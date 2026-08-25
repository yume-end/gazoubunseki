"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { fileToDataUrl, validateUploadedImage } from "@/lib/image";

type Props = {
  onImageReady: (payload: { sourceType: "upload" | "url"; name: string; mimeType: string; dataUrl: string }) => void;
};

export function ImageUploader({ onImageReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      setError(null);
      validateUploadedImage(file);
      setBusy(true);
      const dataUrl = await fileToDataUrl(file);
      onImageReady({ sourceType: "upload", name: file.name, mimeType: file.type, dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleUrlSubmit() {
    if (!url.trim()) {
      setError("画像URLを入力してください。");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "画像URLの取得に失敗しました。");
      onImageReady({ sourceType: "url", name: data.name, mimeType: data.mimeType, dataUrl: data.dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像URLの取得に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    void handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-panel/80 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        <div className="space-y-3">
          <p className="text-lg font-semibold">画像をアップロードまたはドラッグ＆ドロップ</p>
          <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]" onClick={() => inputRef.current?.click()} type="button">
            画像を選択
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => void handleFile(e.target.files?.[0])} />
          <p className="text-sm text-muted">JPG / PNG / WebP, 10MB 以下</p>
        </div>
      </div>
      <div className="grid gap-3">
        <label className="text-sm text-muted">画像URL</label>
        <div className="flex gap-2 max-md:flex-col">
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none ring-0 placeholder:text-slate-500" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-60" onClick={() => void handleUrlSubmit()} disabled={busy} type="button">
            {busy ? "処理中..." : "URLを読み込み"}
          </button>
        </div>
      </div>
      {error ? <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
