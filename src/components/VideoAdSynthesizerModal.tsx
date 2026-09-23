import React from 'react';
import { X, Film } from 'lucide-react';
import { ProductPreset } from '../types';

interface VideoAdSynthesizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockupSnapshotUrl: string | null;
  product: ProductPreset;
  selectedColor: string;
}

export const VideoAdSynthesizerModal: React.FC<VideoAdSynthesizerModalProps> = ({
  isOpen,
  onClose,
  product,
  mockupSnapshotUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-pink-400" />
            Video Ad Maker — {product.name}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        {mockupSnapshotUrl ? (
          <img src={mockupSnapshotUrl} alt="Ad frame" className="w-full rounded-xl border border-zinc-800" />
        ) : (
          <p className="text-sm text-zinc-400">Capture a mockup snapshot first to build social video ads.</p>
        )}
      </div>
    </div>
  );
};
