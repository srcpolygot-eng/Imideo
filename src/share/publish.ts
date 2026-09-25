/** Part 4 — Publish share pages (localStorage + standalone HTML download) */

import type { SharePage } from './types';
import { newShareId, newShareToken } from './types';

const KEY = 'imideo_share_pages_v1';

function readAll(): SharePage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SharePage[];
  } catch {
    return [];
  }
}

function writeAll(pages: SharePage[]) {
  localStorage.setItem(KEY, JSON.stringify(pages.slice(0, 50)));
}

export function listSharePages(): SharePage[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getSharePage(idOrToken: string): SharePage | null {
  return (
    readAll().find((p) => p.id === idOrToken || p.token === idOrToken) || null
  );
}

export function saveSharePage(
  input: Omit<SharePage, 'id' | 'token' | 'createdAt'> & {
    id?: string;
    token?: string;
  }
): SharePage {
  const pages = readAll();
  const page: SharePage = {
    id: input.id || newShareId(),
    token: input.token || newShareToken(),
    createdAt: Date.now(),
    title: input.title,
    subtitle: input.subtitle,
    heroImageUrl: input.heroImageUrl,
    videoUrl: input.videoUrl,
    audioUrl: input.audioUrl,
    ctaLabel: input.ctaLabel || 'Shop now',
    ctaHref: input.ctaHref || '#',
    productName: input.productName,
  };
  const next = [page, ...pages.filter((p) => p.id !== page.id)];
  writeAll(next);
  return page;
}

export function deleteSharePage(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function buildShareHtml(page: SharePage): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const hero = page.heroImageUrl
    ? `<img src="${page.heroImageUrl}" alt="${esc(page.title)}" style="width:100%;max-height:480px;object-fit:contain;border-radius:16px;background:#18181b"/>`
    : '';
  const video = page.videoUrl
    ? `<video src="${page.videoUrl}" controls playsinline style="width:100%;border-radius:16px;margin-top:16px"></video>`
    : '';
  const audio = page.audioUrl
    ? `<audio src="${page.audioUrl}" controls style="width:100%;margin-top:12px"></audio>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(page.title)} · Imideo</title>
  <meta name="description" content="${esc(page.subtitle || page.title)}" />
  <style>
    :root { color-scheme: dark; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background:#09090b; color:#fafafa; min-height:100vh; }
    .wrap { max-width:640px; margin:0 auto; padding:32px 20px 64px; }
    h1 { font-size:1.75rem; margin:0 0 8px; letter-spacing:-0.02em; }
    p { color:#a1a1aa; line-height:1.5; }
    .badge { display:inline-block; font-size:11px; font-weight:600;
      padding:4px 10px; border-radius:999px; background:#27272a; color:#a78bfa; margin-bottom:16px; }
    .cta { display:inline-block; margin-top:24px; padding:12px 22px; border-radius:12px;
      background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff; text-decoration:none;
      font-weight:600; font-size:14px; }
    footer { margin-top:40px; font-size:12px; color:#52525b; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="badge">Imideo · ${esc(page.productName || 'Campaign')}</div>
    <h1>${esc(page.title)}</h1>
    ${page.subtitle ? `<p>${esc(page.subtitle)}</p>` : ''}
    ${hero}
    ${video}
    ${audio}
    <p><a class="cta" href="${esc(page.ctaHref || '#')}">${esc(page.ctaLabel || 'Shop now')}</a></p>
    <footer>Published with Imideo Studio · token ${esc(page.token)}</footer>
  </div>
</body>
</html>`;
}

export function downloadShareHtml(page: SharePage) {
  const html = buildShareHtml(page);
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `imideo-share-${page.token}.html`;
  a.click();
}

export function inAppShareUrl(page: SharePage): string {
  if (typeof window === 'undefined') return `#/share/${page.token}`;
  return `${window.location.origin}${window.location.pathname}#/share/${page.token}`;
}

export function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return Promise.reject(new Error('Clipboard unavailable'));
}
