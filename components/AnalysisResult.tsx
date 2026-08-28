import type { AnalysisReport, ExplanationLevel } from "@/types/analysis";
import { explanationForLevel } from "@/lib/analysis";
import { buildYolosEvaluationSummary } from "@/lib/ai/evaluation";

export function AnalysisResult({ report, level }: { report: AnalysisReport; level: ExplanationLevel }) {
  const explanationLines = explanationForLevel(report, level);
  const evaluation = buildYolosEvaluationSummary(report.detections.length);
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

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">Model Score</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            <li>・AI生成: {report.modelScores.aiGeneratedScore == null ? "未導入" : `${report.modelScores.aiGeneratedScore}%`}</li>
            <li>・AI編集: {report.modelScores.aiEditedScore == null ? "未導入" : `${report.modelScores.aiEditedScore}%`}</li>
            <li>・合成: {report.modelScores.compositeScore == null ? "未導入" : `${report.modelScores.compositeScore}%`}</li>
            <li>・手描き: {report.modelScores.handDrawnScore == null ? "未導入" : `${report.modelScores.handDrawnScore}%`}</li>
            <li>・普通の写真: {report.modelScores.ordinaryPhotoScore == null ? "未導入" : `${report.modelScores.ordinaryPhotoScore}%`}</li>
            <li>・不確実性: {report.modelScores.uncertaintyScore}%</li>
          </ul>
        </section>
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">Derived Score</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            <li>・AI操作総合: {Math.round(report.derivedScores.aiManipulationScore * 100)}%</li>
            <li>・整合性: {Math.round(report.derivedScores.consistencyScore * 100)}%</li>
          </ul>
        </section>
      </div>

      <p className="rounded-2xl bg-white/5 p-4 text-sm leading-7">{explanationLines.join("\n")}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">YOLOS-tiny Evaluation</h3>
          <ul className="grid gap-2 text-sm text-slate-200">
            <li>・Model: {evaluation.model}</li>
            <li>・Images tested: {evaluation.imagesTested}</li>
            <li>・air conditioner: not supported by current model</li>
            <li>・mirror: not a dedicated class in current model</li>
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
                <div>検出信頼度 {Math.round(item.visualConfidence * 100)}%</div>
                {typeof item.forensicRelevance === "number" ? (
      <div>フォレンジック重要度 {Math.round(item.forensicRelevance * 100)}%</div>
    ) : null}
                {item.possibleBrand ? <div>AI visual identification: {item.possibleBrand}</div> : null}
                {item.possibleModel ? <div>Model: {item.possibleModel}</div> : null}
                {item.suspiciousFeatures.map((feature) => (
                  <div key={`${item.id}-${feature.type}`}>・{feature.type}: {feature.description}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">
        <div>分析は実験的な AI 画像真正性分析です。確定的な証拠ではありません。</div>
        <div className="mt-2 grid gap-1 text-xs text-cyan-100/80">
          <div>request count: {report.diagnostics.requestCount}</div>
          <div>analysis duration: {report.diagnostics.durationMs}ms</div>
          <div>Demo Mode: {report.diagnostics.demoMode ? "on" : "off"}</div>
          <div>model: {report.diagnostics.model}</div>
          <div>inference backend: {report.processingInfo.inferenceBackend}</div>
          <div>model load: {report.processingInfo.performance.modelLoadTimeMs ?? "n/a"}ms</div>
          <div>first inference: {report.processingInfo.performance.firstInferenceTimeMs ?? "n/a"}ms</div>
          <div>subsequent inference: {report.processingInfo.performance.subsequentInferenceTimeMs ?? "n/a"}ms</div>
          <div>preprocessing: {report.processingInfo.performance.preprocessingTimeMs ?? "n/a"}ms</div>
          <div>total inference: {report.processingInfo.performance.totalInferenceTimeMs ?? "n/a"}ms</div>
          <div>fallback: {report.processingInfo.backendFallback.occurred ? `${report.processingInfo.backendFallback.from} → ${report.processingInfo.backendFallback.to}` : "none"}</div>
        </div>
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value == null ? "未導入" : `${value}%`}</div>
    </div>
  );
}
