import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

export function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is required. Please configure your API key in the app to continue.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function getApiKeyFromReq(req: express.Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'] as string;
  if (headerKey && headerKey.trim()) {
    return headerKey.trim();
  }
  const authHeader = req.headers['authorization'] as string;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const bodyKey = req.body?.apiKey as string;
  if (bodyKey && bodyKey.trim()) {
    return bodyKey.trim();
  }
  return undefined;
}

export function createApiApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Create API router
  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      hasServerApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
      platform: process.env.VERCEL ? 'vercel' : 'node',
    });
  });

  // Validate API key — must succeed against a real Gemini model via @google/genai
  apiRouter.post('/gemini/validate-key', async (req, res) => {
    try {
      const apiKey = getApiKeyFromReq(req);
      if (!apiKey) {
        return res.status(400).json({ valid: false, error: 'No API key provided.' });
      }
      // Basic shape check so "h" / random strings never pass
      if (apiKey.length < 20 || !/^AIza[0-9A-Za-z_\-]{20,}$/.test(apiKey)) {
        return res.status(400).json({
          valid: false,
          error:
            'Invalid key format. Gemini API keys from Google AI Studio start with "AIza" and are longer.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      // Try current flash models in order until one accepts the key
      const candidates = [
        'gemini-3.5-flash',
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite',
      ];
      let lastError: string | undefined;
      for (const model of candidates) {
        try {
          await ai.models.generateContent({
            model,
            contents: 'ping',
            config: { maxOutputTokens: 1 },
          });
          return res.json({ valid: true, model });
        } catch (modelErr: any) {
          lastError = modelErr?.message || String(modelErr);
          const msg = (lastError || '').toLowerCase();
          if (
            msg.includes('api key') ||
            msg.includes('permission') ||
            msg.includes('401') ||
            msg.includes('403') ||
            msg.includes('invalid') ||
            msg.includes('unauthenticated')
          ) {
            return res.status(400).json({
              valid: false,
              error: lastError || 'Invalid API key.',
            });
          }
        }
      }
      return res.status(400).json({
        valid: false,
        error: lastError || 'Could not validate API key against any Gemini model.',
      });
    } catch (err: any) {
      console.warn('API key validation error:', err.message);
      return res.status(400).json({ valid: false, error: err.message || 'Invalid API Key' });
    }
  });

  // Feature: High-Quality Image Generation (gemini-3-pro-image-preview with 1K, 2K, 4K)
  // or Create Images (gemini-3.1-flash-image-preview)
  apiRouter.post('/gemini/generate-image', async (req, res) => {
    try {
      const {
        prompt,
        model = 'gemini-3-pro-image-preview',
        aspectRatio = '1:1',
        imageSize = '1K',
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const clientKey = getApiKeyFromReq(req);
      const ai = getGeminiClient(clientKey);

      const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
        },
      };

      // Add imageSize for models that support it
      if (imageSize && (model === 'gemini-3-pro-image-preview' || model === 'gemini-3.1-flash-image')) {
        config.imageConfig.imageSize = imageSize;
      }

      const response = await ai.models.generateContent({
        model: model || 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config,
      });

      let imageBase64: string | null = null;
      let mimeType = 'image/png';
      let textOutput = '';

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        } else if (part.text) {
          textOutput += part.text;
        }
      }

      if (!imageBase64) {
        return res.status(400).json({
          error: textOutput || 'No image part was returned by the model.',
        });
      }

      return res.json({
        imageUrl: `data:${mimeType};base64,${imageBase64}`,
        imageBase64,
        mimeType,
        aspectRatio,
        imageSize,
        textOutput,
      });
    } catch (err: any) {
      console.error('Error generating image:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate image.',
      });
    }
  });

  // Feature: Create & Edit Images using gemini-3.1-flash-image-preview
  apiRouter.post('/gemini/edit-image', async (req, res) => {
    try {
      const { prompt, imageBase64, mimeType = 'image/png' } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
      }
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'Image base64 data is required for image editing.' });
      }

      const clientKey = getApiKeyFromReq(req);
      const ai = getGeminiClient(clientKey);
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/png',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let resultBase64: string | null = null;
      let resultMime = 'image/png';
      let textOutput = '';

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          resultBase64 = part.inlineData.data;
          resultMime = part.inlineData.mimeType || 'image/png';
          break;
        } else if (part.text) {
          textOutput += part.text;
        }
      }

      if (!resultBase64) {
        return res.status(400).json({
          error: textOutput || 'The model did not return an edited image.',
        });
      }

      return res.json({
        imageUrl: `data:${resultMime};base64,${resultBase64}`,
        imageBase64: resultBase64,
        mimeType: resultMime,
        textOutput,
      });
    } catch (err: any) {
      console.error('Error editing image:', err);
      return res.status(500).json({
        error: err.message || 'Failed to edit image.',
      });
    }
  });

  // Feature: Veo Video Generation (Text to Video or Photo to Video) using veo-3.1-fast-generate-preview
  apiRouter.post('/veo/generate-video', async (req, res) => {
    try {
      const {
        prompt,
        imageBase64,
        mimeType = 'image/png',
        aspectRatio = '16:9',
        resolution = '720p',
      } = req.body;

      const clientKey = getApiKeyFromReq(req);
      const ai = getGeminiClient(clientKey);

      const validAspectRatios = ['16:9', '9:16'];
      const finalAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const config: any = {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: finalAspectRatio,
      };

      const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        config,
      };

      if (prompt && typeof prompt === 'string') {
        payload.prompt = prompt;
      } else if (!imageBase64) {
        return res.status(400).json({ error: 'Either a text prompt or an image must be provided.' });
      }

      if (imageBase64 && typeof imageBase64 === 'string') {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        payload.image = {
          imageBytes: cleanBase64,
          mimeType: mimeType || 'image/png',
        };
      }

      const operation = await ai.models.generateVideos(payload);
      return res.json({
        operationName: operation.name,
      });
    } catch (err: any) {
      console.error('Error starting video generation:', err);
      return res.status(500).json({
        error: err.message || 'Failed to initiate video generation.',
      });
    }
  });

  // Veo Video Polling Status
  apiRouter.post('/veo/video-status', async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: 'operationName is required.' });
      }

      const clientKey = getApiKeyFromReq(req);
      const ai = getGeminiClient(clientKey);
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });
      return res.json({
        done: !!updated.done,
        error: updated.error || null,
      });
    } catch (err: any) {
      console.error('Error polling video operation:', err);
      return res.status(500).json({
        error: err.message || 'Failed to check video status.',
      });
    }
  });

  // Download Video proxy
  apiRouter.post('/veo/video-download', async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: 'operationName is required.' });
      }

      const clientKey = getApiKeyFromReq(req);
      const apiKey = clientKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: 'Gemini API key is required. Please set your key in the app.' });
      }

      const ai = getGeminiClient(clientKey);
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });
      if (!updated.done) {
        return res.status(400).json({ error: 'Video generation is still in progress.' });
      }

      const downloadUri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadUri) {
        return res.status(404).json({ error: 'Video URI not found in operation result.' });
      }

      // Fetch video stream securely with API key
      const videoRes = await fetch(downloadUri, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!videoRes.ok) {
        return res.status(videoRes.status).json({ error: 'Failed to retrieve video stream.' });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline; filename="veo-generation.mp4"');

      const arrayBuffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('Error downloading video:', err);
      return res.status(500).json({
        error: err.message || 'Failed to download video.',
      });
    }
  });

  // Feature: Generate Music using Lyria 3 (lyria-3-clip-preview or lyria-3-pro-preview)
  apiRouter.post('/gemini/generate-music', async (req, res) => {
    try {
      const {
        prompt,
        model = 'lyria-3-clip-preview',
        durationSeconds = 15,
        genre,
        mood,
        tempo,
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Music prompt is required.' });
      }

      const clientKey = getApiKeyFromReq(req);
      const ai = getGeminiClient(clientKey);

      // Validate model choice
      const validModel =
        model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      // Build structured prompt for Lyria
      const tags: string[] = [];
      if (genre) tags.push(`Genre: ${genre}`);
      if (mood) tags.push(`Mood: ${mood}`);
      if (tempo) tags.push(`Tempo: ${tempo}`);
      if (durationSeconds) tags.push(`Duration: ${durationSeconds} seconds`);

      const fullPrompt = tags.length > 0 ? `${prompt.trim()} (${tags.join(', ')})` : prompt.trim();

      let audioData: string | undefined;
      let mimeType: string = 'audio/mp3';
      let audioUri: string | undefined;

      // Primary strategy: Call interactions.create
      try {
        const interaction = await (ai as any).interactions.create({
          model: validModel,
          input: fullPrompt,
        });

        if (interaction.output_audio) {
          audioData = interaction.output_audio.data;
          mimeType = interaction.output_audio.mime_type || 'audio/mp3';
          audioUri = interaction.output_audio.uri;
        } else if (interaction.steps && Array.isArray(interaction.steps)) {
          for (const step of interaction.steps) {
            if (step.type === 'model_output' && Array.isArray(step.content)) {
              for (const item of step.content) {
                if (item.type === 'audio') {
                  audioData = item.data;
                  mimeType = item.mime_type || 'audio/mp3';
                  audioUri = item.uri;
                  break;
                }
              }
            }
          }
        }
      } catch (interactionsErr: any) {
        console.warn(
          'Lyria interactions.create failed, attempting generateContent fallback:',
          interactionsErr.message
        );

        // Fallback strategy: Call models.generateContent
        try {
          const genRes = await ai.models.generateContent({
            model: validModel,
            contents: fullPrompt,
          });

          const candidate = genRes.candidates?.[0];
          const parts = candidate?.content?.parts || [];
          for (const part of parts) {
            if ((part as any).inlineData && (part as any).inlineData.data) {
              audioData = (part as any).inlineData.data;
              mimeType = (part as any).inlineData.mimeType || 'audio/mp3';
              break;
            }
          }
        } catch (genErr: any) {
          // If both failed, propagate the original error
          throw interactionsErr || genErr;
        }
      }

      // If audioUri is present but no base64, fetch audio
      if (!audioData && audioUri) {
        try {
          const rawKey = clientKey || process.env.GEMINI_API_KEY;
          const fetchRes = await fetch(audioUri, {
            headers: rawKey ? { 'x-goog-api-key': rawKey } : {},
          });
          if (fetchRes.ok) {
            const buf = await fetchRes.arrayBuffer();
            audioData = Buffer.from(buf).toString('base64');
            const fetchedMime = fetchRes.headers.get('content-type');
            if (fetchedMime) mimeType = fetchedMime;
          }
        } catch (fetchErr: any) {
          console.warn('Failed to fetch audio from URI:', fetchErr.message);
        }
      }

      if (!audioData && !audioUri) {
        return res.status(502).json({
          error:
            'Lyria music generation model did not return playable audio. Please try modifying your prompt or selecting a different duration.',
        });
      }

      const audioUrl = audioData ? `data:${mimeType};base64,${audioData}` : audioUri;

      return res.json({
        success: true,
        audioUrl,
        mimeType,
        model: validModel,
        durationSeconds: validModel === 'lyria-3-clip-preview' ? Math.min(durationSeconds, 30) : durationSeconds,
        prompt: fullPrompt,
        title: prompt.slice(0, 40),
      });
    } catch (err: any) {
      console.error('Lyria music generation error:', err);
      const status = err.status || (err.message?.includes('400') ? 400 : 500);
      return res.status(status).json({
        error:
          err.message ||
          'Failed to generate music with Lyria. Make sure your Gemini API Key has access to the Lyria paid model tier.',
        status,
      });
    }
  });

  // Mount API router on both /api (standard) and root / (in case Vercel rewrites strip /api prefix)
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}
