/** Extract dominant colors from a logo / image data URL */

export interface ExtractedPalette {
  hex: string[];
  rgb: { r: number; g: number; b: number }[];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function quantize(v: number, step = 32): number {
  return Math.min(255, Math.round(v / step) * step);
}

export async function extractPaletteFromDataUrl(
  dataUrl: string,
  maxColors = 6
): Promise<ExtractedPalette> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { hex: [], rgb: [] };
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const counts = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 40) continue;
    const r = quantize(data[i]);
    const g = quantize(data[i + 1]);
    const b = quantize(data[i + 2]);
    if (r > 240 && g > 240 && b > 240) continue;
    const key = `${r},${g},${b}`;
    const prev = counts.get(key);
    if (prev) prev.n++;
    else counts.set(key, { r, g, b, n: 1 });
  }
  const sorted = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, maxColors);
  return {
    rgb: sorted.map(({ r, g, b }) => ({ r, g, b })),
    hex: sorted.map(({ r, g, b }) => rgbToHex(r, g, b)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export function copyHex(hex: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(hex);
  return Promise.reject(new Error('Clipboard unavailable'));
}
