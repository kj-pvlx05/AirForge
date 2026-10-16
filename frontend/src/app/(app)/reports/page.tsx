import { BarChart3 } from "lucide-react";

/** Reports & Analytics — Tier 3. Charts, readiness trends, utilization. */
export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Operational trends, readiness metrics, and resource utilization analytics.
        </p>
      </div>
      <div className="aero-card flex flex-col items-center justify-center gap-3 p-12">
        <div className="rounded-full bg-aero-primary-vsoft p-4">
          <BarChart3 size={24} className="text-aero-primary" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Reports will use Recharts for data visualization in Phase 9.
        </p>
      </div>
    </div>
  );
}
