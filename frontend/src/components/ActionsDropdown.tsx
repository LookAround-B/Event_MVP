import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  hidden?: boolean;
  disabled?: boolean;
}

interface ActionsDropdownProps {
  actions: ActionItem[];
}

export default function ActionsDropdown({ actions }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const visibleActions = actions.filter(a => !a.hidden);
  if (visibleActions.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'hsl(var(--muted-foreground))' }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'hsl(var(--surface-bright))';
          e.currentTarget.style.color = 'hsl(var(--on-surface))';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
        }}
        title="Actions"
        aria-label="Actions menu"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-44 rounded-lg shadow-xl py-1 animate-fade-in"
          style={{
            background: 'hsl(var(--surface-container))',
            border: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          {visibleActions.map((action, i) => (
            <button
              key={i}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                action.className || ''
              }`}
              style={{ color: action.className ? undefined : 'hsl(var(--on-surface))' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'hsl(var(--surface-bright))')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
