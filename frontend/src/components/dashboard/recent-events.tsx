import { Radio, AlertTriangle, Cpu, Info, Cloud } from "lucide-react";
import { OperationalEvent } from "@/lib/api";

interface RecentEventsProps {
  events: OperationalEvent[];
  loading?: boolean;
}

export function RecentEvents({ events, loading = false }: RecentEventsProps) {
  if (loading) {
    return (
      <div className="aero-card p-5 animate-pulse">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string, category: string) => {
    if (category === "weather") {
      return <Cloud size={14} className="text-aero-warning" />;
    }
    if (type === "optimization") {
      return <Cpu size={14} className="text-primary" />;
    }
    if (type === "warning") {
      return <AlertTriangle size={14} className="text-aero-warning" />;
    }
    if (type === "critical") {
      return <AlertTriangle size={14} className="text-aero-critical" />;
    }
    return <Info size={14} className="text-muted-foreground" />;
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full">
        {category}
      </span>
    );
  };

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return "just now";
    }
  };

  return (
    <div className="aero-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-aero-success animate-pulse" />
          <h3 className="aero-section-title">Operational Feed</h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">Live Sync</span>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="mt-0.5 rounded-lg border border-border bg-card p-1.5 shrink-0">
              {getEventIcon(evt.type, evt.category)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground truncate">
                  {evt.title}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {formatTime(evt.created_at)}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                {evt.description}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                {getCategoryBadge(evt.category)}
                {evt.type === "warning" && (
                  <span className="aero-badge-warning text-[9px] py-0">Caution</span>
                )}
                {evt.type === "optimization" && (
                  <span className="aero-badge-primary text-[9px] py-0">Deterministic Solver</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
            No recent operational events recorded.
          </div>
        )}
      </div>
    </div>
  );
}
