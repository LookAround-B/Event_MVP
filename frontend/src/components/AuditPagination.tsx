import { cn } from '@/lib/utils';

interface AuditPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function AuditPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: AuditPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className={cn('relative z-10 flex items-center justify-center gap-2 mt-4', className)}>
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 disabled:pointer-events-none"
      >
        Previous
      </button>
      <span className="px-4 py-2 text-sm font-medium text-muted-foreground">
        Page {page} of {safeTotalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
        disabled={page === safeTotalPages}
        className="inline-flex min-w-[96px] items-center justify-center rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  );
}
