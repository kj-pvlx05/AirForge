import { Shell } from "@/components/layout/shell";

/**
 * Layout for all app pages — wraps with Sidebar + Topbar shell.
 * Using a route group (app) so the shell doesn't affect the root redirect.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
