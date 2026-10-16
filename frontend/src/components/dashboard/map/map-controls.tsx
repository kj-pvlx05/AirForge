"use client";

import {
  Layers,
  Maximize2,
  X,
  Compass,
  MapPin,
  Plane,
  AlertTriangle,
} from "lucide-react";
import { LayerVisibility } from "./types";

interface MapControlsProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onFitBounds: () => void;
  hasSelection: boolean;
  onClearSelection: () => void;
}

export function MapControls({
  layers,
  onToggleLayer,
  onFitBounds,
  hasSelection,
  onClearSelection,
}: MapControlsProps) {
  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* Left controls: Layer toggles */}
      <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-surface/90 backdrop-blur-md px-2.5 py-1.5 shadow-sm pointer-events-auto">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mr-1.5 pl-0.5">
          <Layers size={13} className="text-primary" />
          <span className="hidden sm:inline">Layers</span>
        </div>

        <button
          onClick={() => onToggleLayer("sectors")}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            layers.sectors
              ? "bg-primary-soft text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle Operational Sectors"
        >
          <Compass size={11} />
          <span>Sectors</span>
        </button>

        <button
          onClick={() => onToggleLayer("airports")}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            layers.airports
              ? "bg-primary-soft text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle Air Stations & Staging Bases"
        >
          <MapPin size={11} />
          <span>Bases</span>
        </button>

        <button
          onClick={() => onToggleLayer("routes")}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            layers.routes
              ? "bg-primary-soft text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle Mission Flight Routes"
        >
          <Layers size={11} />
          <span>Routes</span>
        </button>

        <button
          onClick={() => onToggleLayer("aircraft")}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            layers.aircraft
              ? "bg-primary-soft text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle Live Aircraft Positions"
        >
          <Plane size={11} />
          <span>Fleet</span>
        </button>

        <button
          onClick={() => onToggleLayer("restrictions")}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            layers.restrictions
              ? "bg-primary-soft text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Toggle Airspace Restrictions & NOTAMs"
        >
          <AlertTriangle size={11} />
          <span className="hidden md:inline">NOTAMs</span>
        </button>
      </div>

      {/* Right controls: Fit View, Clear Selection, and Compact Legend */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {hasSelection && (
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 rounded-xl border border-border/80 bg-surface/90 backdrop-blur-md px-2.5 py-1.5 shadow-sm text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            title="Clear Selection (Esc)"
          >
            <X size={12} />
            <span>Clear</span>
          </button>
        )}

        <button
          onClick={onFitBounds}
          className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface/90 backdrop-blur-md px-2.5 py-1.5 shadow-sm text-[11px] font-medium text-foreground hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer"
          title="Fit View to Operational Area"
        >
          <Maximize2 size={12} className="text-primary" />
          <span className="hidden sm:inline">Fit Area</span>
        </button>

        {/* Calm Compact Legend */}
        <div className="hidden lg:flex items-center gap-3 rounded-xl border border-border/80 bg-surface/90 backdrop-blur-md px-3 py-1.5 shadow-sm text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-aero-success" />
            <span className="text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-aero-warning" />
            <span className="text-muted-foreground">Advisory / Watch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-aero-critical" />
            <span className="text-muted-foreground">Restricted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
