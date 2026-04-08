
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchSelect } from "@/components/SearchSelect";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function displayDate(s: string) {
  const d = parseDate(s);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder,
  className,
  disabled
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  
  // Initialize view to the selected date or today
  const initDate = parseDate(value) || today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  // Sync view when opened
  useEffect(() => {
    if (open) {
      const d = parseDate(value) || today;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [open, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 400; // approximate
      const top = spaceBelow > dropdownHeight ? rect.bottom + 6 : rect.top - dropdownHeight - 6;
      setDropdownPos({
        top: Math.max(8, top),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
      });
    }
  }, [open]);

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const selected = parseDate(value);
  const isSelected = (d: number) =>
    selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  const isToday = (d: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Generate Year options
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => String(currentYear + 10 - i));
  const monthOptions = MONTHS.map((m, idx) => ({ value: String(idx), label: m }));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150 border",
          "bg-surface-container border-border/50 hover:border-primary/40 focus:outline-none",
          open && "border-primary/60 ring-1 ring-primary/30",
          value ? "text-on-surface" : "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed hover:border-border/50"
        )}
      >
        <span>{value ? displayDate(value) : (placeholder || "Pick a date…")}</span>
        <Calendar className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-[320px] max-w-[320px] rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/30 p-4"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {/* Controls logic with proper searchable dropdowns */}
          <div className="flex items-center gap-2 mb-3">
            <button type="button" onClick={prevMonth} className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-colors border border-border/40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              <SearchSelect 
                value={String(viewMonth)}
                onChange={(v) => setViewMonth(Number(v))}
                options={monthOptions}
              />
              <SearchSelect 
                value={String(viewYear)}
                onChange={(v) => setViewYear(Number(v))}
                options={yearOptions}
              />
            </div>

            <button type="button" onClick={nextMonth} className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center hover:bg-surface-container text-muted-foreground hover:text-on-surface transition-colors border border-border/40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => { onChange(formatDate(new Date(viewYear, viewMonth, day))); setOpen(false); }}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-medium transition-all duration-150",
                      isSelected(day)
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : isToday(day)
                        ? "border border-primary/50 text-primary"
                        : "text-on-surface hover:bg-surface-container hover:text-on-surface"
                    )}
                  >
                    {day}
                  </button>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-border/30 flex gap-2">
            <button
              type="button"
              onClick={() => { onChange(formatDate(today)); setOpen(false); }}
              className="flex-1 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="flex-1 py-1.5 text-xs font-semibold text-muted-foreground hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors border border-border/40"
              >
                Clear
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
