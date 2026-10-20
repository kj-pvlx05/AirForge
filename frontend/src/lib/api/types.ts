/**
 * AirOps — Frontend TypeScript Domain Types.
 * Matches backend FastAPI Pydantic models exactly.
 */

export type AirportStatus = "operational" | "degraded" | "closed";

export interface Airport {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_ft: number;
  runway_length_m: number;
  status: AirportStatus;
  region: string;
  fuel_available: boolean;
  created_at: string;
}

export type SectorStatus = "active" | "restricted" | "closed";
export type SectorRiskLevel = "low" | "medium" | "high" | "critical";

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface Sector {
  id: string;
  code: string;
  name: string;
  boundary: GeoJSONPolygon;
  status: SectorStatus;
  risk_level: SectorRiskLevel;
  notes?: string | null;
  created_at: string;
}

export type AircraftModel =
  | "AeroLift M1"
  | "AeroLift H2"
  | "AeroTransport T1"
  | "AeroUtility U1";

export type AircraftType =
  | "Medium utility helicopter"
  | "Heavy transport helicopter"
  | "Fixed-wing transport"
  | "Light utility helicopter";

export type AircraftRole =
  | "transport"
  | "medevac"
  | "search-and-rescue"
  | "disaster-relief"
  | "training"
  | "standby";

export type AircraftStatus =
  | "available"
  | "in-mission"
  | "maintenance"
  | "grounded";

export interface Aircraft {
  id: string;
  tail_number: string;
  model: AircraftModel;
  type: AircraftType;
  role: AircraftRole;
  base_airport_id?: string | null;
  current_airport_id?: string | null;
  status: AircraftStatus;
  max_range_km: number;
  max_payload_kg: number;
  max_passengers: number;
  cruise_speed_kmh: number;
  fuel_capacity_liters: number;
  fuel_level_percent: number;
  flight_hours: number;
  last_maintenance_date?: string | null;
  next_maintenance_due?: string | null;
  created_at: string;
}

export type CrewRole =
  | "pilot"
  | "co-pilot"
  | "flight-engineer"
  | "flight-medic"
  | "loadmaster"
  | "operations-observer";

export type CrewStatus = "available" | "on-mission" | "off-duty" | "medical";

export interface Crew {
  id: string;
  code: string;
  name: string;
  role: CrewRole;
  rank: string;
  base_airport_id?: string | null;
  status: CrewStatus;
  qualifications: string[];
  max_duty_hours: number;
  current_duty_hours: number;
  rest_period_hours: number;
  created_at: string;
}

export type MissionType =
  | "disaster-relief"
  | "medevac"
  | "transport"
  | "search-and-rescue"
  | "training"
  | "standby";

export type MissionPriority = "critical" | "high" | "medium" | "low";

export type MissionStatus =
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled"
  | "reassigned";

export interface Mission {
  id: string;
  code: string;
  title: string;
  type: MissionType;
  priority: MissionPriority;
  status: MissionStatus;
  origin_airport_id: string;
  destination_airport_id: string;
  sector_id?: string | null;
  assigned_aircraft_id?: string | null;
  required_aircraft_model?: string | null;
  required_crew_composition: Record<string, number>;
  passenger_count: number;
  cargo_weight_kg: number;
  urgency_score: number;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string | null;
  actual_end?: string | null;
  notes?: string | null;
  created_at: string;
}

export type WeatherConditionType =
  | "clear"
  | "scattered-clouds"
  | "overcast"
  | "light-rain"
  | "heavy-rain"
  | "thunderstorm"
  | "fog";

export type WeatherSeverity = "none" | "moderate" | "severe";

export interface WeatherCondition {
  id: string;
  region: string;
  sector_id?: string | null;
  airport_id?: string | null;
  condition: WeatherConditionType;
  severity: WeatherSeverity;
  visibility_km: number;
  wind_speed_kts: number;
  wind_direction_deg: number;
  ceiling_ft: number;
  temperature_c: number;
  is_vfr: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export type AirspaceRestrictionType =
  | "weather-hazard"
  | "relief-corridor"
  | "search-grid"
  | "civil-protection-zone";

export type AirspaceRestrictionStatus =
  | "active"
  | "pending"
  | "expired"
  | "lifted";

export interface AirspaceRestriction {
  id: string;
  identifier: string;
  name: string;
  type: AirspaceRestrictionType;
  sector_id?: string | null;
  boundary?: GeoJSONPolygon | null;
  altitude_floor_ft: number;
  altitude_ceiling_ft: number;
  status: AirspaceRestrictionStatus;
  reason: string;
  active_from: string;
  active_until: string;
  created_at: string;
}

export interface EnvironmentState {
  weather: WeatherCondition[];
  restrictions: AirspaceRestriction[];
  sectors: Sector[];
  timestamp: string;
}

export interface FleetReadiness {
  total: number;
  available: number;
  in_mission: number;
  maintenance: number;
  grounded: number;
  availability_pct: number;
}

export interface CrewReadiness {
  total: number;
  available: number;
  on_mission: number;
  off_duty: number;
  medical: number;
  availability_pct: number;
}

export interface MissionReadiness {
  total: number;
  active: number;
  scheduled: number;
  critical: number;
  high: number;
}

export interface ReadinessReport {
  operational_readiness_pct: number;
  status_level: "nominal" | "caution" | "degraded";
  fleet: FleetReadiness;
  crew: CrewReadiness;
  missions: MissionReadiness;
  generated_at: string;
}

export type EventType = "info" | "warning" | "critical" | "optimization" | "simulation";
export type EventCategory = "weather" | "fleet" | "crew" | "mission" | "system";

export interface OperationalEvent {
  id: string;
  type: EventType;
  category: EventCategory;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ImpactedSector {
  id: string;
  code: string;
  name: string;
  risk_before: string;
  risk_after: string;
  weather_condition_before: string;
  weather_condition_after: string;
  ceiling_ft_before: number;
  ceiling_ft_after: number;
  visibility_km_before: number;
  visibility_km_after: number;
  wind_kts_before: number;
  wind_kts_after: number;
}

export interface ImpactedAircraft {
  id: string;
  tail_number: string;
  model: string;
  status_before: string;
  status_after: string;
  reason: string;
}

export interface ImpactedMission {
  id: string;
  code: string;
  title: string;
  priority: string;
  assigned_aircraft_id?: string | null;
  assigned_aircraft_tail?: string | null;
  origin_code: string;
  destination_code: string;
  impact_reason: string;
}

export interface ImpactedRoute {
  mission_code: string;
  origin_code: string;
  destination_code: string;
  sector_code: string;
  status: string;
}

export interface SimulationImpact {
  affected_sectors: ImpactedSector[];
  affected_aircraft: ImpactedAircraft[];
  affected_missions: ImpactedMission[];
  affected_routes: ImpactedRoute[];
  summary: Record<string, unknown>;
}

export interface SimulationStateSnapshot {
  readiness_score: number;
  readiness_status: string;
  fleet: {
    total: number;
    available: number;
    in_mission: number;
    maintenance: number;
    grounded: number;
  };
  crew: {
    total: number;
    available: number;
    on_mission: number;
    off_duty: number;
  };
  missions: {
    total: number;
    active: number;
    scheduled: number;
    critical: number;
    high: number;
  };
  sector?: {
    code: string;
    name: string;
    risk_level: string;
    visibility_km: number;
    ceiling_ft: number;
    wind_speed_kts: number;
    condition: string;
    severity: string;
    is_vfr: boolean;
  };
}

export interface SimulationResult {
  event_id: string;
  scenario: string;
  target: string;
  status: string;
  state_before: SimulationStateSnapshot;
  event: Record<string, unknown>;
  state_after: SimulationStateSnapshot;
  impact: SimulationImpact;
  created_at: string;
}

export interface SimulationEventItem {
  id: string;
  scenario_type: string;
  title: string;
  description: string;
  parameters: Record<string, unknown>;
  status: string;
  triggered_at: string;
  created_at: string;
}

// ==========================================
// Phase 7: Optimization Engine Models
// ==========================================

export type SolverStatus =
  | "OPTIMAL"
  | "FEASIBLE"
  | "INFEASIBLE"
  | "MODEL_INVALID"
  | "UNKNOWN";

export type RecommendationActionType =
  | "reallocate_aircraft"
  | "reroute_mission"
  | "standby_deployment"
  | "delay_task";

export type RecommendationStatus =
  | "pending_review"
  | "approved"
  | "dismissed"
  | "applied";

export interface Allocation {
  mission_id: string;
  mission_code: string;
  aircraft_id: string;
  aircraft_tail: string;
  crew_ids?: string[];
  crew_codes?: string[];
  reason: string;
  origin_airport_id?: string | null;
  destination_airport_id?: string | null;
  corridor?: string;
  action_type?: string;
  score?: number;
  notes?: string | null;
}

export type MissionAllocation = Allocation;

export interface UnresolvedMission {
  mission_id: string;
  mission_code: string;
  priority: string;
  reason: string;
  unmet_constraints: string[];
}

export interface ConstraintSummary {
  hard_constraints_satisfied: boolean;
  violations: string[];
  constraints_enforced: string[];
  soft_objectives_optimized?: string[];
}

export interface OptimizationMetrics {
  missions_total: number;
  missions_affected: number;
  missions_covered: number;
  missions_unresolved: number;
  aircraft_reassigned: number;
  missions_rerouted: number;
  resource_utilization_pct: number;
  solve_time_ms: number;
}

export interface OptimizationRun {
  id: string;
  simulation_event_id?: string | null;
  trigger_reason: string;
  solver_status: SolverStatus;
  objective_value?: number | null;
  solve_time_ms: number;
  total_missions: number;
  assigned_missions: number;
  unassigned_missions: number;
  constraints_applied: string[];
  constraint_violations_avoided: string[];
  raw_result?: Record<string, unknown>;
  created_at: string;
}

export interface Recommendation {
  id: string;
  optimization_run_id: string;
  simulation_event_id?: string | null;
  title: string;
  summary: string;
  action_type: RecommendationActionType;
  allocations: Allocation[];
  impact_summary: Record<string, unknown>;
  ai_explanation?: string | null;
  status: RecommendationStatus;
  created_at: string;
}

export interface ReassignmentDetail {
  mission_id: string;
  mission_code: string;
  mission_title: string;
  priority: string;
  origin_code: string;
  destination_code: string;
  previous_aircraft_id?: string | null;
  previous_aircraft_tail?: string | null;
  previous_aircraft_model?: string | null;
  recommended_aircraft_id: string;
  recommended_aircraft_tail: string;
  recommended_aircraft_model: string;
  original_corridor: string;
  recommended_corridor: string;
  action_type: string;
  reason: string;
}

export interface OptimizationRequest {
  mission_ids?: string[];
  scenario_event_id?: string | null;
  simulation_event_id?: string | null;
  event_id?: string | null;
  trigger_reason?: string;
  force_recompute?: boolean;
  allow_rerouting?: boolean;
  max_solve_time_seconds?: number;
}

export type OptimizationSolveRequest = OptimizationRequest;

export interface OptimizationResult {
  run_id: string;
  recommendation_id: string;
  status: string;
  solver_status: SolverStatus;
  objective_score: number;
  objective_value: number;
  solve_time_ms: number;
  total_missions: number;
  assigned_missions: number;
  unassigned_missions: number;
  reassignments_count: number;
  rerouted_count: number;
  allocations: Allocation[];
  unresolved_missions: UnresolvedMission[];
  metrics: OptimizationMetrics;
  constraints: ConstraintSummary;
  reassignments: ReassignmentDetail[];
  recommendation: Recommendation;
  created_at: string;
}

export type OptimizationSolveResponse = OptimizationResult;

export interface ApplyRecommendationResponse {
  status: string;
  message: string;
  recommendation_id: string;
  applied_allocations_count: number;
  updated_missions: string[];
  applied_at: string;
}

export interface AIExplanation {
  headline: string;
  situation_summary: string;
  key_changes: string[];
  optimization_summary: string;
  allocation_insights: string[];
  unresolved_analysis: string[];
  constraint_observations: string[];
  operator_attention: string[];
  confidence: "high" | "medium" | "low";
}

export interface AIAnalyzeRequest {
  optimization_run_id: string;
  include_situation_summary?: boolean;
  include_allocation_explanations?: boolean;
  include_unresolved_analysis?: boolean;
}

export interface AIExplanationResponse {
  optimization_run_id: string;
  provider: string;
  model: string;
  generated_at: string;
  source: string;
  explanation: AIExplanation;
  fallback_used: boolean;
  error_code?: string | null;
  prompt_version: string;
}

