import { X, FileText, FileSpreadsheet, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (type: "csv" | "excel") => void;
}

const ExportModal = ({ open, onClose, onExport }: ExportModalProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border/60 bg-surface-low shadow-2xl animate-fade-in flex flex-col pointer-events-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-on-surface">Download as</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2.5">
          <button onClick={() => onExport("excel")} className="group w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-surface-container/40 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-200 text-left">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Excel Spreadsheet</p>
              <p className="text-xs text-muted-foreground mt-0.5">.xlsx — for Microsoft Excel</p>
            </div>
          </button>
          <button onClick={() => onExport("csv")} className="group w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-surface-container/40 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-200 text-left">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">CSV File</p>
              <p className="text-xs text-muted-foreground mt-0.5">.csv — plain text, universal</p>
            </div>
          </button>
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportModal;
