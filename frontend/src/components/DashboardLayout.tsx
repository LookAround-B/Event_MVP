
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const pageTitles: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/events":           "Events",
  "/registrations":    "Registrations",
  "/financial":        "Financial",
  "/reports":          "Reports",
  "/clubs":            "Clubs",
  "/riders":           "Riders",
  "/horses":           "Horses",
  "/users":            "Users",
  "/admin/approvals":  "Approvals",
  "/notifications":    "Notifications",
  "/audit":            "Audit Log",
  "/settings":         "Settings",
  "/profile":          "Profile",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const title = pageTitles[router.pathname] || "Dashboard";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-h-screen min-w-0 relative">

          {/* Ambient background blobs */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.04] bg-primary" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.03]"
              style={{ background: "hsl(253,90%,73%)" }} />
          </div>

          {/* Dot-grid background */}
          <div className="pointer-events-none fixed inset-0 dot-grid opacity-[0.018] z-0" />

          {/* Top bar */}
          <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30
            border-b border-border/40 backdrop-blur-xl"
            style={{ background: "hsl(var(--background)/0.85)" }}>

            {/* Left: trigger + title */}
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-on-surface transition-colors" />
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-extrabold gradient-text tracking-tight">{title}</h2>
              </div>
            </div>

            {/* Right: search + actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-36 lg:w-52 transition-all rounded-xl border border-border/50"
                  style={{ background: "hsl(var(--surface-container))" }}
                />
              </div>

              <ThemeToggle />

              {/* Notification bell with pulse */}
              <Link href="/notifications" className="relative p-2 sm:p-2.5 rounded-xl hover:bg-surface-container transition-colors text-muted-foreground hover:text-on-surface border border-border/50">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary pulse-ring" />
              </Link>

              {/* Avatar */}
              <Link href="/profile" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold border border-primary/30 shimmer-card hover:opacity-80 transition-opacity"
                style={{ background: "hsl(var(--primary)/0.15)", color: "hsl(var(--primary))" }}>
                A
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-3 sm:p-6 overflow-auto relative z-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
