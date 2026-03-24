import React, { useState, useRef, useEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';

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
        className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10 text-gray-400 hover:text-white transition"
        title="Actions"
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg shadow-xl bg-slate-800 border border-white border-opacity-10 py-1 animate-in fade-in duration-150">
          {visibleActions.map((action, i) => (
            <button
              key={i}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-white hover:bg-opacity-10 disabled:opacity-40 disabled:cursor-not-allowed ${
                action.className || 'text-gray-300 hover:text-white'
              }`}
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
