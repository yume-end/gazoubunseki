"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ImageUploader } from "@/components/ImageUploader";
import { analyzeImageLocally, analyzeLocally, detectWebGpuSupport } from "@/lib/analysis";
import { fetchUrlAsDataUrl, fileToDataUrl, isLikelyImageUrl, loadImageFromDataUrl, validateUploadedImage } from "@/lib/image";
import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";

export default function Page() {
  const [level, setLevel] = useState<ExplanationLevel>("standard");
  const [step, setStep] = useState("待機中");
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode] = useState(() => process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.DEMO_MODE === "true");
  const [webGpuAvailable, setWebGpuAvailable] = useState(false);
  const [browserReady, setBrowserReady] = useState(false);

  useEffect(() => {
    setBrowserReady(true);
    setWebGpuAvailable(detectWebGpuSupport());
  }, []);

  const modelLabel = useMemo(() => (webGpuAvailable ? "browser-local-canvas + WebGPU検出" : "browser-local-canvas"), [webGpuAvailable]);

  async function runAnalysis(dataUrl: string, sourceType: "upload" | "url", name: string, mimeType: string) {
    setPreview(dataUrl);
    setError(null);
    setReport(null);
    setStep("画像を読み込みました");
    setStep("画像の特徴を分析しています...");

    try {
      const img = await loadImageFromDataUrl(dataUrl);
      setStep("重要な要素を検出しています...");
      const metrics = await analyzeImageLocally(img);
      setStep("不自然な特徴を確認しています...");
      const localReport = analyzeLocally(metrics, { demoMode, webGpuAvailable, imageType: mimeType, fileName: name });
      setReport({ ...localReport, imageSource: { type: sourceType, name, mimeType } });
      setStep("証拠を統合しています...");
      setStep("完了");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました。");
      setStep("エラーが発生しました");
    }
  }

  async function handleUpload(file: File) {
    validateUploadedImage(file);
    const dataUrl = await fileToDataUrl(file);
    await runAnalysis(dataUrl, "upload", file.name, file.type);
  }

  async function handleUrl(url: string) {
    if (!isLikelyImageUrl(url)) {
      setError("有効な画像URLを入力してください。");
      return;
    }
    const dataUrl = await fetchUrlAsDataUrl(url);
    await runAnalysis(dataUrl, "url", url.split("/").pop() || "image", "image/jpeg");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="grid gap-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">AI画像真正性分析</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">AI画像フォレンジック</h1>
        <p className="max-w-3xl text-base leading-7 text-muted">画像の特徴を多角的に分析し、AI生成・加工・合成などの可能性を推定します。</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-100">このMVPでは、アップロードした画像を外部AI APIへ送信せず、お使いのブラウザ上で解析します。</div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">モデルの初回ダウンロードなど、必要なネットワーク通信が発生する場合があります。URL入力はブラウザのCORS制約の影響を受けます。</div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-300">
          {demoMode ? <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-100">Demo Mode</span> : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Model: {modelLabel}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">WebGPU: {browserReady ? (webGpuAvailable ? "available" : "not detected") : "checking..."}</span>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <ImageUploader onFileSelected={(file) => void handleUpload(file)} onUrlSubmit={(url) => void handleUrl(url)} />
          <AnalysisProgress step={step} />
          {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
        </div>
        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-panel/60 p-5">
            <div className="mb-3 text-sm text-muted">説明レベル</div>
            <div className="flex flex-wrap gap-2">
              {(["brief", "standard", "detailed"] as ExplanationLevel[]).map((item) => (
                <button key={item} className={`rounded-full px-4 py-2 text-sm font-semibold ${level === item ? "bg-white text-slate-950" : "bg-white/5 text-white"}`} onClick={() => setLevel(item)} type="button">
                  {item === "brief" ? "簡潔" : item === "standard" ? "標準" : "詳細"}
                </button>
              ))}
            </div>
          </div>
          {preview ? <img alt="preview" className="rounded-3xl border border-white/10 object-cover" src={preview} /> : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-sm text-muted">画像プレビュー</div>}
        </div>
      </section>
      {report ? <AnalysisResult level={level} report={report} /> : null}
    </main>
  );
}
