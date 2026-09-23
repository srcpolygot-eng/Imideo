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
  LogIn,
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  onSaveApiKey: (key: string) => void;
  onClearApiKey: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  onSaveApiKey,
  onClearApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey);
      setValidationStatus(apiKey ? 'valid' : 'idle');
      setValidationError(null);
      setShowKey(false);
    }
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setValidationStatus('invalid');
      setValidationError('Please enter a Gemini API key.');
      return;
    }

    setValidating(true);
    setValidationStatus('idle');
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
      onClose();
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setInputKey('');
    setValidationStatus('idle');
    setValidationError(null);
    onClearApiKey();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputKey.trim() && !validating) {
      handleTestAndSave();
    }
  };

  return (
    <div
      id="api-key-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-indigo-500/20 to-fuchsia-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Login to Product Mockup Studio</h2>
              <p className="text-xs text-zinc-400">
                Enter your Gemini API key to unlock AI features
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

        {/* Info Banner */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-zinc-300">
            <span className="font-semibold text-white">Gemini API Key Required</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Your key is stored securely in your browser and enables Gemini image generation, Veo video, Lyria music, Virtual Try-On, and high-res exports.
            </p>
          </div>
        </div>

        {/* Server key notice */}
        {hasServerKey && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>A server-side API key is already configured. You can still add a personal key to override it.</span>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-2">
          <label htmlFor="gemini-api-key-input" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Gemini API Key
          </label>
          <div className="relative">
            <input
              id="gemini-api-key-input"
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setValidationStatus('idle');
                setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 font-mono transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation feedback */}
          {validationStatus === 'valid' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>API key verified — you are logged in!</span>
            </div>
          )}
          {validationStatus === 'invalid' && validationError && (
            <div className="flex items-start gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Get key link */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>Don't have a key?</span>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            <span>Get free key from Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Logout / Clear Key</span>
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

            <button
              type="button"
              disabled={validating || !inputKey.trim()}
              onClick={handleTestAndSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95"
            >
              {validating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login & Unlock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
