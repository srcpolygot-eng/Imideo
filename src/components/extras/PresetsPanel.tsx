/** Style presets picker for product mockups */

import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { STYLE_PRESETS, applyPreset, type StylePreset } from '../../features/presets';
import type { LogoTransform } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transform: LogoTransform;
  onApply: (next: LogoTransform, preset: StylePreset) => void;
}

export const PresetsPanel: React.FC<Props> = ({ isOpen, onClose, transform, onApply }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-fuchsia-950/40 to-zinc-900">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            Style Presets
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onApply(applyPreset(transform, p), p);
                onClose();
              }}
              className="text-left p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-fuchsia-500/50 transition-colors"
            >
              <div className="text-lg mb-1">{p.emoji}</div>
              <div className="text-xs font-semibold text-zinc-100">{p.name}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{p.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {p.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400">{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresetsPanel;
