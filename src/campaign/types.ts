/** Campaign pipeline — mockup → image → video → music (Part 2) */

export type CampaignStepId =
  | 'brief'
  | 'stills'
  | 'mockup'
  | 'video'
  | 'music'
  | 'pack';

export type CampaignStepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export interface CampaignStep {
  id: CampaignStepId;
  label: string;
  status: CampaignStepStatus;
  message?: string;
  outputUrl?: string;
  outputKind?: 'image' | 'video' | 'audio' | 'zip';
}

export interface CampaignBrief {
  productName: string;
  season: string;
  tone: string;
  audience: string;
  extraNotes: string;
}

export interface CampaignRun {
  id: string;
  createdAt: number;
  brief: CampaignBrief;
  steps: CampaignStep[];
  stills: string[];
  mockupUrl?: string;
  videoUrl?: string;
  musicUrl?: string;
  packNote?: string;
}

export function defaultCampaignSteps(): CampaignStep[] {
  return [
    { id: 'brief', label: 'Brief', status: 'pending' },
    { id: 'stills', label: 'AI Stills', status: 'pending' },
    { id: 'mockup', label: 'Product Mockup', status: 'pending' },
    { id: 'video', label: 'Veo Ad', status: 'pending' },
    { id: 'music', label: 'Lyria Bed', status: 'pending' },
    { id: 'pack', label: 'Export Pack', status: 'pending' },
  ];
}

export function newCampaignId(): string {
  return `camp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
