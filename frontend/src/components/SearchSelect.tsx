
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: (string | SearchSelectOption)[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function SearchSelect({ value, onChange, options, placeholder, className, icon }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Normalize options to object format
  const normalizedOptions = options.map(o => typeof o === "string" ? { value: o, label: o } : o);

  const filtered = normalizedOptions.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = normalizedOptions.find(o => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-150 border",
          "bg-surface-container text-on-surface border-border/50",
          "hover:border-primary/40 focus:outline-none",
          open && "border-primary/60 ring-1 ring-primary/30"
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className={value ? "text-on-surface" : "text-muted-foreground"}>
            {selectedOption ? selectedOption.label : (placeholder || "Select…")}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border/60 bg-surface-low shadow-2xl shadow-black/30 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container rounded-lg border border-border/40 text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-44 overflow-y-auto py-1 scrollbar-none">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">No results</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors",
                    value === opt.value
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container"
                  )}
                >
                  {opt.label}
                  {value === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
