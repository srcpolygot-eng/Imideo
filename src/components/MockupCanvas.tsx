import React, { useRef, useState, useEffect } from 'react';
import { ProductPreset, LogoTransform } from '../types';
import { Download, Copy, Check, Eye, EyeOff, RotateCw, ZoomIn, Move } from 'lucide-react';

interface MockupCanvasProps {
  product: ProductPreset;
  selectedColor: string;
  logoUrl: string | null;
  transform: LogoTransform;
  onUpdateTransform: (newTransform: Partial<LogoTransform>) => void;
  onResetTransform: () => void;
  onSnapshot?: (dataUrl: string) => void;
}

export const MockupCanvas: React.FC<MockupCanvasProps> = ({
  product,
  selectedColor,
  logoUrl,
  transform,
  onUpdateTransform,
  onResetTransform,
  onSnapshot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; initialX: number; initialY: number }>({
    x: 0,
    y: 0,
    initialX: 0,
    initialY: 0,
  });
  const [showGuides, setShowGuides] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!logoUrl) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialX: transform.x,
      initialY: transform.y,
    });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !printAreaRef.current) return;
      const rect = printAreaRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

      const newX = Math.max(-60, Math.min(60, dragStart.initialX + deltaXPercent));
      const newY = Math.max(-60, Math.min(60, dragStart.initialY + deltaYPercent));

      onUpdateTransform({
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      });
    };

    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragStart, onUpdateTransform]);

  // Compute CSS filter for logo color mode
  const getLogoFilter = () => {
    if (transform.colorFilter === 'white') {
      return 'brightness(0) invert(1) contrast(150%)';
    }
    if (transform.colorFilter === 'black') {
      return 'brightness(0) contrast(150%)';
    }
    if (transform.colorFilter === 'custom') {
      return 'drop-shadow(0 0 1px rgba(0,0,0,0.5))';
    }
    return 'none';
  };

  // High-Resolution Export
  const exportCompositeImage = async (): Promise<string | null> => {
    if (!containerRef.current) return null;
    setIsExporting(true);

    try {
      const svgElement = containerRef.current.querySelector('svg.mockup-svg');
      if (!svgElement) return null;

      const canvas = document.createElement('canvas');
      const size = 1400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw background
      ctx.fillStyle = '#121316';
      ctx.fillRect(0, 0, size, size);

      // Serialize SVG
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          URL.revokeObjectURL(blobURL);
          resolve();
        };
        img.onerror = reject;
        img.src = blobURL;
      });

      // If there's a logo, composite it on top
      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = reject;
          logoImg.src = logoUrl;
        });

        // Calculate print area in 1400x1400 coordinates
        const pa = product.printArea;
        const paLeft = (pa.left / 100) * size;
        const paTop = (pa.top / 100) * size;
        const paWidth = (pa.width / 100) * size;
        const paHeight = (pa.height / 100) * size;

        const centerX = paLeft + paWidth / 2 + (transform.x / 100) * paWidth;
        const centerY = paTop + paHeight / 2 + (transform.y / 100) * paHeight;

        const logoScale = transform.scale / 100;
        const maxDim = Math.min(paWidth, paHeight) * 0.9 * logoScale;
        const aspect = logoImg.width / logoImg.height;

        let drawW = maxDim;
        let drawH = maxDim / aspect;
        if (aspect < 1) {
          drawH = maxDim;
          drawW = maxDim * aspect;
        }

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((transform.rotation * Math.PI) / 180);
        ctx.globalAlpha = transform.opacity / 100;

        // Set blend mode
        if (transform.blendMode === 'multiply') {
          ctx.globalCompositeOperation = 'multiply';
        } else if (transform.blendMode === 'overlay') {
          ctx.globalCompositeOperation = 'overlay';
        } else if (transform.blendMode === 'screen') {
          ctx.globalCompositeOperation = 'screen';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(logoImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      return dataUrl;
    } catch (err) {
      console.error('Export error:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await exportCompositeImage();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${product.id}-mockup.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    const dataUrl = await exportCompositeImage();
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerSnapshot = async () => {
    if (!onSnapshot) return;
    const dataUrl = await exportCompositeImage();
    if (dataUrl) {
      onSnapshot(dataUrl);
    }
  };

  return (
    <div
      id="mockup-canvas-container"
      className="relative flex flex-col items-center justify-center w-full h-full min-h-[520px] lg:min-h-[640px] bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4 sm:p-6 overflow-hidden select-none"
    >
      {/* Subtle Studio Backdrop Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-zinc-800/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">{product.name}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400 capitalize">{product.category}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-lg">
          <button
            id="toggle-guides-button"
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showGuides
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle Print Placement Guide"
          >
            {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            id="reset-placement-button"
            type="button"
            onClick={onResetTransform}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1"
            title="Reset Logo Center & Scale"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            id="copy-mockup-button"
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
            title="Copy high-res image to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            id="download-mockup-button"
            type="button"
            disabled={isExporting}
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            title="Download full 300 DPI composite mockup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Mockup Stage (Aspect 1:1) */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-[480px] lg:max-w-[540px] aspect-square flex items-center justify-center p-2"
      >
        {/* Vector SVG Mockup Base */}
        <svg
          className="mockup-svg w-full h-full drop-shadow-2xl overflow-visible"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Filter: Drop Shadow */}
            <filter id="product-shadow" x="-20%" y="-10%" width="140%" height="130%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="24" stdDeviation="28" floodColor="#000000" floodOpacity="0.45" />
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.3" />
            </filter>

            {/* Mug Cylindrical Shading Gradient */}
            <linearGradient id="mug-body-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.32" />
              <stop offset="12%" stopColor="#000000" stopOpacity="0.12" />
              <stop offset="34%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="78%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </linearGradient>

            {/* Mug Gloss Specular Stripe */}
            <linearGradient id="mug-specular" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.42" />
              <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.65" />
              <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            {/* T-Shirt Fabric Fold Shadow Gradient */}
            <linearGradient id="shirt-folds" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="65%" stopColor="#000000" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
            </linearGradient>
          </defs>

          {/* Render based on product ID */}
          {renderProductSvg(product.id, selectedColor)}
        </svg>

        {/* Dynamic Logo Placement Layer (Positioned exactly over product.printArea) */}
        <div
          ref={printAreaRef}
          style={{
            position: 'absolute',
            top: `${product.printArea.top}%`,
            left: `${product.printArea.left}%`,
            width: `${product.printArea.width}%`,
            height: `${product.printArea.height}%`,
            pointerEvents: 'auto',
          }}
          className="flex items-center justify-center"
        >
          {/* Print Area Guide Border */}
          {showGuides && (
            <div
              className={`absolute inset-0 rounded-lg border-2 border-dashed transition-all pointer-events-none ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-zinc-500/40 hover:border-zinc-400/60'
              }`}
            >
              <span className="absolute top-1.5 left-2 text-[10px] font-mono tracking-wider text-zinc-400/80 uppercase">
                Print Area
              </span>
            </div>
          )}

          {/* Draggable Logo Container */}
          {logoUrl ? (
            <div
              id="mockup-logo-element"
              onPointerDown={handlePointerDown}
              style={{
                transform: `translate(${transform.x}%, ${transform.y}%) rotate(${transform.rotation}deg) scale(${
                  transform.scale / 100
                }) ${transform.flipX ? 'scaleX(-1)' : ''} ${transform.flipY ? 'scaleY(-1)' : ''}`,
                opacity: transform.opacity / 100,
                mixBlendMode: transform.blendMode,
                cursor: isDragging ? 'grabbing' : 'grab',
                filter: getLogoFilter(),
              }}
              className="relative max-w-full max-h-full transition-transform duration-75 flex items-center justify-center select-none"
            >
              <img
                src={logoUrl}
                alt="Product Logo Mockup"
                referrerPolicy="no-referrer"
                className={`max-w-[280px] max-h-[280px] object-contain pointer-events-none drop-shadow-sm ${
                  product.isCurvedSurface && transform.cylindricalWarp ? 'cylindrical-warp' : ''
                }`}
                style={{
                  transform:
                    product.isCurvedSurface && transform.cylindricalWarp
                      ? 'perspective(400px) rotateY(-8deg) scaleX(0.96)'
                      : 'none',
                }}
              />

              {/* Active Selection Box when guides enabled */}
              {showGuides && (
                <div className="absolute -inset-2 border border-indigo-400/70 rounded pointer-events-none">
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-sm shadow-sm" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-sm shadow-sm" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-sm shadow-sm" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-sm shadow-sm" />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-mono px-1 rounded shadow">
                    Drag to move
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed border-zinc-700/60 rounded-xl bg-zinc-950/40">
              <Move className="w-6 h-6 text-zinc-500 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-zinc-300">Upload Your Logo</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">or select a sample logo below</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Help / Controls info */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">
          <Move className="w-3.5 h-3.5 text-zinc-400" /> Drag logo directly on mockup to position
        </span>
        <span className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">
          <ZoomIn className="w-3.5 h-3.5 text-zinc-400" /> Scale: {transform.scale}%
        </span>
        <span className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">
          <RotateCw className="w-3.5 h-3.5 text-zinc-400" /> Angle: {transform.rotation}°
        </span>
        {onSnapshot && (
          <button
            type="button"
            onClick={handleTriggerSnapshot}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 ml-1"
          >
            Use snapshot in AI features →
          </button>
        )}
      </div>
    </div>
  );
};

// SVG Product Renderers
function renderProductSvg(productId: string, color: string) {
  switch (productId) {
    case 'ceramic-mug':
      return (
        <g filter="url(#product-shadow)">
          {/* Mug Handle (C-Handle) */}
          <path
            d="M390,230 C470,230 475,370 385,370"
            fill="none"
            stroke={color}
            strokeWidth="38"
            strokeLinecap="round"
          />
          <path
            d="M390,230 C470,230 475,370 385,370"
            fill="none"
            stroke="#000000"
            strokeOpacity="0.2"
            strokeWidth="38"
            strokeLinecap="round"
          />

          {/* Mug Main Body */}
          <rect x="180" y="180" width="220" height="260" rx="20" fill={color} />
          {/* Mug Cylindrical Gradient Lighting */}
          <rect x="180" y="180" width="220" height="260" rx="20" fill="url(#mug-body-grad)" />
          {/* Glossy Specular Strip */}
          <rect x="180" y="180" width="220" height="260" rx="20" fill="url(#mug-specular)" />

          {/* Mug Bottom Base Rim */}
          <ellipse cx="290" cy="438" rx="104" ry="12" fill={color} />
          <ellipse cx="290" cy="438" rx="104" ry="12" fill="#000000" fillOpacity="0.25" />

          {/* Mug Top Rim Outer Lip */}
          <ellipse cx="290" cy="180" rx="110" ry="24" fill={color} />
          <ellipse cx="290" cy="180" rx="110" ry="24" fill="url(#mug-body-grad)" />

          {/* Mug Interior Cavity */}
          <ellipse cx="290" cy="180" rx="100" ry="20" fill="#212224" />
          {/* Dark Coffee inside */}
          <ellipse cx="290" cy="184" rx="94" ry="17" fill="#3D2314" />
          <ellipse cx="280" cy="182" rx="40" ry="8" fill="#5A351D" fillOpacity="0.4" />

          {/* Top Ceramic Lip Highlight */}
          <path
            d="M182,180 A110,24 0 0,0 398,180"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeOpacity="0.6"
          />
        </g>
      );

    case 'enamel-mug':
      return (
        <g filter="url(#product-shadow)">
          {/* Vintage Enamel Handle */}
          <path
            d="M380,240 C450,240 455,360 375,360"
            fill="none"
            stroke={color}
            strokeWidth="32"
            strokeLinecap="round"
          />
          {/* Body */}
          <path
            d="M185,200 L200,420 A15,15 0 0,0 215,435 L365,435 A15,15 0 0,0 380,420 L395,200 Z"
            fill={color}
          />
          <path
            d="M185,200 L200,420 A15,15 0 0,0 215,435 L365,435 A15,15 0 0,0 380,420 L395,200 Z"
            fill="url(#mug-body-grad)"
          />

          {/* Metal Steel Rolled Rim */}
          <ellipse cx="290" cy="200" rx="106" ry="18" fill="#4A4E54" />
          <ellipse cx="290" cy="198" rx="104" ry="16" fill="#A0A5AC" />
          <ellipse cx="290" cy="200" rx="98" ry="15" fill="#1C1E20" />
        </g>
      );

    case 'travel-tumbler':
      return (
        <g filter="url(#product-shadow)">
          {/* Tall Cylinder Body */}
          <path
            d="M205,170 L220,470 A16,16 0 0,0 236,485 L344,485 A16,16 0 0,0 360,470 L375,170 Z"
            fill={color}
          />
          <path
            d="M205,170 L220,470 A16,16 0 0,0 236,485 L344,485 A16,16 0 0,0 360,470 L375,170 Z"
            fill="url(#mug-body-grad)"
          />
          <path
            d="M205,170 L220,470 A16,16 0 0,0 236,485 L344,485 A16,16 0 0,0 360,470 L375,170 Z"
            fill="url(#mug-specular)"
          />

          {/* Tumbler Steel Band */}
          <rect x="207" y="165" width="166" height="12" rx="3" fill="#A4ACB8" />
          {/* Leakproof Lid */}
          <path d="M200,165 L210,135 L370,135 L380,165 Z" fill="#202326" />
          <rect x="235" y="125" width="110" height="12" rx="4" fill="#32363A" />
        </g>
      );

    case 'crewneck-tshirt':
      return (
        <g filter="url(#product-shadow)">
          {/* Realistic T-Shirt Silhouette */}
          <path
            d="M230,120 Q290,145 350,120 L445,160 L400,240 L365,220 L375,475 Q290,490 205,475 L215,220 L180,240 L135,160 Z"
            fill={color}
          />

          {/* Fabric Shading / Wrinkle Overlay */}
          <path
            d="M230,120 Q290,145 350,120 L445,160 L400,240 L365,220 L375,475 Q290,490 205,475 L215,220 L180,240 L135,160 Z"
            fill="url(#shirt-folds)"
          />

          {/* Underarm and Side Seam Folds */}
          <path
            d="M215,220 Q235,320 220,460"
            fill="none"
            stroke="#000000"
            strokeWidth="3"
            strokeOpacity="0.18"
          />
          <path
            d="M365,220 Q345,320 360,460"
            fill="none"
            stroke="#000000"
            strokeWidth="3"
            strokeOpacity="0.18"
          />

          {/* Chest Wrinkle Highlights */}
          <path
            d="M235,180 Q290,210 345,180"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeOpacity="0.2"
          />
          <path
            d="M225,280 Q290,300 355,275"
            fill="none"
            stroke="#000000"
            strokeWidth="3"
            strokeOpacity="0.12"
          />

          {/* Ribbed Crewneck Collar */}
          <path
            d="M230,120 Q290,165 350,120 Q290,140 230,120 Z"
            fill="#000000"
            fillOpacity="0.15"
          />
          <path
            d="M230,120 Q290,165 350,120"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M230,120 Q290,165 350,120"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeOpacity="0.25"
          />

          {/* Inner Back Neck Label area */}
          <path
            d="M242,122 Q290,145 338,122 Q290,110 242,122 Z"
            fill="#2A2C30"
          />
          {/* Sleeve Stitch Lines */}
          <path d="M142,175 L182,235" fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.2" strokeDasharray="3 3" />
          <path d="M438,175 L398,235" fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.2" strokeDasharray="3 3" />
        </g>
      );

    case 'oversized-tee':
      return (
        <g filter="url(#product-shadow)">
          {/* Heavyweight Boxy Cut */}
          <path
            d="M220,115 Q290,140 360,115 L480,165 L430,270 L385,245 L395,490 Q290,505 185,490 L195,245 L150,270 L100,165 Z"
            fill={color}
          />
          <path
            d="M220,115 Q290,140 360,115 L480,165 L430,270 L385,245 L395,490 Q290,505 185,490 L195,245 L150,270 L100,165 Z"
            fill="url(#shirt-folds)"
          />
          {/* Dropped shoulder stitch lines */}
          <line x1="220" y1="115" x2="210" y2="190" stroke="#000000" strokeWidth="2" strokeOpacity="0.2" />
          <line x1="360" y1="115" x2="370" y2="190" stroke="#000000" strokeWidth="2" strokeOpacity="0.2" />
          {/* Ribbed Collar */}
          <path d="M220,115 Q290,155 360,115" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        </g>
      );

    case 'pullover-hoodie':
      return (
        <g filter="url(#product-shadow)">
          {/* Hoodie Body & Arms */}
          <path
            d="M210,130 L110,210 L155,420 L210,380 L215,480 L365,480 L370,380 L425,420 L470,210 L370,130 Z"
            fill={color}
          />
          <path
            d="M210,130 L110,210 L155,420 L210,380 L215,480 L365,480 L370,380 L425,420 L470,210 L370,130 Z"
            fill="url(#shirt-folds)"
          />

          {/* Front Kangaroo Pouch Pocket */}
          <path
            d="M235,370 L250,450 L330,450 L345,370 L320,350 L260,350 Z"
            fill={color}
            stroke="#000000"
            strokeWidth="2"
            strokeOpacity="0.2"
          />

          {/* Double Layer Hood */}
          <path
            d="M210,130 Q290,80 370,130 Q330,175 290,175 Q250,175 210,130 Z"
            fill={color}
          />
          <path
            d="M210,130 Q290,80 370,130 Q330,175 290,175 Q250,175 210,130 Z"
            fill="#000000"
            fillOpacity="0.2"
          />

          {/* Hood Drawstring Cords */}
          <line x1="265" y1="175" x2="260" y2="245" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="315" y1="175" x2="320" y2="245" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.8" />
          <circle cx="260" cy="248" r="3" fill="#D0D0D0" />
          <circle cx="320" cy="248" r="3" fill="#D0D0D0" />
        </g>
      );

    case 'canvas-tote':
      return (
        <g filter="url(#product-shadow)">
          {/* Twin Tote Handles */}
          <path
            d="M225,240 C225,90 355,90 355,240"
            fill="none"
            stroke={color}
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M225,240 C225,90 355,90 355,240"
            fill="none"
            stroke="#000000"
            strokeWidth="24"
            strokeOpacity="0.15"
            strokeLinecap="round"
          />

          {/* Main Bag Body */}
          <rect x="180" y="230" width="220" height="250" rx="14" fill={color} />
          <rect x="180" y="230" width="220" height="250" rx="14" fill="url(#shirt-folds)" />

          {/* Handle Reinforcement X-Stitching */}
          <rect x="216" y="232" width="18" height="24" fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.3" />
          <line x1="216" y1="232" x2="234" y2="256" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.3" />
          <line x1="234" y1="232" x2="216" y2="256" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.3" />

          <rect x="346" y="232" width="18" height="24" fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.3" />
          <line x1="346" y1="232" x2="364" y2="256" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.3" />
          <line x1="364" y1="232" x2="346" y2="256" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.3" />
        </g>
      );

    case 'baseball-cap':
    default:
      return (
        <g filter="url(#product-shadow)">
          {/* Cap Crown 6-Panel Dome */}
          <path
            d="M170,300 C170,180 410,180 410,300 Z"
            fill={color}
          />
          <path
            d="M170,300 C170,180 410,180 410,300 Z"
            fill="url(#shirt-folds)"
          />
          {/* Crown Seam Line */}
          <path d="M290,185 L290,300" stroke="#000000" strokeWidth="2" strokeOpacity="0.2" />
          {/* Top Squatchee Button */}
          <ellipse cx="290" cy="188" rx="8" ry="6" fill={color} stroke="#000000" strokeWidth="1" strokeOpacity="0.3" />

          {/* Curved Visor / Brim */}
          <path
            d="M140,320 C180,290 400,290 440,320 C380,365 200,365 140,320 Z"
            fill={color}
          />
          <path
            d="M140,320 C180,290 400,290 440,320 C380,365 200,365 140,320 Z"
            fill="#000000"
            fillOpacity="0.25"
          />
        </g>
      );
  }
}
