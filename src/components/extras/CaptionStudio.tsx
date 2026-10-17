/** Social caption generator */
import React, { useState } from 'react';
import { X, MessageSquareText, Loader2, Copy, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  productName: string;
  onRequireApiKey: () => void;
  onToast?: (msg: string) => void;
}

const TONES = ['Playful', 'Luxury', 'Gen-Z', 'Professional', 'Eco'] as const;

export const CaptionStudio: React.FC<Props> = ({
  isOpen, onClose, apiKey, hasServerKey, productName, onRequireApiKey, onToast,
}) => {
  const hasKey = !!(apiKey || hasServerKey);
  const [tone, setTone] = useState<(typeof TONES)[number]>('Playful');
  const [platform, setPlatform] = useState('Instagram');
  const [extra, setExtra] = useState('');
  const [captions, setCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const generate = async () => {
    if (!hasKey) { onRequireApiKey(); return; }
    setLoading(true); setCaptions([]);
    try {
      const prompt = `Write 4 short ${platform} product captions for "${productName}". Tone: ${tone}. ${extra}. Return only the captions, one per line, no numbering.`;
      const res = await fetch('/api/gemini/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}) },
        body: JSON.stringify({ prompt, model: 'gemini-2.0-flash' }),
      });
      let text = '';
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        text = data.text || data.content || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (!text) {
        text = [
          `${productName} just dropped. ${tone === 'Luxury' ? 'Crafted for those who notice.' : 'Your new everyday essential.'}`,
          `Meet ${productName} \u2014 designed for real life.`,
          `POV: you found ${productName} and never looked back.`,
          `Soft launch energy. ${productName} is live.`,
        ].join('\n');
        onToast?.('Using local caption templates (text route unavailable)');
      }
      const lines = text.split('\n').map((l) => l.replace(/^\d+[).\s]+/, '').trim()).filter(Boolean).slice(0, 6);
      setCaptions(lines);
    } catch (e: any) {
      onToast?.(e?.message || 'Caption generation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-pink-950/40 to-zinc-900">
          <div className="flex items-center gap-2 text-sm font-bold text-white"><MessageSquareText className="w-4 h-4 text-pink-400" /> Caption Studio</div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button key={t} type="button" onClick={() => setTone(t)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${tone === t ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{t}</button>
            ))}
          </div>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white">
            {['Instagram', 'TikTok', 'Twitter/X', 'LinkedIn', 'Pinterest'].map((p) => <option key={p}>{p}</option>)}
          </select>
          <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Extra brief (optional)" className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white" />
          <button type="button" disabled={loading} onClick={generate} className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 text-xs font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate captions
          </button>
          {captions.map((c, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200">
              <p className="flex-1 leading-relaxed">{c}</p>
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(c); onToast?.('Caption copied'); } catch { /* */ } }} className="p-1 text-zinc-500 hover:text-white shrink-0"><Copy className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaptionStudio;
