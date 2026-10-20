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


def test_staging_config_validation():
    """Verify configuration validator treats staging with strict persistence and security rules."""
    staging_settings_invalid = Settings(
        app_env="staging",
        supabase_url="",
        supabase_service_role_key="",
    )
    assert staging_settings_invalid.is_production is True
    assert staging_settings_invalid.is_auth_enforced is True
    issues = staging_settings_invalid.validate_production_configuration()
    assert len(issues) >= 2
    assert any("SUPABASE_URL" in issue for issue in issues)
    assert any("SUPABASE_SERVICE_ROLE_KEY" in issue for issue in issues)

    with pytest.raises(RuntimeError):
        staging_settings_invalid.validate_production_configuration(raise_error=True)

    staging_settings_valid = Settings(
        app_env="staging",
        supabase_url="https://staging-proj.supabase.co",
        supabase_service_role_key="staging-service-role-secret-key",
    )
    assert staging_settings_valid.validate_production_configuration() == []



def test_cors_origin_parsing():
    """Verify CORS origins field validator handles lists, comma-separated strings, and JSON strings."""
    s1 = Settings(cors_origins="https://aerosync.vercel.app,http://localhost:3000")
    assert s1.cors_origins == ["https://aerosync.vercel.app", "http://localhost:3000"]

    s2 = Settings(cors_origins='["https://aerosync.vercel.app","http://localhost:3000"]')
    assert s2.cors_origins == ["https://aerosync.vercel.app", "http://localhost:3000"]
    assert s1.cors_origin_regex is not None


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


def test_repository_service_client_precedence(monkeypatch):
    """Verify repository operations prioritize service_role client over anon client."""
    from unittest.mock import MagicMock
    from app.db import repository as repo_module

    fake_row = {
        "id": "00000000-0000-0000-0000-000000000001",
        "code": "TST1",
        "name": "Test Airport 1",
        "region": "TestRegion",
        "latitude": 0.0,
        "longitude": 0.0,
        "elevation_ft": 100,
        "runway_length_m": 1500,
        "status": "operational",
        "fuel_available": True,
    }

    service_mock = MagicMock()
    service_table = MagicMock()
    service_mock.table.return_value = service_table
    service_table.select.return_value.order.return_value.execute.return_value.data = [fake_row]

    anon_mock = MagicMock()
    anon_table = MagicMock()
    anon_mock.table.return_value = anon_table
    anon_table.select.return_value.order.return_value.execute.return_value.data = [fake_row]

    monkeypatch.setattr(repo_module, "is_supabase_configured", lambda: True)
    monkeypatch.setattr(repo_module, "get_service_client", lambda: service_mock)
    monkeypatch.setattr(repo_module, "get_anon_client", lambda: anon_mock)

    airports = repo_module.repository.get_airports()
    assert len(airports) == 1
    assert airports[0].code == "TST1"
    service_mock.table.assert_called_with("airports")
    anon_mock.table.assert_not_called()

    # Fallback to anon client when service client is None
    service_mock.reset_mock()
    anon_mock.reset_mock()
    monkeypatch.setattr(repo_module, "get_service_client", lambda: None)

    airports = repo_module.repository.get_airports()
    assert len(airports) == 1
    assert airports[0].code == "TST1"
    anon_mock.table.assert_called_with("airports")


def test_health_independent_count_failures(client, monkeypatch):
    """Verify that a failure in one table query does not reset other table counts to zero,
    and that the health status is marked degraded without leaking sensitive database errors.
    """
    from uuid import UUID
    from app.db import repository as repo_module
    from app.models import Airport

    def mock_get_aircraft_fail():
        raise RuntimeError("permission denied for table aircraft; secret_token=SUPER_SECRET_VALUE")

    fake_airports = [
        Airport(
            id=UUID("00000000-0000-0000-0000-000000000001"),
            code="TST1",
            name="Test Airport 1",
            region="TestRegion",
            latitude=0.0,
            longitude=0.0,
            elevation_ft=100,
            runway_length_m=1500,
            status="operational",
            fuel_available=True,
        )
    ]

    monkeypatch.setattr(repo_module.repository, "get_airports", lambda: fake_airports)
    monkeypatch.setattr(repo_module.repository, "get_aircraft", mock_get_aircraft_fail)

    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()

    # Verify airports count was preserved and not wiped out to zero
    assert data["database"]["airports_loaded"] == 1
    # Verify aircraft count failed cleanly
    assert data["database"]["aircraft_loaded"] == 0
    # Verify database check does not falsely claim success
    assert data["database"]["connected"] is False
    assert data["status"] == "degraded"
    assert "Failed to query operational tables: aircraft" in data["database"]["error"]
    # Verify no secrets or sensitive exception messages are exposed
    assert "SUPER_SECRET_VALUE" not in data["database"]["error"]
    assert "permission denied" not in data["database"]["error"]


def test_health_probe_fails_but_operational_queries_succeed(client, monkeypatch):
    """Verify that when the initial probe suffers a transient error but all operational table
    queries succeed, the health endpoint reconciles connected to True, status to 'ok',
    and does not report a false connectivity failure.
    """
    import httpx
    from uuid import UUID
    from unittest.mock import MagicMock
    from app.db import repository as repo_module
    from app.models import Airport
    import app.main as main_module

    # 1. Mock initial probe client to simulate a transient socket disconnection
    probe_client = MagicMock()
    probe_table = MagicMock()
    probe_client.table.return_value = probe_table
    probe_table.select.return_value.limit.return_value.execute.side_effect = (
        httpx.RemoteProtocolError("Server disconnected without sending a response")
    )

    monkeypatch.setattr(main_module, "get_service_client", lambda: probe_client)
    monkeypatch.setattr(main_module, "get_anon_client", lambda: probe_client)

    # 2. Mock operational repository queries to all succeed (simulating fresh connection succeeding)
    fake_airports = [
        Airport(
            id=UUID("00000000-0000-0000-0000-000000000001"),
            code="TST1",
            name="Test Airport 1",
            region="TestRegion",
            latitude=0.0,
            longitude=0.0,
            elevation_ft=100,
            runway_length_m=1500,
            status="operational",
            fuel_available=True,
        )
    ]
    monkeypatch.setattr(repo_module.repository, "get_airports", lambda: fake_airports)
    monkeypatch.setattr(repo_module.repository, "get_aircraft", lambda: [])
    monkeypatch.setattr(repo_module.repository, "get_crew", lambda: [])
    monkeypatch.setattr(repo_module.repository, "get_missions", lambda: [])

    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "ok"
    assert data["database"]["connected"] is True
    assert data["database"]["error"] is None
    assert data["database"]["airports_loaded"] == 1
    assert data["database"]["aircraft_loaded"] == 0


def test_readiness_succeeds_after_transient_connection_failure(client, monkeypatch):
    """Verify readiness probe recovers and returns 200 when encountering a transient transport disconnect."""
    import httpx
    from unittest.mock import MagicMock
    import app.main as main_module

    orig_env = settings.app_env
    try:
        settings.app_env = "staging"

        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table

        # 1st call fails with RemoteProtocolError; 2nd call succeeds
        mock_table.select.return_value.limit.return_value.execute.side_effect = [
            httpx.RemoteProtocolError("Server disconnected without response"),
            MagicMock(data=[{"id": "test"}]),
        ]

        monkeypatch.setattr(main_module, "is_supabase_configured", lambda: True)
        monkeypatch.setattr(main_module, "get_service_client", lambda: mock_client)
        monkeypatch.setattr(main_module, "get_anon_client", lambda: mock_client)

        res = client.get("/api/ready")
        assert res.status_code == 200
        assert res.json()["ready"] is True
        assert mock_table.select.return_value.limit.return_value.execute.call_count == 2
    finally:
        settings.app_env = orig_env


def test_readiness_returns_503_when_database_unavailable(client, monkeypatch):
    """Verify readiness probe returns HTTP 503 when the database check persistently fails in staging/production."""
    import httpx
    from unittest.mock import MagicMock
    import app.main as main_module

    orig_env = settings.app_env
    try:
        settings.app_env = "staging"

        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        # Persistently fails on all attempts
        mock_table.select.return_value.limit.return_value.execute.side_effect = (
            httpx.ConnectError("Connection refused")
        )

        monkeypatch.setattr(main_module, "is_supabase_configured", lambda: True)
        monkeypatch.setattr(main_module, "get_service_client", lambda: mock_client)
        monkeypatch.setattr(main_module, "get_anon_client", lambda: mock_client)

        res = client.get("/api/ready")
        assert res.status_code == 503
        data = res.json()
        assert data["detail"] == "Database unreachable in production."
    finally:
        settings.app_env = orig_env


def test_repository_empty_queries_return_not_found_value_without_local_store(monkeypatch):
    """Verify that in staging/production, successful Supabase queries returning 0 rows
    return None (for single entities) or [] (for lists) without accessing local_store."""
    from unittest.mock import MagicMock
    from app.db.repository import OperationalRepository, repository
    import app.db.repository as repo_mod

    orig_env = settings.app_env
    try:
        settings.app_env = "staging"

        # Mock Supabase client returning empty data (0 rows)
        mock_client = MagicMock()
        mock_res = MagicMock()
        mock_res.data = []

        mock_query = MagicMock()
        mock_query.execute.return_value = mock_res
        mock_query.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_client.table.return_value = mock_query

        monkeypatch.setattr(repo_mod, "is_supabase_configured", lambda: True)
        monkeypatch.setattr(repo_mod, "get_service_client", lambda: mock_client)
        monkeypatch.setattr(repo_mod, "get_anon_client", lambda: mock_client)

        # Spy/guard on local_store property to ensure it is NEVER accessed
        local_store_accessed = []
        def fail_on_local_store(self):
            local_store_accessed.append(True)
            raise AssertionError("local_store was accessed unexpectedly!")

        monkeypatch.setattr(OperationalRepository, "local_store", property(fail_on_local_store))

        dummy_id = uuid4()

        # Single-entity lookups must return None
        assert repository.get_optimization_run(dummy_id) is None
        assert repository.get_optimization_result(dummy_id) is None
        assert repository.get_ai_analysis_by_run_id(dummy_id) is None
        assert repository.get_ai_analysis(dummy_id) is None
        assert repository.get_recommendation(dummy_id) is None
        assert repository.get_recommendation_by_run_id(dummy_id) is None
        assert repository.get_airport_by_id(dummy_id) is None
        assert repository.get_sector_by_id(dummy_id) is None
        assert repository.get_aircraft_by_id(dummy_id) is None
        assert repository.get_crew_by_id(dummy_id) is None
        assert repository.get_mission_by_id(dummy_id) is None
        assert repository.get_simulation_event(dummy_id) is None

        # List lookups must return []
        assert repository.get_airports() == []
        assert repository.get_sectors() == []
        assert repository.list_simulation_events() == []
        assert repository.list_optimization_runs() == []

        assert len(local_store_accessed) == 0
    finally:
        settings.app_env = orig_env


def test_repository_genuine_database_failures_raise_production_error(monkeypatch):
    """Verify that in staging/production, database exceptions raise RuntimeError and do not fall back."""
    import httpx
    from unittest.mock import MagicMock
    from app.db.repository import repository
    import app.db.repository as repo_mod

    orig_env = settings.app_env
    try:
        settings.app_env = "staging"

        mock_client = MagicMock()
        mock_query = MagicMock()
        mock_query.execute.side_effect = httpx.ConnectError("Database connection timed out")
        mock_query.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_client.table.return_value = mock_query

        monkeypatch.setattr(repo_mod, "is_supabase_configured", lambda: True)
        monkeypatch.setattr(repo_mod, "get_service_client", lambda: mock_client)
        monkeypatch.setattr(repo_mod, "get_anon_client", lambda: mock_client)

        dummy_id = uuid4()
        with pytest.raises(RuntimeError) as exc_info:
            repository.get_optimization_run(dummy_id)
        assert "Database operation failed in production (get_optimization_run)" in str(exc_info.value)

        with pytest.raises(RuntimeError) as exc_info:
            repository.get_airports()
        assert "Database operation failed in production (get_airports)" in str(exc_info.value)
    finally:
        settings.app_env = orig_env


def test_repository_unconfigured_supabase_fails_safely_in_production(monkeypatch):
    """Verify that when Supabase is unconfigured in staging/production, repository lookups fail safely."""
    from app.db.repository import repository
    import app.db.repository as repo_mod

    orig_env = settings.app_env
    try:
        settings.app_env = "staging"

        monkeypatch.setattr(repo_mod, "is_supabase_configured", lambda: False)
        monkeypatch.setattr(repo_mod, "get_service_client", lambda: None)
        monkeypatch.setattr(repo_mod, "get_anon_client", lambda: None)

        dummy_id = uuid4()
        with pytest.raises(RuntimeError) as exc_info:
            repository.get_optimization_run(dummy_id)
        assert "Silent fallback to in-memory store is prohibited" in str(exc_info.value)
    finally:
        settings.app_env = orig_env


def test_repository_development_mode_fallback_preserved(monkeypatch):
    """Verify that development mode (is_production=False) still falls back to local_store."""
    from app.db.repository import repository
    import app.db.repository as repo_mod

    orig_env = settings.app_env
    try:
        settings.app_env = "development"

        monkeypatch.setattr(repo_mod, "is_supabase_configured", lambda: False)
        airports = repository.get_airports()
        assert len(airports) > 0  # Seeded baseline
    finally:
        settings.app_env = orig_env


def test_ai_analyze_missing_run_returns_404_without_gemini_or_mutation(client, monkeypatch):
    """Verify POST /api/ai/analyze returns 404 for nonexistent run, never calls Gemini, and never mutates data."""
    from unittest.mock import AsyncMock, MagicMock
    from app.auth import OperatorPrincipal, require_privileged_operator
    from app.services.ai_explanation_service import ai_explanation_service
    from app.db.repository import repository
    import app.db.repository as repo_mod

    orig_env = settings.app_env
    try:
        settings.app_env = "staging"

        # Mock Supabase client returning empty data for missing run
        mock_client = MagicMock()
        mock_res = MagicMock()
        mock_res.data = []

        mock_query = MagicMock()
        mock_query.execute.return_value = mock_res
        mock_query.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_client.table.return_value = mock_query

        monkeypatch.setattr(repo_mod, "is_supabase_configured", lambda: True)
        monkeypatch.setattr(repo_mod, "get_service_client", lambda: mock_client)
        monkeypatch.setattr(repo_mod, "get_anon_client", lambda: mock_client)

        # Mock privileged operator dependency
        mock_operator = OperatorPrincipal(
            subject="test-operator",
            role="operator",
            authenticated=True,
            auth_method="supabase_jwt",
        )
        app.dependency_overrides[require_privileged_operator] = lambda: mock_operator

        # Spy on Gemini API caller and save_ai_analysis to ensure they are NEVER called
        gemini_mock = AsyncMock()
        monkeypatch.setattr(ai_explanation_service, "_call_gemini_api", gemini_mock)

        save_analysis_mock = MagicMock()
        monkeypatch.setattr(repository, "save_ai_analysis", save_analysis_mock)

        missing_uuid = str(uuid4())
        response = client.post(
            "/api/ai/analyze",
            json={"optimization_run_id": missing_uuid},
        )

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["error"] == "OPTIMIZATION_RUN_NOT_FOUND"

        # Verify no Gemini call was made
        assert gemini_mock.call_count == 0

        # Verify no AI analysis was saved
        assert save_analysis_mock.call_count == 0

    finally:
        settings.app_env = orig_env
        app.dependency_overrides.pop(require_privileged_operator, None)


