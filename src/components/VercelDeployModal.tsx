import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  FileCode,
  ShieldCheck,
  Sparkles,
  Server,
  Zap,
  Globe,
  ArrowRight,
  Key,
  CheckCircle2,
  RefreshCw,
  GitBranch,
} from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  hasServerKey: boolean;
  onOpenApiKeyModal: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  hasServerKey,
  onOpenApiKeyModal,
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/username/product-mockup-studio');
  const [activeTab, setActiveTab] = useState<'one-click' | 'cli' | 'config' | 'test'>('one-click');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Health test state
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  if (!isOpen) return null;

  // Build the official Vercel Clone / Deploy URL
  const cleanRepoUrl = repoUrl.trim() || 'https://github.com/username/product-mockup-studio';
  const vercelDeployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(
    cleanRepoUrl
  )}&env=GEMINI_API_KEY&envDescription=Google+Gemini+API+Key+from+Google+AI+Studio&envLink=https%3A%2F%2Faistudio.google.com%2Fapikey&project-name=product-mockup-studio`;

  const markdownBadge = `[![Deploy with Vercel](https://vercel.com/button)](${vercelDeployUrl})`;

  const vercelJsonSnippet = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ]
}`;

  const cliSnippet = `# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy directly with environment variables
vercel --prod -e GEMINI_API_KEY="${apiKey || 'your_gemini_api_key'}"`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setTestResult({
        ok: res.ok,
        status: res.status,
        data,
        latencyMs: elapsed,
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        status: 500,
        error: err.message,
      });
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="vercel-deploy-modal"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {/* Vercel Triangular Logo Badge */}
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 shrink-0">
              <svg
                viewBox="0 0 76 65"
                fill="currentColor"
                className="w-5 h-5 translate-y-[1px]"
              >
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">Deploy to Vercel</h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                1-Click deployment support for Vite frontend and Vercel Serverless API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Architecture Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 font-medium">Framework</p>
              <p className="font-semibold text-zinc-200 text-xs">Vite SPA</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 font-medium">API Runtime</p>
              <p className="font-semibold text-zinc-200 text-xs">Serverless /api</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 font-medium">AI Models</p>
              <p className="font-semibold text-zinc-200 text-xs">Gemini & Veo</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 font-medium">Config</p>
              <p className="font-semibold text-zinc-200 text-xs">vercel.json</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('one-click')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'one-click'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click Deploy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'cli'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Vercel CLI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'config'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>vercel.json</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'test'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test API</span>
          </button>
        </div>

        {/* Tab 1: 1-Click Deploy */}
        {activeTab === 'one-click' && (
          <div className="space-y-4">
            {/* Deploy with Vercel Button Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  Launch on Vercel
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm">
                  Click the official Vercel button to create a new project with pre-wired repository and environment variables.
                </p>
              </div>

              {/* Official Vercel Button */}
              <a
                href={vercelDeployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-white/10 shrink-0 transition-transform active:scale-95"
              >
                <svg viewBox="0 0 76 65" fill="currentColor" className="w-4 h-4">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                <span>Deploy with Vercel</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
              </a>
            </div>

            {/* Custom Repository URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                GitHub Repository URL
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-2.5 text-zinc-500">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/your-username/product-mockup-studio"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vercelDeployUrl, 'deploy-url')}
                  className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
                  title="Copy 1-Click Deploy URL"
                >
                  {copiedType === 'deploy-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                If you exported your project to GitHub (AI Studio top-right &gt; Export to GitHub), paste your repo link above.
              </p>
            </div>

            {/* README Markdown Badge Copy */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Markdown Badge for README.md</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(markdownBadge, 'markdown-badge')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  {copiedType === 'markdown-badge' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied to clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black text-[11px] font-mono text-zinc-400 overflow-x-auto select-all">
                {markdownBadge}
              </pre>
            </div>

            {/* Step-by-step instructions */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs">
              <p className="font-bold text-zinc-300">Step-by-Step Deployment:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 text-[11px]">
                <li>Export this project to GitHub (AI Studio menu &gt; Export to GitHub) or download as ZIP.</li>
                <li>Import the repository into Vercel or click the <strong className="text-zinc-200">Deploy with Vercel</strong> button above.</li>
                <li>In Vercel Project Settings, add the environment variable <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code>.</li>
                <li>Deploy! Vercel handles the Vite build and serves the serverless API automatically.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Vercel CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Terminal Commands</span>
              <button
                type="button"
                onClick={() => copyToClipboard(cliSnippet, 'cli-snippet')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
              >
                {copiedType === 'cli-snippet' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied commands</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              {cliSnippet}
            </pre>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-200">Notes for CLI deployment:</p>
              <p>• The <code className="text-zinc-300 font-mono">-e GEMINI_API_KEY</code> flag injects your secret directly to production.</p>
              <p>• Vercel CLI automatically recognizes the root <code className="text-zinc-300 font-mono">vercel.json</code> file.</p>
            </div>
          </div>
        )}

        {/* Tab 3: Config Inspector */}
        {activeTab === 'config' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Root configuration: vercel.json</span>
              <button
                type="button"
                onClick={() => copyToClipboard(vercelJsonSnippet, 'vercel-json')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
              >
                {copiedType === 'vercel-json' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied vercel.json</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy vercel.json</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
              {vercelJsonSnippet}
            </pre>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-200">How it works on Vercel:</p>
              <p>• <strong className="text-zinc-300">Frontend:</strong> Built via <code className="font-mono text-zinc-300">vite build</code> and served from <code className="font-mono text-zinc-300">dist/</code> via Vercel Edge CDN.</p>
              <p>• <strong className="text-zinc-300">Serverless API:</strong> Requests to <code className="font-mono text-zinc-300">/api/*</code> route to <code className="font-mono text-zinc-300">/api/index.ts</code>, invoking the Express handler with full Gemini 3.1 & Veo 3.1 support.</p>
            </div>
          </div>
        )}

        {/* Tab 4: Test API */}
        {activeTab === 'test' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-200">Test Serverless API Health</p>
                <p className="text-[11px] text-zinc-400">
                  Verify the /api/health endpoint returns an OK status and checks server-side API keys.
                </p>
              </div>
              <button
                type="button"
                disabled={testingApi}
                onClick={handleTestApi}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
              >
                {testingApi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Health Check</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                  testResult.ok
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-rose-400" />
                    )}
                    <span>HTTP {testResult.status} OK</span>
                  </span>
                  {testResult.latencyMs && (
                    <span className="text-[10px] text-zinc-400">{testResult.latencyMs}ms response</span>
                  )}
                </div>
                <pre className="text-[11px] bg-black/60 p-2.5 rounded-lg overflow-x-auto text-zinc-300">
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Environment Variable Section */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">Required Vercel Environment Variable</span>
            </div>
            {apiKey && (
              <button
                type="button"
                onClick={() => copyToClipboard(apiKey, 'active-api-key')}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
                title="Copy the API key you entered in the app to clipboard"
              >
                {copiedType === 'active-api-key' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied API Key!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy My Gemini Key</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black border border-zinc-800/80 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-indigo-400 font-bold">GEMINI_API_KEY</span>
              <span className="text-zinc-500">=</span>
              <span className="text-zinc-400">
                {apiKey ? `${apiKey.substring(0, 8)}...` : hasServerKey ? '(Host Server Key Active)' : '(Required)'}
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                apiKey || hasServerKey
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {apiKey ? 'Saved in App' : hasServerKey ? 'Host Active' : 'Not Set'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            In your Vercel Project Dashboard under <strong>Settings &gt; Environment Variables</strong>, set{' '}
            <code className="text-zinc-300 font-mono">GEMINI_API_KEY</code> to enable AI features for all users on your custom domain.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>

          <a
            href={vercelDeployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-black flex items-center gap-2 shadow-lg shadow-white/10 transition-transform active:scale-95"
          >
            <svg viewBox="0 0 76 65" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <span>Deploy to Vercel</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
          </a>
        </div>
      </div>
    </div>
  );
};
