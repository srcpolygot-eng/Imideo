/**
 * CapCut Video Studio — shared types, constants, helpers
 */
import React from 'react';
import { Monitor, Smartphone, Square } from 'lucide-react';

export type ClipKind = 'video' | 'image' | 'audio' | 'text' | 'sticker';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type AIModel = 'veo-3.1-fast' | 'omni-flash';
export type TransitionType = 'none' | 'fade' | 'dissolve' | 'slide' | 'zoom' | 'wipe';

export interface TimelineClip {
  id: string;
  kind: ClipKind;
  name: string;
  track: number;
  start: number;
  duration: number;
  src?: string;
  text?: string;
  textStyle?: { fontSize: number; color: string; align: 'left' | 'center' | 'right'; bold: boolean };
  volume: number;
  speed: number;
  opacity: number;
  scale: number;
  filter: string;
  transition: TransitionType;
  transitionDuration: number;
  inPoint: number;
  outPoint: number;
}

export const TRACK_LABELS = ['V1 · Main', 'V2 · Overlay', 'T · Text', 'A · Audio'];
export const TRACK_COLORS = [
  'from-indigo-600 to-indigo-500',
  'from-violet-600 to-violet-500',
  'from-amber-600 to-amber-500',
  'from-emerald-600 to-emerald-500',
];
export const TRACK_BORDER = ['border-indigo-400', 'border-violet-400', 'border-amber-400', 'border-emerald-400'];

export const ASPECT_PRESETS: { id: AspectRatio; label: string; icon: React.ReactNode }[] = [
  { id: '16:9', label: '16:9', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: '9:16', label: '9:16', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: '1:1', label: '1:1', icon: <Square className="w-3.5 h-3.5" /> },
  { id: '4:5', label: '4:5', icon: <Smartphone className="w-3.5 h-3.5" /> },
];

export const FILTERS = [
  { id: 'none', label: 'Original' }, { id: 'cinematic', label: 'Cinematic' },
  { id: 'vintage', label: 'Vintage' }, { id: 'bw', label: 'B&W' },
  { id: 'warm', label: 'Warm' }, { id: 'cool', label: 'Cool' },
  { id: 'vivid', label: 'Vivid' }, { id: 'fade', label: 'Fade' },
  { id: 'noir', label: 'Noir' }, { id: 'dream', label: 'Dream' },
  { id: 'retro', label: 'Retro' }, { id: 'neon', label: 'Neon' },
];

export const TRANSITIONS: TransitionType[] = ['none', 'fade', 'dissolve', 'slide', 'zoom', 'wipe'];
export const TEXT_PRESETS = ['Your headline', 'Shop now', 'New drop', 'Limited edition', 'Swipe up', 'Coming soon'];
export const STICKERS = ['*', '+', '#', '@', '!', '~', 'o', 'x', '>>', '**'];

export function uid() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, '0')}.${ms}`;
}

export function aspectCss(ar: AspectRatio): string {
  const map: Record<AspectRatio, string> = { '16:9': '16 / 9', '9:16': '9 / 16', '1:1': '1 / 1', '4:5': '4 / 5' };
  return map[ar];
}

export function filterCss(f: string): string {
  switch (f) {
    case 'cinematic': return 'contrast(1.12) saturate(0.88) brightness(0.94)';
    case 'vintage': return 'sepia(0.4) contrast(1.08)';
    case 'bw': return 'grayscale(1)';
    case 'warm': return 'sepia(0.22) saturate(1.25)';
    case 'cool': return 'hue-rotate(175deg) saturate(0.9)';
    case 'vivid': return 'saturate(1.55) contrast(1.18)';
    case 'fade': return 'contrast(0.88) brightness(1.08)';
    case 'noir': return 'grayscale(1) contrast(1.45)';
    case 'dream': return 'blur(0.6px) saturate(1.25)';
    case 'retro': return 'sepia(0.35) contrast(1.2)';
    case 'neon': return 'saturate(1.8) contrast(1.3)';
    default: return 'none';
  }
}

export function defaultClip(partial: Partial<TimelineClip> & Pick<TimelineClip, 'kind' | 'name' | 'track'>): TimelineClip {
  return {
    id: uid(), start: 0, duration: 3, volume: 100, speed: 1, opacity: 100, scale: 100,
    filter: 'none', transition: 'none', transitionDuration: 0.4, inPoint: 0, outPoint: 0, ...partial,
  };
}
