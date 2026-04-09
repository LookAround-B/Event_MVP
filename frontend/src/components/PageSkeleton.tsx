import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/TableSkeleton";

type PageSkeletonVariant =
  | "dashboard"
  | "table"
  | "detail"
  | "form"
  | "modal"
  | "list"
  | "public";

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  rows?: number;
}

const CardGrid = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bento-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-3 w-24 bg-border/30" />
            <Skeleton className="h-8 w-20 bg-border/20" />
            <Skeleton className="h-3 w-28 bg-border/20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl bg-border/20" />
        </div>
      </div>
    ))}
  </div>
);

const HeaderBlock = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-56 bg-border/20" />
    <Skeleton className="h-4 w-80 max-w-full bg-border/20" />
  </div>
);

export function PageSkeleton({
  variant = "detail",
  rows = 5,
}: PageSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 animate-fade-in">
        <HeaderBlock />
        <CardGrid />
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          <div className="bento-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 bg-border/20" />
              <Skeleton className="h-9 w-28 rounded-xl bg-border/20" />
            </div>
            <Skeleton className="h-[320px] w-full rounded-2xl bg-border/15" />
          </div>
          <div className="space-y-4">
            <div className="bento-card p-5 space-y-4">
              <Skeleton className="h-5 w-36 bg-border/20" />
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl bg-border/20" />
              ))}
            </div>
            <div className="bento-card p-5 space-y-4">
              <Skeleton className="h-5 w-32 bg-border/20" />
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-xl bg-border/20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-6 animate-fade-in">
        <HeaderBlock />
        <CardGrid count={3} />
        <TableSkeleton rows={rows} cols={5} />
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <HeaderBlock />
        <div className="bento-card p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-28 bg-border/20" />
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-28 w-full rounded-2xl bg-border/15" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-full bg-border/20" />
            <Skeleton className="h-11 w-44 rounded-full bg-border/15" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
        <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40">
          <div className="border-b border-border/40 px-6 py-5">
            <Skeleton className="h-6 w-44 bg-border/20" />
            <Skeleton className="mt-3 h-4 w-64 bg-border/15" />
          </div>
          <div className="space-y-5 px-6 py-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-28 bg-border/20" />
                <Skeleton className="h-11 w-full rounded-xl bg-border/20" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 border-t border-border/40 px-6 py-4">
            <Skeleton className="h-11 flex-1 rounded-full bg-border/20" />
            <Skeleton className="h-11 flex-1 rounded-full bg-border/15" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-6 animate-fade-in">
        <HeaderBlock />
        <div className="bento-card p-5 space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-border/20 p-4">
              <Skeleton className="h-10 w-10 rounded-xl bg-border/20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 bg-border/20" />
                <Skeleton className="h-3 w-64 max-w-full bg-border/15" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full bg-border/15" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "public") {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-3 text-center">
            <Skeleton className="mx-auto h-10 w-56 bg-border/20" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full bg-border/15" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bento-card p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full rounded-xl bg-border/20" />
              ))}
            </div>
            <div className="bento-card p-6 space-y-4">
              <Skeleton className="h-56 w-full rounded-2xl bg-border/15" />
              <Skeleton className="h-4 w-3/4 bg-border/15" />
              <Skeleton className="h-4 w-1/2 bg-border/15" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <HeaderBlock />
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="bento-card p-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl bg-border/15" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl bg-border/20" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="bento-card p-5 space-y-3">
            <Skeleton className="h-5 w-36 bg-border/20" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl bg-border/20" />
            ))}
          </div>
          <div className="bento-card p-5 space-y-3">
            <Skeleton className="h-5 w-28 bg-border/20" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl bg-border/15" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
