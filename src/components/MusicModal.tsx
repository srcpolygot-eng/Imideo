import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { MusicModel, GeneratedTrack } from '../types';
import { synthesizeMockupTrack } from '../utils/audioSynth';

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  onOpenApiKeyModal: () => void;
  currentProductName?: string;
  onSyncWithMockup?: (audioUrl: string, isPlaying: boolean) => void;
}

export const MusicModal: React.FC<MusicModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  onOpenApiKeyModal,
  currentProductName = 'Ceramic Mug',
  onSyncWithMockup,
}) => {
  const [model, setModel] = useState<MusicModel>('lyria-3-clip-preview');
  const [prompt, setPrompt] = useState(
    'Warm acoustic guitar fingerpicking, gentle electric piano chords, cozy coffee shop vibe, uplifting commercial soundtrack'
  );
  const [genre, setGenre] = useState('Acoustic / Indie');
  const [mood, setMood] = useState('Cozy & Chill');
  const [tempo, setTempo] = useState('Moderate (92 BPM)');
  const [durationSeconds, setDurationSeconds] = useState<number>(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(15);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasKey = !!(apiKey || hasServerKey);
  const isUnlocked = hasKey;

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTrackDuration(audio.duration);
      }
    };
    audio.onended = () => {
      if (audio.loop) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
        if (onSyncWithMockup) onSyncWithMockup('', false);
      }
    };
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isMuted, isLooping]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onSyncWithMockup) onSyncWithMockup(currentTrack.audioUrl, false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const loadTrack = (track: GeneratedTrack, autoPlay = false) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setTrackDuration(track.durationSeconds);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      if (autoPlay) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please enter a music prompt.');
      return;
    }
    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep(
      isUnlocked
        ? `Connecting to Google Lyria 3 (${model})...`
        : 'Synthesizing commercial soundtrack in browser preview...'
    );
    try {
      if (isUnlocked) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-gemini-api-key'] = apiKey;
        setGenerationStep('Generating high-fidelity audio with Lyria 3...');
        const res = await fetch('/api/gemini/generate-music', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: prompt.trim(),
            model,
            durationSeconds,
            genre,
            mood,
            tempo,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.audioUrl) {
          const newTrack: GeneratedTrack = {
            id: `lyria-${Date.now()}`,
            title: prompt.slice(0, 35) + (prompt.length > 35 ? '...' : ''),
            prompt: prompt.trim(),
            model,
            durationSeconds: data.durationSeconds || durationSeconds,
            audioUrl: data.audioUrl,
            genre,
            mood,
            tempo,
            isAiGenerated: true,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setTracks((prev) => [newTrack, ...prev]);
          loadTrack(newTrack, true);
          return;
        }
        // Real API failed — surface error. Do NOT pretend synth is Lyria.
        const reason =
          data.error ||
          (res.status === 401 || res.status === 403
            ? 'API key rejected by Google. Re-login with a valid Gemini key.'
            : `Lyria generation failed (HTTP ${res.status}).`);
        setErrorMessage(reason);
        return;
      }
      // Free / no-key path only: local Web Audio preview (clearly labeled non-AI)
      setGenerationStep('Synthesizing local preview (login with Gemini key for real Lyria)...');
      const synthesizedUrl = await synthesizeMockupTrack({ genre, durationSeconds, tempo });
      const previewTrack: GeneratedTrack = {
        id: `synth-${Date.now()}`,
        title: `${genre} (${mood}) — local preview`,
        prompt: prompt.trim(),
        model,
        durationSeconds,
        audioUrl: synthesizedUrl,
        genre,
        mood,
        tempo,
        isAiGenerated: false,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTracks((prev) => [previewTrack, ...prev]);
      loadTrack(previewTrack, true);
    } catch (err: any) {
      console.error('Music generation failure:', err);
      setErrorMessage(err?.message || 'Failed to generate audio track.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentTrack) return;
    const a = document.createElement('a');
    a.href = currentTrack.audioUrl;
    a.download = `mockup-soundtrack-${currentTrack.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div
      id="music-studio-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-fuchsia-950/40 via-zinc-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Lyria 3 AI Music Studio</h2>
              <p className="text-xs text-zinc-400">
                Soundtracks for your <span className="text-zinc-200 font-medium">{currentProductName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isUnlocked
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-700/50 text-amber-300 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasKey ? 'Gemini Key Active' : 'Login with API Key'}</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!isUnlocked && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Full Lyria 3 Unlocks with Gemini API Key</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Login with your Gemini API Key for AI music. Browser-synthesized previews still work without a key.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-fuchsia-600 text-white font-semibold shrink-0"
              >
                Login with API Key
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
              Music Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModel('lyria-3-clip-preview')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  model === 'lyria-3-clip-preview'
                    ? 'border-fuchsia-500 bg-zinc-800 ring-1 ring-fuchsia-500'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-white">lyria-3-clip</div>
                <div className="text-zinc-400 mt-0.5">Fast clips up to 30s</div>
              </button>
              <button
                type="button"
                onClick={() => setModel('lyria-3-pro-preview')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  model === 'lyria-3-pro-preview'
                    ? 'border-fuchsia-500 bg-zinc-800 ring-1 ring-fuchsia-500'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-white">lyria-3-pro</div>
                <div className="text-zinc-400 mt-0.5">Full-length tracks</div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-200">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
              placeholder="Describe the music you want..."
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-zinc-400">Genre</label>
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400">Mood</label>
              <input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400">Duration (s)</label>
              <input
                type="number"
                min={5}
                max={model === 'lyria-3-clip-preview' ? 30 : 120}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value) || 15)}
                className="w-full mt-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            disabled={isGenerating || !prompt.trim()}
            onClick={handleGenerate}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{generationStep || 'Generating...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isUnlocked ? 'Generate with Lyria 3' : 'Generate Browser Preview'}</span>
              </>
            )}
          </button>

          {currentTrack && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white truncate">{currentTrack.title}</span>
                <span className="text-zinc-500">{currentTrack.isAiGenerated ? 'Lyria 3' : 'Preview'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={togglePlay} className="p-2 rounded-lg bg-fuchsia-600 text-white">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={trackDuration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = t;
                    setCurrentTime(t);
                  }}
                  className="flex-1"
                />
                <button type="button" onClick={() => setIsMuted(!isMuted)} className="p-1.5 text-zinc-400">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button type="button" onClick={handleDownload} className="p-1.5 text-zinc-400 hover:text-white">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {tracks.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Generated tracks
              </div>
              {tracks.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => loadTrack(t, true)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-fuchsia-500/40 text-xs text-zinc-300 truncate"
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
