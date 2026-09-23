import React, { useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  Palette,
  Archive,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import JSZip from 'jszip';
import { ProductPreset, LogoTransform } from '../types';
import { PRODUCTS } from '../data/products';

interface BatchBrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl: string | null;
  transform: LogoTransform;
  selectedColor: string;
  onSelectProduct: (product: ProductPreset) => void;
}

export const BatchBrandKitModal: React.FC<BatchBrandKitModalProps> = ({
  isOpen,
  onClose,
  logoUrl,
  transform,
  selectedColor,
  onSelectProduct,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!isOpen) return null;

  // Harmonized Brand Palette based on active color
  const brandPalette = [
    { name: 'Active Hero', hex: selectedColor },
    { name: 'Core Onyx', hex: '#18181b' },
    { name: 'Clean Chalk', hex: '#f4f4f5' },
    { name: 'Electric Accent', hex: '#6366f1' },
    { name: 'Vibrant Pop', hex: '#ec4899' },
  ];

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleDownloadFullLookbookZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Brand Guide JSON
      const brandGuide = {
        brandName: 'Product Mockup Studio Collection',
        generatedAt: new Date().toISOString(),
        primaryPalette: brandPalette,
        typographyPairings: {
          headline: 'Cabinet Grotesk / Plus Jakarta Sans Bold',
          body: 'Plus Jakarta Sans Regular',
          code: 'JetBrains Mono',
        },
        merchandiseCatalog: PRODUCTS.map((p) => ({
          name: p.name,
          category: p.category,
          recommendedColorways: p.colors,
        })),
      };

      zip.file('brand-identity-guidelines.json', JSON.stringify(brandGuide, null, 2));

      if (logoUrl) {
        const logoData = logoUrl.replace(/^data:image\/\w+;base64,/, '');
        zip.file('brand-logo-master.png', logoData, { base64: true });
      }

      const readme = `# BRAND IDENTITY & MERCHANDISE LOOKBOOK
Generated with Product Mockup Studio Pro

## Brand Palette:
${brandPalette.map((c) => `- ${c.name}: ${c.hex}`).join('\n')}

## Catalog Products:
${PRODUCTS.map((p) => `- ${p.name} (${p.category})`).join('\n')}

Ready for Shopify, Printful, Printify, and Custom Merch Runs.
`;
      zip.file('README-BRAND-GUIDE.md', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complete-brand-lookbook-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create lookbook zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div
      id="batch-brand-kit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-zinc-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">AI Batch Brand Kit & Multi-Product Lookbook</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {PRODUCTS.length} Products Synced
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Visualize your logo and color identity simultaneously across your entire merchandise line
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isZipping}
              onClick={handleDownloadFullLookbookZip}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Packaging...</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Download Lookbook ZIP</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Brand Palette Bar */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Generated Brand Palette</span>
              </span>
              <span className="text-[11px] text-zinc-500">Click any hex code to copy</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {brandPalette.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleCopyHex(c.hex)}
                  className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/50 text-left transition-all group flex items-center gap-3"
                >
                  <div
                    className="w-7 h-7 rounded-md border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-zinc-400 truncate">{c.name}</div>
                    <div className="text-xs font-mono font-bold text-zinc-200 group-hover:text-amber-400 flex items-center gap-1">
                      <span>{c.hex}</span>
                      {copiedHex === c.hex && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 6-Product Simultaneous Lookbook Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200">Synchronized Merchandise Catalog</h3>
              <span className="text-[11px] text-zinc-500">Click any product to switch active canvas</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                  className="group p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-500/60 cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
                >
                  {/* Visual mockup container */}
                  <div className="aspect-square rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 relative flex items-center justify-center overflow-hidden">
                    {/* Simplified SVG illustration with logo */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div
                        className="w-24 h-24 rounded-2xl transition-transform group-hover:scale-105 flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: selectedColor }}
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            className="w-12 h-12 object-contain filter drop-shadow-md"
                          />
                        ) : (
                          <Sparkles className="w-8 h-8 text-white/40" />
                        )}
                      </div>
                    </div>

                    {/* Category pill */}
                    <span className="absolute top-2 left-2 text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/60 text-zinc-400 backdrop-blur-sm">
                      {prod.category}
                    </span>

                    {/* Hover switch CTA */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 font-bold text-[11px] flex items-center gap-1 shadow-lg">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Edit on Canvas</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="pt-2.5">
                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {prod.colors.length} Colorways • {prod.printArea.width}% Print Area
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Ready for client presentations, pitch decks, and manufacturer handoff</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
