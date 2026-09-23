/**
 * CapCut-style Video Studio (UI)
 * Modules: videoStudioTypes, videoStudioLib, videoStudioAI, videoStudioExport
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Film, Play, Pause, SkipBack, SkipForward, Scissors, Trash2, Plus, Type, Music,
  Upload, Download, Sparkles, Volume2, VolumeX, Layers, RotateCcw, Gauge,
  Clapperboard, Copy, Link2, Magnet, ChevronLeft, ChevronRight, Wand2, Key,
  AlertCircle, RotateCw, Move,
} from 'lucide-react';
import { getUsageSummary } from '../utils/generationLimits';
import type { TimelineClip, AspectRatio, AIModel, ClipKind, VideoStudioProps } from './videoStudioTypes';
import {
  TRACK_LABELS, TRACK_COLORS, TRACK_BORDER, ASPECT_PRESETS, FILTERS, TRANSITIONS,
  TEXT_PRESETS, STICKERS, uid, formatTime, aspectCss, filterCss, defaultClip,
  lastEndOnTrack, snapTimeValue,
} from './videoStudioLib';
import { runVeoGeneration, type AIStatus } from './videoStudioAI';
import { exportTimelineToWebM, downloadBlob } from './videoStudioExport';

export type { VideoStudioProps } from './videoStudioTypes';

export const VideoStudio: React.FC<VideoStudioProps> = ({
  apiKey, hasServerKey, onRequireApiKey, initialImage, onToast,
}) => {
  const hasKey = !!apiKey || hasServerKey;
  const toast = (m: string) => onToast?.(m);
  const [aspect, setAspect] = useState<AspectRatio>('9:16');
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(48);
  const [projectDuration, setProjectDuration] = useState(12);
  const [snap, setSnap] = useState(true);
  const [muted, setMuted] = useState(false);
  const [mediaBin, setMediaBin] = useState<{ id: string; name: string; kind: ClipKind; src: string; duration?: number }[]>([]);
  const [aiModel, setAiModel] = useState<AIModel>('veo-3.1-fast');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImage] = useState<string | null>(initialImage || null);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const dragRef = useRef<{ id: string; mode: 'move' | 'trim-left' | 'trim-right'; startX: number; origStart: number; origDuration: number } | null>(null);
  const playTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef({ cancelled: false });
  const selected = clips.find((c) => c.id === selectedId) || null;
  const usage = getUsageSummary(hasKey);

  useEffect(() => {
    const maxEnd = clips.reduce((m, c) => Math.max(m, c.start + c.duration), 8);
    setProjectDuration(Math.max(8, Math.ceil(maxEnd + 2)));
  }, [clips]);

  useEffect(() => {
    if (!isPlaying) {
      if (playTimer.current) cancelAnimationFrame(playTimer.current);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayhead((p) => {
        const next = p + dt;
        if (next >= projectDuration) { setIsPlaying(false); return projectDuration; }
        return next;
      });
      playTimer.current = requestAnimationFrame(tick);
    };
    playTimer.current = requestAnimationFrame(tick);
    return () => { if (playTimer.current) cancelAnimationFrame(playTimer.current); };
  }, [isPlaying, projectDuration]);

  const updateClip = (id: string, partial: Partial<TimelineClip>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  };

  const placeOnTrack = (track: number, dur: number, k: ClipKind, name: string, url: string, id: string) => {
    setMediaBin((b) => [...b, { id, name, kind: k, src: url, duration: dur }]);
    const clip = defaultClip({ kind: k, name, track, src: url, duration: dur, outPoint: dur });
    clip.start = lastEndOnTrack(clips, track);
    setClips((c) => [...c, clip]);
    setSelectedId(clip.id);
  };

  const onMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, kind: ClipKind) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const id = uid();
    const name = file.name.slice(0, 28);
    if (kind === 'video') {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => { placeOnTrack(0, Math.min(30, v.duration || 5), 'video', name, url, id); toast(`Video · ${(v.duration || 5).toFixed(1)}s`); };
      v.src = url;
    } else if (kind === 'audio') {
      const a = document.createElement('audio');
      a.preload = 'metadata';
      a.onloadedmetadata = () => { placeOnTrack(3, Math.min(60, a.duration || 8), 'audio', name, url, id); toast('Audio added'); };
      a.src = url;
    } else {
      placeOnTrack(0, 3, 'image', name, url, id);
      toast('Image clip (3s)');
    }
    e.target.value = '';
  };

  const addTextClip = (text?: string) => {
    const clip = defaultClip({ kind: 'text', name: 'Text', track: 2, text: text || 'Your text', duration: 3, textStyle: { fontSize: 48, color: '#ffffff', align: 'center', bold: true } });
    clip.start = playhead;
    setClips((c) => [...c, clip]);
    setSelectedId(clip.id);
  };

  const addSticker = (s: string) => {
    const clip = defaultClip({ kind: 'sticker', name: s, track: 2, text: s, duration: 2.5, textStyle: { fontSize: 72, color: '#fff', align: 'center', bold: true } });
    clip.start = playhead;
    setClips((c) => [...c, clip]);
    setSelectedId(clip.id);
  };

  const deleteClip = (id: string, ripple = false) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    if (ripple) {
      setClips((prev) => prev.filter((c) => c.id !== id).map((c) =>
        c.track === clip.track && c.start >= clip.start + clip.duration ? { ...c, start: Math.max(0, c.start - clip.duration) } : c
      ));
      toast('Ripple delete');
    } else {
      setClips((prev) => prev.filter((c) => c.id !== id));
      toast('Deleted');
    }
    if (selectedId === id) setSelectedId(null);
  };

  const splitClip = (id: string) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    if (playhead <= clip.start + 0.15 || playhead >= clip.start + clip.duration - 0.15) {
      toast('Move playhead inside clip to split');
      return;
    }
    const offset = playhead - clip.start;
    const left: TimelineClip = { ...clip, id: uid(), duration: offset, outPoint: clip.inPoint + offset };
    const right: TimelineClip = { ...clip, id: uid(), start: playhead, duration: clip.duration - offset, inPoint: clip.inPoint + offset, name: `${clip.name} ·` };
    setClips((prev) => [...prev.filter((c) => c.id !== id), left, right]);
    setSelectedId(right.id);
    toast('Split');
  };

  const duplicateClip = (id: string) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    const copy: TimelineClip = { ...clip, id: uid(), start: clip.start + clip.duration, name: `${clip.name} copy` };
    setClips((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const onClipPointerDown = (e: React.PointerEvent, clip: TimelineClip, mode: 'move' | 'trim-left' | 'trim-right') => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { id: clip.id, mode, startX: e.clientX, origStart: clip.start, origDuration: clip.duration };
    setSelectedId(clip.id);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / timelineZoom;
      if (d.mode === 'move') updateClip(d.id, { start: snapTimeValue(d.origStart + dx, snap, playhead, clips) });
      else if (d.mode === 'trim-left') {
        const maxShrink = d.origDuration - 0.3;
        const delta = Math.max(-d.origStart, Math.min(maxShrink, dx));
        updateClip(d.id, { start: d.origStart + delta, duration: d.origDuration - delta });
      } else updateClip(d.id, { duration: Math.max(0.3, d.origDuration + dx) });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [timelineZoom, snap, playhead, clips]);

  const handleAIGenerate = async () => {
    if (!hasKey) { onRequireApiKey(); return; }
    cancelRef.current.cancelled = false;
    await runVeoGeneration({
      apiKey, hasKey, model: aiModel, prompt: aiPrompt, image: aiImage, aspect,
      signal: cancelRef.current,
      onStatus: (s, message, error) => {
        setAiStatus(s);
        if (message) setAiMessage(message);
        if (error) setAiError(error);
        else if (s !== 'error') setAiError(null);
      },
      onVideo: (videoUrl) => {
        const id = uid();
        setMediaBin((b) => [...b, { id, name: 'AI Video', kind: 'video', src: videoUrl, duration: 8 }]);
        const clip = defaultClip({ kind: 'video', name: 'AI Video', track: 0, src: videoUrl, duration: 8, outPoint: 8 });
        clip.start = lastEndOnTrack(clips, 0);
        setClips((c) => [...c, clip]);
        setSelectedId(clip.id);
        toast('AI video generated!');
      },
    });
  };

  const handleExport = async () => {
    if (!clips.length) { toast('Add clips first'); return; }
    setExporting(true);
    setExportPct(0);
    try {
      const blob = await exportTimelineToWebM({ clips, aspect, projectDuration, onProgress: setExportPct });
      downloadBlob(blob, `video-studio-${Date.now()}.webm`);
      toast('Export complete');
    } catch (err: any) {
      toast(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const activeClips = clips.filter((c) => playhead >= c.start && playhead < c.start + c.duration).sort((a, b) => a.track - b.track);
  const mainVisual = activeClips.find((c) => c.track === 0 || c.track === 1);
  const overlays = activeClips.filter((c) => c.track === 2);

  return (
    <div className="flex flex-col gap-3 min-h-[78vh]">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-zinc-900/95 border border-zinc-800">
        <div className="flex items-center gap-1.5 px-1">
          <Clapperboard className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-white">Video Studio</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">CapCut</span>
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
          {ASPECT_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setAspect(p.id)} className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 ${aspect === p.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {p.icon}<span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Media</button>
        <button type="button" onClick={() => audioInputRef.current?.click()} className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</button>
        <button type="button" onClick={() => addTextClip()} className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Text</button>
        <input ref={fileInputRef} type="file" accept="video/*,image/*" className="hidden" onChange={(e) => onMediaUpload(e, e.target.files?.[0]?.type.startsWith('video') ? 'video' : 'image')} />
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => onMediaUpload(e, 'audio')} />
        <button type="button" onClick={() => setSnap((s) => !s)} className={`p-1.5 rounded-lg ${snap ? 'text-rose-400 bg-rose-500/15' : 'text-zinc-500 hover:bg-zinc-800'}`} title="Snap"><Magnet className="w-4 h-4" /></button>
        <button type="button" onClick={() => setMuted((m) => !m)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800">{muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
        <div className="flex-1" />
        <button type="button" disabled={exporting} onClick={handleExport} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />{exporting ? `Export ${exportPct}%` : 'Export'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="xl:col-span-5 flex flex-col gap-2">
          <div className="flex-1 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center p-3 min-h-[280px]">
            <div className="relative bg-zinc-950 overflow-hidden shadow-2xl w-full max-w-md" style={{ aspectRatio: aspectCss(aspect) }}>
              {mainVisual?.src && (mainVisual.kind === 'image' || mainVisual.kind === 'video') ? (
                mainVisual.kind === 'video' ? (
                  <video key={mainVisual.id} src={mainVisual.src} className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: filterCss(mainVisual.filter), opacity: mainVisual.opacity / 100, transform: `translate(${mainVisual.posX}%, ${mainVisual.posY}%) scale(${mainVisual.scale / 100}) rotate(${mainVisual.rotation || 0}deg)` }}
                    muted={muted} playsInline
                    ref={(el) => {
                      if (!el) return;
                      const local = (playhead - mainVisual.start) * mainVisual.speed + mainVisual.inPoint;
                      if (Math.abs(el.currentTime - local) > 0.25) { try { el.currentTime = Math.max(0, local); } catch { /* */ } }
                      if (isPlaying && el.paused) el.play().catch(() => {});
                      if (!isPlaying && !el.paused) el.pause();
                    }}
                  />
                ) : (
                  <img src={mainVisual.src} alt="" className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: filterCss(mainVisual.filter), opacity: mainVisual.opacity / 100, transform: `translate(${mainVisual.posX}%, ${mainVisual.posY}%) scale(${mainVisual.scale / 100}) rotate(${mainVisual.rotation || 0}deg)` }} />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-2">
                  <Film className="w-10 h-10 opacity-40" /><p className="text-xs">Import media or generate with AI</p>
                </div>
              )}
              {overlays.map((t) => (
                <div key={t.id} className="absolute inset-0 flex items-center justify-center pointer-events-none px-4" style={{ opacity: t.opacity / 100, transform: `translate(${t.posX}%, ${t.posY}%)` }}>
                  <span style={{ fontSize: Math.max(14, (t.textStyle?.fontSize || 48) * 0.4 * (t.scale / 100)), color: t.textStyle?.color || '#fff', fontWeight: t.textStyle?.bold ? 700 : 500, textShadow: '0 2px 12px rgba(0,0,0,0.65)' }}>{t.text}</span>
                </div>
              ))}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white tabular-nums">{formatTime(playhead)} / {formatTime(projectDuration)}</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <button type="button" onClick={() => { setPlayhead(0); setIsPlaying(false); }} className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"><SkipBack className="w-4 h-4" /></button>
            <button type="button" onClick={() => setPlayhead((p) => Math.max(0, p - 1))} className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" onClick={() => setIsPlaying((p) => !p)} className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/30">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button type="button" onClick={() => setPlayhead((p) => Math.min(projectDuration, p + 1))} className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"><ChevronRight className="w-4 h-4" /></button>
            <button type="button" onClick={() => setPlayhead(projectDuration)} className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800"><SkipForward className="w-4 h-4" /></button>
            <span className="text-xs font-mono text-zinc-400 w-28 text-center tabular-nums">{formatTime(playhead)}</span>
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col gap-2 max-h-[72vh] overflow-y-auto">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-950/50 via-zinc-900 to-indigo-950/40 border border-rose-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider font-bold text-rose-300 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Generate (Gemini Veo)</div>
              {!hasKey && <button type="button" onClick={onRequireApiKey} className="text-[10px] text-amber-400 flex items-center gap-1"><Key className="w-3 h-3" /> Login for higher limits</button>}
            </div>
            <div className="flex gap-1">
              {(['veo-3.1-fast', 'veo-3.1', 'omni-flash'] as AIModel[]).map((m) => (
                <button key={m} type="button" onClick={() => setAiModel(m)} className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold ${aiModel === m ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  {m === 'veo-3.1-fast' ? 'Veo Fast' : m === 'veo-3.1' ? 'Veo 3.1' : 'Omni'}
                </button>
              ))}
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} placeholder="Describe the video…" className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder:text-zinc-600 resize-none" />
            <button type="button" disabled={aiStatus === 'generating' || aiStatus === 'polling'} onClick={handleAIGenerate}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />{aiStatus === 'generating' || aiStatus === 'polling' ? (aiMessage || 'Working…') : 'Generate Video'}
            </button>
            {aiError && <div className="flex items-start gap-1.5 text-[10px] text-rose-400"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{aiError}</div>}
            {aiStatus === 'done' && <p className="text-[10px] text-emerald-400">{aiMessage}</p>}
            <p className="text-[9px] text-zinc-600">Quota · Veo {usage.veo.used}/{usage.veo.limit} · Omni {usage.omni.used}/{usage.omni.limit}</p>
          </div>

          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5">Stickers & Text</div>
            <div className="flex flex-wrap gap-1">
              {STICKERS.map((s) => (<button key={s} type="button" onClick={() => addSticker(s)} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-bold text-zinc-200 flex items-center justify-center">{s}</button>))}
              {TEXT_PRESETS.map((t) => (<button key={t} type="button" onClick={() => addTextClip(t)} className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300">{t}</button>))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1"><Layers className="w-3 h-3" /> Clip Inspector</div>
            {!selected ? <p className="text-[11px] text-zinc-600">Select a clip on the timeline</p> : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">{selected.name}</span>
                  <span className="text-[9px] text-zinc-500 font-mono">{TRACK_LABELS[selected.track]}</span>
                </div>
                {(selected.kind === 'text' || selected.kind === 'sticker') && (
                  <input type="text" value={selected.text || ''} onChange={(e) => updateClip(selected.id, { text: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white" />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-0.5"><span className="text-[9px] text-zinc-500 flex items-center gap-1"><Gauge className="w-3 h-3" /> Speed {selected.speed.toFixed(2)}x</span><input type="range" min={0.25} max={3} step={0.05} value={selected.speed} onChange={(e) => updateClip(selected.id, { speed: Number(e.target.value) })} className="w-full accent-rose-500" /></label>
                  <label className="space-y-0.5"><span className="text-[9px] text-zinc-500">Opacity {selected.opacity}%</span><input type="range" min={5} max={100} value={selected.opacity} onChange={(e) => updateClip(selected.id, { opacity: Number(e.target.value) })} className="w-full accent-rose-500" /></label>
                  <label className="space-y-0.5"><span className="text-[9px] text-zinc-500">Scale {selected.scale}%</span><input type="range" min={40} max={200} value={selected.scale} onChange={(e) => updateClip(selected.id, { scale: Number(e.target.value) })} className="w-full accent-rose-500" /></label>
                  <label className="space-y-0.5"><span className="text-[9px] text-zinc-500 flex items-center gap-1"><RotateCw className="w-3 h-3" /> Rotate {selected.rotation || 0}°</span><input type="range" min={-180} max={180} value={selected.rotation || 0} onChange={(e) => updateClip(selected.id, { rotation: Number(e.target.value) })} className="w-full accent-rose-500" /></label>
                  <label className="space-y-0.5"><span className="text-[9px] text-zinc-500 flex items-center gap-1"><Move className="w-3 h-3" /> X {selected.posX}%</span><input type="range" min={-50} max={50} value={selected.posX} onChange={(e) => updateClip(selected.id, { posX: Number(e.target.value) })} className="w-full accent-indigo-500" /></label>
                  <label className="space-y-0.5"><span className="text-[9px] text-zinc-500">Y {selected.posY}%</span><input type="range" min={-50} max={50} value={selected.posY} onChange={(e) => updateClip(selected.id, { posY: Number(e.target.value) })} className="w-full accent-indigo-500" /></label>
                </div>
                <div className="flex flex-wrap gap-1">{FILTERS.map((f) => (<button key={f.id} type="button" onClick={() => updateClip(selected.id, { filter: f.id })} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${selected.filter === f.id ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{f.label}</button>))}</div>
                <div className="flex flex-wrap gap-1">{TRANSITIONS.map((t) => (<button key={t} type="button" onClick={() => updateClip(selected.id, { transition: t })} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize ${selected.transition === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{t}</button>))}</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button type="button" onClick={() => splitClip(selected.id)} className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-semibold text-zinc-200 flex items-center gap-1"><Scissors className="w-3 h-3" /> Split</button>
                  <button type="button" onClick={() => duplicateClip(selected.id)} className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-semibold text-zinc-200 flex items-center gap-1"><Copy className="w-3 h-3" /> Duplicate</button>
                  <button type="button" onClick={() => deleteClip(selected.id, true)} className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-semibold text-amber-300 flex items-center gap-1"><Link2 className="w-3 h-3" /> Ripple</button>
                  <button type="button" onClick={() => deleteClip(selected.id, false)} className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-[10px] font-semibold text-rose-400 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 p-2 space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Timeline</span>
          <span className="text-[9px] text-zinc-600">Drag · edge-trim · click to seek</span>
          <div className="flex-1" />
          <input type="range" min={24} max={120} value={timelineZoom} onChange={(e) => setTimelineZoom(Number(e.target.value))} className="w-24 accent-rose-500" />
          <button type="button" onClick={() => { setClips([]); setSelectedId(null); }} className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Clear</button>
        </div>
        <div className="overflow-x-auto">
          <div style={{ width: Math.max(640, projectDuration * timelineZoom + 100) }} className="min-w-full">
            <div className="relative h-6 border-b border-zinc-800 ml-[92px] cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPlayhead(Math.max(0, Math.min(projectDuration, (e.clientX - rect.left) / timelineZoom)));
            }}>
              {Array.from({ length: Math.ceil(projectDuration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-700/50" style={{ left: i * timelineZoom }}>
                  <span className="absolute top-1 left-1 text-[8px] font-mono text-zinc-600">{i}s</span>
                </div>
              ))}
              <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none" style={{ left: playhead * timelineZoom }}>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-rose-500 rotate-45" />
              </div>
            </div>
            {TRACK_LABELS.map((label, trackIdx) => (
              <div key={trackIdx} className="flex border-b border-zinc-800/70 last:border-0">
                <div className="w-[92px] shrink-0 px-2 py-2 text-[10px] font-semibold text-zinc-500 border-r border-zinc-800 flex items-center gap-1.5 bg-zinc-950/60">
                  <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${TRACK_COLORS[trackIdx]}`} />{label}
                </div>
                <div className="relative h-14 flex-1" onClick={(e) => {
                  if ((e.target as HTMLElement).dataset.clip) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPlayhead(Math.max(0, Math.min(projectDuration, (e.clientX - rect.left) / timelineZoom)));
                }}>
                  <div className="absolute top-0 bottom-0 w-px bg-rose-500/80 z-10 pointer-events-none" style={{ left: playhead * timelineZoom }} />
                  {clips.filter((c) => c.track === trackIdx).map((clip) => (
                    <div key={clip.id} data-clip="1" onPointerDown={(e) => onClipPointerDown(e, clip, 'move')} onClick={(e) => { e.stopPropagation(); setSelectedId(clip.id); }}
                      className={`absolute top-1.5 bottom-1.5 rounded-md border cursor-grab active:cursor-grabbing overflow-hidden select-none ${
                        selectedId === clip.id ? `${TRACK_BORDER[trackIdx]} ring-1 ring-white/30` : 'border-transparent'
                      } bg-gradient-to-r ${TRACK_COLORS[trackIdx]}`}
                      style={{ left: clip.start * timelineZoom, width: Math.max(12, clip.duration * timelineZoom) }}>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40 z-10" onPointerDown={(e) => onClipPointerDown(e, clip, 'trim-left')} />
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40 z-10" onPointerDown={(e) => onClipPointerDown(e, clip, 'trim-right')} />
                      <div className="px-2 py-0.5 h-full flex flex-col justify-center pointer-events-none">
                        <div className="text-[9px] font-bold text-white truncate leading-tight">{clip.name}</div>
                        <div className="text-[8px] text-white/70 font-mono">{clip.duration.toFixed(1)}s{clip.speed !== 1 ? ` · ${clip.speed}x` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
