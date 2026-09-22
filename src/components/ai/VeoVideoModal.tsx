import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Film,
  Upload,
  Sparkles,
  Download,
  AlertCircle,
  Play,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle,
  Smartphone,
  Monitor,
  Key,
} from 'lucide-react';
import { VideoAspectRatio } from '../../types';

interface VeoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockupSnapshotUrl: string | null;
  initialInputImage?: string | null;
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
}

export const VeoVideoModal: React.FC<VeoVideoModalProps> = ({
  isOpen,
  onClose,
  mockupSnapshotUrl,
  initialInputImage,
  apiKey,
  hasServerKey,
  onRequireApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'photo-to-video' | 'text-to-video'>(
    initialInputImage || mockupSnapshotUrl ? 'photo-to-video' : 'photo-to-video'
  );

  // Video settings
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [prompt, setPrompt] = useState('');

  // Image source for photo-to-video
  const [imageSource, setImageSource] = useState<'mockup' | 'custom'>(
    initialInputImage ? 'custom' : mockupSnapshotUrl ? 'mockup' : 'custom'
  );
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(initialInputImage || null);

  // Execution states
  const [status, setStatus] = useState<'idle' | 'generating' | 'polling' | 'downloading' | 'completed' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const hasKey = !!apiKey || hasServerKey;

  // Update image when prop changes
  useEffect(() => {
    if (initialInputImage) {
      setUploadedPhotoUrl(initialInputImage);
      setImageSource('custom');
      setActiveTab('photo-to-video');
    }
  }, [initialInputImage]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const photoSuggestions = [
    'Smooth 360-degree turntable rotation showcasing the product mockup with soft dramatic lighting',
    'Cinematic slow push-in camera movement towards the logo with subtle atmospheric particles',
    'Warm sunbeams slowly sweeping across the product surface casting gentle moving shadows',
    'Steam gently rising from the coffee mug with coffee being poured in cozy morning ambiance',
  ];

  const textSuggestions = [
    'Commercial ad for a ceramic coffee mug with liquid espresso splashing gracefully in ultra slow motion, studio lighting',
    'Fashion model walking down a sunny street wearing a modern graphic t-shirt, cinematic shallow depth of field',
    'High-energy streetwear commercial showcasing apparel in neon cyberpunk city night with rain reflections',
    'Artisanal pottery maker setting a finished ceramic coffee cup on rustic wooden shelf in sunlit workshop',
  ];

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhotoUrl(reader.result as string);
      setImageSource('custom');
    };
    reader.readAsDataURL(file);
  };

  const getActiveImage = (): string | null => {
    if (imageSource === 'mockup') return mockupSnapshotUrl;
    return uploadedPhotoUrl;
  };

  // Start Generation Flow
  const handleStartGeneration = async () => {
    if (!hasKey) {
      setStatus('error');
      setErrorMessage('Gemini API key is required to generate Veo videos. Please enter your key.');
      onRequireApiKey();
      return;
    }

    setStatus('generating');
    setStatusMessage('Initiating Veo 3.1 video generation request...');
    setErrorMessage(null);
    setVideoUrl(null);
    setElapsedSeconds(0);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
    };

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const isPhoto = activeTab === 'photo-to-video';
      const targetImage = isPhoto ? getActiveImage() : null;

      if (isPhoto && !targetImage) {
        throw new Error('Please select or upload a photo to animate into video.');
      }
      if (!isPhoto && !prompt.trim()) {
        throw new Error('Please provide a text prompt to generate video.');
      }

      const bodyPayload: any = {
        model: 'veo-3.1-fast-generate-preview',
        aspectRatio, // '16:9' or '9:16'
        resolution,
      };

      if (prompt.trim()) {
        bodyPayload.prompt = prompt.trim();
      }

      if (targetImage) {
        bodyPayload.imageBase64 = targetImage;
        bodyPayload.mimeType = 'image/png';
      }

      const startRes = await fetch('/api/veo/generate-video', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to start Veo video generation.');
      }

      const opName = startData.operationName;
      setOperationName(opName);
      setStatus('polling');
      setStatusMessage('Veo is rendering frames and computing motion physics...');

      // Start Polling Loop
      startPolling(opName);
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to initiate video generation.');
    }
  };

  const startPolling = (opName: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    let pollCount = 0;
    const reassuranceMessages = [
      'Veo is computing motion physics & lighting...',
      'Synthesizing realistic surface fabric & ceramic reflections...',
      'Assembling smooth 24fps video frames...',
      'Encoding MP4 video stream with selected aspect ratio...',
      'Almost done, finalizing video generation...',
    ];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
    };

    pollIntervalRef.current = setInterval(async () => {
      pollCount++;
      const msgIndex = Math.min(Math.floor(pollCount / 3), reassuranceMessages.length - 1);
      setStatusMessage(reassuranceMessages[msgIndex]);

      try {
        const pollRes = await fetch('/api/veo/video-status', {
          method: 'POST',
          headers,
          body: JSON.stringify({ operationName: opName }),
        });

        const pollData = await pollRes.json();
        if (pollData.error) {
          throw new Error(pollData.error.message || 'Veo video generation failed.');
        }

        if (pollData.done) {
          // Completed! Download the video
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (timerRef.current) clearInterval(timerRef.current);

          setStatus('downloading');
          setStatusMessage('Downloading completed MP4 video...');
          await downloadVideo(opName);
        }
      } catch (err: any) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus('error');
        setErrorMessage(err.message || 'Error occurred while checking video progress.');
      }
    }, 4500);
  };

  const downloadVideo = async (opName: string) => {
    try {
      const res = await fetch('/api/veo/video-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
        },
        body: JSON.stringify({ operationName: opName }),
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve generated video stream.');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setVideoUrl(objectUrl);
      setStatus('completed');
      setStatusMessage('Video generated successfully!');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to download generated video.');
    }
  };

  const handleReset = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    setVideoUrl(null);
    setErrorMessage(null);
    setOperationName(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="veo-video-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Veo 3 Video Generation
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  veo-3.1-fast-generate-preview
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Animate your product mockups into video or generate commercial videos from text
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key requirement warning if missing */}
        {!hasKey && (
          <div className="p-3 mt-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2 min-w-0">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Gemini API key is required for Veo 3.1 video generation.</span>
            </div>
            <button
              type="button"
              onClick={onRequireApiKey}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] shrink-0 transition-colors"
            >
              Set API Key
            </button>
          </div>
        )}

        {/* Mode Selector Tabs */}
        {status === 'idle' && (
          <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 my-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('photo-to-video')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'photo-to-video'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Animate Photo into Video
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text-to-video')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'text-to-video'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Generate Video from Text
            </button>
          </div>
        )}

        {/* Modal Body */}
        {status === 'idle' ? (
          <div className="space-y-4">
            {/* If Photo-to-Video: Select Source Photo */}
            {activeTab === 'photo-to-video' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  1. Select Photo to Animate
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Mockup Canvas Option */}
                  <button
                    type="button"
                    onClick={() => setImageSource('mockup')}
                    disabled={!mockupSnapshotUrl}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      imageSource === 'mockup'
                        ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    } ${!mockupSnapshotUrl ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <p className="text-xs font-semibold text-zinc-200">Current Mockup Preview</p>
                    <div className="w-full h-20 bg-zinc-900 rounded-lg mt-1.5 flex items-center justify-center p-1 border border-zinc-800">
                      {mockupSnapshotUrl ? (
                        <img
                          src={mockupSnapshotUrl}
                          alt="Mockup snapshot"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-zinc-500">No snapshot yet</span>
                      )}
                    </div>
                  </button>

                  {/* Upload Custom Photo Option */}
                  <label
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      imageSource === 'custom'
                        ? 'bg-cyan-500/15 border-cyan-500 ring-1 ring-cyan-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs font-semibold text-zinc-200">Upload Any Photo</p>
                    <div className="w-full h-20 bg-zinc-900 rounded-lg mt-1.5 flex items-center justify-center p-1 border border-zinc-800">
                      {uploadedPhotoUrl ? (
                        <img
                          src={uploadedPhotoUrl}
                          alt="Custom photo"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-zinc-500">
                          <Upload className="w-5 h-5 mb-1 text-cyan-400" />
                          <span className="text-[10px]">Click to choose file</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Video Configuration (Aspect Ratio & Resolution) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Aspect Ratio (Required: 16:9 or 9:16) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Aspect Ratio (Required 16:9 or 9:16)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>16:9 (Landscape)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>9:16 (Portrait)</span>
                  </button>
                </div>
              </div>

              {/* Resolution (720p or 1080p) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Video Resolution
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                      resolution === '720p'
                        ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    720p HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                      resolution === '1080p'
                        ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1080p Full HD
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {activeTab === 'photo-to-video'
                  ? 'Motion & Camera Prompt (Optional)'
                  : 'Commercial Video Prompt'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  activeTab === 'photo-to-video'
                    ? 'e.g. Smooth 360-degree rotation of the product with cinematic studio lighting...'
                    : 'e.g. Commercial ad of a ceramic coffee mug rotating in slow motion with coffee splashing...'
                }
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Creative Prompt Presets */}
            <div>
              <span className="text-[11px] text-zinc-500 block mb-1.5">Motion Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {(activeTab === 'photo-to-video' ? photoSuggestions : textSuggestions).map((sugg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(sugg)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Film className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'photo-to-video' ? 'Animate into Video' : 'Generate Video'} ({aspectRatio})
                </span>
              </button>
            </div>
          </div>
        ) : status === 'generating' || status === 'polling' || status === 'downloading' ? (
          /* Active Progress State */
          <div className="py-12 px-4 text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
              <Film className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-100">{statusMessage}</h3>
              <p className="text-xs text-zinc-400">
                Veo 3.1 Fast video generation in progress. Video generation can take a minute.
              </p>
            </div>

            {/* Elapsed Time Counter */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Elapsed: {elapsedSeconds}s</span>
            </div>

            <div className="max-w-md mx-auto bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 text-left text-xs text-zinc-400 space-y-1">
              <div className="flex items-center justify-between text-zinc-300 font-medium">
                <span>Model: veo-3.1-fast-generate-preview</span>
                <span className="font-mono">{aspectRatio}</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                The video stream will download automatically once synthesis finishes.
              </p>
            </div>
          </div>
        ) : status === 'completed' && videoUrl ? (
          /* Completed Video Result State */
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Video Successfully Generated with Veo 3.1
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {aspectRatio} • {resolution}
              </span>
            </div>

            {/* Video Player Container */}
            <div
              className={`mx-auto bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center ${
                aspectRatio === '9:16' ? 'max-w-[280px] aspect-[9/16]' : 'w-full aspect-[16/9]'
              }`}
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={videoUrl}
                download={`veo-generation-${aspectRatio.replace(':', 'x')}.mp4`}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 Video</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Create Another Video</span>
              </button>
            </div>
          </div>
        ) : (
          /* Error State */
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">Generation Encountered an Error</h3>
              <p className="text-xs text-rose-300 max-w-md mx-auto">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
