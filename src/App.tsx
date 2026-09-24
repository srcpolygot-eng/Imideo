/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PRODUCTS } from './data/products';
import { SAMPLE_LOGOS } from './data/sampleLogos';
import { ProductPreset, LogoTransform } from './types';
import { Header, WorkspaceMode } from './components/Header';
import { MockupCanvas } from './components/MockupCanvas';
import { LogoUploader } from './components/LogoUploader';
import { ControlsPanel } from './components/ControlsPanel';
import { CreateEditModal } from './components/ai/CreateEditModal';
import { HighQualityModal } from './components/ai/HighQualityModal';
import { VeoVideoModal } from './components/ai/VeoVideoModal';
import { MusicModal } from './components/MusicModal';
import { ExportModal } from './components/ExportModal';
import { VirtualTryOnModal } from './components/VirtualTryOnModal';
import { ThreeDViewerModal } from './components/ThreeDViewerModal';
import { VideoAdSynthesizerModal } from './components/VideoAdSynthesizerModal';
import { BatchBrandKitModal } from './components/BatchBrandKitModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import {
  CheckCircle2,
  Key,
  Image as ImageIcon,
  Shirt,
  Clapperboard,
} from 'lucide-react';

export default function App() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('products');
  const [currentProduct, setCurrentProduct] = useState<ProductPreset>(PRODUCTS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(PRODUCTS[0].defaultColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(SAMPLE_LOGOS[0].dataUrl);
  const [transform, setTransform] = useState<LogoTransform>({
    x: 0,
    y: 0,
    scale: PRODUCTS[0].printArea.defaultScale,
    rotation: 0,
    opacity: 100,
    blendMode: PRODUCTS[0].defaultBlendMode,
    colorFilter: 'original',
    customColor: '#FFFFFF',
    cylindricalWarp: true,
    flipX: false,
    flipY: false,
  });
  const [mockupSnapshotUrl, setMockupSnapshotUrl] = useState<string | null>(null);
  // Gemini API Key state & persistence — strip keys that fail basic format (e.g. leftover "h")
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('gemini_custom_api_key') || '';
      if (stored && !/^AIza[0-9A-Za-z_\-]{20,}$/.test(stored.trim())) {
        localStorage.removeItem('gemini_custom_api_key');
        return '';
      }
      return stored;
    } catch {
      return '';
    }
  });
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [isHighQualityOpen, setIsHighQualityOpen] = useState(false);
  const [isVeoVideoOpen, setIsVeoVideoOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isVirtualTryOnOpen, setIsVirtualTryOnOpen] = useState(false);
  const [isThreeDViewerOpen, setIsThreeDViewerOpen] = useState(false);
  const [isVideoAdOpen, setIsVideoAdOpen] = useState(false);
  const [isBatchBrandKitOpen, setIsBatchBrandKitOpen] = useState(false);
  const [veoInitialImage, setVeoInitialImage] = useState<string | null>(null);
  const [isVercelDeployOpen, setIsVercelDeployOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasServerApiKey) setHasServerKey(true);
      })
      .catch((err) => console.warn('Could not check server health:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem('gemini_custom_api_key', newKey);
    } catch (e) {
      console.error('Failed to store API key:', e);
    }
    showToast('Logged in successfully! AI features unlocked.');
  };

  const handleClearApiKey = () => {
    setApiKey('');
    try {
      localStorage.removeItem('gemini_custom_api_key');
    } catch (e) {
      console.error('Failed to clear API key:', e);
    }
    showToast('Logged out. API key removed.');
  };

  const handleUpdateTransform = (partial: Partial<LogoTransform>) => {
    setTransform((prev) => ({ ...prev, ...partial }));
  };

  const handleResetTransform = () => {
    setTransform({
      x: 0,
      y: 0,
      scale: currentProduct.printArea.defaultScale,
      rotation: 0,
      opacity: 100,
      blendMode: currentProduct.defaultBlendMode,
      colorFilter: 'original',
      customColor: '#FFFFFF',
      cylindricalWarp: true,
      flipX: false,
      flipY: false,
    });
    showToast('Placement reset to product center.');
  };

  const handleSelectProduct = (prod: ProductPreset) => {
    setCurrentProduct(prod);
    setSelectedColor(prod.defaultColor);
    setTransform((prev) => ({
      ...prev,
      scale: prod.printArea.defaultScale,
      blendMode: prod.defaultBlendMode,
    }));
    showToast(`Switched product to ${prod.name}`);
  };

  const handleShuffle = () => {
    const prod = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const color = prod.colors[Math.floor(Math.random() * prod.colors.length)].hex;
    setCurrentProduct(prod);
    setSelectedColor(color);
    setTransform((prev) => ({
      ...prev,
      x: Math.floor(Math.random() * 21) - 10,
      y: Math.floor(Math.random() * 21) - 10,
      scale: prod.printArea.defaultScale,
      rotation: Math.floor(Math.random() * 21) - 10,
      blendMode: prod.defaultBlendMode,
    }));
    if (SAMPLE_LOGOS.length) {
      const logo = SAMPLE_LOGOS[Math.floor(Math.random() * SAMPLE_LOGOS.length)];
      setLogoUrl(logo.dataUrl);
    }
    showToast(`Remixed: ${prod.name}`);
  };

  const handleApplyLogoFromAI = (imageUrl: string) => {
    setLogoUrl(imageUrl);
    showToast('AI-generated design applied to mockup!');
  };

  const handleSendToVeo = (imageUrl: string) => {
    setVeoInitialImage(imageUrl);
    setIsCreateEditOpen(false);
    setIsHighQualityOpen(false);
    setIsVeoVideoOpen(true);
    showToast('Image loaded into Veo video animator.');
  };

  const handleSnapshotCaptured = (dataUrl: string) => {
    setMockupSnapshotUrl(dataUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      <Header
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        workspaceMode={workspaceMode}
        onWorkspaceChange={setWorkspaceMode}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenCreateEdit={() => setIsCreateEditOpen(true)}
        onOpenHighQuality={() => setIsHighQualityOpen(true)}
        onOpenVeoVideo={() => {
          setVeoInitialImage(null);
          setIsVeoVideoOpen(true);
        }}
        onOpenMusicStudio={() => setIsMusicModalOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenThreeDViewer={() => setIsThreeDViewerOpen(true)}
        onOpenVirtualTryOn={() => setIsVirtualTryOnOpen(true)}
        onOpenBatchBrandKit={() => setIsBatchBrandKitOpen(true)}
        onOpenVideoAd={() => setIsVideoAdOpen(true)}
        onShuffle={handleShuffle}
        onOpenVercelDeploy={() => setIsVercelDeployOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile workspace switcher */}
        <div className="md:hidden flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setWorkspaceMode('products')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 ${
              workspaceMode === 'products' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            Products
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('image-studio')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 ${
              workspaceMode === 'image-studio' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('video-studio')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 ${
              workspaceMode === 'video-studio' ? 'bg-rose-600 text-white' : 'text-zinc-400'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Video
          </button>
        </div>

        {workspaceMode === 'image-studio' ? (
          <ImageStudio
            onExportToMockup={(dataUrl) => {
              setLogoUrl(dataUrl);
              setWorkspaceMode('products');
              showToast('Artwork applied to product mockup!');
            }}
            onToast={showToast}
          />
        ) : workspaceMode === 'video-studio' ? (
          <VideoStudio
            apiKey={apiKey}
            hasServerKey={hasServerKey}
            onRequireApiKey={() => setIsApiKeyModalOpen(true)}
            initialImage={mockupSnapshotUrl || logoUrl}
            onToast={showToast}
          />
        ) : (
          <>
            {!apiKey && !hasServerKey && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-fuchsia-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-100">Login with Gemini API Key to Unlock AI Studios</p>
                    <p className="text-[11px] text-zinc-400">
                      Enable Lyria music, Virtual Try-On, Veo video, and 4K images.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-500 to-fuchsia-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  Login with API Key
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-5 space-y-6">
                <LogoUploader
                  currentLogoUrl={logoUrl}
                  onLogoSelected={(dataUrl, name) => {
                    setLogoUrl(dataUrl);
                    showToast(`Logo loaded: ${name || 'Custom logo'}`);
                  }}
                  onClearLogo={() => {
                    setLogoUrl(null);
                    showToast('Logo cleared.');
                  }}
                />
                <ControlsPanel
                  currentProduct={currentProduct}
                  selectedColor={selectedColor}
                  transform={transform}
                  onSelectProduct={handleSelectProduct}
                  onSelectColor={(hex) => setSelectedColor(hex)}
                  onUpdateTransform={handleUpdateTransform}
                  onResetTransform={handleResetTransform}
                />
              </div>
              <div className="lg:col-span-7 flex flex-col items-center">
                <MockupCanvas
                  product={currentProduct}
                  selectedColor={selectedColor}
                  logoUrl={logoUrl}
                  transform={transform}
                  onUpdateTransform={handleUpdateTransform}
                  onResetTransform={handleResetTransform}
                  onSnapshot={handleSnapshotCaptured}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-100 shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <CreateEditModal
        isOpen={isCreateEditOpen}
        onClose={() => setIsCreateEditOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onApplyLogo={handleApplyLogoFromAI}
        onSendToVeo={handleSendToVeo}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
      />
      <HighQualityModal
        isOpen={isHighQualityOpen}
        onClose={() => setIsHighQualityOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onApplyLogo={handleApplyLogoFromAI}
        onSendToVeo={handleSendToVeo}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
      />
      <VeoVideoModal
        isOpen={isVeoVideoOpen}
        onClose={() => setIsVeoVideoOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        initialImage={veoInitialImage}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
      />
      <MusicModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onOpenApiKeyModal={() => {
          setIsMusicModalOpen(false);
          setIsApiKeyModalOpen(true);
        }}
        currentProductName={currentProduct.name}
      />
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        mockupSnapshotUrl={mockupSnapshotUrl}
        product={currentProduct}
        selectedColor={selectedColor}
        logoUrl={logoUrl}
        transform={transform}
      />
      <ThreeDViewerModal
        isOpen={isThreeDViewerOpen}
        onClose={() => setIsThreeDViewerOpen(false)}
        product={currentProduct}
        selectedColor={selectedColor}
        logoUrl={logoUrl}
        transform={transform}
      />
      <VirtualTryOnModal
        isOpen={isVirtualTryOnOpen}
        onClose={() => setIsVirtualTryOnOpen(false)}
        mockupSnapshotUrl={mockupSnapshotUrl}
        product={currentProduct}
        selectedColor={selectedColor}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
      />
      <VideoAdSynthesizerModal
        isOpen={isVideoAdOpen}
        onClose={() => setIsVideoAdOpen(false)}
        mockupSnapshotUrl={mockupSnapshotUrl}
        product={currentProduct}
        selectedColor={selectedColor}
      />
      <BatchBrandKitModal
        isOpen={isBatchBrandKitOpen}
        onClose={() => setIsBatchBrandKitOpen(false)}
        logoUrl={logoUrl}
        transform={transform}
        selectedColor={selectedColor}
        onSelectProduct={handleSelectProduct}
      />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onSaveApiKey={handleSaveApiKey}
        onClearApiKey={handleClearApiKey}
      />
      <VercelDeployModal
        isOpen={isVercelDeployOpen}
        onClose={() => setIsVercelDeployOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onOpenApiKeyModal={() => {
          setIsVercelDeployOpen(false);
          setIsApiKeyModalOpen(true);
        }}
      />
    </div>
  );
}
