/** DaVinci-style Video Studio — shared types */

export type ClipKind = 'video' | 'image' | 'audio' | 'text' | 'sticker' | 'effect' | 'adjustment';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9' | '4:3';
export type AIModel = 'veo-3.1-fast' | 'veo-3.1' | 'veo-3.1-lite' | 'omni-flash';
export type TransitionType =
  | 'none' | 'fade' | 'dissolve'
  | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom-in' | 'zoom-out' | 'wipe' | 'wipe-vertical'
  | 'flash' | 'blur' | 'spin' | 'push' | 'iris' | 'clock';
export type EaseType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
export type CompositeMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'lighten' | 'darken' | 'add';
export type TextAnim = 'none' | 'fade' | 'typewriter' | 'scale-in' | 'slide-up' | 'bounce-in' | 'flicker';
export type VideoFxId =
  | 'none' | 'blur' | 'sharpen' | 'vignette' | 'grain' | 'glow'
  | 'shake' | 'mirror' | 'posterize' | 'edge' | 'duotone' | 'glitch';
export type ExportPresetId =
  | 'custom' | 'yt-1080' | 'yt-4k' | 'ig-reel' | 'ig-square' | 'tiktok' | 'twitter' | 'proxy';

export interface Keyframe {
  time: number;
  props: Partial<{
    opacity: number;
    scale: number;
    rotation: number;
    posX: number;
    posY: number;
    volume: number;
    cropL: number;
    cropR: number;
    cropT: number;
    cropB: number;
  }>;
  ease?: EaseType;
}

export interface ColorGrade {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  lift: number;
  gamma: number;
  gain: number;
  highlights: number;
  shadows: number;
  vibrance: number;
}

export interface TimelineClip {
  id: string;
  kind: ClipKind;
  name: string;
  track: number;
  start: number;
  duration: number;
  src?: string;
  text?: string;
  textStyle?: {
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic?: boolean;
    underline?: boolean;
    fontFamily?: string;
    bg?: string;
    stroke?: string;
    strokeWidth?: number;
    shadow?: boolean;
    anim?: TextAnim;
  };
  volume: number;
  pan: number;
  speed: number;
  reverse: boolean;
  opacity: number;
  scale: number;
  rotation: number;
  posX: number;
  posY: number;
  anchorX: number;
  anchorY: number;
  cropL: number;
  cropR: number;
  cropT: number;
  cropB: number;
  filter: string;
  videoFx: VideoFxId;
  videoFxAmount: number;
  composite: CompositeMode;
  transition: TransitionType;
  transitionDuration: number;
  transitionOut: TransitionType;
  transitionOutDuration: number;
  inPoint: number;
  outPoint: number;
  fadeIn: number;
  fadeOut: number;
  color: ColorGrade;
  keyframes: Keyframe[];
  locked: boolean;
  muted: boolean;
  disabled: boolean;
  linkedGroup?: string;
  labelColor?: string;
}

export interface Marker {
  id: string;
  time: number;
  label: string;
  color: string;
  duration?: number;
}

export interface TrackState {
  id: number;
  name: string;
  kind: 'video' | 'audio' | 'text' | 'fx';
  muted: boolean;
  solo: boolean;
  locked: boolean;
  visible: boolean;
  height: number;
}

export interface MediaBinItem {
  id: string;
  name: string;
  kind: ClipKind;
  src: string;
  duration?: number;
  thumb?: string;
  bin?: string;
}

export interface ProjectSettings {
  name: string;
  fps: 24 | 25 | 30 | 60;
  width: number;
  height: number;
  aspect: AspectRatio;
  sampleRate: 44100 | 48000;
}

export interface ExportSettings {
  preset: ExportPresetId;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  format: 'webm' | 'mp4';
  includeAudio: boolean;
}

export interface VideoStudioProps {
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
  initialImage?: string | null;
  onToast?: (msg: string) => void;
}

export const DEFAULT_COLOR: ColorGrade = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  tint: 0,
  lift: 0,
  gamma: 0,
  gain: 0,
  highlights: 0,
  shadows: 0,
  vibrance: 0,
};

export const DEFAULT_TRACKS: TrackState[] = [
  { id: 0, name: 'V1 · Main', kind: 'video', muted: false, solo: false, locked: false, visible: true, height: 48 },
  { id: 1, name: 'V2 · Overlay', kind: 'video', muted: false, solo: false, locked: false, visible: true, height: 40 },
  { id: 2, name: 'V3 · PiP', kind: 'video', muted: false, solo: false, locked: false, visible: true, height: 36 },
  { id: 3, name: 'T1 · Titles', kind: 'text', muted: false, solo: false, locked: false, visible: true, height: 36 },
  { id: 4, name: 'A1 · Audio', kind: 'audio', muted: false, solo: false, locked: false, visible: true, height: 36 },
  { id: 5, name: 'A2 · Music', kind: 'audio', muted: false, solo: false, locked: false, visible: true, height: 32 },
  { id: 6, name: 'FX', kind: 'fx', muted: false, solo: false, locked: false, visible: true, height: 28 },
];
