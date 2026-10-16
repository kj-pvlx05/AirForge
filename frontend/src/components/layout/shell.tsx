import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface ShellProps {
  children: React.ReactNode;
}

/**
 * Shell — the application frame.
 * Fixed sidebar (260px) + topbar (56px) + scrollable content area.
 * Used by all pages within the (app) route group.
 */
export function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="ml-[260px] flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
