/** CapCut Video Studio — shared types */

export type ClipKind = 'video' | 'image' | 'audio' | 'text' | 'sticker' | 'effect';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type AIModel = 'veo-3.1-fast' | 'veo-3.1' | 'omni-flash';
export type TransitionType = 'none' | 'fade' | 'dissolve' | 'slide' | 'zoom' | 'wipe' | 'flash';

export interface TimelineClip {
  id: string;
  kind: ClipKind;
  name: string;
  /** 0 = main, 1 = overlay, 2 = text/stickers, 3 = audio */
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
    bg?: string;
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
  /** Position offset as % of frame (-50..50) */
  posX: number;
  posY: number;
}

export interface MediaBinItem {
  id: string;
  name: string;
  kind: ClipKind;
  src: string;
  duration?: number;
  thumb?: string;
}

export interface VideoStudioProps {
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
  initialImage?: string | null;
  onToast?: (msg: string) => void;
}
