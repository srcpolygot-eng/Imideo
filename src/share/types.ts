/** Part 4 — Share / publish model */

export interface SharePage {
  id: string;
  title: string;
  subtitle?: string;
  createdAt: number;
  heroImageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  productName?: string;
  token: string;
}

export function newShareId(): string {
  return `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newShareToken(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
