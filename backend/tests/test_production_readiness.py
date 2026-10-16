"""AEROSYNC — Phase 9: Production Readiness, Security & Deployment Regression Tests."""

from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, settings
from app.db.store import store
from app.main import app
from app.models.optimization import OptimizationRequest
from app.services.optimization_service import optimization_service
from app.services.simulation_service import simulation_service
from app.models.simulation import SimulationScenarioRequest


@pytest.fixture
def client():
    """Test client for FastAPI app."""
    return TestClient(app)


def test_production_config_validation():
    """Verify configuration validator flags missing database credentials in production."""
    prod_settings_invalid = Settings(
        app_env="production",
        supabase_url="",
        supabase_service_role_key="",
    )
    issues = prod_settings_invalid.validate_production_configuration()
    assert len(issues) >= 2
    assert any("SUPABASE_URL" in issue for issue in issues)
    assert any("SUPABASE_SERVICE_ROLE_KEY" in issue for issue in issues)

    with pytest.raises(RuntimeError):
        prod_settings_invalid.validate_production_configuration(raise_error=True)

    prod_settings_valid = Settings(
        app_env="production",
        supabase_url="https://live-proj.supabase.co",
        supabase_service_role_key="live-service-role-secret-key",
    )
    assert prod_settings_valid.validate_production_configuration() == []


def test_cors_origin_parsing():
    """Verify CORS origins field validator handles lists, comma-separated strings, and JSON strings."""
    s1 = Settings(cors_origins="https://aerosync.vercel.app,http://localhost:3000")
    assert s1.cors_origins == ["https://aerosync.vercel.app", "http://localhost:3000"]

    s2 = Settings(cors_origins='["https://aerosync.vercel.app","http://localhost:3000"]')
    assert s2.cors_origins == ["https://aerosync.vercel.app", "http://localhost:3000"]


def test_health_and_readiness_endpoints(client):
    """Verify /api/health and /api/ready diagnostics report accurate telemetry."""
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    data_h = res_health.json()
    assert data_h["service"] == "aerosync-api"
    assert "status" in data_h
    assert "database" in data_h
    assert data_h["database"]["aircraft_loaded"] >= 18
    assert data_h["database"]["airports_loaded"] == 5

    res_ready = client.get("/api/ready")
    assert res_ready.status_code == 200
    data_r = res_ready.json()
    assert data_r["ready"] is True


def test_privileged_mutation_auth_enforcement_all_endpoints(client):
    """Verify all privileged endpoints reject unauthenticated requests with 401 when auth is enforced."""
    orig_auth = settings.auth_required
    orig_key = settings.operator_api_key
    try:
        settings.auth_required = True
        settings.operator_api_key = "test-secret-operator-key-99"

        # 1. First run optimization in demo mode to generate a real run_id and rec_id for testing
        settings.auth_required = False
        opt_setup = client.post("/api/optimization/run", json={}).json()
        valid_run_id = opt_setup["run_id"]
        valid_rec_id = opt_setup["recommendation_id"]
        settings.auth_required = True

        sim_payload = {"scenario": "weather_deterioration", "target_id": "SEC-B"}
        endpoints = [
            ("POST", "/api/simulation/reset", None),
            ("POST", "/api/simulation/events", sim_payload),
            ("POST", "/api/simulation/events/inject", sim_payload),
            ("POST", "/api/optimization/run", {}),
            ("POST", "/api/optimization/solve", {}),
            ("POST", f"/api/optimization/apply/{valid_rec_id}", None),
            ("POST", "/api/optimization/apply", {"rec_id": valid_rec_id}),
            ("POST", "/api/ai/analyze", {"optimization_run_id": valid_run_id}),
        ]

        # 1. Unauthenticated -> 401 Unauthorized
        for method, endpoint, payload in endpoints:
            res = client.post(endpoint, json=payload) if payload is not None else client.post(endpoint)
            assert res.status_code == 401, f"{endpoint} allowed unauthenticated access! Status: {res.status_code}"
            assert "AUTHENTICATION_REQUIRED" in res.text

        # 2. Invalid API Key -> 403 Forbidden
        for method, endpoint, payload in endpoints:
            headers = {"X-API-Key": "invalid-operator-key"}
            res = client.post(endpoint, json=payload, headers=headers) if payload is not None else client.post(endpoint, headers=headers)
            assert res.status_code == 403, f"{endpoint} did not reject invalid API key with 403! Status: {res.status_code}"
            assert "INVALID_API_KEY" in res.text

        # 3. Invalid Bearer Token -> 401 Unauthorized
        for method, endpoint, payload in endpoints:
            headers = {"Authorization": "Bearer invalid-jwt-token"}
            res = client.post(endpoint, json=payload, headers=headers) if payload is not None else client.post(endpoint, headers=headers)
            assert res.status_code == 401, f"{endpoint} did not reject invalid Bearer token with 401! Status: {res.status_code}"
            assert "INVALID_TOKEN" in res.text

        # 4. Valid Operator API Key -> Authorized
        res_opt = client.post("/api/optimization/run", json={}, headers={"X-API-Key": "test-secret-operator-key-99"})
        assert res_opt.status_code == 200
        assert res_opt.json()["solver_status"] in ("OPTIMAL", "FEASIBLE")

        res_sim = client.post(
            "/api/simulation/events",
            json=sim_payload,
            headers={"X-API-Key": "test-secret-operator-key-99"},
        )
        assert res_sim.status_code == 201

        res_sim_inject = client.post(
            "/api/simulation/events/inject",
            json=sim_payload,
            headers={"X-API-Key": "test-secret-operator-key-99"},
        )
        assert res_sim_inject.status_code == 201

        res_ai = client.post(
            "/api/ai/analyze",
            json={"optimization_run_id": valid_run_id},
            headers={"X-API-Key": "test-secret-operator-key-99"},
        )
        assert res_ai.status_code == 200

        # 5. Valid Bearer Token (token matching operator key) -> Authorized
        res_bearer = client.post(
            "/api/optimization/solve",
            json={},
            headers={"Authorization": "Bearer test-secret-operator-key-99"},
        )
        assert res_bearer.status_code == 200

        # 6. Public health and telemetry endpoints remain accessible without credentials
        assert client.get("/").status_code == 200
        assert client.get("/api/health").status_code == 200
        assert client.get("/api/ready").status_code == 200
        assert client.get("/api/aircraft").status_code == 200
        assert client.get("/api/events").status_code == 200

    finally:
        settings.auth_required = orig_auth
        settings.operator_api_key = orig_key


def test_production_repository_rejects_silent_inmemory_fallback():
    """Verify repository strictly refuses silent fallback to in-memory store in production."""
    from app.db.repository import repository
    orig_env = settings.app_env
    orig_url = settings.supabase_url
    try:
        settings.app_env = "production"
        settings.supabase_url = ""
        with pytest.raises(RuntimeError) as exc_info:
            repository.get_airports()
        assert "Production persistence error" in str(exc_info.value) or "prohibited" in str(exc_info.value)
    finally:
        settings.app_env = orig_env
        settings.supabase_url = orig_url


def test_simulation_reset_production_safeguard(client):
    """Verify simulation reset is forbidden in production when allow_demo_reset is False."""
    orig_env = settings.app_env
    orig_allow_reset = settings.allow_demo_reset
    orig_key = settings.operator_api_key
    try:
        settings.app_env = "production"
        settings.allow_demo_reset = False
        settings.operator_api_key = "test-operator-key"

        res = client.post(
            "/api/simulation/reset",
            headers={"X-API-Key": "test-operator-key"},
        )
        assert res.status_code == 403
        assert "RESET_FORBIDDEN_IN_PRODUCTION" in res.text
    finally:
        settings.app_env = orig_env
        settings.allow_demo_reset = orig_allow_reset
        settings.operator_api_key = orig_key


def test_reset_preserves_historical_records():
    """Verify reset restores baseline fleet telemetry without wiping optimization/simulation history."""
    store.reset_to_seed()
    # Execute a simulation event
    sim_res = simulation_service.execute_scenario(
        SimulationScenarioRequest(scenario="weather_deterioration", target_id="SEC-B")
    )
    # Execute an optimization run
    opt_res = optimization_service.run_optimization(OptimizationRequest())

    # Execute simulation reset
    simulation_service.reset_simulation()

    # Baseline restored: available aircraft restored to nominal 18
    available_aircraft = [a for a in store.get_aircraft() if a.status == "available"]
    assert len(available_aircraft) == 18

    # Historical runs preserved:
    assert opt_res.run_id in store.optimization_results
    assert sim_res.event_id in store.simulation_events


def test_apply_recommendation_idempotency():
    """Verify applying recommendation twice is idempotent and does not corrupt state."""
    store.reset_to_seed()
    opt_res = optimization_service.run_optimization(OptimizationRequest())
    assert opt_res.recommendation_id is not None

    # First apply
    resp1 = optimization_service.apply_recommendation(opt_res.recommendation_id)
    assert resp1.status == "applied"
    assert resp1.applied_allocations_count > 0

    # Second apply (idempotent duplicate request)
    resp2 = optimization_service.apply_recommendation(opt_res.recommendation_id)
    assert resp2.status == "applied"
    assert "already applied" in resp2.message
    assert resp2.applied_allocations_count == resp1.applied_allocations_count


def test_stale_run_detection():
    """Verify optimization service detects when a solve result is stale due to subsequent disruption."""
    store.reset_to_seed()
    opt_res = optimization_service.run_optimization(OptimizationRequest())

    # Immediately after solve, result is not stale
    assert optimization_service.is_run_stale(opt_res.run_id) is False

    # A subsequent simulation event occurs afterward
    simulation_service.execute_scenario(
        SimulationScenarioRequest(scenario="weather_deterioration", target_id="SEC-B")
    )

    # Now the previous optimization run is correctly recognized as stale
    assert optimization_service.is_run_stale(opt_res.run_id) is True


@pytest.mark.asyncio
async def test_supabase_auth_rbac_role_enforcement():
    """Verify require_privileged_operator enforces authorized roles for Supabase JWT users."""
    from fastapi import HTTPException
    from app.auth import OperatorPrincipal, require_privileged_operator

    orig_auth = settings.auth_required
    try:
        settings.auth_required = True

        # 1. Non-operator authenticated user -> 403 Forbidden
        viewer_principal = OperatorPrincipal(
            subject="user_123",
            role="authenticated",
            authenticated=True,
            auth_method="supabase_jwt",
        )
        with pytest.raises(HTTPException) as exc_info:
            await require_privileged_operator(viewer_principal)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail["error"] == "INSUFFICIENT_ROLE"

        # 2. Operator role -> Authorized
        operator_principal = OperatorPrincipal(
            subject="operator_456",
            role="operator",
            authenticated=True,
            auth_method="supabase_jwt",
        )
        res = await require_privileged_operator(operator_principal)
        assert res.role == "operator"

        # 3. Commander role -> Authorized
        admin_principal = OperatorPrincipal(
            subject="commander_789",
            role="commander",
            authenticated=True,
            auth_method="supabase_jwt",
        )
        res_admin = await require_privileged_operator(admin_principal)
        assert res_admin.role == "commander"

    finally:
        settings.auth_required = orig_auth


@pytest.mark.asyncio
async def test_user_metadata_self_promotion_prevented(monkeypatch):
    """Verify an attacker cannot self-promote by modifying client-editable user_metadata."""
    from unittest.mock import MagicMock
    from fastapi import HTTPException
    import app.auth as auth_module
    from app.auth import get_current_operator, require_privileged_operator

    # Create mock user object with user_metadata attempting self-promotion
    attacker_user = MagicMock()
    attacker_user.id = "attacker-uuid-999"
    attacker_user.role = "authenticated"
    attacker_user.user_metadata = {"role": "operator", "admin": True, "claims": ["all"]}
    attacker_user.app_metadata = {}  # Trusted server app_metadata is empty

    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.user = attacker_user
    mock_client.auth.get_user.return_value = mock_resp

    monkeypatch.setattr(auth_module, "is_supabase_configured", lambda: True)
    monkeypatch.setattr(auth_module, "get_service_client", lambda: mock_client)
    monkeypatch.setattr(auth_module, "get_anon_client", lambda: mock_client)

    orig_auth = settings.auth_required
    try:
        settings.auth_required = True

        mock_bearer = MagicMock()
        mock_bearer.credentials = "header.attacker_payload.signature"
        mock_request = MagicMock()

        # 1. Verify get_current_operator extracts role strictly from app_metadata
        principal = await get_current_operator(request=mock_request, bearer_creds=mock_bearer, x_api_key=None)
        assert principal.role == "authenticated"  # Ignored attacker's user_metadata
        assert principal.role != "operator"

        # 2. Verify require_privileged_operator denies mutation with 403 Forbidden
        with pytest.raises(HTTPException) as exc_info:
            await require_privileged_operator(principal)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail["error"] == "INSUFFICIENT_ROLE"

        # 3. Verify legitimate server-set app_metadata is honored
        legit_user = MagicMock()
        legit_user.id = "legit-operator-uuid"
        legit_user.role = "authenticated"
        legit_user.user_metadata = {}
        legit_user.app_metadata = {"role": "operator"}  # Server-controlled
        mock_resp.user = legit_user

        legit_principal = await get_current_operator(request=mock_request, bearer_creds=mock_bearer, x_api_key=None)
        assert legit_principal.role == "operator"
        passed = await require_privileged_operator(legit_principal)
        assert passed.role == "operator"

    finally:
        settings.auth_required = orig_auth
