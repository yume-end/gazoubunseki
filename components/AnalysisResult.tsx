import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";
import { explanationForLevel } from "@/lib/analysis";

export function AnalysisResult({ report, level }: { report: AnalysisReport; level: ExplanationLevel }) {
  const explanation = explanationForLevel(report, level);
  return (
    <div className="grid gap-5 rounded-3xl border border-white/10 bg-panel/80 p-6">
      <div className="grid gap-3">
        <p className="text-sm text-muted">総合評価</p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <Score label="AI生成の可能性" value={report.overallAssessment.aiGeneratedScore} />
          <Score label="AI編集の可能性" value={report.overallAssessment.aiEditedScore} />
          <Score label="合成の可能性" value={report.overallAssessment.compositeScore} />
          <Score label="手描きの可能性" value={report.overallAssessment.handDrawnScore} />
          <Score label="普通の写真の可能性" value={report.overallAssessment.ordinaryPhotoScore} />
          <Score label="不確実性" value={report.overallAssessment.uncertaintyScore} />
        </div>
      </div>
      <p className="rounded-2xl bg-white/5 p-4 text-sm leading-7">{explanation.body.join("\n")}</p>
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
        Web image/source verification is not included in this zero-cost prototype.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">全体の証拠</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            {report.globalEvidence.map((item) => <li key={`${item.type}-${item.description}`}>・{item.type}: {item.description}</li>)}
          </ul>
        </section>
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">注意事項</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            {report.limitations.map((item) => <li key={item}>・{item}</li>)}
          </ul>
        </section>
      </div>
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">要素別分析</h3>
        <div className="grid gap-4">
          {report.elements.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted">{item.description}</div>
                </div>
                <div className="text-sm text-muted">重要度 {Math.round(item.importance * 100)}%</div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-200">
                <div>視覚信頼度 {Math.round(item.visualConfidence * 100)}%</div>
                {item.possibleBrand ? <div>AI visual identification: {item.possibleBrand}</div> : null}
                {item.possibleModel ? <div>Model: {item.possibleModel}</div> : null}
                {item.suspiciousFeatures.map((feature) => <div key={`${item.id}-${feature.type}`}>・{feature.type}: {feature.description}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">
        <div>分析は実験的な AI 画像真正性分析です。確定的な証拠ではありません。</div>
        <div className="mt-2 grid gap-1 text-xs text-cyan-100/80">
          <div>Gemini request count: {report.diagnostics.requestCount}</div>
          <div>analysis duration: {report.diagnostics.durationMs}ms</div>
          <div>Demo Mode: {report.diagnostics.demoMode ? "on" : "off"}</div>
          <div>model: {report.diagnostics.model}</div>
        </div>
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}%</div>
    </div>
  );
}
