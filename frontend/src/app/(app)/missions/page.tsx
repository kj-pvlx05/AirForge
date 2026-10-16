import { Target } from "lucide-react";

/** Missions & Tasks — Tier 3. Mission list, timeline, assignments. */
export default function MissionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Missions & Tasks</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Active, scheduled, and completed missions with assignment details.
        </p>
      </div>
      <div className="aero-card flex flex-col items-center justify-center gap-3 p-12">
        <div className="rounded-full bg-aero-primary-vsoft p-4">
          <Target size={24} className="text-aero-primary" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Mission data will be populated from the backend in Phase 4.
        </p>
      </div>
    </div>
  );
}
