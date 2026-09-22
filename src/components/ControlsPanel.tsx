import React from 'react';
import { PRODUCTS } from '../data/products';
import { ProductPreset, LogoTransform, ProductCategory } from '../types';
import {
  Palette,
  Sliders,
  Sparkles,
  Layers,
  Coffee,
  Shirt,
  ShoppingBag,
  RotateCw,
} from 'lucide-react';

interface ControlsPanelProps {
  currentProduct: ProductPreset;
  selectedColor: string;
  transform: LogoTransform;
  onSelectProduct: (product: ProductPreset) => void;
  onSelectColor: (hex: string) => void;
  onUpdateTransform: (newTransform: Partial<LogoTransform>) => void;
  onResetTransform: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  currentProduct,
  selectedColor,
  transform,
  onSelectProduct,
  onSelectColor,
  onUpdateTransform,
  onResetTransform,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<ProductCategory | 'all'>('all');

  const filteredProducts = activeCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  // Quick preset positions
  const applyPreset = (type: 'center' | 'left-chest' | 'large' | 'bottom') => {
    switch (type) {
      case 'left-chest':
        onUpdateTransform({
          x: -24,
          y: -18,
          scale: 60,
          rotation: 0,
        });
        break;
      case 'large':
        onUpdateTransform({
          x: 0,
          y: 0,
          scale: 125,
          rotation: 0,
        });
        break;
      case 'bottom':
        onUpdateTransform({
          x: 0,
          y: 22,
          scale: 80,
          rotation: 0,
        });
        break;
      case 'center':
      default:
        onUpdateTransform({
          x: 0,
          y: 0,
          scale: currentProduct.printArea.defaultScale,
          rotation: 0,
        });
        break;
    }
  };

  return (
    <div id="controls-panel" className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg space-y-6">
      {/* 1. Product Selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-100">Select Product Mockup</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{PRODUCTS.length} Items</span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-3 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Products
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('drinkware')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeCategory === 'drinkware'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" /> Mugs & Drinkware
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('apparel')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeCategory === 'apparel'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" /> T-Shirts & Apparel
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('accessories')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeCategory === 'accessories'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Accessories
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const isSelected = p.id === currentProduct.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectProduct(p);
                  onSelectColor(p.defaultColor);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-sm ring-1 ring-indigo-500/40'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    {p.category}
                  </span>
                  {p.isCurvedSurface && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">3D Wrap</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-200 truncate">{p.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{p.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Color Swatches */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">Product Color</h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">{selectedColor}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentProduct.colors.map((c) => {
            const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => onSelectColor(c.hex)}
                className={`relative w-8 h-8 rounded-full border transition-all ${
                  isSelected
                    ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-900 scale-110 border-white'
                    : 'border-zinc-700/80 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={`${c.name} (${c.hex})`}
              />
            );
          })}

          {/* Custom Color Picker input */}
          <div className="relative flex items-center ml-1">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onSelectColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
              title="Choose Custom Color"
            />
            <div
              className="w-8 h-8 rounded-full border border-dashed border-zinc-600 flex items-center justify-center text-zinc-400 text-xs hover:border-zinc-400 transition-colors pointer-events-none"
              style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Logo Placement & Scale Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Placement & Scale</h3>
          </div>
          <button
            type="button"
            onClick={onResetTransform}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('center')}
            className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Center
          </button>
          {currentProduct.category === 'apparel' && (
            <button
              type="button"
              onClick={() => applyPreset('left-chest')}
              className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Left Chest
            </button>
          )}
          <button
            type="button"
            onClick={() => applyPreset('large')}
            className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Large Front
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-3 bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/80">
          {/* Scale Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Size / Scale</span>
              <span className="font-mono text-zinc-200">{transform.scale}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={currentProduct.printArea.maxScale || 180}
              value={transform.scale}
              onChange={(e) => onUpdateTransform({ scale: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Horizontal Position (X) */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Horizontal Offset (X)</span>
              <span className="font-mono text-zinc-200">{transform.x}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={transform.x}
              onChange={(e) => onUpdateTransform({ x: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Vertical Position (Y) */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Vertical Offset (Y)</span>
              <span className="font-mono text-zinc-200">{transform.y}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={transform.y}
              onChange={(e) => onUpdateTransform({ y: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Rotation Angle</span>
              <span className="font-mono text-zinc-200">{transform.rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={transform.rotation}
              onChange={(e) => onUpdateTransform({ rotation: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Realistic Print Finish & Blend Modes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-zinc-100">Print Finish & Blend Mode</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onUpdateTransform({ blendMode: 'multiply' })}
            className={`p-2 rounded-xl border text-left transition-colors ${
              transform.blendMode === 'multiply'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <p className="font-semibold text-zinc-200">Multiply (Fabric Inked)</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Folds & shadows show naturally</p>
          </button>

          <button
            type="button"
            onClick={() => onUpdateTransform({ blendMode: 'normal' })}
            className={`p-2 rounded-xl border text-left transition-colors ${
              transform.blendMode === 'normal'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <p className="font-semibold text-zinc-200">Normal (Opaque Vinyl)</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Solid thick transfer print</p>
          </button>
        </div>

        {/* Logo Color Screenprint Style */}
        <div>
          <span className="text-xs text-zinc-400 mb-1.5 block">Ink Color Filter:</span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => onUpdateTransform({ colorFilter: 'original' })}
              className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                transform.colorFilter === 'original'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => onUpdateTransform({ colorFilter: 'white' })}
              className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                transform.colorFilter === 'white'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              All-White
            </button>
            <button
              type="button"
              onClick={() => onUpdateTransform({ colorFilter: 'black' })}
              className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                transform.colorFilter === 'black'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              All-Black
            </button>
          </div>
        </div>

        {/* 3D Mug Curvature Warp Toggle */}
        {currentProduct.isCurvedSurface && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
            <div>
              <p className="font-semibold text-zinc-200">Cylindrical Perspective Warp</p>
              <p className="text-[11px] text-zinc-500">Curvature wrap along ceramic mug contour</p>
            </div>
            <input
              type="checkbox"
              checked={transform.cylindricalWarp}
              onChange={(e) => onUpdateTransform({ cylindricalWarp: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
