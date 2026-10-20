/* ============================================================
   AirOps — Constants
   ============================================================ */

/** Sidebar navigation items */
export const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Fleet", href: "/fleet", icon: "Plane" },
  { label: "Personnel & Crew", href: "/crew", icon: "Users" },
  { label: "Missions & Tasks", href: "/missions", icon: "Target" },
  { label: "Environment", href: "/environment", icon: "Cloud" },
  { label: "Optimization", href: "/optimization", icon: "Cpu" },
  { label: "Simulation Center", href: "/simulation", icon: "FlaskConical" },
  { label: "Reports & Analytics", href: "/reports", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

/** Mission types (non-combat only) */
export const MISSION_TYPES = [
  "transport",
  "medevac",
  "search-and-rescue",
  "disaster-relief",
  "training",
  "standby",
] as const;

/** Mission priority levels */
export const PRIORITY_LEVELS = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

/** Aircraft statuses */
export const AIRCRAFT_STATUSES = [
  "available",
  "in-mission",
  "maintenance",
  "grounded",
] as const;

/** Crew statuses */
export const CREW_STATUSES = [
  "available",
  "on-mission",
  "off-duty",
  "medical",
] as const;

/** Sector risk levels */
export const RISK_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

/** Weather severity */
export const WEATHER_SEVERITY = [
  "none",
  "moderate",
  "severe",
] as const;

/** Simulation scenario types */
export const SCENARIO_TYPES = [
  "weather_deterioration",
  "aircraft_unavailable",
  "crew_unavailable",
  "airspace_restriction",
  "new_high_priority_task",
  "maintenance_delay",
] as const;
