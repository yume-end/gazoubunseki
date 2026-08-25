import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";

export function AnalysisResult({ report, level }: { report: AnalysisReport; level: ExplanationLevel }) {
  const percent = Math.round(report.aiGenerationLikelihood * 100);
  const realPercent = Math.round(report.realImageLikelihood * 100);
  return (
    <div className="grid gap-5 rounded-3xl border border-white/10 bg-panel/80 p-6">
      <div className="grid gap-2">
        <p className="text-sm text-muted">総合評価</p>
        <div className="text-3xl font-bold">{percent}% AI生成・加工の可能性</div>
        <p className="text-sm text-muted">実写・既存画像らしさ: {realPercent}%</p>
      </div>
      <p className="rounded-2xl bg-white/5 p-4 text-sm leading-7">{report.summary}</p>
      {level !== "brief" ? (
        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">証拠</h2>
          <ul className="grid gap-2 text-sm text-slate-200">
            {report.reasons.map((reason) => <li key={reason} className="rounded-2xl bg-white/5 px-4 py-3">{reason}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">画像内の特徴</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            {report.imageFindings.map((item) => <li key={item}>・{item}</li>)}
          </ul>
        </section>
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">合成・加工の観点</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            {report.collageFindings.map((item) => <li key={item}>・{item}</li>)}
          </ul>
        </section>
      </div>
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">要素別分析</h3>
        <div className="grid gap-4">
          {report.elementAnalyses.map((item) => (
            <div key={item.elementId} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{item.elementName}</div>
                  <div className="text-sm text-muted">{item.summary}</div>
                </div>
                <div className="text-sm text-muted">信頼度 {Math.round(item.confidence * 100)}%</div>
              </div>
              <ul className="mt-3 grid gap-2 text-sm text-slate-200">
                {item.evidence.map((e) => <li key={e}>・{e}</li>)}
              </ul>
              {item.bestMatch ? <p className="mt-3 text-sm text-cyan-200">最良候補: {item.bestMatch.title} ({Math.round(item.bestMatch.similarity * 100)}%)</p> : null}
            </div>
          ))}
        </div>
      </div>
      {level === "detailed" && report.rawNotes ? <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">開発メモ: {report.rawNotes}</p> : null}
    </div>
  );
}
