/** CapCut Video Studio — MediaRecorder timeline export */
import type { AspectRatio, TimelineClip } from './videoStudioTypes';
import { filterCss } from './videoStudioLib';

export async function exportTimelineToWebM(opts: {
  clips: TimelineClip[];
  aspect: AspectRatio;
  projectDuration: number;
  onProgress?: (pct: number) => void;
}): Promise<Blob> {
  const { clips, aspect, projectDuration, onProgress } = opts;
  if (!clips.length) throw new Error('Add clips first');

  const w = aspect === '9:16' || aspect === '4:5' ? 720 : 1280;
  const h =
    aspect === '9:16' ? 1280 : aspect === '4:5' ? 900 : aspect === '1:1' ? 720 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(24);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 3_500_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });
  recorder.start(100);

  const fps = 24;
  const totalFrames = Math.ceil(Math.min(projectDuration, 60) * fps);
  const cache = new Map<string, HTMLImageElement | HTMLVideoElement>();

  const load = (src: string, kind: string) =>
    new Promise<HTMLImageElement | HTMLVideoElement>((resolve, reject) => {
      if (cache.has(src)) {
        resolve(cache.get(src)!);
        return;
      }
      if (kind === 'video') {
        const v = document.createElement('video');
        v.src = src;
        v.muted = true;
        v.playsInline = true;
        v.onloadeddata = () => {
          cache.set(src, v);
          resolve(v);
        };
        v.onerror = reject;
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          cache.set(src, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      }
    });

  for (const c of clips) {
    if (c.src && (c.kind === 'video' || c.kind === 'image')) {
      try {
        await load(c.src, c.kind);
      } catch {
        /* skip broken media */
      }
    }
  }

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / fps;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    const active = clips
      .filter((c) => t >= c.start && t < c.start + c.duration)
      .sort((a, b) => a.track - b.track);

    for (const c of active) {
      const localT = (t - c.start) * c.speed;
      ctx.save();
      ctx.globalAlpha = c.opacity / 100;
      ctx.filter = filterCss(c.filter);

      if (c.transition !== 'none' && c.transitionDuration > 0) {
        const td = c.transitionDuration;
        if (localT < td) ctx.globalAlpha *= localT / td;
        else if (c.duration - localT / c.speed < td) {
          ctx.globalAlpha *= Math.max(0, (c.duration - localT / c.speed) / td);
        }
      }

      const sc = c.scale / 100;
      const ox = (c.posX / 100) * w;
      const oy = (c.posY / 100) * h;
      const rot = ((c.rotation || 0) * Math.PI) / 180;

      if ((c.kind === 'image' || c.kind === 'video') && c.src) {
        const media = cache.get(c.src);
        if (media) {
          if (media instanceof HTMLVideoElement) {
            try {
              media.currentTime = Math.min(
                (media.duration || 1) - 0.05,
                c.inPoint + localT
              );
            } catch {
              /* seek may fail mid-frame */
            }
          }
          const dw = w * sc;
          const dh = h * sc;
          ctx.translate(w / 2 + ox, h / 2 + oy);
          ctx.rotate(rot);
          ctx.drawImage(media as CanvasImageSource, -dw / 2, -dh / 2, dw, dh);
        }
      } else if ((c.kind === 'text' || c.kind === 'sticker') && c.text) {
        const fs = (c.textStyle?.fontSize || 48) * (w / 720) * sc;
        ctx.translate(w / 2 + ox, h / 2 + oy);
        ctx.rotate(rot);
        ctx.font = `${c.textStyle?.bold ? 'bold' : '600'} ${fs}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = c.textStyle?.color || '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 12;
        if (c.textStyle?.bg) {
          const metrics = ctx.measureText(c.text);
          const pad = 12;
          ctx.fillStyle = c.textStyle.bg;
          ctx.fillRect(
            -metrics.width / 2 - pad,
            -fs / 2 - pad / 2,
            metrics.width + pad * 2,
            fs + pad
          );
          ctx.fillStyle = c.textStyle?.color || '#fff';
        }
        ctx.fillText(c.text, 0, 0);
      }
      ctx.restore();
    }

    if (frame % 8 === 0) {
      onProgress?.(Math.round((frame / totalFrames) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  recorder.stop();
  return done;
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
