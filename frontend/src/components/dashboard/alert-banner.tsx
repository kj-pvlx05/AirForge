"use client";

import { AlertTriangle, ArrowRight, CloudRain, X } from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  message?: string;
  detail?: string;
  type?: "weather" | "warning" | "critical";
  onActionClick?: () => void;
}

export function AlertBanner({
  message = "Weather deterioration monitored near Sector B · Convective squalls forecast for next 3 hours",
  detail = "4 aircraft and 3 scheduled missions in coastal corridor potentially impacted.",
  type = "weather",
  onActionClick,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Operational advisory"
      className="flex items-center justify-between gap-4 rounded-xl border border-aero-primary-light/30 bg-aero-primary-vsoft/80 px-4 py-2.5 transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {type === "weather" ? (
            <CloudRain size={15} strokeWidth={2} />
          ) : (
            <AlertTriangle size={15} strokeWidth={2} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
          <span className="font-semibold text-foreground">{message}</span>
          <span className="text-muted-foreground text-[12px] hidden md:inline">
            — {detail}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onActionClick}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-light cursor-pointer"
        >
          View analysis
          <ArrowRight
            size={13}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
