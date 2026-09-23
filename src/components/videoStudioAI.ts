/** CapCut Video Studio — Gemini / Veo AI helpers (current model IDs) */
import {
  canGenerate,
  consumeGeneration,
  GenerationKind,
} from '../utils/generationLimits';
import type { AIModel, AspectRatio } from './videoStudioTypes';

export type AIStatus = 'idle' | 'generating' | 'polling' | 'done' | 'error';

function kindForModel(m: AIModel): GenerationKind {
  if (m === 'veo-3.1-fast' || m === 'veo-3.1' || m === 'veo-3.1-lite') return 'veo';
  return 'omni';
}

function modelId(m: AIModel): string {
  if (m === 'veo-3.1') return 'veo-3.1-generate-preview';
  if (m === 'veo-3.1-lite') return 'veo-3.1-lite-generate-preview';
  if (m === 'omni-flash') return 'gemini-omni-1.1-flash';
  return 'veo-3.1-fast-generate-preview';
}

function headers(apiKey: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['x-gemini-api-key'] = apiKey;
  return h;
}

export async function runVeoGeneration(opts: {
  apiKey: string;
  hasKey: boolean;
  model: AIModel;
  prompt: string;
  image?: string | null;
  aspect: AspectRatio;
  onStatus: (s: AIStatus, message?: string, error?: string) => void;
  onVideo: (videoUrl: string) => void;
  signal?: { cancelled: boolean };
}): Promise<void> {
  const {
    apiKey, hasKey, model, prompt, image, aspect, onStatus, onVideo, signal,
  } = opts;

  const kind = kindForModel(model);
  if (!canGenerate(kind, hasKey)) {
    onStatus(
      'error',
      undefined,
      hasKey
        ? `Daily ${kind.toUpperCase()} limit reached.`
        : 'Free limit reached. Login with a Gemini API key for higher quotas.'
    );
    return;
  }
  if (!prompt.trim() && !image) {
    onStatus('error', undefined, 'Enter a prompt or attach an image.');
    return;
  }

  onStatus('generating', 'Submitting to Veo\u2026');
  try {
    consumeGeneration(kind);
    const body: Record<string, unknown> = {
      prompt: prompt.trim() || 'Cinematic product showcase, smooth camera, studio lighting',
      model: modelId(model),
      aspectRatio: aspect === '1:1' || aspect === '4:5' ? '9:16' : aspect === '21:9' ? '16:9' : aspect,
      resolution: '720p',
    };
    if (apiKey) body.apiKey = apiKey;
    if (image) {
      body.imageBase64 = image;
      body.image = image;
      body.mimeType = 'image/png';
    }

    let res = await fetch('/api/veo/generate-video', {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });
    if (res.status === 404) {
      res = await fetch('/api/veo/generate', {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify(body),
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start generation');

    const opName = data.operationName || data.name;
    if (!opName) throw new Error('No operation name returned');

    onStatus('polling', 'Rendering video\u2026');

    const poll = async (): Promise<void> => {
      if (signal?.cancelled) {
        onStatus('idle');
        return;
      }
      let pollRes = await fetch('/api/veo/poll', {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({ operationName: opName }),
      });
      if (pollRes.status === 404) {
        pollRes = await fetch('/api/veo/video-status', {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify({ operationName: opName }),
        });
      }
      const pollData = await pollRes.json();
      if (!pollRes.ok) throw new Error(pollData.error || 'Poll failed');

      if (pollData.error) throw new Error(pollData.error);

      if (pollData.done && pollData.videoUrl) {
        onVideo(pollData.videoUrl);
        onStatus('done', 'Video ready');
        return;
      }
      if (pollData.done) {
        const dl = await fetch('/api/veo/video-download', {
          method: 'POST',
          headers: headers(apiKey),
          body: JSON.stringify({ operationName: opName }),
        });
        if (dl.ok) {
          const blob = await dl.blob();
          onVideo(URL.createObjectURL(blob));
          onStatus('done', 'Video ready');
          return;
        }
        throw new Error('Video finished but download failed');
      }
      await new Promise((r) => setTimeout(r, 4000));
      return poll();
    };

    await poll();
  } catch (err: any) {
    onStatus('error', undefined, err.message || 'Generation failed');
  }
}

export async function runImageGeneration(opts: {
  apiKey: string;
  prompt: string;
  aspectRatio?: string;
  model?: string;
  imageSize?: string;
}): Promise<{ imageUrl: string }> {
  const { apiKey, prompt, aspectRatio = '1:1', model, imageSize } = opts;
  const res = await fetch('/api/gemini/generate-image', {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      prompt,
      aspectRatio,
      model: model || 'gemini-3-pro-image',
      imageSize,
      apiKey: apiKey || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Image generation failed');
  if (!data.imageUrl) throw new Error('No image returned');
  return { imageUrl: data.imageUrl };
}

export async function runImageEdit(opts: {
  apiKey: string;
  prompt: string;
  imageBase64: string;
}): Promise<{ imageUrl: string }> {
  const { apiKey, prompt, imageBase64 } = opts;
  const res = await fetch('/api/gemini/edit-image', {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      prompt,
      imageBase64,
      apiKey: apiKey || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Image edit failed');
  if (!data.imageUrl) throw new Error('No image returned');
  return { imageUrl: data.imageUrl };
}

export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  const res = await fetch('/api/gemini/validate-key', {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  return !!data.valid;
}
