import { Cloud } from "lucide-react";

/** Environment — Tier 3. Weather conditions, airspace restrictions, sector status. */
export default function EnvironmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Environment</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Weather conditions, airspace restrictions, and operational sector status.
        </p>
      </div>
      <div className="aero-card flex flex-col items-center justify-center gap-3 p-12">
        <div className="rounded-full bg-aero-primary-vsoft p-4">
          <Cloud size={24} className="text-aero-primary" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Environment data will be populated from the backend in Phase 4.
        </p>
      </div>
    </div>
  );
}
