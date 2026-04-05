
import { useState } from "react";
import { Plus, X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
};

interface QuickActionFABProps {
  actions: QuickAction[];
}

export const QuickActionFAB = ({ actions }: QuickActionFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {/* Action Buttons */}
      {isOpen && (
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-3 animate-slide-up bg-surface-container/95 border border-border/40 py-2 px-4 rounded-xl shadow-2xl backdrop-blur-md cursor-pointer hover:bg-surface-bright transition-all group",
              )}
              style={{ animationDelay: `${(actions.length - index) * 50}ms` }}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
            >
              <span className="text-xs font-bold text-on-surface whitespace-nowrap opacity-80 group-hover:opacity-100">{action.label}</span>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors")}>
                <action.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto active:scale-95 border-beam",
          isOpen ? "bg-destructive text-destructive-foreground rotate-90" : "btn-cta"
        )}
        style={{
          boxShadow: isOpen
            ? "0 0 30px hsla(var(--destructive)/0.35)"
            : "0 0 30px hsla(var(--primary)/0.35)",
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1] bg-black/40 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
