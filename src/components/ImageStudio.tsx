import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  MousePointer2, Brush, Eraser, PaintBucket, Square, Circle, Minus, Type, Pipette, Crop,
  Undo2, Redo2, Download, Upload, Trash2, ZoomIn, ZoomOut, Maximize2, Layers,
  Sun, Contrast, Droplets, Aperture, RotateCcw, FlipHorizontal, FlipVertical,
  Eye, EyeOff, Plus, Sparkles, Image as ImageIcon,
} from 'lucide-react';

export type DrawTool =
  | 'select' | 'brush' | 'eraser' | 'fill' | 'rect' | 'ellipse' | 'line' | 'text' | 'eyedropper' | 'crop';

export interface StudioLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
}

interface ImageStudioProps {
  onExportToMockup?: (dataUrl: string) => void;
  onToast?: (msg: string) => void;
}

const CANVAS_PRESETS = [
  { id: 'square', label: '1:1 Square', w: 1024, h: 1024 },
  { id: 'portrait', label: '3:4 Portrait', w: 768, h: 1024 },
  { id: 'landscape', label: '16:9 Wide', w: 1280, h: 720 },
  { id: 'story', label: '9:16 Story', w: 720, h: 1280 },
  { id: 'hd', label: '1920\u00d71080 HD', w: 1920, h: 1080 },
  { id: 'print', label: 'A4 Print', w: 1240, h: 1754 },
];

const BRUSH_PRESETS = [2, 4, 8, 16, 24, 40, 64];

const FILTER_PRESETS = [
  { id: 'none', label: 'Original' },
  { id: 'grayscale', label: 'B&W' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'invert', label: 'Invert' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'vivid', label: 'Vivid' },
];

function hexToRgba(hex: string, alpha = 1): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function createLayerCanvas(w: number, h: number, fill?: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
  }
  return c;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({ onExportToMockup, onToast }) => {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasW, setCanvasW] = useState(1024);
  const [canvasH, setCanvasH] = useState(1024);
  const [tool, setTool] = useState<DrawTool>('brush');
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [brushSize, setBrushSize] = useState(16);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [zoom, setZoom] = useState(0.65);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filterPreset, setFilterPreset] = useState('none');
  const [layers, setLayers] = useState<StudioLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState('');
  const layersRef = useRef<StudioLayer[]>([]);
  const activeLayerIdRef = useRef('');
  const isDrawing = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const shapePreview = useRef<ImageData | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIdx = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [textInput, setTextInput] = useState('Your text');
  const [fontSize, setFontSize] = useState(48);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const toast = (msg: string) => onToast?.(msg);

  useEffect(() => { layersRef.current = layers; }, [layers]);
  useEffect(() => { activeLayerIdRef.current = activeLayerId; }, [activeLayerId]);

  const getActiveCanvas = useCallback((): HTMLCanvasElement | null => {
    return layersRef.current.find((l) => l.id === activeLayerIdRef.current)?.canvas ?? null;
  }, []);

  const compositeToDisplay = useCallback(() => {
    const display = displayRef.current;
    if (!display) return;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    const filters: string[] = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (filterPreset === 'grayscale') filters.push('grayscale(100%)');
    if (filterPreset === 'sepia') filters.push('sepia(80%)');
    if (filterPreset === 'invert') filters.push('invert(100%)');
    if (filterPreset === 'warm') filters.push('sepia(30%) saturate(120%)');
    if (filterPreset === 'cool') filters.push('hue-rotate(180deg) saturate(80%)');
    if (filterPreset === 'vivid') filters.push('saturate(160%) contrast(110%)');
    ctx.filter = filters.length ? filters.join(' ') : 'none';
    for (const layer of layersRef.current) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity / 100;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
  }, [brightness, contrast, saturation, filterPreset]);

  const pushHistory = useCallback(() => {
    const active = getActiveCanvas();
    if (!active) return;
    const dataUrl = active.toDataURL('image/png');
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(dataUrl);
    if (historyRef.current.length > 40) historyRef.current.shift();
    historyIdx.current = historyRef.current.length - 1;
    setCanUndo(historyIdx.current > 0);
    setCanRedo(false);
  }, [getActiveCanvas]);

  const restoreFromDataUrl = useCallback((dataUrl: string) => {
    const active = getActiveCanvas();
    if (!active) return;
    const img = new Image();
    img.onload = () => {
      const ctx = active.getContext('2d')!;
      ctx.clearRect(0, 0, active.width, active.height);
      ctx.drawImage(img, 0, 0);
      compositeToDisplay();
    };
    img.src = dataUrl;
  }, [getActiveCanvas, compositeToDisplay]);

  const undo = () => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    restoreFromDataUrl(historyRef.current[historyIdx.current]);
    setCanUndo(historyIdx.current > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current += 1;
    restoreFromDataUrl(historyRef.current[historyIdx.current]);
    setCanUndo(true);
    setCanRedo(historyIdx.current < historyRef.current.length - 1);
  };

  const initCanvas = useCallback((w: number, h: number, fill = '#1a1a1a') => {
    setCanvasW(w);
    setCanvasH(h);
    const base = createLayerCanvas(w, h, fill);
    const draw = createLayerCanvas(w, h);
    const newLayers: StudioLayer[] = [
      { id: 'bg', name: 'Background', visible: true, opacity: 100, canvas: base },
      { id: 'layer-1', name: 'Layer 1', visible: true, opacity: 100, canvas: draw },
    ];
    setLayers(newLayers);
    layersRef.current = newLayers;
    setActiveLayerId('layer-1');
    activeLayerIdRef.current = 'layer-1';
    historyRef.current = [];
    historyIdx.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    requestAnimationFrame(() => {
      const display = displayRef.current;
      if (display) {
        display.width = w;
        display.height = h;
        compositeToDisplay();
        historyRef.current = [draw.toDataURL('image/png')];
        historyIdx.current = 0;
      }
    });
  }, [compositeToDisplay]);

  useEffect(() => { initCanvas(1024, 1024, '#1a1a1a'); }, []);
  useEffect(() => { compositeToDisplay(); }, [brightness, contrast, saturation, filterPreset, compositeToDisplay]);

  const getCanvasCoords = (e: React.PointerEvent) => {
    const display = displayRef.current!;
    const rect = display.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (display.width / rect.width),
      y: (e.clientY - rect.top) * (display.height / rect.height),
    };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const sx = Math.floor(x), sy = Math.floor(y);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
    const startIdx = (sy * w + sx) * 4;
    const tr = data[startIdx], tg = data[startIdx + 1], tb = data[startIdx + 2], ta = data[startIdx + 3];
    const tmp = document.createElement('canvas').getContext('2d')!;
    tmp.fillStyle = fillColor;
    tmp.fillRect(0, 0, 1, 1);
    const fd = tmp.getImageData(0, 0, 1, 1).data;
    const fr = fd[0], fg = fd[1], fb = fd[2], fa = fd[3];
    if (tr === fr && tg === fg && tb === fb && ta === fa) return;
    const match = (i: number) => data[i] === tr && data[i + 1] === tg && data[i + 2] === tb && data[i + 3] === ta;
    const stack: number[] = [sx, sy];
    const visited = new Uint8Array(w * h);
    while (stack.length) {
      const cy = stack.pop()!, cx = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const pos = cy * w + cx;
      if (visited[pos]) continue;
      const i = pos * 4;
      if (!match(i)) continue;
      visited[pos] = 1;
      data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = fa;
      stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const active = getActiveCanvas();
    if (!active) return;
    const ctx = active.getContext('2d')!;
    const pos = getCanvasCoords(e);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    if (tool === 'eyedropper') {
      const pixel = displayRef.current!.getContext('2d')!.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
      setColor(hex);
      toast(`Picked ${hex}`);
      return;
    }
    if (tool === 'fill') {
      pushHistory();
      floodFill(ctx, pos.x, pos.y, hexToRgba(color, brushOpacity / 100));
      compositeToDisplay();
      pushHistory();
      return;
    }
    if (tool === 'text') {
      pushHistory();
      ctx.save();
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = hexToRgba(color, brushOpacity / 100);
      ctx.textBaseline = 'top';
      ctx.fillText(textInput || 'Text', pos.x, pos.y);
      ctx.restore();
      compositeToDisplay();
      pushHistory();
      return;
    }

    isDrawing.current = true;
    startPos.current = pos;
    if (tool === 'brush' || tool === 'eraser') {
      pushHistory();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = `rgba(0,0,0,${brushOpacity / 100})`;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = hexToRgba(color, brushOpacity / 100);
      }
    }
    if (tool === 'rect' || tool === 'ellipse' || tool === 'line') {
      pushHistory();
      shapePreview.current = ctx.getImageData(0, 0, active.width, active.height);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    const active = getActiveCanvas();
    if (!active) return;
    const ctx = active.getContext('2d')!;
    const pos = getCanvasCoords(e);
    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      compositeToDisplay();
    }
    if ((tool === 'rect' || tool === 'ellipse' || tool === 'line') && startPos.current && shapePreview.current) {
      ctx.putImageData(shapePreview.current, 0, 0);
      const sx = startPos.current.x, sy = startPos.current.y;
      ctx.save();
      ctx.strokeStyle = hexToRgba(color, brushOpacity / 100);
      ctx.fillStyle = hexToRgba(color, (brushOpacity / 100) * 0.25);
      ctx.lineWidth = Math.max(2, brushSize / 4);
      ctx.lineCap = 'round';
      if (tool === 'rect') {
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
        ctx.fillRect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (tool === 'ellipse') {
        const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
        ctx.beginPath();
        ctx.ellipse((pos.x + sx) / 2, (pos.y + sy) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.restore();
      compositeToDisplay();
    }
  };

  const onPointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const active = getActiveCanvas();
    if (active) {
      const ctx = active.getContext('2d')!;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
    }
    shapePreview.current = null;
    startPos.current = null;
    compositeToDisplay();
    pushHistory();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        initCanvas(img.width, img.height, '#000000');
        requestAnimationFrame(() => {
          const active = layersRef.current.find((l) => l.id === 'layer-1')?.canvas;
          if (active) active.getContext('2d')!.drawImage(img, 0, 0);
          compositeToDisplay();
          pushHistory();
          toast(`Imported ${img.width}\u00d7${img.height} image`);
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const exportPng = () => {
    compositeToDisplay();
    const display = displayRef.current;
    if (!display) return;
    const link = document.createElement('a');
    link.download = `image-studio-${Date.now()}.png`;
    link.href = display.toDataURL('image/png');
    link.click();
    toast('Exported PNG');
  };

  const sendToMockup = () => {
    compositeToDisplay();
    const display = displayRef.current;
    if (!display) return;
    onExportToMockup?.(display.toDataURL('image/png'));
    toast('Sent artwork to Product Mockup canvas');
  };

  const clearActiveLayer = () => {
    const active = getActiveCanvas();
    if (!active) return;
    pushHistory();
    active.getContext('2d')!.clearRect(0, 0, active.width, active.height);
    compositeToDisplay();
    pushHistory();
    toast('Layer cleared');
  };

  const addLayer = () => {
    const id = `layer-${Date.now()}`;
    const canvas = createLayerCanvas(canvasW, canvasH);
    const layer: StudioLayer = { id, name: `Layer ${layers.length}`, visible: true, opacity: 100, canvas };
    const next = [...layers, layer];
    setLayers(next);
    layersRef.current = next;
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
    toast(`Added ${layer.name}`);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l));
      layersRef.current = next;
      requestAnimationFrame(() => compositeToDisplay());
      return next;
    });
  };

  const flip = (axis: 'h' | 'v') => {
    const active = getActiveCanvas();
    if (!active) return;
    pushHistory();
    const ctx = active.getContext('2d')!;
    const tmp = document.createElement('canvas');
    tmp.width = active.width;
    tmp.height = active.height;
    tmp.getContext('2d')!.drawImage(active, 0, 0);
    ctx.clearRect(0, 0, active.width, active.height);
    ctx.save();
    if (axis === 'h') { ctx.translate(active.width, 0); ctx.scale(-1, 1); }
    else { ctx.translate(0, active.height); ctx.scale(1, -1); }
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
    compositeToDisplay();
    pushHistory();
  };

  const tools: { id: DrawTool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select' },
    { id: 'brush', icon: <Brush className="w-4 h-4" />, label: 'Brush' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
    { id: 'fill', icon: <PaintBucket className="w-4 h-4" />, label: 'Fill' },
    { id: 'rect', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
    { id: 'ellipse', icon: <Circle className="w-4 h-4" />, label: 'Ellipse' },
    { id: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line' },
    { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
    { id: 'eyedropper', icon: <Pipette className="w-4 h-4" />, label: 'Eyedropper' },
    { id: 'crop', icon: <Crop className="w-4 h-4" />, label: 'Crop' },
  ];

  return (
    <div className="flex flex-col gap-3 h-full min-h-[70vh]">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        <div className="flex items-center gap-1 px-1">
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white hidden sm:inline">Image Studio</span>
          <span className="text-[10px] text-zinc-500 font-mono">{canvasW}\u00d7{canvasH}</span>
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <button type="button" onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-30" title="Undo"><Undo2 className="w-4 h-4" /></button>
        <button type="button" onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-30" title="Redo"><Redo2 className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-zinc-700" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />Import</button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImport} />
        <button type="button" onClick={exportPng} className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Export PNG</button>
        {onExportToMockup && (
          <button type="button" onClick={sendToMockup} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Use on Product</button>
        )}
        <div className="w-px h-6 bg-zinc-700" />
        <button type="button" onClick={() => flip('h')} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800" title="Flip H"><FlipHorizontal className="w-4 h-4" /></button>
        <button type="button" onClick={() => flip('v')} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800" title="Flip V"><FlipVertical className="w-4 h-4" /></button>
        <button type="button" onClick={clearActiveLayer} className="p-1.5 rounded-lg text-rose-400 hover:bg-zinc-800" title="Clear layer"><Trash2 className="w-4 h-4" /></button>
        <div className="flex-1" />
        <button type="button" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-[11px] font-mono text-zinc-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800"><ZoomIn className="w-4 h-4" /></button>
        <button type="button" onClick={() => setZoom(0.65)} className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800" title="Fit"><Maximize2 className="w-4 h-4" /></button>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        <div className="w-12 shrink-0 flex flex-col gap-1 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          {tools.map((t) => (
            <button key={t.id} type="button" title={t.label} onClick={() => { setTool(t.id); if (t.id === 'text') setShowTextPanel(true); }}
              className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                tool === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}>{t.icon}</button>
          ))}
        </div>

        <div className="flex-1 min-w-0 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-auto flex items-center justify-center p-4"
          style={{ backgroundImage: 'linear-gradient(45deg,#27272a 25%,transparent 25%),linear-gradient(-45deg,#27272a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#27272a 75%),linear-gradient(-45deg,transparent 75%,#27272a 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0' }}>
          <canvas ref={displayRef} width={canvasW} height={canvasH}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
            className="shadow-2xl shadow-black/50 rounded-sm cursor-crosshair touch-none"
            style={{ width: canvasW * zoom, height: canvasH * zoom, maxWidth: 'none' }} />
        </div>

        <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto max-h-[75vh]">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Color & Brush</div>
            <div className="flex items-center gap-2">
              <label className="relative w-10 h-10 rounded-xl overflow-hidden border border-zinc-600 cursor-pointer shrink-0">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer border-0" />
              </label>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-zinc-200">{color}</div>
                <div className="text-[10px] text-zinc-500">Foreground</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400"><span>Size</span><span>{brushSize}px</span></div>
              <input type="range" min={1} max={120} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-indigo-500" />
              <div className="flex flex-wrap gap-1">
                {BRUSH_PRESETS.map((s) => (
                  <button key={s} type="button" onClick={() => setBrushSize(s)} className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    brushSize === s ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400"><span>Opacity</span><span>{brushOpacity}%</span></div>
              <input type="range" min={5} max={100} value={brushOpacity} onChange={(e) => setBrushOpacity(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>
          </div>

          {(tool === 'text' || showTextPanel) && (
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Text</div>
              <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white" placeholder="Enter text\u2026" />
              <div className="flex justify-between text-[10px] text-zinc-400"><span>Font size</span><span>{fontSize}px</span></div>
              <input type="range" min={12} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-indigo-500" />
              <p className="text-[10px] text-zinc-500">Click on canvas to place text</p>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Adjustments</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400"><span>Brightness</span><span>{brightness}%</span></div>
              <input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400"><span>Contrast</span><span>{contrast}%</span></div>
              <input type="range" min={20} max={200} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400"><span>Saturation</span><span>{saturation}%</span></div>
              <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <button type="button" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setFilterPreset('none'); }} className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Filters</div>
            <div className="grid grid-cols-2 gap-1">
              {FILTER_PRESETS.map((f) => (
                <button key={f.id} type="button" onClick={() => setFilterPreset(f.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold ${
                    filterPreset === f.id ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Canvas Size</div>
            <div className="grid grid-cols-1 gap-1">
              {CANVAS_PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => initCanvas(p.w, p.h, bgColor)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] text-left ${
                    canvasW === p.w && canvasH === p.h
                      ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-200'
                      : 'bg-zinc-800 text-zinc-400 border border-transparent'
                  }`}>{p.label} <span className="text-zinc-500 font-mono">{p.w}\u00d7{p.h}</span></button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1"><Layers className="w-3 h-3" /> Layers</div>
              <button type="button" onClick={addLayer} className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-1">
              {[...layers].reverse().map((layer) => (
                <div key={layer.id} onClick={() => { if (layer.id !== 'bg') { setActiveLayerId(layer.id); activeLayerIdRef.current = layer.id; } }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs ${
                    activeLayerId === layer.id ? 'bg-indigo-600/25 border border-indigo-500/40 text-white' : 'bg-zinc-800/60 text-zinc-300'
                  }`}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="text-zinc-400 hover:text-white">
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="flex-1 truncate">{layer.name}</span>
                  {layer.id === 'bg' && <span className="text-[9px] text-zinc-500">locked</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
