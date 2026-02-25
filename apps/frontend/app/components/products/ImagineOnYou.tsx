"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  productImage: string;
  productName: string;
}

const STYLE_MESSAGES = [
  "Mashallah! This look was made for you. Simply stunning! ✨",
  "This product suits you beautifully — a perfect match! 💛",
  "You look absolutely gorgeous in this! Own this style! 🌟",
  "Elegant, graceful, and uniquely you. We love this look! 🌸",
  "This product complements you perfectly. A divine choice! 💫",
  "You wear this so well! This is definitely your style! ✨",
];

function randomMsg() {
  return STYLE_MESSAGES[Math.floor(Math.random() * STYLE_MESSAGES.length)];
}

export function ImagineOnYou({ productImage, productName }: Props) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
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
      setStep(2);
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

      const W = 900;
      const H = 680;
      canvas.width = W;
      canvas.height = H;

      const [userImg, productImg] = await Promise.all([
        loadImage(userPhoto),
        loadImage(productImage),
      ]);

      // ── Background ────────────────────────────────────────────────
      ctx.fillStyle = "#0e0c1a";
      ctx.fillRect(0, 0, W, H);

      // ── User photo – fills left 58% ───────────────────────────────
      const photoW = Math.floor(W * 0.58);
      const photoH = H;
      const userRatio = userImg.width / userImg.height;
      let dw = photoW, dh = photoW / userRatio;
      if (dh < photoH) { dh = photoH; dw = dh * userRatio; }
      const dx = (photoW - dw) / 2;
      const dy = (photoH - dh) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, photoW, photoH);
      ctx.clip();
      ctx.drawImage(userImg, dx, dy, dw, dh);
      ctx.restore();

      // Vignette over user photo
      const vigGrad = ctx.createRadialGradient(
        photoW / 2, photoH / 2, photoH * 0.3,
        photoW / 2, photoH / 2, photoH * 0.85
      );
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, photoW, photoH);
      ctx.clip();
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, photoW, photoH);
      ctx.restore();

      // ── Product overlay on user photo (torso area) ─────────────────
      const overlayY = photoH * 0.22;
      const overlayH = photoH * 0.72;
      const prodRatioFull = productImg.width / productImg.height;
      let ovW = photoW * 0.82, ovH = ovW / prodRatioFull;
      if (ovH > overlayH) { ovH = overlayH; ovW = ovH * prodRatioFull; }
      const ovX = (photoW - ovW) / 2;
      const ovY = overlayY + (overlayH - ovH) / 2;

      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(productImg, ovX, ovY, ovW, ovH);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(productImg, ovX, ovY, ovW, ovH);
      ctx.restore();

      // ── Right panel ───────────────────────────────────────────────
      const rightX = photoW + 1;
      const rightW = W - rightX;

      const panelGrad = ctx.createLinearGradient(rightX, 0, W, H);
      panelGrad.addColorStop(0, "#1a1728");
      panelGrad.addColorStop(1, "#0e0c1a");
      ctx.fillStyle = panelGrad;
      ctx.fillRect(rightX, 0, rightW, H);

      // Gold top accent line
      ctx.fillStyle = "#d4a853";
      ctx.fillRect(rightX, 0, rightW, 3);

      // Product image on right
      const prodMaxW = rightW - 32;
      const prodMaxH = H * 0.58;
      const prodRatio = productImg.width / productImg.height;
      let pw = prodMaxW, ph = pw / prodRatio;
      if (ph > prodMaxH) { ph = prodMaxH; pw = ph * prodRatio; }
      const px = rightX + (rightW - pw) / 2;
      const py = 24;

      ctx.save();
      ctx.shadowColor = "rgba(212,168,83,0.3)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 10);
      ctx.clip();
      ctx.drawImage(productImg, px, py, pw, ph);
      ctx.restore();

      // Gold frame around product
      ctx.strokeStyle = "rgba(212,168,83,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 10);
      ctx.stroke();

      // Product name badge
      const badgeY = py + ph + 14;
      ctx.fillStyle = "rgba(212,168,83,0.15)";
      ctx.beginPath();
      ctx.roundRect(rightX + 10, badgeY, rightW - 20, 34, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(212,168,83,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rightX + 10, badgeY, rightW - 20, 34, 6);
      ctx.stroke();
      ctx.fillStyle = "#d4a853";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      const nameShort = productName.length > 28 ? productName.slice(0, 26) + "…" : productName;
      ctx.fillText(nameShort, rightX + rightW / 2, badgeY + 21);

      // Stars
      const starsY = badgeY + 50;
      ctx.fillStyle = "#d4a853";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★ ★ ★ ★ ★", rightX + rightW / 2, starsY);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px sans-serif";
      ctx.fillText("Perfect Match!", rightX + rightW / 2, starsY + 14);

      // ── Bottom message banner ─────────────────────────────────────
      const bannerH = 70;
      const bannerY = H - bannerH;
      ctx.fillStyle = "rgba(10,8,20,0.97)";
      ctx.fillRect(0, bannerY, W, bannerH);
      ctx.fillStyle = "#d4a853";
      ctx.fillRect(0, bannerY, W, 2);

      const msg = randomMsg();
      setMessage(msg);

      ctx.fillStyle = "rgba(212,168,83,0.6)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("MODESTYLE.PK", 16, bannerY + 20);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(msg, W / 2, bannerY + 24);

      ctx.fillStyle = "rgba(212,168,83,0.7)";
      ctx.font = "10px sans-serif";
      ctx.fillText("Virtual Try-On by ModestStyle.pk", W / 2, bannerY + 42);

      // "YOU" label on left photo
      ctx.fillStyle = "rgba(212,168,83,0.9)";
      ctx.beginPath();
      ctx.roundRect(10, 10, 54, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#1a1728";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("YOU 💛", 37, 24);

      // "PRODUCT" label top-right panel
      ctx.fillStyle = "rgba(212,168,83,0.9)";
      ctx.beginPath();
      ctx.roundRect(rightX + 8, 10, 66, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#1a1728";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("PRODUCT ✦", rightX + 41, 24);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setResult(dataUrl);
    } catch {
      setResult(userPhoto);
      setMessage(randomMsg());
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `modestyle-tryon-${productName.replace(/\s+/g, "-")}.jpg`;
    a.click();
  };

  const reset = () => {
    setUserPhoto(null);
    setResult(null);
    setMessage("");
    setStep(1);
  };

  // ── Result view ──────────────────────────────────────────────────
  if (result) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gold-200 shadow-lg">
        <canvas ref={canvasRef} className="hidden" />

        <div className="bg-gradient-to-r from-secondary via-secondary to-secondary/90 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-white text-sm font-semibold">Your Try-On Result</p>
          </div>
          <span className="text-gold-400 text-xs">✨ ModestStyle.pk</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result} alt="Your virtual try-on" className="w-full block" />

        {message && (
          <div className="bg-gradient-to-r from-gold-50 to-amber-50 border-t border-gold-100 px-5 py-3.5 text-center">
            <p className="text-secondary text-sm font-semibold leading-snug">{message}</p>
          </div>
        )}

        <div className="flex gap-2.5 p-3.5 bg-white border-t border-gray-100">
          <button
            onClick={downloadResult}
            className="flex-1 bg-secondary text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary/90 transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save Image
          </button>
          <button
            onClick={reset}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
          >
            Try Another Photo
          </button>
        </div>
      </div>
    );
  }

  // ── Upload + Generate view ───────────────────────────────────────
  return (
    <div className="rounded-2xl border border-gold-200 overflow-hidden shadow-sm">
      <canvas ref={canvasRef} className="hidden" />

      {/* Premium Header */}
      <div className="bg-gradient-to-r from-secondary to-secondary/90 px-4 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M3 8a1 1 0 011-1h9a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-bold tracking-wide">Virtual Try-On</p>
          <p className="text-gold-300/80 text-[10px] tracking-wide">See how this product looks on YOU</p>
        </div>
        <div className="ml-auto">
          <span className="bg-gold-500/20 border border-gold-500/30 text-gold-400 text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wider">FREE</span>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= 1 ? "bg-gold-500 text-white" : "bg-gray-200 text-gray-400"}`}>1</div>
          <span className={`text-[11px] font-medium ${step >= 1 ? "text-secondary" : "text-gray-400"}`}>Upload Photo</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= 2 ? "bg-gold-500 text-white" : "bg-gray-200 text-gray-400"}`}>2</div>
          <span className={`text-[11px] font-medium ${step >= 2 ? "text-secondary" : "text-gray-400"}`}>Generate Look</span>
        </div>
      </div>

      <div className="bg-white p-4 space-y-3">

        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 ${
            dragOver
              ? "border-gold-500 bg-gold-50 scale-[0.99]"
              : userPhoto
              ? "border-gold-400 bg-gradient-to-br from-gold-50 to-amber-50"
              : "border-gray-200 hover:border-gold-300 hover:bg-gold-50/50"
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
              <img src={userPhoto} alt="Your photo" className="w-16 h-16 object-cover rounded-lg border-2 border-gold-300 shadow-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Photo Ready!
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click to change photo</p>
                <p className="text-[10px] text-gold-500 mt-1 font-medium">Tip: full-body gives best results</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setUserPhoto(null); setResult(null); setStep(1); }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="py-7 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Upload Your Photo</p>
              <p className="text-xs text-gray-400 mt-1">Drag & drop or click to browse</p>
              <p className="text-[10px] text-gold-500 mt-2 font-medium">Full-body photo gives best results</p>
              <p className="text-[10px] text-gray-300 mt-1">JPG, PNG • stays on your device</p>
            </div>
          )}
        </div>

        {/* Product preview */}
        {productImage && (
          <div className="flex items-center gap-3 bg-secondary/5 border border-secondary/10 rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImage} alt={productName} className="w-12 h-12 object-cover rounded-lg border border-gold-200" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gold-500 uppercase tracking-wider font-medium">Selected Product</p>
              <p className="text-sm font-semibold text-secondary truncate mt-0.5">{productName}</p>
            </div>
            <span className="text-gold-500 text-lg">✦</span>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={generateTryOn}
          disabled={!userPhoto || loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-secondary to-secondary/90 text-white text-sm font-bold hover:from-secondary/95 hover:to-secondary/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating your look…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              See It On Me ✨
            </>
          )}
        </button>

        {!userPhoto && (
          <p className="text-center text-xs text-gray-400">
            Upload your photo above to see how this looks on you
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-300">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Photo never uploaded or stored — 100% private
        </div>
      </div>
    </div>
  );
}
