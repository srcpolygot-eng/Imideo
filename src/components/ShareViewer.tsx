/** In-app share page viewer for #/share/:token */

import React, { useEffect, useState } from 'react';
import { getSharePage } from '../share/publish';
import type { SharePage } from '../share/types';

function parseShareToken(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/^#\/share\/([a-z0-9]+)/i);
  return m?.[1] || null;
}

export const ShareViewer: React.FC = () => {
  const [page, setPage] = useState<SharePage | null>(null);
  const [token, setToken] = useState<string | null>(() => parseShareToken());

  useEffect(() => {
    const onHash = () => setToken(parseShareToken());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!token) {
      setPage(null);
      return;
    }
    setPage(getSharePage(token));
  }, [token]);

  if (!token || !page) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-zinc-950 text-zinc-100">
      <div className="max-w-xl mx-auto px-5 py-10">
        <div className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-violet-300 mb-4">
          Imideo · {page.productName || 'Campaign'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{page.title}</h1>
        {page.subtitle && (
          <p className="text-sm text-zinc-400 mb-6">{page.subtitle}</p>
        )}
        {page.heroImageUrl && (
          <img
            src={page.heroImageUrl}
            alt=""
            className="w-full max-h-[420px] object-contain rounded-2xl bg-zinc-900 border border-zinc-800"
          />
        )}
        {page.videoUrl && (
          <video
            src={page.videoUrl}
            controls
            playsInline
            className="w-full mt-4 rounded-2xl border border-zinc-800"
          />
        )}
        {page.audioUrl && (
          <audio src={page.audioUrl} controls className="w-full mt-3" />
        )}
        <a
          href={page.ctaHref || '#'}
          className="inline-block mt-8 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-sm font-semibold text-white"
        >
          {page.ctaLabel || 'Shop now'}
        </a>
        <p className="mt-10 text-[11px] text-zinc-600">
          <a href="#/" className="text-zinc-400 underline">
            ← Back to studio
          </a>
        </p>
      </div>
    </div>
  );
};

export default ShareViewer;
