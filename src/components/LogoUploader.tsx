import React, { useRef, useState } from 'react';
import { SAMPLE_LOGOS } from '../data/sampleLogos';
import { SampleLogo } from '../types';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle, Sparkles } from 'lucide-react';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
  onLogoSelected: (logoDataUrl: string, logoName?: string) => void;
  onClearLogo: () => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogoUrl,
  onLogoSelected,
  onClearLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, SVG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setLogoFileName(file.name);
        onLogoSelected(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleLogo) => {
    setLogoFileName(sample.name);
    onLogoSelected(sample.dataUrl, sample.name);
  };

  return (
    <div id="logo-uploader-card" className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Upload Your Logo</h3>
            <p className="text-xs text-zinc-400">Drag & drop PNG or SVG for clean transparent placement</p>
          </div>
        </div>

        {currentLogoUrl && (
          <button
            type="button"
            onClick={() => {
              setLogoFileName(null);
              onClearLogo();
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        id="drop-zone-area"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 transition-all flex flex-col items-center justify-center text-center ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 scale-[0.99]'
            : currentLogoUrl
            ? 'border-zinc-700/80 bg-zinc-950/60 hover:border-zinc-600'
            : 'border-zinc-700/60 bg-zinc-950/40 hover:border-indigo-500/50 hover:bg-indigo-950/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {currentLogoUrl ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-700 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img
                src={currentLogoUrl}
                alt="Active logo"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {logoFileName || 'Custom Logo Attached'}
                </p>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Click or drag another file to replace</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
              Active
            </span>
          </div>
        ) : (
          <div className="py-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-2 text-zinc-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">
              Drop logo file here, or <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">Supports PNG, SVG, JPG, WebP (up to 20MB)</p>
          </div>
        )}
      </div>

      {/* Quick Test Sample Logos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Test with Ready Sample Logos
          </span>
          <span className="text-[10px] text-zinc-500">1-Click Preview</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SAMPLE_LOGOS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 text-left transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shrink-0 group-hover:border-zinc-600 transition-colors">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">
                  {sample.name}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">{sample.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
