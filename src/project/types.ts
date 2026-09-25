/** Imideo Project Hub — shared project model (Part 0) */

export type StudioKind = 'products' | 'image-studio' | 'video-studio';

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  tags: string[];
}

export interface ProductSnapshot {
  productId: string;
  color: string;
  logoUrl: string | null;
  transform: Record<string, unknown>;
  mockupSnapshotUrl: string | null;
}

export interface ImageStudioSnapshot {
  layersJson?: string;
  width?: number;
  height?: number;
  historyNote?: string;
}

export interface VideoStudioSnapshot {
  clipsJson?: string;
  aspect?: string;
  playhead?: number;
  projectDuration?: number;
  colorGradeJson?: string;
  nodeGraphJson?: string;
}

export interface CampaignSnapshot {
  lastRunId?: string;
  brief?: string;
  outputs?: { kind: string; url: string; label: string }[];
}

export interface ImideoProject {
  meta: ProjectMeta;
  product?: ProductSnapshot;
  image?: ImageStudioSnapshot;
  video?: VideoStudioSnapshot;
  campaign?: CampaignSnapshot;
  assetIds: string[];
  workspaceMode: StudioKind;
}

export function newProjectId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyProject(name = 'Untitled Project'): ImideoProject {
  const now = Date.now();
  return {
    meta: {
      id: newProjectId(),
      name,
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    assetIds: [],
    workspaceMode: 'products',
  };
}
