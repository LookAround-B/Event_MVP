import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  total: number;
  page: number;
  perPage: number;
  onChange: (page: number) => void;
}

function getPageNumbers(totalPages: number, current: number): (number | "…")[] {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) pages.push(p);
  if (current < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

const Pagination = ({ total, page, perPage, onChange }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const pages = getPageNumbers(totalPages, page);

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-on-surface">{from}–{to}</span> of{" "}
        <span className="font-semibold text-on-surface">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
