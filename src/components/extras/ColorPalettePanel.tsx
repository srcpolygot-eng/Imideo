/** Logo color extractor panel */
import React, { useEffect, useState } from 'react';
import { X, Palette, Copy, Loader2, Pipette } from 'lucide-react';
import { extractPaletteFromDataUrl, copyHex } from '../../features/colorExtract';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onPickColor?: (hex: string) => void;
  onToast?: (msg: string) => void;
}

export const ColorPalettePanel: React.FC<Props> = ({ isOpen, onClose, imageUrl, onPickColor, onToast }) => {
  const [hexes, setHexes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !imageUrl) { setHexes([]); setError(null); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    extractPaletteFromDataUrl(imageUrl, 8)
      .then((p) => { if (!cancelled) setHexes(p.hex); })
      .catch(() => { if (!cancelled) setError('Could not read colors from image'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-teal-950/40 to-zinc-900">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Palette className="w-4 h-4 text-teal-400" /> Brand Colors
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          {!imageUrl && <p className="text-xs text-zinc-500 text-center py-6">Load a logo to extract colors</p>}
          {loading && <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 py-6"><Loader2 className="w-4 h-4 animate-spin" /> Sampling palette\u2026</div>}
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {!loading && hexes.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {hexes.map((h) => (
                <button key={h} type="button" onClick={async () => {
                  try { await copyHex(h); onToast?.(`Copied ${h}`); } catch { /* */ }
                  onPickColor?.(h);
                }} className="group rounded-xl overflow-hidden border border-zinc-700 hover:border-teal-400" title={h}>
                  <div className="h-12 w-full" style={{ background: h }} />
                  <div className="px-1 py-1 text-[9px] font-mono text-zinc-400 flex items-center justify-between bg-zinc-950">
                    <span>{h}</span><Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="text-[10px] text-zinc-600 flex items-center gap-1"><Pipette className="w-3 h-3" /> Click a swatch to copy & apply as product color</p>
        </div>
      </div>
    </div>
  );
};

export default ColorPalettePanel;
