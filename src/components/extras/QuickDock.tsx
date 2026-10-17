/** Floating quick-actions dock (Cmd+K) */

import React from 'react';
import {
  FolderOpen, Library, Rocket, Bot, Camera, ListOrdered, Share2,
  Sparkles, Palette, MessageSquareText, Keyboard, X,
} from 'lucide-react';

export type DockActionId =
  | 'projects' | 'assets' | 'campaign' | 'agent' | 'camera'
  | 'render' | 'share' | 'presets' | 'colors' | 'captions' | 'shortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAction: (id: DockActionId) => void;
}

const ACTIONS: { id: DockActionId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'projects', label: 'Projects', icon: <FolderOpen className="w-4 h-4 text-amber-400" />, hint: 'Save / load' },
  { id: 'assets', label: 'Assets', icon: <Library className="w-4 h-4 text-indigo-400" />, hint: 'Media library' },
  { id: 'presets', label: 'Presets', icon: <Sparkles className="w-4 h-4 text-fuchsia-400" />, hint: 'Style looks' },
  { id: 'colors', label: 'Colors', icon: <Palette className="w-4 h-4 text-teal-400" />, hint: 'From logo' },
  { id: 'captions', label: 'Captions', icon: <MessageSquareText className="w-4 h-4 text-pink-400" />, hint: 'Social copy' },
  { id: 'campaign', label: 'Campaign', icon: <Rocket className="w-4 h-4 text-orange-400" />, hint: 'Full pipeline' },
  { id: 'agent', label: 'Agent', icon: <Bot className="w-4 h-4 text-violet-400" />, hint: 'AI planner' },
  { id: 'camera', label: 'Capture', icon: <Camera className="w-4 h-4 text-cyan-400" />, hint: 'Camera' },
  { id: 'render', label: 'Render', icon: <ListOrdered className="w-4 h-4 text-emerald-400" />, hint: 'Export queue' },
  { id: 'share', label: 'Share', icon: <Share2 className="w-4 h-4 text-sky-400" />, hint: 'Publish' },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard className="w-4 h-4 text-zinc-300" />, hint: '?' },
];

export const QuickDock: React.FC<Props> = ({ isOpen, onClose, onAction }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center pt-[12vh] p-4 bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
          <span className="text-xs font-semibold text-zinc-300">Quick actions</span>
          <button type="button" onClick={onClose} className="p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2 grid grid-cols-2 gap-1 max-h-[60vh] overflow-y-auto">
          {ACTIONS.map((a) => (
            <button key={a.id} type="button" onClick={() => { onAction(a.id); onClose(); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-800 text-left transition-colors">
              {a.icon}
              <div>
                <div className="text-xs font-semibold text-zinc-100">{a.label}</div>
                <div className="text-[10px] text-zinc-500">{a.hint}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">Tip: press Cmd+K anytime</div>
      </div>
    </div>
  );
};

export default QuickDock;
