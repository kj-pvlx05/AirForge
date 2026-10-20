"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  Users,
  Target,
  Cloud,
  Cpu,
  FlaskConical,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { AirOpsBrand } from "@/components/ui/airops-brand";

/* Map icon string names to Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Plane,
  Users,
  Target,
  Cloud,
  Cpu,
  FlaskConical,
  BarChart3,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-border bg-sidebar">
      {/* ── Brand ── */}
      <div className="flex h-[56px] items-center gap-3 border-b border-border px-6">
        {/* Minimal abstract mark */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Abstract aviation flight path */}
            <path
              d="M9 2C5.134 2 2 5.134 2 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9 16C12.866 16 16 12.866 16 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="9" cy="9" r="2" fill="currentColor" />
          </svg>
        </div>
        <AirOpsBrand size="md" withSubtitle={true} />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium
                    transition-colors duration-150 ease-out
                    ${
                      isActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  {Icon && (
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2 : 1.5}
                      className={
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      }
                    />
                  )}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          AirOps v0.1 · Synthetic Data Only
        </p>
      </div>
    </aside>
  );
}
