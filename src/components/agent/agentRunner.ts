/** Agent mode — Gemini-powered campaign planner (real API tools only). */
export type AgentToolName = 'generate_image' | 'generate_video' | 'generate_music' | 'plan_only';
export interface AgentPlanStep {
  tool: AgentToolName;
  title: string;
  prompt: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  resultUrl?: string;
  error?: string;
}
export interface AgentPlan { goal: string; steps: AgentPlanStep[]; summary?: string; }
function headers(apiKey: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['x-gemini-api-key'] = apiKey;
  return h;
}
export function planFromGoal(goal: string, productName = 'product'): AgentPlan {
  const g = goal.trim() || `Summer campaign for ${productName}`;
  return {
    goal: g,
    steps: [
      { tool: 'generate_image', title: 'Hero still', prompt: `Marketing product photo: ${g}. Clean studio, high detail.`, status: 'pending' },
      { tool: 'generate_image', title: 'Lifestyle still', prompt: `Lifestyle scene for: ${g}. Natural light, aspirational.`, status: 'pending' },
      { tool: 'generate_video', title: '15s Veo ad', prompt: `Vertical cinematic product ad, 15 seconds: ${g}.`, status: 'pending' },
      { tool: 'generate_music', title: 'Lyria bed', prompt: `Upbeat commercial soundtrack for: ${g}. No vocals, 15 seconds.`, status: 'pending' },
    ],
    summary: `Plan for \u201c${g}\u201d: 2 stills \u2192 Veo ad \u2192 Lyria bed.`,
  };
}
export async function executeAgentPlan(opts: {
  apiKey: string; plan: AgentPlan; onUpdate: (plan: AgentPlan) => void; signal?: { cancelled: boolean };
}): Promise<AgentPlan> {
  const { apiKey, signal } = opts;
  let plan = { ...opts.plan, steps: opts.plan.steps.map((s) => ({ ...s })) };
  if (!apiKey) {
    plan.steps = plan.steps.map((s) => ({ ...s, status: 'skipped' as const, error: 'Valid Gemini API key required' }));
    opts.onUpdate(plan);
    return plan;
  }
  for (let i = 0; i < plan.steps.length; i++) {
    if (signal?.cancelled) break;
    const step = plan.steps[i];
    plan.steps[i] = { ...step, status: 'running' };
    opts.onUpdate({ ...plan, steps: [...plan.steps] });
    try {
      if (step.tool === 'generate_image') {
        const res = await fetch('/api/gemini/generate-image', { method: 'POST', headers: headers(apiKey), body: JSON.stringify({ prompt: step.prompt, model: 'gemini-3-pro-image', aspectRatio: '1:1' }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Image failed');
        plan.steps[i] = { ...plan.steps[i], status: 'done', resultUrl: data.imageUrl };
      } else if (step.tool === 'generate_music') {
        const res = await fetch('/api/gemini/generate-music', { method: 'POST', headers: headers(apiKey), body: JSON.stringify({ prompt: step.prompt, model: 'lyria-3-clip-preview', durationSeconds: 15 }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.audioUrl) throw new Error(data.error || 'Music failed');
        plan.steps[i] = { ...plan.steps[i], status: 'done', resultUrl: data.audioUrl };
      } else if (step.tool === 'generate_video') {
        const res = await fetch('/api/veo/generate-video', { method: 'POST', headers: headers(apiKey), body: JSON.stringify({ prompt: step.prompt, model: 'veo-3.1-fast-generate-preview', aspectRatio: '9:16', resolution: '720p' }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Veo start failed');
        const op = data.operationName || data.name;
        if (!op) throw new Error('No operation name');
        let videoUrl: string | undefined;
        for (let t = 0; t < 40; t++) {
          if (signal?.cancelled) break;
          await new Promise((r) => setTimeout(r, 4000));
          const poll = await fetch('/api/veo/poll', { method: 'POST', headers: headers(apiKey), body: JSON.stringify({ operationName: op }) });
          const pd = await poll.json().catch(() => ({}));
          if (pd.videoUrl) { videoUrl = pd.videoUrl; break; }
          if (pd.done && !pd.videoUrl) break;
          if (pd.error) throw new Error(pd.error);
        }
        if (!videoUrl) throw new Error('Veo timed out');
        plan.steps[i] = { ...plan.steps[i], status: 'done', resultUrl: videoUrl };
      } else {
        plan.steps[i] = { ...plan.steps[i], status: 'done' };
      }
    } catch (e: any) {
      plan.steps[i] = { ...plan.steps[i], status: 'error', error: e?.message || 'Step failed' };
    }
    opts.onUpdate({ ...plan, steps: [...plan.steps] });
  }
  return plan;
}
