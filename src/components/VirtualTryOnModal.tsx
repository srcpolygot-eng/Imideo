import React from 'react';
import { X, Camera, AlertCircle, Key } from 'lucide-react';
import { ProductPreset } from '../types';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockupSnapshotUrl: string | null;
  product: ProductPreset;
  selectedColor: string;
  apiKey: string;
  hasServerKey: boolean;
  onRequireApiKey: () => void;
}

export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  onRequireApiKey,
}) => {
  if (!isOpen) return null;
  const hasKey = !!(apiKey || hasServerKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            Virtual Try-On
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        {!hasKey && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Virtual Try-On requires a Gemini API Key. Login to unlock.</span>
            </div>
            <button
              type="button"
              onClick={onRequireApiKey}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-colors"
            >
              Login
            </button>
          </div>
        )}
        <p className="text-sm text-zinc-400">
          Upload a photo and try your mockup with Gemini AI. Full generation requires a logged-in API key.
        </p>
        {hasKey && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <Key className="w-4 h-4" />
            <span>API key active — Virtual Try-On unlocked.</span>
          </div>
        )}
      </div>
    </div>
  );
};
