import React from 'react';
import {
  Sparkles,
  Film,
  Wand2,
  Key,
  Music,
  Layers,
  Shuffle,
  Download,
  RotateCw,
  Camera,
  Image as ImageIcon,
  Shirt,
  Clapperboard,
} from 'lucide-react';

export type WorkspaceMode = 'products' | 'image-studio' | 'video-studio';

interface HeaderProps {
  apiKey: string;
  hasServerKey: boolean;
  workspaceMode?: WorkspaceMode;
  onWorkspaceChange?: (mode: WorkspaceMode) => void;
  onOpenApiKeyModal: () => void;
  onOpenCreateEdit: () => void;
  onOpenHighQuality: () => void;
  onOpenVeoVideo: () => void;
  onOpenMusicStudio: () => void;
  onOpenExport: () => void;
  onOpenThreeDViewer: () => void;
  onOpenVirtualTryOn: () => void;
  onOpenBatchBrandKit: () => void;
  onOpenVideoAd: () => void;
  onShuffle: () => void;
  onOpenVercelDeploy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  hasServerKey,
  workspaceMode = 'products',
  onWorkspaceChange,
  onOpenApiKeyModal,
  onOpenCreateEdit,
  onOpenHighQuality,
  onOpenVeoVideo,
  onOpenMusicStudio,
  onOpenExport,
  onOpenThreeDViewer,
  onOpenVirtualTryOn,
  onOpenBatchBrandKit,
  onOpenVideoAd,
  onShuffle,
  onOpenVercelDeploy,
}) => {
  const hasKey = !!apiKey || hasServerKey;

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">
              Creative Studio
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">
              Products · Image · Video · AI
            </p>
          </div>

          {onWorkspaceChange && (
            <div className="hidden md:flex items-center p-0.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold ml-2">
              <button
                type="button"
                onClick={() => onWorkspaceChange('products')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  workspaceMode === 'products'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Shirt className="w-3.5 h-3.5 text-indigo-400" />
                <span>Products</span>
              </button>
              <button
                type="button"
                onClick={() => onWorkspaceChange('image-studio')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  workspaceMode === 'image-studio'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => onWorkspaceChange('video-studio')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  workspaceMode === 'video-studio'
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            id="nav-create-edit-button"
            type="button"
            onClick={onOpenCreateEdit}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Create or edit images with Gemini Flash"
          >
            <Wand2 className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Create</span>
          </button>

          <button
            id="nav-high-quality-button"
            type="button"
            onClick={onOpenHighQuality}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Generate high-quality 1K / 2K / 4K images"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">4K</span>
          </button>

          <button
            id="nav-export-button"
            type="button"
            onClick={onOpenExport}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Export print-ready mockups at 300 DPI"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Export</span>
            <span className="text-[10px] text-indigo-400 font-mono hidden lg:inline">300 DPI</span>
          </button>

          <button
            id="nav-api-key-button"
            type="button"
            onClick={onOpenApiKeyModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              hasKey
                ? 'bg-zinc-900 hover:bg-zinc-850 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
            }`}
            title={hasKey ? 'Logged in — manage Gemini API key' : 'Login with Gemini API Key'}
          >
            <Key className="w-3.5 h-3.5" />
            {hasKey ? (
              <>
                <span className="hidden sm:inline">Logged In</span>
                <span className="sm:hidden">Key</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Login</span>
                <span className="sm:hidden">Key</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              </>
            )}
          </button>

          <button
            id="nav-music-studio-button"
            type="button"
            onClick={onOpenMusicStudio}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-fuchsia-500/20 transition-all active:scale-95"
            title="Generate commercial music with Google Lyria 3"
          >
            <Music className="w-3.5 h-3.5 text-fuchsia-100" />
            <span className="hidden sm:inline">Music</span>
            <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono hidden md:inline">Lyria 3</span>
          </button>

          <button
            id="nav-veo-video-button"
            type="button"
            onClick={onOpenVeoVideo}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            title="Generate or animate videos using veo-3.1-fast-generate-preview"
          >
            <Film className="w-3.5 h-3.5 text-cyan-200" />
            <span className="hidden sm:inline">Video</span>
          </button>

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
          </button>
        </div>
      </div>
    </header>
  );
};
