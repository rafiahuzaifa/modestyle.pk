"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  productImage: string;
  productName: string;
}

const STYLE_MESSAGES = [
  "This product really suits you! You look absolutely stunning 💛",
  "Mashallah! This look was made for you. A perfect match! ✨",
  "You look gorgeous! This is definitely your style 🌟",
  "Wow! This product complements your features beautifully 💛",
  "Perfect choice! You look elegant and graceful 🌸",
];

export function ImagineOnYou({ productImage, productName }: Props) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserPhoto(e.target?.result as string);
      setResult(null);
      setMessage("");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const generateTryOn = async () => {
    if (!userPhoto || !productImage) return;
    setLoading(true);

    try {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      // Canvas size: side by side
      const W = 800;
      const H = 600;
      canvas.width = W;
      canvas.height = H;

      // Load both images
      const [userImg, productImg] = await Promise.all([
        loadImage(userPhoto),
        loadImage(productImage),
      ]);

      // White background
      ctx.fillStyle = "#fdf8f0";
      ctx.fillRect(0, 0, W, H);

      // Draw user photo on left (with cover fit)
      const leftW = W * 0.55;
      const userRatio = userImg.width / userImg.height;
      const leftH = H - 80;
      let uw = leftW, uh = leftW / userRatio;
      if (uh > leftH) { uh = leftH; uw = uh * userRatio; }
      const ux = (leftW - uw) / 2;
      const uy = (leftH - uh) / 2 + 10;

      // Rounded clip for user photo
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(ux, uy, uw, uh, 16);
      ctx.clip();
      ctx.drawImage(userImg, ux, uy, uw, uh);
      ctx.restore();

      // Subtle overlay on user photo showing product
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.roundRect(ux, uy, uw, uh, 16);
      ctx.clip();
      ctx.drawImage(productImg, ux, uy + uh * 0.25, uw, uh * 0.6);
      ctx.restore();

      // Divider
      ctx.strokeStyle = "#d4a853";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(leftW, 30);
      ctx.lineTo(leftW, H - 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Product image on right
      const rightX = leftW + 8;
      const rightW = W - leftW - 16;
      const productRatio = productImg.width / productImg.height;
      const rightH = H - 120;
      let pw = rightW, ph = rightW / productRatio;
      if (ph > rightH) { ph = rightH; pw = ph * productRatio; }
      const px = rightX + (rightW - pw) / 2;
      const py = 10 + (rightH - ph) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 12);
      ctx.clip();
      ctx.drawImage(productImg, px, py, pw, ph);
      ctx.restore();

      // Product label background
      ctx.fillStyle = "rgba(212,168,83,0.95)";
      ctx.beginPath();
      ctx.roundRect(rightX, H - 100, rightW, 38, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(productName.slice(0, 30), rightX + rightW / 2, H - 76);

      // Bottom message banner
      const msg = STYLE_MESSAGES[Math.floor(Math.random() * STYLE_MESSAGES.length)];
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, H - 56, W, 56);
      ctx.fillStyle = "#d4a853";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✨  " + msg, W / 2, H - 28);

      // ModestStyle watermark
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("ModestStyle.pk", W - 12, H - 10);

      // Left label
      ctx.fillStyle = "rgba(26,26,46,0.7)";
      ctx.beginPath();
      ctx.roundRect(ux, uy + uh - 30, 60, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("You 💛", ux + 30, uy + uh - 13);

      // Right label
      ctx.fillStyle = "rgba(26,26,46,0.7)";
      ctx.beginPath();
      ctx.roundRect(px, py + ph - 30, 70, 24, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText("Product ✨", px + 35, py + ph - 13);

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      setResult(dataUrl);
      setMessage(msg);
    } catch {
      // fallback if canvas fails
      setResult(userPhoto);
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `modestyle-tryon-${productName.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const reset = () => {
    setUserPhoto(null);
    setResult(null);
    setMessage("");
  };

  // ── Result view ─────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="rounded-xl overflow-hidden border border-gold-200">
        <canvas ref={canvasRef} className="hidden" />
        <div className="bg-gradient-to-r from-secondary to-secondary/90 px-4 py-3 flex items-center gap-2">
          <span className="text-gold-400 text-sm font-bold">✨</span>
          <p className="text-white text-sm font-medium">Virtual Try-On Result</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result} alt="Virtual try-on result" className="w-full" />
        {message && (
          <div className="bg-gold-50 border-t border-gold-100 px-4 py-3 text-center">
            <p className="text-secondary text-sm font-semibold">{message}</p>
          </div>
        )}
        <div className="flex gap-2 p-3 bg-white border-t border-gray-100">
          <button
            onClick={downloadResult}
            className="flex-1 bg-secondary text-white py-2.5 rounded-lg text-xs font-medium hover:bg-secondary/90 transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save Image
          </button>
          <button
            onClick={reset}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
          >
            Try Another Photo
          </button>
        </div>
      </div>
    );
  }

  // ── Upload + Generate view ──────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gold-200 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">AI</div>
        <div>
          <p className="text-white text-sm font-semibold">Virtual Try-On</p>
          <p className="text-white/80 text-[11px]">Upload your photo to see how it looks on you</p>
        </div>
      </div>

      <div className="bg-white p-4 space-y-3">
        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-xl transition-all ${
            dragOver
              ? "border-gold-500 bg-gold-50"
              : userPhoto
              ? "border-gold-400 bg-gold-50"
              : "border-gray-200 hover:border-gold-400 hover:bg-gold-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {userPhoto ? (
            <div className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={userPhoto} alt="Your photo" className="w-16 h-16 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-600">✓ Photo uploaded</p>
                <p className="text-xs text-gray-400 mt-0.5">Click to change photo</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setUserPhoto(null); setResult(null); }}
                className="text-gray-400 hover:text-red-500 transition p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">📸</div>
              <p className="text-sm font-medium text-gray-600">Upload your photo</p>
              <p className="text-xs text-gray-400 mt-1">Drag & drop or click to browse</p>
              <p className="text-[10px] text-gray-300 mt-2">JPG, PNG supported • Your photo stays private</p>
            </div>
          )}
        </div>

        {/* Product preview */}
        {productImage && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImage} alt={productName} className="w-12 h-12 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">Selected product</p>
              <p className="text-sm font-medium text-secondary truncate">{productName}</p>
            </div>
            <span className="text-gold-500">✦</span>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={generateTryOn}
          disabled={!userPhoto || loading}
          className="w-full py-3.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your look...
            </>
          ) : (
            <>✨ See It On Me</>
          )}
        </button>

        {!userPhoto && (
          <p className="text-center text-xs text-gray-400">
            Upload your photo above to enable try-on
          </p>
        )}

        <p className="text-center text-[10px] text-gray-300">
          🔒 Your photo is never stored or shared
        </p>
      </div>
    </div>
  );
}
