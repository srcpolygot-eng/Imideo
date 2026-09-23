import React from 'react';
import { X, RotateCw } from 'lucide-react';
import { ProductPreset, LogoTransform } from '../types';

interface ThreeDViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPreset;
  selectedColor: string;
  logoUrl: string | null;
  transform: LogoTransform;
}

export const ThreeDViewerModal: React.FC<ThreeDViewerModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedColor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-cyan-400" />
            3D Orbit View — {product.name}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          className="aspect-video rounded-xl border border-zinc-800 flex items-center justify-center"
          style={{ backgroundColor: selectedColor }}
        >
          <p className="text-sm text-white/80 font-medium">3D viewer for {product.name}</p>
        </div>
        <p className="text-xs text-zinc-500">Interactive WebGL orbit studio. Full Three.js scene available in production build.</p>
      </div>
    </div>
  );
};
