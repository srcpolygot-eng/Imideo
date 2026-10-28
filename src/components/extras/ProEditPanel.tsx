/** Premiere Pro / DaVinci Resolve style pro tools panel for Video Studio */
import React from 'react';
import {
  Undo2, Redo2, Scissors, ArrowLeftToLine, ArrowRightToLine, Eraser, Minimize2, MapPin,
  ChevronsRight, ClipboardCopy, ClipboardPaste, FileText, Captions, TrendingUp,
} from 'lucide-react';
import type { TimelineClip, ColorGrade, Marker } from '../videoStudioTypes';
import { DEFAULT_COLOR } from '../videoStudioTypes';
import { GRADE_LOOKS } from '../../features/videoPro';

interface Props {
  selected: TimelineClip | null;
  canUndo: boolean;
  canRedo: boolean;
  markIn: number | null;
  markOut: number | null;
  markers: Marker[];
  hasCopied: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSplitAll: () => void;
  onSetIn: () => void;
  onSetOut: () => void;
  onLift: () => void;
  onExtract: () => void;
  onCloseGaps: () => void;
  onAddMarker: () => void;
  onJumpMarker: (dir: 1 | -1) => void;
  onRemoveMarker: (id: string) => void;
  onSeek: (t: number) => void;
  onCopyAttrs: () => void;
  onPasteAttrs: () => void;
  onRamp: (from: number, to: number) => void;
  onGrade: (g: Partial<ColorGrade>) => void;
  onExportEDL: () => void;
  onExportSRT: () => void;
}

const GRADE_SLIDERS: { key: keyof ColorGrade; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Exposure', min: 50, max: 150 },
  { key: 'contrast', label: 'Contrast', min: 50, max: 150 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200 },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
  { key: 'tint', label: 'Tint', min: -100, max: 100 },
  { key: 'lift', label: 'Lift', min: -50, max: 50 },
  { key: 'gamma', label: 'Gamma', min: -50, max: 50 },
  { key: 'gain', label: 'Gain', min: -50, max: 50 },
];

const btn = 'px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-[10px] font-semibold text-zinc-200 flex items-center gap-1';

export const ProEditPanel: React.FC<Props> = (p) => {
  const grade = { ...DEFAULT_COLOR, ...(p.selected?.color || {}) };
  const sorted = [...p.markers].sort((a, b) => a.time - b.time);
  return (
    <div className="space-y-2.5">
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pro Edit</div>
      <div className="flex flex-wrap gap-1">
        <button type="button" className={btn} disabled={!p.canUndo} onClick={p.onUndo} title="Ctrl+Z"><Undo2 className="w-3 h-3" /> Undo</button>
        <button type="button" className={btn} disabled={!p.canRedo} onClick={p.onRedo} title="Ctrl+Shift+Z"><Redo2 className="w-3 h-3" /> Redo</button>
        <button type="button" className={btn} onClick={p.onSplitAll} title="Add edit to all tracks"><Scissors className="w-3 h-3" /> Split all tracks</button>
        <button type="button" className={btn} onClick={p.onCloseGaps}><Minimize2 className="w-3 h-3" /> Close gaps</button>
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        <button type="button" className={btn} onClick={p.onSetIn} title="I"><ArrowLeftToLine className="w-3 h-3" /> In{p.markIn !== null ? ` ${p.markIn.toFixed(1)}s` : ''}</button>
        <button type="button" className={btn} onClick={p.onSetOut} title="O"><ArrowRightToLine className="w-3 h-3" /> Out{p.markOut !== null ? ` ${p.markOut.toFixed(1)}s` : ''}</button>
        <button type="button" className={btn} disabled={p.markIn === null || p.markOut === null} onClick={p.onLift}><Eraser className="w-3 h-3" /> Lift</button>
        <button type="button" className={btn} disabled={p.markIn === null || p.markOut === null} onClick={p.onExtract}><ChevronsRight className="w-3 h-3" /> Extract</button>
      </div>
      <div className="flex flex-wrap gap-1">
        <button type="button" className={btn} onClick={p.onAddMarker} title="M"><MapPin className="w-3 h-3" /> Marker</button>
        <button type="button" className={btn} onClick={() => p.onJumpMarker(-1)}>‹ Prev</button>
        <button type="button" className={btn} onClick={() => p.onJumpMarker(1)}>Next ›</button>
        <button type="button" className={btn} disabled={!p.selected} onClick={p.onCopyAttrs}><ClipboardCopy className="w-3 h-3" /> Copy attrs</button>
        <button type="button" className={btn} disabled={!p.selected || !p.hasCopied} onClick={p.onPasteAttrs}><ClipboardPaste className="w-3 h-3" /> Paste attrs</button>
      </div>
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sorted.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-300">
              <button type="button" onClick={() => p.onSeek(m.time)}>{m.label} {m.time.toFixed(1)}s</button>
              <button type="button" className="text-zinc-500 hover:text-rose-400" onClick={() => p.onRemoveMarker(m.id)}>×</button>
            </span>
          ))}
        </div>
      )}
      {p.selected && (
        <>
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[9px] text-zinc-500">Speed ramp</span>
            <button type="button" className={btn} onClick={() => p.onRamp(1, 0.3)}><TrendingUp className="w-3 h-3 rotate-180" /> Ease out</button>
            <button type="button" className={btn} onClick={() => p.onRamp(0.3, 1)}><TrendingUp className="w-3 h-3" /> Ease in</button>
            <button type="button" className={btn} onClick={() => p.onRamp(1, 3)}>Speed up</button>
          </div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pt-1">Color · Lumetri / Primaries</div>
          <div className="flex flex-wrap gap-1">
            <button type="button" className={btn} onClick={() => p.onGrade({ ...DEFAULT_COLOR })}>Reset</button>
            {GRADE_LOOKS.map((l) => (
              <button key={l.id} type="button" className={btn} onClick={() => p.onGrade({ ...DEFAULT_COLOR, ...l.grade })}>{l.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GRADE_SLIDERS.map((s) => (
              <label key={s.key} className="space-y-0.5">
                <span className="text-[9px] text-zinc-500">{s.label} {grade[s.key]}</span>
                <input type="range" min={s.min} max={s.max} value={grade[s.key]} className="w-full"
                  onChange={(e) => p.onGrade({ ...grade, [s.key]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-1 pt-1">
        <button type="button" className={btn} onClick={p.onExportEDL}><FileText className="w-3 h-3" /> Export EDL</button>
        <button type="button" className={btn} onClick={p.onExportSRT}><Captions className="w-3 h-3" /> Export SRT</button>
      </div>
    </div>
  );
};
