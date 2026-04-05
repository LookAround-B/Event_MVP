
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 6 }: TableSkeletonProps) {
  return (
    <div className="bento-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-surface-container/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-4">
                  <Skeleton className="h-4 w-24 bg-border/40" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-t border-border/50">
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="p-4">
                    {j === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded bg-border/30" />
                        <Skeleton className="h-4 w-40 bg-border/30" />
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-full bg-border/20" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-border/50 flex items-center justify-between">
        <Skeleton className="h-4 w-32 bg-border/20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg bg-border/20" />
          <Skeleton className="h-8 w-8 rounded-lg bg-border/20" />
        </div>
      </div>
    </div>
  );
}
