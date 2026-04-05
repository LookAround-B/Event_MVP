
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Search, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/DatePicker";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
  initialData?: Record<string, string>;
  submitLabel?: string;
}

// ── Searchable Select ────────────────────────────────────────────────────────

const SearchSelect = ({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150 border",
          "bg-surface-container text-on-surface border-border/50",
          "hover:border-primary/40 focus:outline-none",
          open && "border-primary/60 ring-1 ring-primary/30"
        )}
      >
        <span className={value ? "text-on-surface" : "text-muted-foreground"}>
          {value || placeholder || "Select…"}
        </span>
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
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground text-center">No results</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); setQuery(""); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors",
                    value === opt
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container"
                  )}
                >
                  {opt}
                  {value === opt && <Check className="w-3.5 h-3.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

;

// ── Form Modal ───────────────────────────────────────────────────────────────

const FormModal = ({ open, onClose, title, fields, onSubmit, initialData, submitLabel = "Create" }: FormModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(initialData ?? {});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (open) setFormData(initialData ?? {});
  }, [open, initialData]);

  const set = useCallback((name: string, val: string) => setFormData((prev) => ({ ...prev, [name]: val })), []);

  if (!open || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal shell — flex column with fixed max height */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto"
        style={{ maxHeight: "min(90vh, 720px)" }}>

        {/* ── Sticky header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            {fields.map((field) => {
              const fullWidth = field.type === "textarea";
              return (
                <div key={field.name} className={fullWidth ? "sm:col-span-2" : ""}>
                  <label className="label-tech block mb-1.5">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>

                  {field.type === "select" ? (
                    <SearchSelect
                      value={formData[field.name] || ""}
                      onChange={(v) => set(field.name, v)}
                      options={field.options ?? []}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "date" ? (
                    <DatePicker
                      value={formData[field.name] || ""}
                      onChange={(v) => set(field.name, v)}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={formData[field.name] || ""}
                      onChange={(e) => set(field.name, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 min-h-[88px] resize-none placeholder:text-muted-foreground"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={(e) => set(field.name, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 placeholder:text-muted-foreground"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border/40 flex-shrink-0">
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 py-2.5 btn-cta rounded-xl text-sm font-bold"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-bright transition-colors border border-border/50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FormModal;
