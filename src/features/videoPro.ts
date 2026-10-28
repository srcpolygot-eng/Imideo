/** Pro editing helpers inspired by Adobe Premiere Pro and DaVinci Resolve (pure functions). */
import type { TimelineClip, ColorGrade, Marker } from '../components/videoStudioTypes';
import { DEFAULT_COLOR } from '../components/videoStudioTypes';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const newId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Lumetri / Resolve primary-style grade -> CSS filter string. */
export function gradeToCss(g?: Partial<ColorGrade>): string {
  const c = { ...DEFAULT_COLOR, ...(g || {}) };
  const bright = (c.brightness + c.gamma * 0.4 + c.gain * 0.3 + c.lift * 0.2 + c.shadows * 0.1 + c.highlights * 0.1) / 100;
  const sat = (c.saturation + c.vibrance * 0.5) / 100;
  const hue = c.tint * 0.6;
  const sepia = c.temperature > 0 ? clamp(c.temperature / 200, 0, 0.5) : 0;
  const cool = c.temperature < 0 ? c.temperature * 0.3 : 0;
  const parts = [
    `brightness(${clamp(bright, 0.1, 3).toFixed(3)})`,
    `contrast(${clamp(c.contrast / 100, 0, 3).toFixed(3)})`,
    `saturate(${clamp(sat, 0, 3).toFixed(3)})`,
    `hue-rotate(${(hue + cool).toFixed(1)}deg)`,
  ];
  if (sepia > 0) parts.push(`sepia(${sepia.toFixed(3)})`);
  return parts.join(' ');
}

export function isDefaultGrade(g?: Partial<ColorGrade>): boolean {
  if (!g) return true;
  return (Object.keys(DEFAULT_COLOR) as (keyof ColorGrade)[]).every((k) => (g[k] ?? DEFAULT_COLOR[k]) === DEFAULT_COLOR[k]);
}

export const GRADE_LOOKS: { id: string; label: string; grade: Partial<ColorGrade> }[] = [
  { id: 'teal-orange', label: 'Teal & Orange', grade: { contrast: 115, saturation: 115, temperature: 30, tint: -8 } },
  { id: 'bleach', label: 'Bleach Bypass', grade: { contrast: 135, saturation: 55, brightness: 105 } },
  { id: 'moody', label: 'Moody', grade: { brightness: 90, contrast: 120, saturation: 85, temperature: -25 } },
  { id: 'golden', label: 'Golden Hour', grade: { brightness: 106, saturation: 120, temperature: 60 } },
  { id: 'matte', label: 'Matte', grade: { contrast: 88, brightness: 108, saturation: 90, lift: 10 } },
];

/** Split every clip crossing time t (Premiere "Add Edit to All Tracks"). */
export function splitAllAt(clips: TimelineClip[], t: number): TimelineClip[] {
  const out: TimelineClip[] = [];
  for (const c of clips) {
    if (c.locked || t <= c.start + 0.05 || t >= c.start + c.duration - 0.05) { out.push(c); continue; }
    const off = t - c.start;
    out.push({ ...c, id: newId('c'), duration: off, outPoint: c.inPoint + off * c.speed });
    out.push({ ...c, id: newId('c'), start: t, duration: c.duration - off, inPoint: c.inPoint + off * c.speed });
  }
  return out;
}

/** Remove time range [a,b] from all tracks. ripple=true closes the gap (Extract), false leaves it (Lift). */
export function removeRange(clips: TimelineClip[], a: number, b: number, ripple: boolean): TimelineClip[] {
  if (b <= a) return clips;
  const cut = splitAllAt(splitAllAt(clips, a), b);
  const gap = b - a;
  return cut
    .filter((c) => !(c.start >= a - 1e-6 && c.start + c.duration <= b + 1e-6))
    .map((c) => (ripple && c.start >= b - 1e-6 ? { ...c, start: Math.max(0, c.start - gap) } : c));
}

/** Close all empty gaps on each track (Premiere "Ripple delete gaps"). */
export function closeGaps(clips: TimelineClip[]): TimelineClip[] {
  const result = new Map<string, TimelineClip>();
  const tracks = Array.from(new Set(clips.map((c) => c.track)));
  for (const tr of tracks) {
    let cursor = 0;
    for (const c of clips.filter((x) => x.track === tr).sort((x, y) => x.start - y.start)) {
      result.set(c.id, { ...c, start: cursor });
      cursor += c.duration;
    }
  }
  return clips.map((c) => result.get(c.id) || c);
}

/** Speed ramp: apply easing keyframes-like speed by splitting clip into segments (Resolve "Retime curve"). */
export function speedRamp(clip: TimelineClip, from: number, to: number, segments = 6): TimelineClip[] {
  const srcLen = clip.duration * clip.speed;
  const segSrc = srcLen / segments;
  let start = clip.start;
  const out: TimelineClip[] = [];
  for (let i = 0; i < segments; i++) {
    const sp = clamp(from + (to - from) * (i / Math.max(1, segments - 1)), 0.1, 8);
    const dur = segSrc / sp;
    out.push({ ...clip, id: newId('c'), name: `${clip.name} ramp${i + 1}`, start, duration: dur, speed: sp, inPoint: clip.inPoint + segSrc * i, outPoint: clip.inPoint + segSrc * (i + 1) });
    start += dur;
  }
  return out;
}

/** Copy/paste attributes (Premiere "Paste Attributes"). */
export function pasteAttributes(src: TimelineClip, dst: TimelineClip): TimelineClip {
  return {
    ...dst, opacity: src.opacity, scale: src.scale, rotation: src.rotation, posX: src.posX, posY: src.posY,
    filter: src.filter, color: src.color, videoFx: src.videoFx, videoFxAmount: src.videoFxAmount, composite: src.composite,
  };
}

/** Sort markers & find next/previous. */
export function nextMarker(markers: Marker[], t: number, dir: 1 | -1): Marker | null {
  const s = [...markers].sort((a, b) => a.time - b.time);
  return (dir === 1 ? s.find((m) => m.time > t + 0.01) : [...s].reverse().find((m) => m.time < t - 0.01)) || null;
}

function tc(sec: number, fps: number): string {
  const total = Math.round(sec * fps);
  const f = total % fps, s = Math.floor(total / fps) % 60, m = Math.floor(total / fps / 60) % 60, h = Math.floor(total / fps / 3600);
  return [h, m, s, f].map((n) => String(n).padStart(2, '0')).join(':');
}

/** CMX3600 EDL for round-tripping into Premiere / DaVinci Resolve (video track 0/1 only). */
export function exportEDL(clips: TimelineClip[], title: string, fps = 30): string {
  const list = clips.filter((c) => (c.kind === 'video' || c.kind === 'image') && c.track <= 1 && !c.disabled).sort((a, b) => a.start - b.start);
  const lines = [`TITLE: ${title}`, 'FCM: NON-DROP FRAME', ''];
  list.forEach((c, i) => {
    const srcIn = c.inPoint, srcOut = c.inPoint + c.duration * c.speed;
    lines.push(`${String(i + 1).padStart(3, '0')}  AX       V     C        ${tc(srcIn, fps)} ${tc(srcOut, fps)} ${tc(c.start, fps)} ${tc(c.start + c.duration, fps)}`);
    lines.push(`* FROM CLIP NAME: ${c.name}`);
    if (c.speed !== 1) lines.push(`M2   AX             ${(c.speed * fps).toFixed(1)}                ${tc(srcIn, fps)}`);
    lines.push('');
  });
  return lines.join('\n');
}

/** SRT subtitle export from text clips. */
export function exportSRT(clips: TimelineClip[]): string {
  const ts = (s: number) => {
    const ms = Math.round(s * 1000);
    const p = (n: number, l = 2) => String(n).padStart(l, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  return clips.filter((c) => c.kind === 'text' && c.text).sort((a, b) => a.start - b.start)
    .map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.start + c.duration)}\n${c.text}\n`).join('\n');
}

/** Undo/redo history stack. */
export interface History<T> { past: T[]; future: T[] }
export const emptyHistory = <T,>(): History<T> => ({ past: [], future: [] });
export function pushHistory<T>(h: History<T>, snapshot: T, limit = 100): History<T> {
  return { past: [...h.past, snapshot].slice(-limit), future: [] };
}
export function undo<T>(h: History<T>, current: T): { h: History<T>; state: T } | null {
  if (!h.past.length) return null;
  return { state: h.past[h.past.length - 1], h: { past: h.past.slice(0, -1), future: [current, ...h.future] } };
}
export function redo<T>(h: History<T>, current: T): { h: History<T>; state: T } | null {
  if (!h.future.length) return null;
  return { state: h.future[0], h: { past: [...h.past, current], future: h.future.slice(1) } };
}
