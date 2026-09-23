/** CapCut-style Video Studio — shared types */

export type ClipKind = 'video' | 'image' | 'audio' | 'text' | 'sticker' | 'effect' | 'transition';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
export type AIModel = 'veo-3.1-fast' | 'veo-3.1' | 'veo-3.1-lite' | 'omni-flash';
export type TransitionType =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'wipe'
  | 'flash'
  | 'blur'
  | 'spin';
export type EaseType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';

export interface Keyframe {
  time: number;
  props: Partial<{
    opacity: number;
    scale: number;
    rotation: number;
    posX: number;
    posY: number;
    volume: number;
  }>;
  ease?: EaseType;
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
  };
  volume: number;
  speed: number;
  opacity: number;
  scale: number;
  rotation: number;
  filter: string;
  transition: TransitionType;
  transitionDuration: number;
  inPoint: number;
  outPoint: number;
  posX: number;
  posY: number;
  crop?: { x: number; y: number; w: number; h: number };
  flipX?: boolean;
  flipY?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  keyframes?: Keyframe[];
  locked?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
}

export interface MediaBinItem {
  id: string;
  name: string;
  kind: ClipKind;
  src: string;
  duration?: number;
  thumb?: string;
  width?: number;
  height?: number;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface VideoStudioProps {
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
  initialImage?: string | null;
  onToast?: (msg: string) => void;
}

export type AIStatus = 'idle' | 'generating' | 'polling' | 'done' | 'error';
