import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ViewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: { label: string; value: string | number }[];
}

const ViewModal = ({ open, onClose, title, fields }: ViewModalProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg flex flex-col rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto"
        style={{ maxHeight: "min(90vh, 600px)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 flex-shrink-0">
          <h3 className="text-base font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {fields.map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="label-tech">{label}</p>
                <p className="text-sm text-on-surface font-medium break-words">{String(value) || "—"}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/40 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewModal;
