/** Campaign pipeline UI (Part 2) */
import React, { useRef, useState } from 'react';
import { Rocket, Loader2, CheckCircle2, AlertCircle, SkipForward, Play } from 'lucide-react';
import type { CampaignBrief, CampaignRun } from '../campaign/types';
import { runCampaign } from '../campaign/runner';

interface Props {
  apiKey: string; hasServerKey: boolean; productName: string; mockupSnapshotUrl: string | null;
  onRequireApiKey: () => void; onToast?: (msg: string) => void;
}

export const CampaignPanel: React.FC<Props> = ({
  apiKey, hasServerKey, productName, mockupSnapshotUrl, onRequireApiKey, onToast,
}) => {
  const hasKey = !!(apiKey || hasServerKey);
  const [brief, setBrief] = useState<CampaignBrief>({
    productName, season: 'Summer', tone: 'bright & optimistic', audience: 'Gen-Z shoppers', extraNotes: '',
  });
  const [run, setRun] = useState<CampaignRun | null>(null);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef({ cancelled: false });

  const start = async () => {
    if (!hasKey) { onRequireApiKey(); return; }
    cancelRef.current.cancelled = false;
    setRunning(true);
    try {
      const result = await runCampaign({
        apiKey, brief: { ...brief, productName: brief.productName || productName },
        mockupSnapshotUrl, onProgress: setRun, signal: cancelRef.current,
      });
      setRun(result);
      onToast?.(result.packNote || 'Campaign finished');
    } finally { setRunning(false); }
  };

  const statusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (s === 'error') return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
    if (s === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />;
    if (s === 'skipped') return <SkipForward className="w-3.5 h-3.5 text-zinc-500" />;
    return <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />;
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 bg-gradient-to-r from-orange-950/40 to-zinc-900">
        <Rocket className="w-5 h-5 text-orange-400" />
        <div><div className="text-sm font-bold text-white">Campaign Pipeline</div><div className="text-[10px] text-zinc-400">Still → Mockup → Veo → Lyria</div></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(['productName','season','tone','audience'] as const).map((k) => (
            <label key={k} className="text-zinc-400">{k === 'productName' ? 'Product' : k[0].toUpperCase()+k.slice(1)}
              <input value={brief[k]} onChange={(e) => setBrief({ ...brief, [k]: e.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white" />
            </label>
          ))}
        </div>
        <button type="button" disabled={running} onClick={start} className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 text-xs font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5">
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? 'Running…' : 'Run campaign'}
        </button>
        {run && run.steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            {statusIcon(s.status)}<span className="font-medium text-zinc-200">{s.label}</span>
            <span className="text-[10px] text-zinc-500 truncate flex-1">{s.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CampaignPanel;
