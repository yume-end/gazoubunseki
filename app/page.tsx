"use client";

import { useMemo, useState } from "react";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ImageUploader } from "@/components/ImageUploader";
import { analyzeMock } from "@/lib/analysis";
import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";

export default function Page() {
  const [level, setLevel] = useState<ExplanationLevel>("standard");
  const [step, setStep] = useState("待機中");
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  const analysisMode = useMemo(() => (process.env.NEXT_PUBLIC_USE_MOCK === "true" ? "mock" : "mock"), []);

  async function handleImageReady(payload: { sourceType: "upload" | "url"; name: string; mimeType: string; dataUrl: string }) {
    setPreview(payload.dataUrl);
    setStep("画像を読み込みました");
    setReport(null);
    setStep("AIが画像内の要素を検出しています...");
    const result = await analyzeMock({ type: payload.sourceType, name: payload.name, mimeType: payload.mimeType });
    setStep("分析結果をまとめています...");
    setReport(result);
    setStep("完了");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="grid gap-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">画像フォレンジックAI</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">画像の要素を検出し、Web照合の証拠をもとに真正性を説明する MVP</h1>
        <p className="max-w-3xl text-base leading-7 text-muted">画像をアップロード、またはURLを入力すると、要素抽出・照合・総合評価までを一続きで確認できます。現在は開発用モック中心ですが、Vercel向けに拡張しやすい構造です。</p>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-100">解析モード: {analysisMode}</div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <ImageUploader onImageReady={(payload) => void handleImageReady(payload)} />
          <AnalysisProgress step={step} />
        </div>
        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-panel/60 p-5">
            <div className="mb-3 text-sm text-muted">説明レベル</div>
            <div className="flex gap-2">
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
