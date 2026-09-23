export type ProductCategory = 'drinkware' | 'apparel' | 'accessories';

export type ProductId =
  | 'ceramic-mug'
  | 'enamel-mug'
  | 'travel-tumbler'
  | 'crewneck-tshirt'
  | 'oversized-tee'
  | 'pullover-hoodie'
  | 'crewneck-sweatshirt'
  | 'canvas-tote'
  | 'baseball-cap';

export interface ProductColor {
  name: string;
  hex: string;
  textColor?: string;
  isDark?: boolean;
}

export interface ProductPreset {
  id: ProductId;
  name: string;
  category: ProductCategory;
  subtitle: string;
  description: string;
  defaultColor: string;
  colors: ProductColor[];
  printArea: {
    top: number; // percentage from top (e.g. 28)
    left: number; // percentage from left (e.g. 25)
    width: number; // percentage width (e.g. 50)
    height: number; // percentage height (e.g. 50)
    maxScale: number;
    defaultScale: number;
  };
  supportedBlendModes: ('normal' | 'multiply' | 'overlay' | 'screen')[];
  defaultBlendMode: 'normal' | 'multiply' | 'overlay' | 'screen';
  isCurvedSurface?: boolean;
}

export interface LogoTransform {
  x: number; // percentage offset -50 to +50
  y: number; // percentage offset -50 to +50
  scale: number; // percentage 10 to 200
  rotation: number; // degrees -180 to 180
  opacity: number; // percentage 0 to 100
  blendMode: 'normal' | 'multiply' | 'overlay' | 'screen';
  colorFilter: 'original' | 'white' | 'black' | 'custom';
  customColor: string;
  cylindricalWarp: boolean;
  flipX: boolean;
  flipY: boolean;
}

export interface SampleLogo {
  id: string;
  name: string;
  category: string;
  accent: string;
  dataUrl: string;
}

export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
export type VideoAspectRatio = '16:9' | '9:16';
export type ImageSize = '1K' | '2K' | '4K';

export interface GenerationProgress {
  status: 'idle' | 'submitting' | 'polling' | 'success' | 'error';
  stepMessage: string;
  operationName?: string;
  progressPercent?: number;
  errorMessage?: string;
}

// Music Generation (Lyria)
export type MusicModel = 'lyria-3-clip-preview' | 'lyria-3-pro-preview';

export interface GeneratedTrack {
  id: string;
  title: string;
  prompt: string;
  model: MusicModel;
  durationSeconds: number;
  audioUrl: string; // data:audio/... or blob URL
  genre?: string;
  mood?: string;
  tempo?: string;
  isAiGenerated: boolean;
  createdAt: string;
}
