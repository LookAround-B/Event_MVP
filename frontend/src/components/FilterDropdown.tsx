import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Filter, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label?: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  align?: "left" | "right";
}

export function FilterDropdown({ label = "Filters", options, selected, onChange, align = "left" }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: align === "right" ? rect.right - 256 : rect.left,
      });
    }
  }, [open, align]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div ref={containerRef} className="relative z-20">
      <button
        ref={buttonRef}
        onClick={() => { setOpen(!open); setQuery(""); }}
        className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm transition-colors border",
          open
            ? "border-primary/50 text-primary bg-primary/5"
            : "text-on-surface-variant bg-surface-container hover:bg-surface-bright border-border/50"
        )}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
        {selected.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9998] w-64 max-w-[280px] rounded-2xl border border-border/60 bg-surface-low shadow-2xl animate-fade-in overflow-hidden flex flex-col"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="p-2 border-b border-border/40">
            <div className="relative">
              <Search className="search-input-icon pointer-events-none absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search filters..."
                className="search-input-with-icon w-full pr-3 py-2.5 text-sm bg-surface-container rounded-lg border border-border/40 text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-none">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-center text-muted-foreground">No options found</p>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-surface-container transition-colors group"
                  >
                    <span className={cn("truncate", isSelected ? "text-primary font-semibold" : "text-on-surface")}>
                      {opt.label}
                    </span>
                    <div className={cn(
                      "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ml-3",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent group-hover:border-primary/50"
                    )}>
                      <Check className="w-3 h-3" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-border/40 bg-surface-container/20">
              <button
                onClick={() => onChange([])}
                className="w-full py-1.5 text-xs font-semibold text-muted-foreground hover:text-on-surface transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
