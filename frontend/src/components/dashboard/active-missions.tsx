"use client";

import { Target, ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";
import { Mission } from "@/lib/api";

interface ActiveMissionsProps {
  missions: Mission[];
  loading?: boolean;
}

export function ActiveMissions({ missions, loading = false }: ActiveMissionsProps) {
  if (loading) {
    return (
      <div className="aero-card p-5 animate-pulse">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <span className="aero-badge-critical">Critical</span>;
      case "high":
        return <span className="aero-badge-warning">High</span>;
      case "medium":
        return <span className="aero-badge-primary">Medium</span>;
      default:
        return <span className="aero-badge-neutral">Low</span>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-aero-success">
            <span className="h-1.5 w-1.5 rounded-full bg-aero-success animate-pulse" />
            In Flight
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Clock size={11} />
            Scheduled
          </span>
        );
      default:
        return <span className="text-[11px] text-muted-foreground capitalize">{status}</span>;
    }
  };

  const formatSchedule = (startStr: string) => {
    try {
      const d = new Date(startStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="aero-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-primary" strokeWidth={1.75} />
          <h3 className="aero-section-title">Active & Scheduled Missions</h3>
          <span className="text-xs text-muted-foreground font-mono">
            ({missions.length})
          </span>
        </div>
        <Link
          href="/missions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-light transition-colors"
        >
          View all
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-background/50">
              <th className="px-5 py-2.5">Mission Code & Title</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Priority</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Aircraft Type</th>
              <th className="px-5 py-2.5 text-right">Window</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {missions.slice(0, 6).map((mission) => (
              <tr
                key={mission.id}
                className="hover:bg-muted/40 transition-colors duration-150"
              >
                <td className="px-5 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-medium text-primary">
                      {mission.code}
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[220px]">
                      {mission.title}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-muted-foreground capitalize text-[11px]">
                    {mission.type.replace("-", " ")}
                  </span>
                </td>
                <td className="px-3 py-3">{priorityBadge(mission.priority)}</td>
                <td className="px-3 py-3">{statusBadge(mission.status)}</td>
                <td className="px-3 py-3 font-mono text-[11px] text-foreground">
                  {mission.required_aircraft_model || "AeroLift M1"}
                </td>
                <td className="px-5 py-3 text-right font-mono text-[11px] text-muted-foreground">
                  {formatSchedule(mission.scheduled_start)} - {formatSchedule(mission.scheduled_end)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missions.length === 0 && (
        <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
          No operational missions scheduled.
        </div>
      )}
    </div>
  );
}
