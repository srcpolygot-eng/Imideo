/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PRODUCTS } from './data/products';
import { SAMPLE_LOGOS } from './data/sampleLogos';
import { ProductPreset, LogoTransform } from './types';
import { Header } from './components/Header';
import { MockupCanvas } from './components/MockupCanvas';
import { LogoUploader } from './components/LogoUploader';
import { ControlsPanel } from './components/ControlsPanel';
import { CreateEditModal } from './components/ai/CreateEditModal';
import { HighQualityModal } from './components/ai/HighQualityModal';
import { VeoVideoModal } from './components/ai/VeoVideoModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import {
  Wand2,
  Sparkles,
  Film,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Maximize2,
  Key,
} from 'lucide-react';

export default function App() {
  const [currentProduct, setCurrentProduct] = useState<ProductPreset>(PRODUCTS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(PRODUCTS[0].defaultColor);

  // Initial logo set to first sample logo for instant preview gratification
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

  // Gemini API Key state & persistence
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('gemini_custom_api_key') || '';
    } catch {
      return '';
    }
  });
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Check server-side key status on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasServerApiKey) {
          setHasServerKey(true);
        }
      })
      .catch((err) => {
        console.warn('Could not check server health:', err);
      });
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem('gemini_custom_api_key', newKey);
    } catch (e) {
      console.error('Failed to store API key in localStorage:', e);
    }
    showToast('Gemini API key saved successfully!');
  };

  const handleClearApiKey = () => {
    setApiKey('');
    try {
      localStorage.removeItem('gemini_custom_api_key');
    } catch (e) {
      console.error('Failed to clear API key:', e);
    }
    showToast('Saved API key removed.');
  };

  // Modals state
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [isHighQualityOpen, setIsHighQualityOpen] = useState(false);
  const [isVeoVideoOpen, setIsVeoVideoOpen] = useState(false);
  const [veoInitialImage, setVeoInitialImage] = useState<string | null>(null);
  const [isVercelDeployOpen, setIsVercelDeployOpen] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
      x: 0,
      y: 0,
      rotation: 0,
    }));
  };

  const handleApplyLogoFromAI = (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
    setTransform((prev) => ({
      ...prev,
      x: 0,
      y: 0,
      scale: currentProduct.printArea.defaultScale,
      colorFilter: 'original',
    }));
    showToast('Generated image applied as active logo mockup!');
  };

  const handleSendToVeo = (imgUrl: string) => {
    setVeoInitialImage(imgUrl);
    setIsVeoVideoOpen(true);
  };

  const handleSnapshotCaptured = (dataUrl: string) => {
    setMockupSnapshotUrl(dataUrl);
    showToast('Mockup snapshot captured! Ready for Gemini edit or Veo animation.');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenCreateEdit={() => setIsCreateEditOpen(true)}
        onOpenHighQuality={() => setIsHighQualityOpen(true)}
        onOpenVeoVideo={() => {
          setVeoInitialImage(null);
          setIsVeoVideoOpen(true);
        }}
        onOpenVercelDeploy={() => setIsVercelDeployOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Banner if no API key is configured */}
        {!apiKey && !hasServerKey && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  Gemini API Key Required to Unlock AI Studios
                </p>
                <p className="text-[11px] text-zinc-400">
                  Provide your Gemini API key to enable AI image synthesis (Flash 3.1 & Pro 4K) and Veo 3 video rendering.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Enter API Key</span>
            </button>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-100 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Logo Uploader + Product Customizer (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Logo Upload Card */}
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

            {/* Customization & Placement Controls */}
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

          {/* Right Column: Interactive Mockup Canvas Stage (7 cols on lg) */}
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

        {/* AI Capabilities Showcase Bar */}
        <div className="pt-6 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Integrated Gemini AI & Veo Video Suite
              </h2>
              <p className="text-xs text-zinc-400">
                Create custom brand logos, render ultra high-def imagery, or generate animated product videos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Create & Edit Images */}
            <div
              id="feature-card-create-edit"
              onClick={() => setIsCreateEditOpen(true)}
              className="group p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 cursor-pointer transition-all shadow-md hover:shadow-purple-500/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Wand2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                  Create & Edit Images
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Use natural language text prompts to generate brand logos from scratch or edit existing graphics and mockups.
                </p>
              </div>
            </div>

            {/* Card 2: Generate High-Quality Images (1K, 2K, 4K) */}
            <div
              id="feature-card-high-quality"
              onClick={() => setIsHighQualityOpen(true)}
              className="group p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-md hover:shadow-amber-500/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  gemini-3-pro-image-preview
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  High-Quality Images (1K, 2K, 4K)
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Generate hyper-detailed commercial product photoshoots with explicit affordances for 1K, 2K, and 4K output resolution.
                </p>
              </div>
            </div>

            {/* Card 3: Veo 3 Video Generation */}
            <div
              id="feature-card-veo-video"
              onClick={() => {
                setVeoInitialImage(null);
                setIsVeoVideoOpen(true);
              }}
              className="group p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 cursor-pointer transition-all shadow-md hover:shadow-cyan-500/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Film className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  veo-3.1-fast-generate-preview
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  Veo 3 Video Generations
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Animate your product mockup photo or generate commercial apparel videos in 16:9 (landscape) or 9:16 (portrait).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vercel Deployment Support Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-zinc-950 flex items-center justify-center shrink-0 shadow-md shadow-white/10">
              <svg viewBox="0 0 76 65" fill="currentColor" className="w-4 h-4 translate-y-[0.5px]">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100">Vercel Deployment Ready</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Vite + Serverless API
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Deploy to Vercel in 1 click with pre-configured <code className="text-zinc-300 font-mono">vercel.json</code>, Edge CDN frontend, and serverless Gemini API endpoints.
              </p>
            </div>
          </div>
          <button
            id="workspace-deploy-vercel-button"
            type="button"
            onClick={() => setIsVercelDeployOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shrink-0 flex items-center justify-center gap-2 shadow-md shadow-white/10 transition-all active:scale-95"
          >
            <svg viewBox="0 0 76 65" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <span>Deploy to Vercel</span>
          </button>
        </div>
      </main>

      {/* Modals */}
      <CreateEditModal
        isOpen={isCreateEditOpen}
        onClose={() => setIsCreateEditOpen(false)}
        currentLogoUrl={logoUrl}
        mockupSnapshotUrl={mockupSnapshotUrl}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
        onApplyAsLogo={handleApplyLogoFromAI}
        onSendToVeo={handleSendToVeo}
      />

      <HighQualityModal
        isOpen={isHighQualityOpen}
        onClose={() => setIsHighQualityOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
        onApplyAsLogo={handleApplyLogoFromAI}
        onSendToVeo={handleSendToVeo}
      />

      <VeoVideoModal
        isOpen={isVeoVideoOpen}
        onClose={() => {
          setIsVeoVideoOpen(false);
          setVeoInitialImage(null);
        }}
        mockupSnapshotUrl={mockupSnapshotUrl}
        initialInputImage={veoInitialImage}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onRequireApiKey={() => setIsApiKeyModalOpen(true)}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        hasServerKey={hasServerKey}
        onSaveApiKey={handleSaveApiKey}
        onClearApiKey={handleClearApiKey}
      />

      {/* Vercel Deployment Modal */}
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
