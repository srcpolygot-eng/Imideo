/** Cross-studio Asset Library panel (Part 1) */
import React, { useEffect, useState } from 'react';
import { Library, Trash2, Upload, Image as ImageIcon, Film, Music, RefreshCw, X } from 'lucide-react';
import type { LibraryAsset, AssetKind } from '../assets/types';
import { listAssets, deleteAsset, addAssetFromDataUrl } from '../assets/library';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPick?: (asset: LibraryAsset) => void;
  onToast?: (msg: string) => void;
  filterKind?: AssetKind;
}

export const AssetLibraryPanel: React.FC<Props> = ({ isOpen, onClose, onPick, onToast, filterKind }) => {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [kind, setKind] = useState<AssetKind | 'all'>(filterKind || 'all');
  const refresh = async () => { const list = await listAssets(kind === 'all' ? undefined : kind); setAssets(list); };
  useEffect(() => { if (isOpen) refresh().catch(() => setAssets([])); }, [isOpen, kind]);
  if (!isOpen) return null;
  const onUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      let assetKind: AssetKind = 'other';
      if (file.type.startsWith('image/')) assetKind = 'image';
      else if (file.type.startsWith('video/')) assetKind = 'video';
      else if (file.type.startsWith('audio/')) assetKind = 'audio';
      await addAssetFromDataUrl({ name: file.name, kind: assetKind, src, mimeType: file.type, source: 'upload' });
      await refresh();
      onToast?.(`Added ${file.name}`);
    };
    reader.readAsDataURL(file);
  };
  const icon = (k: AssetKind) => k === 'video' ? <Film className="w-3.5 h-3.5" /> : k === 'audio' ? <Music className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white"><Library className="w-4 h-4 text-indigo-400" /> Asset Library</div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => refresh()} className="p-1.5 text-zinc-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-zinc-800">
          {(['all', 'image', 'video', 'audio', 'logo', 'mockup'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize ${kind === k ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{k}</button>
          ))}
          <label className="ml-auto px-2.5 py-1 rounded-lg bg-zinc-800 text-[10px] font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer">
            <Upload className="w-3 h-3" /> Upload
            <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          </label>
        </div>
        <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto flex-1">
          {assets.length === 0 && <p className="col-span-full text-center text-xs text-zinc-600 py-8">Library empty</p>}
          {assets.map((a) => (
            <div key={a.id} className="group relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <button type="button" onClick={() => { onPick?.(a); onToast?.(`Selected ${a.name}`); }} className="w-full text-left">
                <div className="aspect-square bg-zinc-900 flex items-center justify-center">
                  {(a.kind === 'image' || a.kind === 'logo' || a.kind === 'mockup') ? <img src={a.src} alt="" className="w-full h-full object-cover" /> : a.kind === 'video' ? <video src={a.src} className="w-full h-full object-cover" muted /> : <div className="text-zinc-500">{icon(a.kind)}</div>}
                </div>
                <div className="p-1.5"><div className="text-[10px] font-medium text-zinc-300 truncate">{a.name}</div><div className="text-[9px] text-zinc-600 flex items-center gap-1">{icon(a.kind)} {a.kind}</div></div>
              </button>
              <button type="button" onClick={async () => { await deleteAsset(a.id); await refresh(); }} className="absolute top-1 right-1 p-1 rounded bg-black/60 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AssetLibraryPanel;
