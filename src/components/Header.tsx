import React from 'react';
import { Sparkles, Film, Wand2, Key, CheckCircle, AlertCircle, Layers } from 'lucide-react';

interface HeaderProps {
  apiKey: string;
  hasServerKey: boolean;
  onOpenApiKeyModal: () => void;
  onOpenCreateEdit: () => void;
  onOpenHighQuality: () => void;
  onOpenVeoVideo: () => void;
  onOpenVercelDeploy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  hasServerKey,
  onOpenApiKeyModal,
  onOpenCreateEdit,
  onOpenHighQuality,
  onOpenVeoVideo,
  onOpenVercelDeploy,
}) => {
  const hasKey = !!apiKey || hasServerKey;

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              Product Mockup Studio
              <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Mugs, T-Shirts & Apparel with Gemini AI Image & Veo Video Studio
            </p>
          </div>
        </div>

        {/* AI Studio Feature Quick Launch Bar */}
        <div className="flex items-center gap-2">
          {/* Gemini API Key Button */}
          <button
            id="nav-api-key-button"
            type="button"
            onClick={onOpenApiKeyModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              hasKey
                ? 'bg-zinc-900 hover:bg-zinc-850 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
            }`}
            title="Configure your Gemini API key"
          >
            <Key className={`w-3.5 h-3.5 ${hasKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {hasKey ? (apiKey ? 'API Key: Set' : 'API Key: Active') : 'Set Gemini API Key'}
            </span>
            <span className="sm:hidden">Key</span>
            {hasKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Feature: Create & Edit Images */}
          <button
            id="nav-create-edit-button"
            type="button"
            onClick={onOpenCreateEdit}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Create or edit images with gemini-3.1-flash-image-preview"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Create & Edit</span>
            <span className="text-[10px] text-purple-400 font-mono hidden lg:inline">Flash 3.1</span>
          </button>

          {/* Feature: High-Quality (1K, 2K, 4K) */}
          <button
            id="nav-high-quality-button"
            type="button"
            onClick={onOpenHighQuality}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Generate high-quality images with 1K, 2K, 4K affordances via gemini-3-pro-image-preview"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">High-Quality</span>
            <span className="text-[10px] text-amber-400 font-mono hidden lg:inline">1K/2K/4K</span>
          </button>

          {/* Feature: Veo Video Generation */}
          <button
            id="nav-veo-video-button"
            type="button"
            onClick={onOpenVeoVideo}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            title="Generate or animate videos using veo-3.1-fast-generate-preview (16:9 or 9:16)"
          >
            <Film className="w-3.5 h-3.5 text-cyan-200" />
            <span>Veo Video</span>
          </button>

          {/* Vercel Deployment Option */}
          <button
            id="nav-vercel-deploy-button"
            type="button"
            onClick={onOpenVercelDeploy}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            title="Deploy this application to Vercel"
          >
            <svg viewBox="0 0 76 65" fill="currentColor" className="w-3 h-3 translate-y-[0.5px]">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <span className="hidden sm:inline">Deploy</span>
            <span className="text-[10px] bg-zinc-900 text-zinc-200 px-1.5 py-0.2 rounded font-mono hidden md:inline">
              Vercel
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
