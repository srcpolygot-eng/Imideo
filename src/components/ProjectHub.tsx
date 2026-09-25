/** Project Hub UI — list / save / load / delete IndexedDB projects (Part 0) */

import React, { useEffect, useState } from 'react';
import {
  FolderOpen, Plus, Trash2, Save, Download, Upload, Clock, X,
} from 'lucide-react';
import type { ImideoProject, ProjectMeta } from '../project/types';
import { createEmptyProject } from '../project/types';
import {
  listProjects, loadProject, saveProject, deleteProject, exportProjectJson, importProjectJson,
} from '../project/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  current: ImideoProject | null;
  onOpenProject: (p: ImideoProject) => void;
  onSaveCurrent: () => Promise<ImideoProject | null>;
  onToast?: (msg: string) => void;
}

export const ProjectHub: React.FC<Props> = ({
  isOpen, onClose, current, onOpenProject, onSaveCurrent, onToast,
}) => {
  const [metas, setMetas] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('Untitled Project');

  const refresh = async () => {
    setLoading(true);
    try { setMetas(await listProjects()); } catch { setMetas([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) refresh(); }, [isOpen]);
  if (!isOpen) return null;

  const handleNew = async () => {
    const p = createEmptyProject(newName.trim() || 'Untitled Project');
    await saveProject(p);
    onOpenProject(p);
    onToast?.(`Created \u201c${p.meta.name}\u201d`);
    onClose();
  };

  const handleOpen = async (id: string) => {
    const p = await loadProject(id);
    if (p) { onOpenProject(p); onToast?.(`Opened \u201c${p.meta.name}\u201d`); onClose(); }
  };

  const handleSave = async () => {
    const p = await onSaveCurrent();
    if (p) { await refresh(); onToast?.(`Saved \u201c${p.meta.name}\u201d`); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project \u201c${name}\u201d?`)) return;
    await deleteProject(id);
    await refresh();
    onToast?.('Project deleted');
  };

  const handleExport = async (id: string) => {
    const json = await exportProjectJson(id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `imideo-project-${id}.json`;
    a.click();
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const p = await importProjectJson(text);
    await refresh();
    onOpenProject(p);
    onToast?.(`Imported \u201c${p.meta.name}\u201d`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FolderOpen className="w-4 h-4 text-amber-400" /> Project Hub
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white" placeholder="New project name" />
            <button type="button" onClick={handleNew} className="px-3 py-2 rounded-xl bg-amber-600 text-xs font-semibold text-white flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> New</button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={!current} className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 disabled:opacity-40 flex items-center justify-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save current</button>
            <label className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import JSON
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
            </label>
          </div>
          {current && <p className="text-[11px] text-zinc-500">Active: <span className="text-zinc-300 font-medium">{current.meta.name}</span></p>}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold">Saved projects {loading ? '\u2026' : `(${metas.length})`}</div>
            {metas.length === 0 && !loading && <p className="text-xs text-zinc-600 py-4 text-center">No projects yet</p>}
            {metas.map((m) => (
              <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600">
                <button type="button" onClick={() => handleOpen(m.id)} className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold text-zinc-100 truncate">{m.name}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.updatedAt).toLocaleString()}</div>
                </button>
                <button type="button" onClick={() => handleExport(m.id)} className="p-1.5 text-zinc-500 hover:text-zinc-200" title="Export JSON"><Download className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => handleDelete(m.id, m.name)} className="p-1.5 text-zinc-500 hover:text-rose-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHub;
