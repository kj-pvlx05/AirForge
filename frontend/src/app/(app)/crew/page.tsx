import { Users } from "lucide-react";

/** Personnel & Crew — Tier 3. Crew roster, qualifications, duty status. */
export default function CrewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Personnel & Crew</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Crew roster, qualifications, certifications, and duty-hour tracking.
        </p>
      </div>
      <div className="aero-card flex flex-col items-center justify-center gap-3 p-12">
        <div className="rounded-full bg-aero-primary-vsoft p-4">
          <Users size={24} className="text-aero-primary" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Crew data will be populated from the backend in Phase 4.
        </p>
      </div>
    </div>
  );
}
