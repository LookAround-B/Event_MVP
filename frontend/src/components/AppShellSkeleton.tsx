import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/PageSkeleton";

export function AppShellSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-background animate-fade-in">
      <aside className="hidden lg:flex w-[17rem] shrink-0 flex-col border-r border-border/40 bg-surface-low px-4 py-5">
        <Skeleton className="mb-8 h-10 w-32 rounded-xl bg-border/20" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Skeleton className="h-4 w-4 rounded-md bg-border/20" />
              <Skeleton className="h-4 w-28 bg-border/20" />
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 relative">
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.04] bg-primary" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.03]" style={{ background: "hsl(253,90%,73%)" }} />
        </div>
        <div className="pointer-events-none fixed inset-0 dot-grid opacity-[0.018] z-0" />

        <header
          className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 border-b border-border/40 backdrop-blur-xl"
          style={{ background: "hsl(var(--background)/0.85)" }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <Skeleton className="h-8 w-8 rounded-xl bg-border/20" />
            <Skeleton className="h-6 w-36 bg-border/20" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="hidden sm:block h-10 w-40 rounded-xl bg-border/20" />
            <Skeleton className="h-9 w-9 rounded-xl bg-border/20" />
            <Skeleton className="h-9 w-9 rounded-xl bg-border/20" />
            <Skeleton className="h-9 w-9 rounded-xl bg-border/20" />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 overflow-auto relative z-10">
          <PageSkeleton variant="dashboard" />
        </main>
      </div>
    </div>
  );
}
