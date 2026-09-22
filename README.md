# Product Mockup Studio

A modern web application for generating high-definition product mockups on mugs, apparel, and merchandise with Google Gemini AI (Flash 3.1 & Pro 4K) and Google Veo 3.1 video generation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fproduct-mockup-studio&env=GEMINI_API_KEY&envDescription=Google+Gemini+API+Key+from+Google+AI+Studio&envLink=https%3A%2F%2Faistudio.google.com%2Fapikey&project-name=product-mockup-studio)

---

## ✨ Features

- **Realistic Product Mockups**: Canvas rendering for ceramic mugs, white t-shirts, black hoodies, and tote bags with perspective warping, lighting blend modes, and drag-and-drop logo placement.
- **AI Image Generation & Editing (Gemini Flash 3.1)**: Instant logo synthesis, background replacement, and style transfer.
- **High-Quality 1K / 2K / 4K Images (Gemini Pro Image Preview)**: High-resolution export with custom aspect ratios.
- **Veo 3.1 Video Studio**: Animate mockups or generate cinematic product promo videos using `veo-3.1-fast-generate-preview`.
- **Flexible API Key Support**: Works out of the box with server-side environment variables or user-provided keys saved in browser storage.
- **Vercel Ready**: Pre-configured with `vercel.json` and `/api/index.ts` serverless API routes.

---

## 🚀 Deploying to Vercel

### Option 1: 1-Click Deploy Button
Click the button above or visit:
```
https://vercel.com/new/clone?repository-url=YOUR_REPO_URL&env=GEMINI_API_KEY
```

### Option 2: Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production with your Gemini API key
vercel --prod -e GEMINI_API_KEY="your-gemini-api-key"
```

### Option 3: Manual Git Import
1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New... > Project** and select your repository.
3. Under **Build and Output Settings**, Vercel will automatically detect the **Vite** framework.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
5. Click **Deploy**.

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key used for image and video synthesis | Yes (or entered via UI) |

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run development server (Express + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 Project Architecture

- **`src/`**: React 19 + Tailwind CSS frontend application.
- **`src/server/app.ts`**: Shared Express application and Gemini API route handlers.
- **`server.ts`**: Local development server and container production entry point.
- **`api/index.ts`**: Vercel Serverless Function entry point for `/api/*` endpoints.
- **`vercel.json`**: Vercel routing configuration for Vite SPA + Serverless functions.
