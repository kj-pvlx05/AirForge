import { Plane } from "lucide-react";

/** Fleet Management — Tier 3. Aircraft inventory, status, and maintenance schedule. */
export default function FleetPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Fleet</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Aircraft inventory, operational status, and maintenance scheduling.
        </p>
      </div>
      <div className="aero-card flex flex-col items-center justify-center gap-3 p-12">
        <div className="rounded-full bg-aero-primary-vsoft p-4">
          <Plane size={24} className="text-aero-primary" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Fleet data will be populated from the backend in Phase 4.
        </p>
      </div>
    </div>
  );
}
