/** Part 3 — Render queue job model */

export type RenderJobKind =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'webm'
  | 'zip-pack'
  | 'brand-kit';

export type RenderJobStatus =
  | 'queued'
  | 'running'
  | 'done'
  | 'error'
  | 'cancelled';

export interface RenderJob {
  id: string;
  kind: RenderJobKind;
  label: string;
  status: RenderJobStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
  resultUrl?: string;
  resultFilename?: string;
  source?: {
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    projectName?: string;
    width?: number;
    height?: number;
    quality?: number;
  };
}

export type ExportPreset = {
  id: string;
  label: string;
  kind: RenderJobKind;
  width?: number;
  height?: number;
  quality?: number;
  description: string;
};

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'png-4k', label: 'PNG 4K', kind: 'png', width: 3840, height: 2160, description: 'Print-ready still' },
  { id: 'png-1080', label: 'PNG 1080', kind: 'png', width: 1920, height: 1080, description: 'Web / social still' },
  { id: 'jpeg-web', label: 'JPEG Web', kind: 'jpeg', width: 1600, height: 1600, quality: 0.88, description: 'Compressed product shot' },
  { id: 'webp-share', label: 'WebP Share', kind: 'webp', width: 1200, height: 1200, quality: 0.85, description: 'Lightweight share image' },
  { id: 'zip-campaign', label: 'Campaign ZIP', kind: 'zip-pack', description: 'Mockup + stills + audio + meta JSON' },
  { id: 'brand-kit', label: 'Brand Kit ZIP', kind: 'brand-kit', description: 'Logo variants + mockup pack' },
];

export function newJobId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
