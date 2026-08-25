"use client";

import { useEffect, useState } from "react";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ImageUploader } from "@/components/ImageUploader";
import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";

export default function Page() {
  const [level, setLevel] = useState<ExplanationLevel>("standard");
  const [step, setStep] = useState("待機中");
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [modelName, setModelName] = useState<string>("gemini-3-flash");

  useEffect(() => {
    let mounted = true;
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: { demoMode?: boolean; model?: string }) => {
        if (!mounted) return;
        setDemoMode(Boolean(data.demoMode));
        if (data.model) setModelName(data.model);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  async function handleImageReady(payload: { sourceType: "upload" | "url"; name: string; mimeType: string; dataUrl: string }) {
    setPreview(payload.dataUrl);
    setError(null);
    setReport(null);
    setStep("画像を読み込みました");
    setStep("Gemini が画像内の重要な要素を検出しています...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { report?: AnalysisReport; error?: string };
      if (!response.ok || !data.report) throw new Error(data.error ?? "解析に失敗しました。");
      setStep("不自然な特徴を分析しました");
      setReport(data.report);
      setStep("総合評価を作成しています...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました。");
      setStep("エラーが発生しました");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="grid gap-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">AI画像真正性分析</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">画像フォレンジックAI</h1>
        <p className="max-w-3xl text-base leading-7 text-muted">画像をアップロードするか、画像URLを入力してください。Gemini の無料枠を使った zero-cost prototype として、重要要素の検出と視覚的な不自然さの分析を行います。</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-100">Web image/source verification is not included in this zero-cost prototype.</div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">画像は解析のため Gemini API に送信されます。画像は永続保存しません。</div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-300">
          {demoMode ? <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-100">Demo Mode</span> : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Model: {modelName}</span>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <ImageUploader onImageReady={(payload) => void handleImageReady(payload)} />
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
