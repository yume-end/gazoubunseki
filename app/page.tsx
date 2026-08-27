"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ImageUploader } from "@/components/ImageUploader";
import { analyzeImageLocally, buildForensicReport, detectWebGpuSupport } from "@/lib/analysis";
import { cropImageDataUrl, getBackendAvailability, getObjectDetector } from "@/lib/ai/model-manager";
import { fetchUrlAsDataUrl, fileToDataUrl, isLikelyImageUrl, loadImageFromDataUrl, validateUploadedImage } from "@/lib/image";
import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";
import type { DetectorLoadState, InferenceBackend } from "@/lib/ai-types";

export default function Page() {
  const [level, setLevel] = useState<ExplanationLevel>("standard");
  const [step, setStep] = useState("待機中");
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode] = useState(() => process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.DEMO_MODE === "true");
  const [webGpuAvailable, setWebGpuAvailable] = useState(false);
  const [browserReady, setBrowserReady] = useState(false);
  const [backend, setBackend] = useState<InferenceBackend>("unavailable");
  const [loadState, setLoadState] = useState<DetectorLoadState>("idle");
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    setBrowserReady(true);
    setWebGpuAvailable(detectWebGpuSupport());
    const availability = getBackendAvailability();
    setBackend(availability.webgpu ? "webgpu" : availability.wasm ? "wasm" : "unavailable");
  }, []);

  const modelLabel = useMemo(() => {
    if (loadState === "ready") return `Xenova/yolos-tiny (${backend})`;
    if (loadState === "loading") return "モデルを読み込み中...";
    if (loadState === "error") return "モデル読み込みエラー";
    return "Xenova/yolos-tiny";
  }, [backend, loadState]);

  async function ensureDetectorReady() {
    const detector = await getObjectDetector();
    setLoadState(detector.getState());
    setBackend(detector.getBackend());
    if (detector.getState() === "idle") {
      setLoadState("loading");
      setStep("AIモデルを準備しています...");
      await detector.load();
      setLoadState(detector.getState());
      setBackend(detector.getBackend());
    }
    if (detector.getState() === "error") {
      setLoadState("error");
      setModelError(detector.getError() ?? "モデルの読み込みに失敗しました。");
      throw new Error(detector.getError() ?? "モデルの読み込みに失敗しました。");
    }
    return detector;
  }

  async function runAnalysis(dataUrl: string, sourceType: "upload" | "url", name: string, mimeType: string) {
    setPreview(dataUrl);
    setError(null);
    setModelError(null);
    setReport(null);
    setStep("画像を読み込みました");

    try {
      const detector = await ensureDetectorReady();
      const img = await loadImageFromDataUrl(dataUrl);
      setStep("画像の特徴を分析しています...");
      const metrics = await analyzeImageLocally(img);
      setStep("重要な要素を検出しています...");
      const rawDetections = await detector.detect(img);
      setStep("不自然な特徴を確認しています...");
      const reportData = buildForensicReport({
        metrics,
        detections: rawDetections.map((detection, index) => ({
          ...detection,
          cropDataUrl: cropImageDataUrl(img, detection.boundingBox) ?? undefined,
          sourceLabel: detection.sourceLabel ?? detection.className,
          id: detection.id || `obj-${String(index + 1).padStart(3, "0")}`
        })),
        demoMode,
        webGpuAvailable,
        backend,
        fileName: name,
        mimeType,
        loadState: detector.getState()
      });
      setStep("証拠を統合しています...");
      setReport({ ...reportData, imageSource: { type: sourceType, name, mimeType } });
      setStep("完了");
    } catch (err) {
      const message = err instanceof Error ? err.message : "解析に失敗しました。";
      setError(message);
      setModelError(message);
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
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Backend: {backend}</span>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <ImageUploader onFileSelected={(file) => void handleUpload(file)} onUrlSubmit={(url) => void handleUrl(url)} />
          <AnalysisProgress step={step} />
          {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          {modelError ? <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{modelError}</div> : null}
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
      {report ? (
        <section className="grid gap-4 rounded-3xl border border-white/10 bg-panel/80 p-6">
          <h2 className="text-lg font-semibold">検出オーバーレイと切り出し</h2>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {preview ? <img src={preview} alt="overlay source" className="block w-full" /> : null}
            {report.detections.map((detection) => {
              const box = detection.boundingBox;
              return (
                <div
                  key={detection.id}
                  className="pointer-events-none absolute border-2 border-cyan-300"
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`
                  }}
                >
                  <span className="absolute left-0 top-0 -translate-y-full bg-cyan-300 px-2 py-1 text-xs font-semibold text-slate-950">
                    {detection.className} {Math.round(detection.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {report.elements.map((item) =>
              item.detection?.cropDataUrl ? (
                <figure key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <img src={item.detection.cropDataUrl} alt={item.name} className="h-40 w-full rounded-xl object-cover" />
                  <figcaption className="mt-2 text-sm text-slate-200">
                    {item.name} {Math.round(item.visualConfidence * 100)}%
                  </figcaption>
                </figure>
              ) : null
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
