export function AnalysisProgress({ step }: { step: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel/60 p-5 text-sm text-muted">
      <div className="mb-2 text-white">解析しています...</div>
      <div>{step}</div>
    </div>
  );
}
