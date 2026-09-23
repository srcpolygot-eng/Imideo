import React from 'react';
import { X, Download } from 'lucide-react';
import { ProductPreset, LogoTransform } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockupSnapshotUrl: string | null;
  product: ProductPreset;
  selectedColor: string;
  logoUrl: string | null;
  transform: LogoTransform;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  mockupSnapshotUrl,
  product,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!mockupSnapshotUrl) return;
    const a = document.createElement('a');
    a.href = mockupSnapshotUrl;
    a.download = `mockup-${product.id}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            Export Mockup
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        {mockupSnapshotUrl ? (
          <div className="space-y-3">
            <img src={mockupSnapshotUrl} alt="Mockup preview" className="w-full rounded-xl border border-zinc-800" />
            <button
              type="button"
              onClick={handleDownload}
              className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Capture a mockup snapshot on the canvas first, then export.</p>
        )}
      </div>
    </div>
  );
};
