import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

function getGeminiClient(customApiKey?: string): GoogleGenAI {
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

function getApiKeyFromReq(req: express.Request): string | undefined {
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasServerApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Validate API key
  app.post('/api/gemini/validate-key', async (req, res) => {
    try {
      const apiKey = getApiKeyFromReq(req);
      if (!apiKey) {
        return res.status(400).json({ valid: false, error: 'No API key provided.' });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });
      // Quick lightweight check
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'ping',
        config: {
          maxOutputTokens: 1,
        },
      });
      return res.json({ valid: true });
    } catch (err: any) {
      console.warn('API key validation error:', err.message);
      return res.status(400).json({ valid: false, error: err.message || 'Invalid API Key' });
    }
  });

  // Feature: High-Quality Image Generation (gemini-3-pro-image-preview with 1K, 2K, 4K)
  // or Create Images (gemini-3.1-flash-image-preview)
  app.post('/api/gemini/generate-image', async (req, res) => {
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
  app.post('/api/gemini/edit-image', async (req, res) => {
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
  app.post('/api/veo/generate-video', async (req, res) => {
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
  app.post('/api/veo/video-status', async (req, res) => {
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

  // Veo Video Download Stream
  app.post('/api/veo/video-download', async (req, res) => {
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
        return res.status(400).json({ error: 'Video generation is not complete yet.' });
      }

      if (updated.error) {
        return res.status(500).json({ error: updated.error.message || 'Video generation failed.' });
      }

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: 'Video URI was not found in response.' });
      }

      const videoRes = await fetch(uri, {
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

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Product Mockup Studio server running on port ${PORT}`);
  });
}

startServer();
