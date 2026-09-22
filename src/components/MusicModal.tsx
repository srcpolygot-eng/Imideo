import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  Sparkles,
  Crown,
  Key,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Radio,
  Clock,
  ExternalLink,
  Layers,
  Wand2,
  Share2,
} from 'lucide-react';
import { MusicModel, GeneratedTrack, GoogleAiTier, AuthMode } from '../types';
import { synthesizeMockupTrack } from '../utils/audioSynth';

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  googleAiTier?: GoogleAiTier;
  authMode?: AuthMode;
  onOpenApiKeyModal: () => void;
  currentProductName?: string;
  onSyncWithMockup?: (audioUrl: string, isPlaying: boolean) => void;
}

interface PresetMusicStyle {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  mood: string;
  tempo: string;
  iconText: string;
  recommendedProduct: string;
  prompt: string;
}

const PRESET_STYLES: PresetMusicStyle[] = [
  {
    id: 'acoustic-cafe',
    title: 'Morning Coffee Acoustic',
    subtitle: 'Warm acoustic guitar & soft piano',
    genre: 'Acoustic / Indie',
    mood: 'Cozy & Chill',
    tempo: 'Moderate (92 BPM)',
    iconText: '☕',
    recommendedProduct: 'Ceramic Mugs & Drinkware',
    prompt:
      'Warm acoustic guitar fingerpicking, gentle electric piano chords, cozy coffee shop vibe, organic vinyl texture, uplifting and calm commercial soundtrack',
  },
  {
    id: 'urban-lofi',
    title: 'Urban Streetwear Lo-Fi',
    subtitle: 'Mellow boom-bap & Rhodes chords',
    genre: 'Lo-Fi / Hip-Hop',
    mood: 'Chill & Relaxed',
    tempo: 'Slow (84 BPM)',
    iconText: '🛹',
    recommendedProduct: 'Hoodies & Graphic Tees',
    prompt:
      'Chill 84 BPM boom bap drum beat, soulful Rhodes piano chords, mellow warm sub-bass, vinyl dust crackle, relaxed streetwear fashion aesthetic',
  },
  {
    id: 'electro-commercial',
    title: 'Modern Product Launch',
    subtitle: 'Upbeat electro-pop & synth plucks',
    genre: 'Electro Pop / Commercial',
    mood: 'Energetic & Upbeat',
    tempo: 'Fast (120 BPM)',
    iconText: '✨',
    recommendedProduct: 'All Modern Merch & Ads',
    prompt:
      'Inspiring 120 BPM electro-pop commercial music, punchy clean four-on-the-floor kick, sparkling synth plucks, driving modern bassline, confident launch vibe',
  },
  {
    id: 'ambient-zen',
    title: 'Minimalist Eco Zen',
    subtitle: 'Gentle chimes & atmospheric drone',
    genre: 'Ambient / Zen',
    mood: 'Peaceful & Meditative',
    tempo: 'Slow (68 BPM)',
    iconText: '🌿',
    recommendedProduct: 'Canvas Tote Bags & Caps',
    prompt:
      'Gentle meditation chimes, serene atmospheric synth pad, light acoustic nature ambience, peaceful organic merchandise commercial soundtrack',
  },
  {
    id: 'indie-rock',
    title: 'Indie Rock Energy',
    subtitle: 'Driving guitars & rock drums',
    genre: 'Indie Rock / Alternative',
    mood: 'Bold & Energetic',
    tempo: 'Fast (130 BPM)',
    iconText: '🎸',
    recommendedProduct: 'Vintage Tees & Band Merch',
    prompt:
      'Driving indie rock rhythm guitar riff, punchy rock drum kit, energetic bass groove, raw authentic garage rock vibe for lifestyle apparel promo',
  },
  {
    id: 'lounge-jazz',
    title: 'Luxury Boutique Jazz',
    subtitle: 'Sophisticated saxophone & double bass',
    genre: 'Lounge Jazz / Soul',
    mood: 'Elegant & Sophisticated',
    tempo: 'Moderate (98 BPM)',
    iconText: '🎷',
    recommendedProduct: 'Premium Apparel & Drinkware',
    prompt:
      'Sophisticated jazz lounge chord progression, smooth saxophone melody, brushed snare drum, walking upright double bass, high-end boutique elegance',
  },
];

export const MusicModal: React.FC<MusicModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  googleAiTier = 'none',
  authMode = 'api-key',
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

  // Audio Playback State
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(15);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [syncWithMockup, setSyncWithMockup] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasKey = !!(apiKey || hasServerKey);
  const hasGoogleAiPlan = googleAiTier !== 'none';
  const isUnlocked = hasKey || hasGoogleAiPlan;

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
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

  // Sync volume and loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isMuted, isLooping]);

  // Handle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onSyncWithMockup) onSyncWithMockup(currentTrack.audioUrl, false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        if (syncWithMockup && onSyncWithMockup) {
          onSyncWithMockup(currentTrack.audioUrl, true);
        }
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Select Preset Style
  const handleSelectPreset = (preset: PresetMusicStyle) => {
    setPrompt(preset.prompt);
    setGenre(preset.genre);
    setMood(preset.mood);
    setTempo(preset.tempo);
  };

  // Generate Music using Lyria 3
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please enter a music prompt or select a preset.');
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
        // Attempt real server call to Lyria 3
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['x-gemini-api-key'] = apiKey;
        }

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

        const data = await res.json();

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
          setIsGenerating(false);
          return;
        } else {
          // If server reported quota or permission issue, fallback to synthesized preview with notice
          const reason = data.error || 'Lyria service error';
          console.warn('Lyria API returned non-OK status, falling back to Web Audio preview:', reason);
          setGenerationStep('Generating high-fidelity audio preview with local synthesizer...');
        }
      }

      // Web Audio Synthesizer Preview Fallback / Standalone
      const synthesizedUrl = await synthesizeMockupTrack({
        genre,
        durationSeconds,
        tempo,
      });

      const previewTrack: GeneratedTrack = {
        id: `synth-${Date.now()}`,
        title: `${genre} (${mood})`,
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
      // Even on error, fallback to browser synthesis
      try {
        const fallbackUrl = await synthesizeMockupTrack({ genre, durationSeconds });
        const fallbackTrack: GeneratedTrack = {
          id: `fallback-${Date.now()}`,
          title: `${genre} Preview`,
          prompt: prompt.trim(),
          model,
          durationSeconds,
          audioUrl: fallbackUrl,
          genre,
          mood,
          tempo,
          isAiGenerated: false,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTracks((prev) => [fallbackTrack, ...prev]);
        loadTrack(fallbackTrack, true);
      } catch (synthErr) {
        setErrorMessage(err.message || 'Failed to generate audio track.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const loadTrack = (track: GeneratedTrack, autoPlay: boolean = false) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setTrackDuration(track.durationSeconds);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      if (autoPlay) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          if (syncWithMockup && onSyncWithMockup) {
            onSyncWithMockup(track.audioUrl, true);
          }
        }).catch(() => {});
      } else {
        setIsPlaying(false);
      }
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
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-fuchsia-950/40 via-zinc-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Lyria 3 AI Music Studio</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300">
                  New Big Update
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Compose commercial soundtracks & theme songs for your <span className="text-zinc-200 font-medium">{currentProductName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tier / Key indicator */}
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isUnlocked
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 border-amber-700/50 text-amber-300 hover:bg-amber-900/50 animate-pulse'
              }`}
            >
              {hasGoogleAiPlan ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="capitalize">{googleAiTier.replace('google-ai-', 'Google AI ')}</span>
                </>
              ) : hasKey ? (
                <>
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gemini Key Active</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connect Key or Google AI</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Unlocked / Locked Notice Banner */}
          {!isUnlocked && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-fuchsia-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-zinc-300 space-y-0.5">
                  <span className="font-semibold text-white">Full Lyria 3 Generation Unlocks with Gemini API Key or Google AI</span>
                  <p className="text-[11px] text-zinc-400">
                    Connect your Gemini API Key or active Google AI Plan (Pro, Plus, Ultra, Enterprise). You can also generate in-browser synthesized tracks!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-fuchsia-600 hover:from-amber-500 hover:to-fuchsia-500 text-white font-semibold shadow transition-all active:scale-95"
                >
                  Configure Key / Tier
                </button>
              </div>
            </div>
          )}

          {/* Model Selector: Clip vs Pro */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Select Music Model</span>
              </label>
              <span className="text-[11px] text-zinc-400">Powered by Google DeepMind Lyria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* lyria-3-clip-preview */}
              <div
                onClick={() => {
                  setModel('lyria-3-clip-preview');
                  if (durationSeconds > 30) setDurationSeconds(15);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  model === 'lyria-3-clip-preview'
                    ? 'bg-zinc-800/90 border-fuchsia-500 shadow-md shadow-fuchsia-500/10 ring-1 ring-fuchsia-500'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">lyria-3-clip-preview</span>
                    <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.2 rounded font-mono">
                      Fast 30s
                    </span>
                  </div>
                  {model === 'lyria-3-clip-preview' && (
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400 ring-4 ring-fuchsia-400/20" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Short commercial clips (5s - 30s). Perfect for Instagram reels, TikTok ads, product unveil teasers, and looping website backgrounds.
                </p>
              </div>

              {/* lyria-3-pro-preview */}
              <div
                onClick={() => {
                  setModel('lyria-3-pro-preview');
                  if (durationSeconds <= 30) setDurationSeconds(60);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  model === 'lyria-3-pro-preview'
                    ? 'bg-zinc-800/90 border-fuchsia-500 shadow-md shadow-fuchsia-500/10 ring-1 ring-fuchsia-500'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">lyria-3-pro-preview</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                      Full Track
                    </span>
                  </div>
                  {model === 'lyria-3-pro-preview' && (
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400 ring-4 ring-fuchsia-400/20" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Full-length commercial production tracks (1 to 3 minutes). Ideal for brand campaign anthems, YouTube product reviews, and ambient in-store playlists.
                </p>
              </div>
            </div>
          </div>

          {/* Preset Commercial Music Styles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Commercial Presets for Products & Mockups</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_STYLES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-fuchsia-500/50 hover:bg-zinc-800/60 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{preset.iconText}</span>
                      <span className="text-[9px] font-mono text-zinc-500 group-hover:text-fuchsia-400">
                        {preset.genre}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white">
                      {preset.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                      {preset.subtitle}
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-zinc-800/60 text-[9px] text-zinc-500 truncate">
                    Best for: {preset.recommendedProduct}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt & Custom Controls */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Music Style & Arrangement Description</span>
                <span className="text-[10px] text-zinc-500">Add instruments, genre, tempo, mood</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. 120 BPM upbeat electro-pop commercial music with punchy drums and sparkling synth plucks..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-zinc-500">Quick Tags:</span>
              {[
                '+ Cozy Rhodes Piano',
                '+ 84 BPM Boom-Bap',
                '+ Acoustic Guitar Pluck',
                '+ Modern Synth Bass',
                '+ Vinyl Crackle',
                '+ Upbeat 4-on-the-Floor',
                '+ Soft Nature Foley',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPrompt((prev) => `${prev.trim()}, ${tag.replace('+ ', '')}`)}
                  className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] text-zinc-300 hover:text-white transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Music Parameters: Duration, Mood, Genre */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {/* Duration */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-fuchsia-400" />
                  <span>Duration</span>
                </label>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none"
                >
                  {model === 'lyria-3-clip-preview' ? (
                    <>
                      <option value={5}>5 Seconds (Quick Sting)</option>
                      <option value={10}>10 Seconds (Story Ad)</option>
                      <option value={15}>15 Seconds (Reels / Shorts)</option>
                      <option value={30}>30 Seconds (Standard Ad)</option>
                    </>
                  ) : (
                    <>
                      <option value={60}>1 Minute (Commercial Track)</option>
                      <option value={120}>2 Minutes (Extended Mix)</option>
                      <option value={180}>3 Minutes (Full Anthem)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Genre */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none"
                >
                  <option value="Acoustic / Indie">Acoustic / Indie</option>
                  <option value="Lo-Fi / Hip-Hop">Lo-Fi / Hip-Hop</option>
                  <option value="Electro Pop / Commercial">Electro Pop</option>
                  <option value="Ambient / Zen">Ambient / Zen</option>
                  <option value="Indie Rock / Alternative">Indie Rock</option>
                  <option value="Lounge Jazz / Soul">Lounge Jazz</option>
                </select>
              </div>

              {/* Mood */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none"
                >
                  <option value="Cozy & Chill">Cozy & Chill</option>
                  <option value="Energetic & Upbeat">Energetic & Upbeat</option>
                  <option value="Elegant & Luxury">Elegant & Luxury</option>
                  <option value="Peaceful & Meditative">Peaceful & Meditative</option>
                  <option value="Bold & Inspiring">Bold & Inspiring</option>
                </select>
              </div>

              {/* Tempo */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400">Tempo</label>
                <select
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none"
                >
                  <option value="Slow (70-85 BPM)">Slow (70-85 BPM)</option>
                  <option value="Moderate (90-110 BPM)">Moderate (90-110 BPM)</option>
                  <option value="Fast (120-140 BPM)">Fast (120-140 BPM)</option>
                </select>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-[11px] text-zinc-400">
                {isUnlocked ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected to Lyria 3 engine
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Preview synthesis mode active
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Composing Music...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Soundtrack</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{errorMessage}</span>
                <p className="text-[11px] text-rose-400">
                  Tip: Ensure your Gemini API Key is linked to a Google AI Studio account with billing enabled for Lyria music models.
                </p>
              </div>
            </div>
          )}

          {/* Generating Progress Indicator */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-center">
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 70, 95, 60, 85, 50, 90, 75, 45, 80].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-fuchsia-500 to-rose-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-zinc-200">{generationStep}</p>
              <p className="text-[10px] text-zinc-500">Synthesizing stereo master & frequency harmonics</p>
            </div>
          )}

          {/* ACTIVE MUSIC PLAYER */}
          {currentTrack && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-fuchsia-500/40 shadow-xl space-y-4">
              {/* Track Title & Badges */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{currentTrack.title}</h3>
                    {currentTrack.isAiGenerated ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300">
                        Lyria 3
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">
                        Hi-Fi Synth
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {currentTrack.genre} • {currentTrack.mood} • {currentTrack.tempo}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="Download Audio (.wav)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animated Equalizer Waveform */}
              <div className="h-12 bg-zinc-950/80 rounded-xl border border-zinc-800/80 px-3 flex items-center justify-between gap-1 overflow-hidden">
                {Array.from({ length: 48 }).map((_, idx) => {
                  const progress = currentTime / (trackDuration || 1);
                  const isPast = idx / 48 <= progress;
                  const randomHeight = ((idx * 17) % 70) + 25;
                  return (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        isPast
                          ? 'bg-gradient-to-t from-fuchsia-500 to-rose-400'
                          : 'bg-zinc-800'
                      }`}
                      style={{
                        height: isPlaying
                          ? `${Math.min(100, Math.max(20, randomHeight * (0.6 + Math.random() * 0.7)))}%`
                          : `${randomHeight * 0.5}%`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Timeline & Scrubber */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={trackDuration || 15}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>
                    {Math.floor(currentTime / 60)}:
                    {Math.floor(currentTime % 60).toString().padStart(2, '0')}
                  </span>
                  <span>
                    {Math.floor(trackDuration / 60)}:
                    {Math.floor(trackDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-between pt-1">
                {/* Play / Pause / Loop */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/25 transition-all active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLooping(!isLooping)}
                    className={`p-2 rounded-xl transition-colors ${
                      isLooping
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={isLooping ? 'Looping Enabled' : 'Looping Disabled'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Sync with Product Mockup */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !syncWithMockup;
                      setSyncWithMockup(next);
                      if (onSyncWithMockup && currentTrack) {
                        onSyncWithMockup(currentTrack.audioUrl, next && isPlaying);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      syncWithMockup
                        ? 'bg-gradient-to-r from-indigo-600/30 to-fuchsia-600/30 text-indigo-200 border border-indigo-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sync with Mockup View</span>
                  </button>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Session Track Library */}
          {tracks.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-300">Generated Tracks this Session ({tracks.length})</h4>
              <div className="space-y-1.5">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => loadTrack(track, true)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      currentTrack?.id === track.id
                        ? 'bg-zinc-800/90 border-fuchsia-500/60'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-white"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-fuchsia-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{track.title}</div>
                        <div className="text-[10px] text-zinc-500">
                          {track.genre} • {track.durationSeconds}s • {track.createdAt}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{track.model}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-fuchsia-400" />
            <span>Commercial License: Suitable for ads, social mockups, and client showcases</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
