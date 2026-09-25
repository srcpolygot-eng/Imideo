/** Agent mode UI */
import React, { useState } from 'react';
import { Bot, Sparkles, Play, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, Film, Music } from 'lucide-react';
import { planFromGoal, executeAgentPlan, type AgentPlan } from './agentRunner';

interface Props {
  apiKey: string; hasServerKey: boolean; productName?: string;
  onRequireApiKey: () => void; onToast?: (msg: string) => void;
}

export const AgentPanel: React.FC<Props> = ({ apiKey, hasServerKey, productName = 'Ceramic Mug', onRequireApiKey, onToast }) => {
  const hasKey = !!(apiKey || hasServerKey);
  const [goal, setGoal] = useState(`Summer lifestyle campaign for ${productName}`);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [running, setRunning] = useState(false);
  const handlePlan = () => { setPlan(planFromGoal(goal, productName)); onToast?.('Agent plan ready'); };
  const handleRun = async () => {
    if (!hasKey) { onRequireApiKey(); return; }
    if (!plan) { handlePlan(); return; }
    setRunning(true);
    try { await executeAgentPlan({ apiKey, plan, onUpdate: setPlan }); onToast?.('Agent run finished'); }
    finally { setRunning(false); }
  };
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 bg-gradient-to-r from-violet-950/40 to-zinc-900">
        <Bot className="w-5 h-5 text-violet-400" />
        <div><div className="text-sm font-bold text-white">Agent Mode</div><div className="text-[10px] text-zinc-400">Gemini tools · real API only</div></div>
      </div>
      <div className="p-4 space-y-3">
        {!hasKey && <button type="button" onClick={onRequireApiKey} className="w-full text-left p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">Login with Gemini API key</button>}
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white" />
        <div className="flex gap-2">
          <button type="button" onClick={handlePlan} className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Plan</button>
          <button type="button" disabled={running} onClick={handleRun} className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run
          </button>
        </div>
        {plan?.steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            <div className="mt-0.5 text-violet-400">{s.tool === 'generate_video' ? <Film className="w-3.5 h-3.5" /> : s.tool === 'generate_music' ? <Music className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">{s.title}
                {s.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {s.status === 'error' && <AlertCircle className="w-3 h-3 text-rose-400" />}
                {s.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
              </div>
              {s.error && <p className="text-[10px] text-rose-400">{s.error}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AgentPanel;
