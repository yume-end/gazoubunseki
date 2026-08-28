import type { BoundingBox, DetectedObject, EvidenceItem, LocalImageMetrics } from "@/types/analysis";

const FORNSIC_CLASS_WEIGHTS: Record<string, { importance: number; evidence: string[] }> = {
  person: { importance: 0.95, evidence: ["人物は人体構造や手指の整合性確認に有用です。"] },
  face: { importance: 0.96, evidence: ["顔は境界や目鼻口の不整合確認に有用です。"] },
  tv: { importance: 0.82, evidence: ["テレビはロゴ、反射、画面境界の確認に有用です。"] },
  laptop: { importance: 0.88, evidence: ["PCは画面反射やキーボード配置の整合性確認に有用です。"] },
  keyboard: { importance: 0.72, evidence: ["反復配列の自然さを確認できます。"] },
  "cell phone": { importance: 0.84, evidence: ["端末は反射やエッジの整合性確認に有用です。"] },
  book: { importance: 0.55, evidence: ["テキストや矩形境界の確認に使えます。"] },
  bottle: { importance: 0.5, evidence: ["透明物体や反射の分析に使えます。"] },
  cup: { importance: 0.48, evidence: ["反射や影の整合性確認に使えます。"] },
  chair: { importance: 0.62, evidence: ["家具の脚や遠近感の確認に有用です。"] },
  couch: { importance: 0.68, evidence: ["面の一貫性や影の確認に有用です。"] },
  "dining table": { importance: 0.7, evidence: ["平面のパースや接地感の確認に有用です。"] },
  "potted plant": { importance: 0.45, evidence: ["葉の繰り返しや自然物としての統一感に使えます。"] },
  mirror: { importance: 0.9, evidence: ["反射の整合性確認に強く有用です。"] },
  window: { importance: 0.86, evidence: ["反射や外光の整合性確認に有用です。"] },
  clock: { importance: 0.8, evidence: ["文字と針の整合性を確認できます。"] },
  car: { importance: 0.88, evidence: ["車体の対称性や反射の整合性確認に有用です。"] },
  truck: { importance: 0.84, evidence: ["車体の構造的整合性を確認できます。"] },
  bus: { importance: 0.78, evidence: ["窓や車体の反復パターンを確認できます。"] },
  train: { importance: 0.8, evidence: ["車両の反復構造や窓配置確認に使えます。"] }
};

function normalizeClassName(className: string) {
  return className.trim().toLowerCase().replace(/_/g, " ");
}

function toTitle(className: string) {
  return className
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function relevanceForClass(className: string) {
  const key = normalizeClassName(className);
  return FORNSIC_CLASS_WEIGHTS[key] ?? { importance: 0.42, evidence: ["要素分析に利用できる一般的な物体です。"] };
}

export function selectRelevantObjects(objects: DetectedObject[], threshold = 0.35) {
  return objects
    .map((obj) => {
      const relevance = relevanceForClass(obj.className);
      const relevanceScore = obj.confidence * relevance.importance;
      return {
        ...obj,
        forensicRelevance: relevance.importance,
        relevanceScore
      };
    })
    .filter((item) => item.confidence >= threshold || (item.relevanceScore ?? 0) >= 0.3)
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, 6);
}

export function boxToPixelRect(box: BoundingBox, width: number, height: number) {
  return {
    x: Math.round(box.x * width),
    y: Math.round(box.y * height),
    width: Math.round(box.width * width),
    height: Math.round(box.height * height)
  };
}

export function cropImageDataUrl(source: HTMLImageElement, box: BoundingBox) {
  const canvas = document.createElement("canvas");
  const rect = boxToPixelRect(box, source.width, source.height);
  canvas.width = Math.max(1, rect.width);
  canvas.height = Math.max(1, rect.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return canvas.toDataURL("image/png");
}

export function createElementAnalyses(detections: DetectedObject[], metrics: LocalImageMetrics) {
  return detections.map((detection) => {
    const relevance = relevanceForClass(detection.className);
    const suspiciousFeatures = [
      ...(metrics.compressionArtifactsScore > 0.55 ? [{ type: "compression", strength: metrics.compressionArtifactsScore, description: "局所的に圧縮差や再保存跡が疑われます。" }] : []),
      ...(metrics.repetitionScore > 0.4 ? [{ type: "repetition", strength: metrics.repetitionScore, description: "繰り返しパターンが見られます。" }] : []),
      ...(metrics.symmetryScore > 0.75 ? [{ type: "reflection", strength: metrics.symmetryScore, description: "対称性が強く、反射や整列の可能性があります。" }] : [])
    ];

    return {
      id: detection.id,
      name: toTitle(detection.className),
      description: `${toTitle(detection.className)} として検出された重要要素`,
      importance: relevance.importance,
      possibleBrand: null,
      possibleModel: null,
      visualConfidence: detection.confidence,
      boundingBox: detection.boundingBox,
      suspiciousFeatures: suspiciousFeatures.length > 0 ? suspiciousFeatures : [{ type: "structure", strength: 0.25, description: "構造的整合性は概ね維持されています。" }],
      detection
    };
  });
}

export function detectionsToEvidence(detections: DetectedObject[]): EvidenceItem[] {
  return detections.slice(0, 6).map((detection) => ({
    type: detection.className,
    strength: detection.confidence,
    description: `${toTitle(detection.className)} を検出しました。`
  }));
}
