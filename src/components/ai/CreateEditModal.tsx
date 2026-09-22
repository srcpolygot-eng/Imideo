import React, { useState } from 'react';
import { X, Sparkles, Wand2, Image as ImageIcon, Download, Check, AlertCircle, ArrowRight, Key } from 'lucide-react';

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string | null;
  mockupSnapshotUrl: string | null;
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
  onApplyAsLogo: (imageUrl: string) => void;
  onSendToVeo?: (imageUrl: string) => void;
}

export const CreateEditModal: React.FC<CreateEditModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  mockupSnapshotUrl,
  apiKey,
  hasServerKey,
  onRequireApiKey,
  onApplyAsLogo,
  onSendToVeo,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'create'>('edit');
  const [prompt, setPrompt] = useState('');
  const [selectedSource, setSelectedSource] = useState<'logo' | 'mockup' | 'custom'>('logo');
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const hasKey = !!apiKey || hasServerKey;

  if (!isOpen) return null;

  // Curated edit suggestions
  const editSuggestions = [
    'Add metallic gold foil leaf texture with subtle shimmer',
    'Transform into vintage distressed screenprint with faded texture',
    'Make it look like an authentic embroidered patch with stitching border',
    'Add vibrant cyberpunk neon glow effect with dark aura',
    'Make the style minimalist monochrome line art with crisp vector edges',
  ];

  // Curated create suggestions
  const createSuggestions = [
    'Modern minimalist geometric coffee emblem with sun and mountain peak',
    'Vintage retro typography badge for Pacific Northwest outdoor club',
    'Streetwear mascot emblem of a stylish cyber fox with headphones',
    'Artisanal bakery crest with wheat wreath and vintage French serif letters',
  ];

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomImageBase64(reader.result as string);
      setSelectedSource('custom');
    };
    reader.readAsDataURL(file);
  };

  const getSourceImage = (): string | null => {
    if (selectedSource === 'logo') return currentLogoUrl;
    if (selectedSource === 'mockup') return mockupSnapshotUrl;
    if (selectedSource === 'custom') return customImageBase64;
    return null;
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please provide a prompt describing your desired image or changes.');
      return;
    }

    if (!hasKey) {
      setError('Gemini API key is required to use AI image creation. Please enter your key.');
      onRequireApiKey();
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);
    setApplied(false);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
    };

    try {
      if (activeTab === 'edit') {
        const sourceImage = getSourceImage();
        if (!sourceImage) {
          throw new Error('Please select or upload an image to edit.');
        }

        const res = await fetch('/api/gemini/edit-image', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt,
            imageBase64: sourceImage,
            mimeType: 'image/png',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to edit image with gemini-3.1-flash-image-preview.');
        }
        setResultImage(data.imageUrl);
      } else {
        // Create new image
        const res = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt,
            model: 'gemini-3.1-flash-image-preview',
            aspectRatio: '1:1',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create image with gemini-3.1-flash-image-preview.');
        }
        setResultImage(data.imageUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your API key.');
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
        id="create-edit-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Create & Edit Images
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  gemini-3.1-flash-image-preview
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Use text prompts to generate brand logos or modify existing assets</p>
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
              <span className="truncate">Gemini API key is required to generate or edit images.</span>
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('edit');
              setResultImage(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'edit'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            Edit Existing Image
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setResultImage(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Create from Scratch
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          {activeTab === 'edit' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                1. Select Target Image to Edit
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Active Logo Option */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('logo')}
                  disabled={!currentLogoUrl}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedSource === 'logo'
                      ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  } ${!currentLogoUrl ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <p className="text-xs font-semibold text-zinc-200 truncate">Current Logo</p>
                  <div className="w-full h-14 bg-zinc-900 rounded-lg mt-1.5 flex items-center justify-center p-1 border border-zinc-800">
                    {currentLogoUrl ? (
                      <img
                        src={currentLogoUrl}
                        alt="Logo"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-zinc-500">None uploaded</span>
                    )}
                  </div>
                </button>

                {/* Mockup Canvas Snapshot */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('mockup')}
                  disabled={!mockupSnapshotUrl}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedSource === 'mockup'
                      ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  } ${!mockupSnapshotUrl ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <p className="text-xs font-semibold text-zinc-200 truncate">Mockup Snapshot</p>
                  <div className="w-full h-14 bg-zinc-900 rounded-lg mt-1.5 flex items-center justify-center p-1 border border-zinc-800">
                    {mockupSnapshotUrl ? (
                      <img
                        src={mockupSnapshotUrl}
                        alt="Mockup snapshot"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-zinc-500">No snapshot</span>
                    )}
                  </div>
                </button>

                {/* Custom Photo Upload */}
                <label
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSource === 'custom'
                      ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomFileUpload}
                    className="hidden"
                  />
                  <p className="text-xs font-semibold text-zinc-200 truncate">Upload Any Photo</p>
                  <div className="w-full h-14 bg-zinc-900 rounded-lg mt-1.5 flex items-center justify-center p-1 border border-zinc-800">
                    {customImageBase64 ? (
                      <img
                        src={customImageBase64}
                        alt="Uploaded"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <ImageIcon className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px]">Click to choose</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              {activeTab === 'edit'
                ? '2. What edits or transformations would you like to make?'
                : 'Describe the logo or image to generate:'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={
                activeTab === 'edit'
                  ? 'e.g. Add metallic gold foil highlights and place on dark marble background...'
                  : 'e.g. Modern minimalist coffee brand logo badge with a sun and geometric mountain...'
              }
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Prompt Suggestions */}
          <div>
            <span className="text-[11px] text-zinc-500 block mb-1.5">Creative Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {(activeTab === 'edit' ? editSuggestions : createSuggestions).map((sugg, i) => (
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
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Area */}
          {resultImage && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Generated with gemini-3.1-flash-image-preview
                </span>
                <span className="text-[10px] font-mono text-zinc-500">1:1 Aspect Ratio</span>
              </div>

              <div className="w-48 h-48 mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center p-2 shadow-inner">
                <img
                  src={resultImage}
                  alt="Generated"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyLogo}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  {applied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>{applied ? 'Applied to Mockup!' : 'Use as Mockup Logo'}</span>
                </button>

                <a
                  href={resultImage}
                  download="gemini-generated-image.png"
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
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

          {/* Action buttons */}
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
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating with Gemini 3.1...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeTab === 'edit' ? 'Apply AI Edit' : 'Generate Image'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
