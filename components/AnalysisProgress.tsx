"use client";

export function AnalysisProgress({ step }: { step: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel/60 p-5 text-sm text-muted">
      <div className="mb-2 text-white">画像を解析しています...</div>
      <div>{step}</div>
      <div className="mt-3 text-xs leading-6 text-slate-400">✓ 画像を読み込みました<br />✓ 画像内の重要な要素を検出しました<br />✓ 不自然な特徴を分析しました<br />✓ 総合評価を作成しています</div>
    </div>
  );
}
