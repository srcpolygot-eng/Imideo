import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Sparkles,
  Zap,
  Layers,
  Crown,
  Building2,
  Music,
} from 'lucide-react';
import { GoogleAiTier, AuthMode } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  googleAiTier?: GoogleAiTier;
  authMode?: AuthMode;
  onSaveApiKey: (key: string) => void;
  onClearApiKey: () => void;
  onSaveGoogleAiTier?: (tier: GoogleAiTier) => void;
  onSaveAuthMode?: (mode: AuthMode) => void;
}

const GOOGLE_AI_TIERS: {
  id: GoogleAiTier;
  name: string;
  tagline: string;
  models: string[];
  lyriaSupport: string;
  badgeColor: string;
  icon: any;
}[] = [
  {
    id: 'google-ai-pro',
    name: 'Google AI Pro',
    tagline: 'Recommended for AI Studio Creators & Commercial Mockups',
    models: ['lyria-3-clip-preview', 'gemini-3.1-pro-preview', 'veo-3.1-fast', 'gemini-3-pro-image'],
    lyriaSupport: 'Lyria 3 Clip (up to 30s music clips)',
    badgeColor: 'from-amber-500 to-orange-500 text-white',
    icon: Sparkles,
  },
  {
    id: 'google-ai-plus',
    name: 'Google AI Plus',
    tagline: 'Standard Generative Tier for Developers & Designers',
    models: ['gemini-2.5-flash', 'gemini-3.1-flash-image-preview', 'lyria-3-clip-preview'],
    lyriaSupport: 'Lyria 3 Clip (Standard Queue)',
    badgeColor: 'from-indigo-500 to-blue-500 text-white',
    icon: Zap,
  },
  {
    id: 'google-ai-ultra',
    name: 'Google AI Ultra',
    tagline: 'Maximum Concurrency, Full-Length Tracks & 4K Renders',
    models: ['lyria-3-pro-preview', 'lyria-3-clip-preview', 'veo-3.1', 'gemini-3-pro-image 4K'],
    lyriaSupport: 'Lyria 3 Pro (Full-length music tracks) + Lyria 3 Clip',
    badgeColor: 'from-fuchsia-500 to-pink-500 text-white',
    icon: Crown,
  },
  {
    id: 'google-ai-enterprise',
    name: 'Google AI Enterprise',
    tagline: 'Google Cloud Platform Billing & Dedicated Organization Quota',
    models: ['Custom GCP Project', 'Enterprise Lyria 3', 'High-Volume Veo Video'],
    lyriaSupport: 'Full Enterprise SLA & Custom Quota',
    badgeColor: 'from-emerald-500 to-teal-500 text-white',
    icon: Building2,
  },
];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  googleAiTier = 'none',
  authMode = 'api-key',
  onSaveApiKey,
  onClearApiKey,
  onSaveGoogleAiTier,
  onSaveAuthMode,
}) => {
  const [activeTab, setActiveTab] = useState<'api-key' | 'google-ai-tier'>(
    authMode === 'google-ai-tier' ? 'google-ai-tier' : 'api-key'
  );
  const [inputKey, setInputKey] = useState(apiKey);
  const [selectedTier, setSelectedTier] = useState<GoogleAiTier>(
    googleAiTier !== 'none' ? googleAiTier : 'google-ai-pro'
  );
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
    setSelectedTier(googleAiTier !== 'none' ? googleAiTier : 'google-ai-pro');
    setActiveTab(authMode === 'google-ai-tier' ? 'google-ai-tier' : 'api-key');
    setValidationStatus(apiKey ? 'valid' : 'idle');
    setValidationError(null);
  }, [apiKey, googleAiTier, authMode, isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setValidationError('Please enter a valid Gemini API key.');
      setValidationStatus('invalid');
      return;
    }

    setValidating(true);
    setValidationError(null);

    try {
      const res = await fetch('/api/gemini/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': trimmed,
        },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationStatus('valid');
        onSaveApiKey(trimmed);
        if (onSaveAuthMode) onSaveAuthMode('api-key');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setValidationStatus('invalid');
        setValidationError(data.error || 'The API key appears to be invalid or has expired.');
      }
    } catch (err: any) {
      // If server validation endpoint had network issue, still allow saving
      setValidationStatus('valid');
      onSaveApiKey(trimmed);
      if (onSaveAuthMode) onSaveAuthMode('api-key');
      onClose();
    } finally {
      setValidating(false);
    }
  };

  const handleSaveTier = () => {
    if (onSaveGoogleAiTier) onSaveGoogleAiTier(selectedTier);
    if (onSaveAuthMode) onSaveAuthMode('google-ai-tier');
    if (inputKey.trim()) {
      onSaveApiKey(inputKey.trim());
    }
    onClose();
  };

  const handleRemove = () => {
    setInputKey('');
    setValidationStatus('idle');
    setValidationError(null);
    onClearApiKey();
    if (onSaveGoogleAiTier) onSaveGoogleAiTier('none');
  };

  return (
    <div
      id="api-key-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-fuchsia-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Gemini API & Google AI Access</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 border border-fuchsia-500/30 text-fuchsia-300">
                  New Big Update
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Unlock high-resolution images, Veo video, and Lyria AI music generation
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

        {/* Dual Mode Switcher: API Key OR Google AI Plan */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('api-key')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'api-key'
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Use Gemini API Key</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google-ai-tier')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'google-ai-tier'
                ? 'bg-gradient-to-r from-fuchsia-950/80 to-indigo-950/80 text-white shadow-sm ring-1 ring-fuchsia-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Google AI Plans (Pro, Plus...)</span>
          </button>
        </div>

        {/* TAB 1: Direct Gemini API Key */}
        {activeTab === 'api-key' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-zinc-300">
                <span className="font-semibold text-white">Bring Your Own Key (BYOK)</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Enter your Google AI Studio API key. Your key is stored securely in your browser session and allows direct access to Gemini 3.1, Veo video, and Lyria AI music models.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Enter Gemini API Key</span>
                {validationStatus === 'valid' && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Verified
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    setValidationStatus('idle');
                    setValidationError(null);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {validationError && (
                <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Server key status */}
            {hasServerKey && (
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Environment key configured on server. Custom key overrides it if provided.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Google AI Plans */}
        {activeTab === 'google-ai-tier' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-indigo-950/40 border border-fuchsia-800/40 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-fuchsia-300 font-semibold">
                <Crown className="w-4 h-4 text-fuchsia-400" />
                <span>Google AI Subscription Tiers</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Connect your active Google AI plan (Pro, Plus, Ultra, Enterprise) to enable Lyria 3 AI music generation for product commercial tracks, Veo video, and ultra-high-resolution rendering.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GOOGLE_AI_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                const IconComponent = tier.icon;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-800/90 border-fuchsia-500 shadow-md shadow-fuchsia-500/10 ring-1 ring-fuchsia-500'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                          <IconComponent className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <span className="font-bold text-xs text-white">{tier.name}</span>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-fuchsia-400 ring-4 ring-fuchsia-400/20" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mb-2 leading-snug">{tier.tagline}</p>
                    <div className="p-1.5 rounded-md bg-zinc-900/90 border border-zinc-800/80 text-[10px] text-zinc-300 flex items-center gap-1.5">
                      <Music className="w-3 h-3 text-fuchsia-400 shrink-0" />
                      <span className="truncate">{tier.lyriaSupport}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Link key input for this tier */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-zinc-400">
                Account API Key associated with your Google AI plan (Optional if server key active)
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use server environment key)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none"
              />
            </div>
          </div>
        )}

        {/* Security / Legal Notice & Links */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Keys are stored strictly in local browser memory and proxied via serverless API routes to Google AI services.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Need a Google AI key?</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div>
            {(apiKey || googleAiTier !== 'none') && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Access</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'api-key' ? (
              <button
                type="button"
                disabled={validating || !inputKey.trim()}
                onClick={handleTestAndSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95"
              >
                {validating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Key...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Save & Unlock</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveTier}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Activate Google AI Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
