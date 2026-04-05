import { X, Trash2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const ConfirmModal = ({
  open, onClose, onConfirm,
  title = "Delete Record",
  description = "This action cannot be undone.",
}: ConfirmModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border/60 bg-surface-low shadow-2xl shadow-black/40 animate-fade-in pointer-events-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="text-base font-bold text-on-surface">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border/50 text-sm font-semibold text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
