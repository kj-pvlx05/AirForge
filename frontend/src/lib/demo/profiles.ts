export interface DemoProfile {
  id: "commander" | "fleet_manager" | "dispatcher" | "safety_analyst";
  name: string;
  callSign: string;
  title: string;
  unit: string;
  clearance: string;
  role: "commander" | "fleet_manager" | "dispatcher" | "safety_analyst";
  appRole: "operator" | "dispatcher" | "analyst" | "viewer";
  avatar: string;
  avatarColor: string;
  description: string;
  responsibilities: string[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "commander",
    name: "Col. Marcus Vance",
    callSign: "VANGUARD-01",
    title: "Operations Commander",
    unit: "Air Task Force Command (ATFC)",
    clearance: "TOP SECRET // NOFORN",
    role: "commander",
    appRole: "operator",
    avatar: "MV",
    avatarColor: "bg-purple-600 text-white",
    description:
      "Highest tactical command authority. Oversees multi-sector airspace status, mission GO/NO-GO authorizations, and emergency airframe reallocations.",
    responsibilities: [
      "Strategic airspace situation monitoring",
      "Executive authorization for mission re-tasking",
      "Multi-sector emergency asset reallocation",
      "OR-Tools optimization approval and deployment",
    ],
  },
  {
    id: "fleet_manager",
    name: "Maj. Elena Rostova",
    callSign: "IRONCLAD-04",
    title: "Fleet Readiness Officer",
    unit: "4th Maintenance & Logistics Wing",
    clearance: "SECRET // REL TO AIROPS",
    role: "fleet_manager",
    appRole: "operator",
    avatar: "ER",
    avatarColor: "bg-amber-600 text-white",
    description:
      "Responsible for aircraft airworthiness, maintenance turnaround, unscheduled inspections, and airframe availability across all 5 operational stations.",
    responsibilities: [
      "Fleet readiness monitoring (available vs grounded)",
      "Unscheduled maintenance tracking and turnaround",
      "Home base staging and hangar capacity management",
      "Airframe telemetry and fuel status inspection",
    ],
  },
  {
    id: "dispatcher",
    name: "Capt. Liam Chen",
    callSign: "SKYWATCH-09",
    title: "Chief Flight Dispatcher",
    unit: "Joint Air Operations Center (JAOC)",
    clearance: "SECRET // OPERATIONAL",
    role: "dispatcher",
    appRole: "dispatcher",
    avatar: "LC",
    avatarColor: "bg-sky-600 text-white",
    description:
      "Manages live flight progress, flight corridor slotting, en-route weather deconfliction, and crew duty hour compliance.",
    responsibilities: [
      "Active and scheduled sortie tracking",
      "Corridor assignment and waypoint deconfliction",
      "Crew duty limits and qualification verification",
      "Real-time waypoint diversions and re-routes",
    ],
  },
  {
    id: "safety_analyst",
    name: "Dr. Sarah Jenkins",
    callSign: "AURA-02",
    title: "Senior Airspace Safety Analyst",
    unit: "Aviation Safety & Weather Intelligence",
    clearance: "CONFIDENTIAL // SCI",
    role: "safety_analyst",
    appRole: "analyst",
    avatar: "SJ",
    avatarColor: "bg-emerald-600 text-white",
    description:
      "Focuses on hazard assessment, squall line projections, simulation scenario modeling, and predictive risk scoring.",
    responsibilities: [
      "Environmental threat modeling (squalls, turbulence)",
      "What-if simulation scenario execution and analysis",
      "Safety impact scoring and risk mitigation",
      "Gemini AI operational explanation review",
    ],
  },
];

export function getProfileById(id: string): DemoProfile {
  return (
    DEMO_PROFILES.find((p) => p.id === id) || DEMO_PROFILES[0]
  );
}
