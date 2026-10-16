"use client";

import { useState } from "react";
import { Plane, Layers, MapPin } from "lucide-react";
import { SimulationImpact } from "@/lib/api";

interface ImpactDetailsProps {
  impact: SimulationImpact;
}

export function ImpactDetails({ impact }: ImpactDetailsProps) {
  const [activeTab, setActiveTab] = useState<"missions" | "aircraft" | "routes">("missions");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex border-b border-border bg-muted/40 px-4 pt-2">
        <button
          onClick={() => setActiveTab("missions")}
          className={`pb-2 text-xs font-medium border-b-2 mr-4 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "missions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers size={13} />
          <span>Affected Missions ({impact.affected_missions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("aircraft")}
          className={`pb-2 text-xs font-medium border-b-2 mr-4 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "aircraft"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plane size={13} />
          <span>Affected Fleet ({impact.affected_aircraft.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`pb-2 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "routes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin size={13} />
          <span>Affected Routes ({impact.affected_routes.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-4">
        {activeTab === "missions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                <tr>
                  <th className="pb-2">Mission Code</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Route</th>
                  <th className="pb-2">Assigned Aircraft</th>
                  <th className="pb-2">Operational Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {impact.affected_missions.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-semibold aero-mono text-foreground">
                      {m.code}
                    </td>
                    <td className="py-2.5 text-foreground max-w-[200px] truncate">
                      {m.title}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={
                          m.priority === "critical"
                            ? "aero-badge-critical text-[10px]"
                            : m.priority === "high"
                            ? "aero-badge-warning text-[10px]"
                            : "aero-badge-neutral text-[10px]"
                        }
                      >
                        {m.priority}
                      </span>
                    </td>
                    <td className="py-2.5 aero-mono text-muted-foreground">
                      {m.origin_code} → {m.destination_code}
                    </td>
                    <td className="py-2.5 aero-mono text-foreground">
                      {m.assigned_aircraft_tail || "—"}
                    </td>
                    <td className="py-2.5 text-muted-foreground text-[11px] max-w-[240px]">
                      {m.impact_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "aircraft" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                <tr>
                  <th className="pb-2">Tail Number</th>
                  <th className="pb-2">Model</th>
                  <th className="pb-2">Status Before</th>
                  <th className="pb-2">Status After</th>
                  <th className="pb-2">Grounding / Impact Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {impact.affected_aircraft.map((ac) => (
                  <tr key={ac.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-semibold aero-mono text-foreground">
                      {ac.tail_number}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{ac.model}</td>
                    <td className="py-2.5">
                      <span className="aero-badge-success text-[10px]">
                        {ac.status_before}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={
                          ac.status_after === "grounded"
                            ? "aero-badge-critical text-[10px]"
                            : "aero-badge-warning text-[10px]"
                        }
                      >
                        {ac.status_after}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground text-[11px]">
                      {ac.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "routes" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                <tr>
                  <th className="pb-2">Mission</th>
                  <th className="pb-2">Origin</th>
                  <th className="pb-2">Destination</th>
                  <th className="pb-2">Traversed Sector</th>
                  <th className="pb-2">Corridor Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {impact.affected_routes.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-semibold aero-mono text-foreground">
                      {r.mission_code}
                    </td>
                    <td className="py-2.5 aero-mono text-muted-foreground">
                      {r.origin_code}
                    </td>
                    <td className="py-2.5 aero-mono text-muted-foreground">
                      {r.destination_code}
                    </td>
                    <td className="py-2.5 aero-mono text-foreground font-medium">
                      {r.sector_code}
                    </td>
                    <td className="py-2.5">
                      <span className="aero-badge-warning text-[10px]">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
