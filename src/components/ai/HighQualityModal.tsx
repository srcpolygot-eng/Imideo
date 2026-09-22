import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Download, Check, AlertCircle, ArrowRight, Layers, Sliders, Key } from 'lucide-react';
import { ImageSize, AspectRatio } from '../../types';

interface HighQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
  onApplyAsLogo: (imageUrl: string) => void;
  onSendToVeo?: (imageUrl: string) => void;
}

export const HighQualityModal: React.FC<HighQualityModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  onRequireApiKey,
  onApplyAsLogo,
  onSendToVeo,
}) => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const hasKey = !!apiKey || hasServerKey;

  if (!isOpen) return null;

  const presets = [
    'Artisanal ceramic coffee mug on natural travertine stone with warm morning sun and soft steam',
    'Relaxed streetwear model wearing an oversized heavyweight black t-shirt in modern minimalist studio',
    'Vintage enamel camp mug on weathered cedar wood with a scenic pine mountain background at sunrise',
    'Eco-friendly organic canvas tote bag displayed on light linen fabric with botanical leaf shadows',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide a prompt describing your image.');
      return;
    }

    if (!hasKey) {
      setError('Gemini API key is required to generate high-quality images. Please enter your key.');
      onRequireApiKey();
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);
    setApplied(false);

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3-pro-image-preview',
          aspectRatio,
          imageSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate high-quality image with gemini-3-pro-image-preview.');
      }
      setResultImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini Pro Image API.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLogo = () => {
    if (resultImage) {
      onApplyAsLogo(resultImage);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="high-quality-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Generate High-Quality Images
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  gemini-3-pro-image-preview
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Generate photorealistic commercial product imagery with 1K, 2K, or 4K resolution
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
              <span className="truncate">Gemini API key is required for 1K/2K/4K Pro image generation.</span>
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

        <div className="space-y-4 mt-4">
          {/* 1. Affordance for User to Specify Image Size (1K, 2K, 4K) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Select Output Image Resolution (1K, 2K, 4K)
              </label>
              <span className="text-[11px] text-zinc-500">Specified via imageConfig.imageSize</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* 1K Option */}
              <button
                type="button"
                onClick={() => setImageSize('1K')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  imageSize === '1K'
                    ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-100">1K Standard</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    1024px
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Fast generation, ideal for web product previews</p>
              </button>

              {/* 2K Option */}
              <button
                type="button"
                onClick={() => setImageSize('2K')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  imageSize === '2K'
                    ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-100">2K Ultra HD</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    2048px
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Crisp apparel details & fabric weave clarity</p>
              </button>

              {/* 4K Option */}
              <button
                type="button"
                onClick={() => setImageSize('4K')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  imageSize === '4K'
                    ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-100">4K Master Studio</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">
                    4096px
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Maximum studio quality for professional printing</p>
              </button>
            </div>
          </div>

          {/* 2. Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['1:1', '4:3', '16:9', '9:16', '3:4'] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setAspectRatio(ar)}
                  className={`px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                    aspectRatio === ar
                      ? 'bg-zinc-800 text-white border-zinc-600 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Text Prompt */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Commercial Image Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Photorealistic commercial photo of a ceramic coffee mug on travertine stone with morning light..."
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Prompt Presets */}
          <div>
            <span className="text-[11px] text-zinc-500 block mb-1.5">Studio Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result */}
          {resultImage && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Generated {imageSize} Image ({aspectRatio})
                </span>
                <span className="text-[10px] font-mono text-zinc-500">gemini-3-pro-image-preview</span>
              </div>

              <div className="max-w-md max-h-72 mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center p-2 shadow-inner">
                <img
                  src={resultImage}
                  alt="High Quality Generation"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyLogo}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  {applied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>{applied ? 'Applied to Mockup!' : 'Use as Mockup Logo'}</span>
                </button>

                <a
                  href={resultImage}
                  download={`gemini-pro-${imageSize.toLowerCase()}-image.png`}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ({imageSize})</span>
                </a>

                {onSendToVeo && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendToVeo(resultImage);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <span>Animate with Veo →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer actions */}
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
              disabled={loading || !prompt.trim()}
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Rendering {imageSize} Pro Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate {imageSize} Pro Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
