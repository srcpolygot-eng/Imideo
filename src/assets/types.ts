/** Shared cross-studio Asset Library (Part 1) */

export type AssetKind = 'image' | 'video' | 'audio' | 'logo' | 'mockup' | 'export' | 'other';

export interface LibraryAsset {
  id: string;
  name: string;
  kind: AssetKind;
  src: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  sizeBytes?: number;
  createdAt: number;
  tags: string[];
  source?: 'products' | 'image-studio' | 'video-studio' | 'campaign' | 'agent' | 'pwa' | 'upload';
}

export function newAssetId(): string {
  return `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
