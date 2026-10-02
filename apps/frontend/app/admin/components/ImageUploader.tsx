"use client";

import { useRef, useState } from "react";

export interface UploadedImage {
  assetId: string;
  url: string;
}

const MAX_DIMENSION = 2000;

/** Downscales large photos in the browser so uploads stay under Vercel's 4.5 MB body limit. */
async function prepareImage(file: File): Promise<Blob> {
  if (file.type === "image/gif" || file.size < 1.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/webp", 0.85)
  );
}

export async function uploadToSanity(file: File): Promise<UploadedImage> {
  const blob = await prepareImage(file);
  const form = new FormData();
  const name = blob === file ? file.name : file.name.replace(/\.[^.]+$/, "") + ".webp";
  form.append("file", new File([blob], name, { type: blob.type || file.type }));
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
}

export function ImageUploader({ images, onChange, multiple = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const list = multiple ? Array.from(files) : [files[0]];
    setUploading(list.length);
    const added: UploadedImage[] = [];
    for (const file of list) {
      try {
        added.push(await uploadToSanity(file));
      } catch (err) {
        setError(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      setUploading((n) => n - 1);
    }
    if (multiple) onChange([...images, ...added]);
    else if (added.length) onChange([added[0]]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.assetId} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${img.url}?w=300&h=360&fit=crop`} alt="" className="w-full aspect-[5/6] object-cover" />
              {multiple && i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-gold-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 text-white text-xs">
                {multiple ? (
                  <>
                    <button type="button" onClick={() => move(i, i - 1)} className="px-2 py-1 hover:bg-black/40" aria-label="Move left">
                      ←
                    </button>
                    {i !== 0 && (
                      <button type="button" onClick={() => move(i, 0)} className="px-2 py-1 hover:bg-black/40">
                        Main
                      </button>
                    )}
                    <button type="button" onClick={() => move(i, i + 1)} className="px-2 py-1 hover:bg-black/40" aria-label="Move right">
                      →
                    </button>
                  </>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  className="px-2 py-1 hover:bg-red-600"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading > 0}
        className="w-full border-2 border-dashed border-gray-200 rounded-lg py-5 text-sm text-gray-500 hover:border-gold-300 hover:text-gold-600 transition disabled:opacity-50"
      >
        {uploading > 0
          ? `Uploading ${uploading} image${uploading > 1 ? "s" : ""}…`
          : multiple
          ? "+ Upload images (you can select several)"
          : images.length
          ? "Replace image"
          : "+ Upload image"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
