
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const PortalModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: PortalModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in overflow-hidden">
      {/* ── Blurred Backdrop ── */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-xl animate-fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* ── Modal Shell ── */}
      <div className={cn(
        "relative w-full overflow-hidden bg-surface-container/40 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_120px_-24px_rgba(0,0,0,0.6)] animate-scale-up border-beam",
        maxWidth
      )} onClick={e => e.stopPropagation()}>
        
        {/* ── Dynamic Glow Layer ── */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-full pointer-events-none opacity-40" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-tr-full pointer-events-none opacity-30" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 relative z-10 bg-white/5 backdrop-blur-md">
           {title && <h3 className="text-xl font-black text-on-surface tracking-tight uppercase tracking-widest">{title}</h3>}
           <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-white/10 transition-all text-muted-foreground hover:text-on-surface active:scale-90 group">
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
           </button>
        </div>

        {/* ── Content ── */}
        <div className="px-8 py-8 max-h-[75vh] overflow-y-auto scrollbar-none relative z-10">
           {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
