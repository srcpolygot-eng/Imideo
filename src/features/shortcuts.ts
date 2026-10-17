/** Global keyboard shortcut definitions for Imideo */

export interface ShortcutDef {
  keys: string;
  action: string;
  scope: 'global' | 'products' | 'image' | 'video';
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: '\u2318 / Ctrl + S', action: 'Save current project', scope: 'global' },
  { keys: '\u2318 / Ctrl + K', action: 'Open command / quick dock', scope: 'global' },
  { keys: '1', action: 'Products workspace', scope: 'global' },
  { keys: '2', action: 'Image Studio', scope: 'global' },
  { keys: '3', action: 'Video Studio', scope: 'global' },
  { keys: 'E', action: 'Export modal', scope: 'products' },
  { keys: 'R', action: 'Reset logo placement', scope: 'products' },
  { keys: 'Shift + R', action: 'Shuffle product + logo', scope: 'products' },
  { keys: 'P', action: 'Open style presets', scope: 'products' },
  { keys: 'C', action: 'Color palette from logo', scope: 'products' },
  { keys: 'Space', action: 'Play / pause timeline', scope: 'video' },
  { keys: 'S', action: 'Split clip at playhead', scope: 'video' },
  { keys: '[ / ]', action: 'Nudge playhead', scope: 'video' },
  { keys: 'B', action: 'Brush tool', scope: 'image' },
  { keys: 'V', action: 'Move / select tool', scope: 'image' },
  { keys: '\u2318 / Ctrl + Z', action: 'Undo', scope: 'global' },
  { keys: '\u2318 / Ctrl + Shift + Z', action: 'Redo', scope: 'global' },
  { keys: '?', action: 'Show shortcuts', scope: 'global' },
];

export type ShortcutHandlers = {
  saveProject?: () => void;
  openDock?: () => void;
  setWorkspace?: (mode: 'products' | 'image-studio' | 'video-studio') => void;
  openExport?: () => void;
  resetTransform?: () => void;
  shuffle?: () => void;
  openPresets?: () => void;
  openColors?: () => void;
  openShortcuts?: () => void;
};

export function bindGlobalShortcuts(handlers: ShortcutHandlers): () => void {
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 's') { e.preventDefault(); handlers.saveProject?.(); return; }
    if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); handlers.openDock?.(); return; }
    if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); handlers.openShortcuts?.(); return; }
    if (!meta && !e.altKey) {
      if (e.key === '1') handlers.setWorkspace?.('products');
      if (e.key === '2') handlers.setWorkspace?.('image-studio');
      if (e.key === '3') handlers.setWorkspace?.('video-studio');
      if (e.key.toLowerCase() === 'e') handlers.openExport?.();
      if (e.key.toLowerCase() === 'r' && e.shiftKey) handlers.shuffle?.();
      else if (e.key.toLowerCase() === 'r') handlers.resetTransform?.();
      if (e.key.toLowerCase() === 'p') handlers.openPresets?.();
      if (e.key.toLowerCase() === 'c') handlers.openColors?.();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
