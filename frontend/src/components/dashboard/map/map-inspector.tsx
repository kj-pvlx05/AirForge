"use client";

import { useEffect } from "react";
import {
  X,
  Plane,
  MapPin,
  Compass,
  AlertTriangle,
  Gauge,
  Fuel,
  CloudRain,
  Wind,
  Eye,
  Layers,
  ArrowRight,
} from "lucide-react";
import { SelectedFeature } from "./types";
import {
  Airport,
  Aircraft,
  Sector,
  Mission,
  AirspaceRestriction,
} from "@/lib/api";

interface MapInspectorProps {
  selected: SelectedFeature | null;
  onClose: () => void;
}

export function MapInspector({ selected, onClose }: MapInspectorProps) {
  // Listen for Escape key to close inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!selected) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 w-80 sm:w-88 rounded-2xl border border-border/90 bg-surface/95 backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 bg-background/50">
        <div className="flex items-center gap-2">
          {selected.type === "airport" && (
            <MapPin size={14} className="text-primary" />
          )}
          {selected.type === "aircraft" && (
            <Plane size={14} className="text-primary" />
          )}
          {selected.type === "sector" && (
            <Compass size={14} className="text-primary" />
          )}
          {selected.type === "route" && (
            <Layers size={14} className="text-primary" />
          )}
          {selected.type === "restriction" && (
            <AlertTriangle size={14} className="text-aero-warning" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {selected.type === "airport" && "Air Station Facility"}
            {selected.type === "aircraft" && "Fleet Aircraft"}
            {selected.type === "sector" && "Operational Sector"}
            {selected.type === "route" && "Flight Corridor"}
            {selected.type === "restriction" && "Airspace NOTAM"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body content based on entity type */}
      <div className="p-4 space-y-3">
        {/* AIRPORT DETAILS */}
        {selected.type === "airport" && (() => {
          const air = selected.data as Airport;
          return (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    {air.name}
                  </h4>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-soft text-primary">
                    {air.code}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {air.region || "Operational Staging Facility"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                  <span className="text-[10px] text-muted-foreground block">
                    Runway Length
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {air.runway_length_m} m
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                  <span className="text-[10px] text-muted-foreground block">
                    Elevation
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {air.elevation_ft} ft MSL
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                  <span className="text-[10px] text-muted-foreground block">
                    Refueling
                  </span>
                  <span className="text-xs font-medium text-aero-success flex items-center gap-1">
                    <Fuel size={11} /> Ready
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                  <span className="text-[10px] text-muted-foreground block">
                    Coordinates
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {air.latitude.toFixed(2)}°N, {air.longitude.toFixed(2)}°E
                  </span>
                </div>
              </div>
            </>
          );
        })()}

        {/* AIRCRAFT DETAILS */}
        {selected.type === "aircraft" && (() => {
          const ac = selected.data as Aircraft;
          const isAvail = ac.status === "available";
          const isMaint = ac.status === "maintenance";
          return (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground font-mono">
                    {ac.tail_number}
                  </h4>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      isAvail
                        ? "bg-aero-success/10 text-aero-success font-semibold"
                        : isMaint
                        ? "bg-muted/20 text-muted-foreground"
                        : "bg-primary-soft text-primary font-semibold"
                    }`}
                  >
                    {ac.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {ac.model} · <span className="capitalize">{ac.role}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Fuel size={10} /> Fuel Level
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {ac.fuel_level_percent}%
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Gauge size={10} /> Flight Hours
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {ac.flight_hours} hrs
                  </span>
                </div>
              </div>
            </>
          );
        })()}

        {/* SECTOR DETAILS */}
        {selected.type === "sector" && (() => {
          const s = selected.data as Sector & {
            weather_condition?: string;
            ceiling_ft?: number;
            visibility_km?: number;
            wind_speed_kts?: number;
            is_watch?: boolean;
          };
          const isWatch = s.is_watch || s.risk_level === "medium";
          return (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground font-mono">
                    {s.code}
                  </h4>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      isWatch
                        ? "bg-aero-warning/15 text-aero-warning font-semibold"
                        : "bg-aero-success/10 text-aero-success font-semibold"
                    }`}
                  >
                    {isWatch ? "Advisory Watch" : "Nominal"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.name}</p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border/60">
                <div className="rounded-xl border border-border/60 bg-background/60 p-1.5 text-center">
                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                    <CloudRain size={10} /> Ceiling
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {s.ceiling_ft ? `${s.ceiling_ft} ft` : "4,200 ft"}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-1.5 text-center">
                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                    <Eye size={10} /> Visibility
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {s.visibility_km ? `${s.visibility_km} km` : "8.5 km"}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/60 p-1.5 text-center">
                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                    <Wind size={10} /> Wind
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {s.wind_speed_kts ? `${s.wind_speed_kts} kts` : "14 kts"}
                  </span>
                </div>
              </div>
            </>
          );
        })()}

        {/* MISSION ROUTE DETAILS */}
        {selected.type === "route" && (() => {
          const m = selected.data as Mission & {
            origin_code?: string;
            destination_code?: string;
          };
          return (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    {m.code}
                  </h4>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      m.priority === "critical"
                        ? "bg-aero-critical/10 text-aero-critical font-semibold"
                        : m.priority === "high"
                        ? "bg-aero-warning/15 text-aero-warning font-semibold"
                        : "bg-primary-soft text-primary"
                    }`}
                  >
                    {m.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium line-clamp-1">
                  {m.title}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-2 flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-foreground">
                  {m.origin_code || "SYN-ALPHA"}
                </span>
                <ArrowRight size={12} className="text-muted-foreground" />
                <span className="font-mono font-semibold text-foreground">
                  {m.destination_code || "SYN-BRAVO"}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border/60 font-mono text-muted-foreground">
                  {m.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Model: {m.required_aircraft_model || "AeroLift M1"}</span>
                {m.cargo_weight_kg > 0 && (
                  <span>Cargo: {m.cargo_weight_kg} kg</span>
                )}
              </div>
            </>
          );
        })()}

        {/* RESTRICTION / NOTAM DETAILS */}
        {selected.type === "restriction" && (() => {
          const res = selected.data as AirspaceRestriction;
          return (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground font-mono">
                    {res.identifier}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-aero-warning/15 text-aero-warning uppercase">
                    {res.status}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium mt-0.5">
                  {res.name}
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed bg-background/60 p-2 rounded-xl border border-border/60">
                {res.reason}
              </p>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>
                  Alt: {res.altitude_floor_ft} - {res.altitude_ceiling_ft} ft
                </span>
                <span className="capitalize">{res.type.replace("-", " ")}</span>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
