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
    setInputKey(apiKey);
    setValidationStatus(apiKey ? 'valid' : 'idle');
    setValidationError(null);
  }, [apiKey, isOpen]);

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
        setTimeout(() => {
          onClose();
        }, 800);
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

  const handleDirectSave = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setValidationError('Please enter an API key.');
      return;
    }
    onSaveApiKey(trimmed);
    onClose();
  };

  const handleRemove = () => {
    setInputKey('');
    setValidationStatus('idle');
    setValidationError(null);
    onClearApiKey();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        id="gemini-api-key-modal"
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Gemini API Key Required
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your key to enable AI image and video synthesis
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

        {/* Server key note if present */}
        {hasServerKey && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Server-level API Key Detected</p>
              <p className="text-emerald-400/80 text-[11px] mt-0.5">
                A default key is configured on the host server. You can provide your own personal key below to use your individual quota and billing.
              </p>
            </div>
          </div>
        )}

        {/* Input & Form */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-300">
            Enter your Google Gemini API Key
          </label>

          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setValidationError(null);
                setValidationStatus('idle');
              }}
              placeholder="AIzaSy..."
              className="w-full pl-3.5 pr-20 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {inputKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors rounded-lg"
                  title="Clear key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Feedback */}
          {validationStatus === 'valid' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valid API Key active and ready for AI requests</span>
            </div>
          )}

          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Information & Get Key Link */}
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Your API key is saved locally in your browser storage and passed directly to API generation endpoints. It is never stored in public databases or shared.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Need a Google Gemini API Key?</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Get API Key at Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Saved Key</span>
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
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
