/** Keyboard shortcuts reference */

import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS } from '../../features/shortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const scopes = ['global', 'products', 'image', 'video'] as const;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Keyboard className="w-4 h-4 text-zinc-300" /> Keyboard Shortcuts
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {scopes.map((scope) => {
            const items = SHORTCUTS.filter((s) => s.scope === scope);
            if (!items.length) return null;
            return (
              <div key={scope}>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1.5">{scope}</div>
                <div className="space-y-1">
                  {items.map((s) => (
                    <div key={s.keys + s.action} className="flex items-center justify-between gap-3 text-xs py-1">
                      <span className="text-zinc-300">{s.action}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400 shrink-0">{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsPanel;
