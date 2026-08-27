import type { AnalysisReport, DetectedObject, ElementAnalysis, EvidenceItem, LocalImageMetrics, OverallAssessment } from "@/types/analysis";
import { createElementAnalyses, detectionsToEvidence, selectRelevantObjects } from "@/lib/ai/object-detector";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function detectWebGpuSupport() {
  return typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

export async function analyzeImageLocally(img: HTMLImageElement): Promise<LocalImageMetrics> {
  const canvas = document.createElement("canvas");
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas を初期化できませんでした。");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let brightnessSum = 0;
  let brightnessSq = 0;
  let saturationSum = 0;
  let saturationSq = 0;
  let edgeCount = 0;
  let skinCount = 0;
  let repetitionHits = 0;
  let compressionHits = 0;
  const sampleRows = new Map<number, number[]>();

  const getBrightness = (r: number, g: number, b: number) => (r + g + b) / 3 / 255;
  const getSaturation = (r: number, g: number, b: number) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a === 0) continue;
      const brightness = getBrightness(r, g, b);
      const saturation = getSaturation(r, g, b);
      brightnessSum += brightness;
      brightnessSq += brightness * brightness;
      saturationSum += saturation;
      saturationSq += saturation * saturation;

      if (r > 95 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 15 && r > g && r > b) {
        skinCount += 1;
      }
      if (x > 0 && y > 0) {
        const leftIdx = (y * width + (x - 1)) * 4;
        const topIdx = ((y - 1) * width + x) * 4;
        const leftBrightness = getBrightness(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]);
        const topBrightness = getBrightness(data[topIdx], data[topIdx + 1], data[topIdx + 2]);
        const edgeScore = Math.abs(brightness - leftBrightness) + Math.abs(brightness - topBrightness);
        if (edgeScore > 0.45) edgeCount += 1;
      }

      const rowBucket = Math.floor(y / 8);
      const bucket = sampleRows.get(rowBucket) ?? [];
      bucket.push(Math.round(brightness * 255));
      sampleRows.set(rowBucket, bucket);
    }
  }

  const pixelCount = width * height;
  const avgBrightness = brightnessSum / pixelCount;
  const brightnessVariance = Math.max(0, brightnessSq / pixelCount - avgBrightness * avgBrightness);
  const avgSaturation = saturationSum / pixelCount;
  const saturationVariance = Math.max(0, saturationSq / pixelCount - avgSaturation * avgSaturation);
  const contrast = Math.sqrt(brightnessVariance);
  const edgeDensity = edgeCount / pixelCount;
  const colorVariance = saturationVariance;

  const symmetryScore = (() => {
    let mirrored = 0;
    let compared = 0;
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 40))) {
      for (let x = 0; x < width / 2; x += Math.max(1, Math.floor(width / 40))) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        const leftBrightness = getBrightness(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]);
        const rightBrightness = getBrightness(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
        mirrored += 1 - Math.abs(leftBrightness - rightBrightness);
        compared += 1;
      }
    }
    return compared > 0 ? clamp(mirrored / compared) : 0;
  })();

  for (const values of sampleRows.values()) {
    for (let i = 1; i < values.length; i += 1) {
      if (Math.abs(values[i] - values[i - 1]) < 4) repetitionHits += 1;
      if (Math.abs(values[i] - values[i - 1]) > 40 && i % 7 === 0) compressionHits += 1;
    }
  }

  return {
    width,
    height,
    averageBrightness: avgBrightness,
    brightnessStdDev: Math.sqrt(brightnessVariance),
    contrast,
    edgeDensity,
    colorVariance,
    saturationVariance,
    symmetryScore,
    textLikeScore: clamp(edgeDensity * 2 + (0.5 - avgBrightness) * 0.3 + contrast * 0.6),
    skinLikeScore: clamp((skinCount / pixelCount) * 4),
    repetitionScore: clamp(repetitionHits / Math.max(1, height * 2)),
    compressionArtifactsScore: clamp(compressionHits / Math.max(1, height * 1.5))
  };
}

export function buildForensicReport(params: {
  metrics: LocalImageMetrics;
  detections: DetectedObject[];
  demoMode: boolean;
  webGpuAvailable: boolean;
  backend: "webgpu" | "wasm" | "unavailable";
  fileName: string;
  mimeType: string;
  loadState: "idle" | "loading" | "ready" | "error";
}): AnalysisReport {
  const relevantDetections = selectRelevantObjects(params.detections);
  const elements = createElementAnalyses(relevantDetections, params.metrics);
  const globalEvidence: EvidenceItem[] = [
    ...detectionsToEvidence(relevantDetections),
    { type: "edge_density", strength: params.metrics.edgeDensity, description: "エッジの密度から、細部の情報量を推定しました。" },
    { type: "symmetry", strength: params.metrics.symmetryScore, description: "左右対称性の強さを確認しました。" },
    { type: "compression", strength: params.metrics.compressionArtifactsScore, description: "再保存や圧縮跡の可能性を推定しました。" },
    { type: "repetition", strength: params.metrics.repetitionScore, description: "模様の繰り返しや複製感を推定しました。" }
  ];

  const aiGeneratedScore = clamp(0.22 + params.metrics.repetitionScore * 0.3 + params.metrics.compressionArtifactsScore * 0.25 + (0.2 - params.metrics.contrast) * 0.4 + Math.min(0.12, relevantDetections.length * 0.02));
  const aiEditedScore = clamp(0.16 + params.metrics.compressionArtifactsScore * 0.4 + params.metrics.textLikeScore * 0.12);
  const compositeScore = clamp(0.15 + params.metrics.repetitionScore * 0.3 + params.metrics.symmetryScore * 0.18);
  const handDrawnScore = clamp(0.08 + (0.35 - params.metrics.edgeDensity) * 0.4 + params.metrics.textLikeScore * 0.08);
  const ordinaryPhotoScore = clamp(0.36 + params.metrics.edgeDensity * 0.2 + params.metrics.contrast * 0.22 - params.metrics.compressionArtifactsScore * 0.2 - relevantDetections.length * 0.01);
  const uncertaintyScore = clamp(1 - Math.max(aiGeneratedScore, aiEditedScore, compositeScore, handDrawnScore, ordinaryPhotoScore) + 0.08);

  const overallAssessment = {
    aiGeneratedScore,
    aiEditedScore,
    compositeScore,
    handDrawnScore,
    ordinaryPhotoScore,
    uncertaintyScore
  };

  const reasons = [
    relevantDetections.length > 0 ? `重要要素として ${relevantDetections.slice(0, 3).map((d) => d.className).join(", ")} を検出しました。` : "重要要素は限定的でした。",
    params.metrics.textLikeScore > 0.45 ? "文字領域に不安定なエッジや圧縮差の兆候があります。" : "文字らしい領域は強くは検出されませんでした。",
    params.metrics.repetitionScore > 0.4 ? "繰り返しパターンがやや強く、合成や生成の可能性を少し押し上げます。" : "繰り返し模様は強くありません。",
    params.metrics.compressionArtifactsScore > 0.55 ? "局所的な圧縮特性が不均一で、再保存や部分編集の可能性があります。" : "強い圧縮破綻は見つかりませんでした。"
  ];

  const limitations = [
    "このアプリは画像の視覚的特徴をAI・画像解析技術によって分析し、AI生成・加工・合成などの可能性を推定する実験的ツールです。結果は確定的な証拠ではありません。",
    "JPEG再保存やスクリーンショットなどによって画像特徴が変化する可能性があります。",
    params.webGpuAvailable ? "WebGPU は利用可能です。" : "WebGPU はこの環境で検出できませんでした。"
  ];

  return {
    mode: params.demoMode ? "demo" : "live",
    imageSource: { type: "upload", name: params.fileName, mimeType: params.mimeType },
    summary: params.demoMode ? "Demo Mode のため、これはローカル解析の挙動を示すサンプルです。" : "ローカル画像統計と物体検出をもとに、複数の仮説を比較しました。",
    overallAssessment,
    modelScores: overallAssessment,
    derivedScores: {
      aiManipulationScore: clamp((aiGeneratedScore + aiEditedScore + compositeScore) / 3),
      consistencyScore: clamp(ordinaryPhotoScore + (1 - uncertaintyScore) * 0.25)
    },
    detections: relevantDetections,
    elements,
    globalEvidence,
    limitations,
    reasons,
    diagnostics: {
      requestCount: 1,
      durationMs: 0,
      demoMode: params.demoMode,
      model: params.backend === "unavailable" ? "unavailable" : `transformers.js ${params.backend}`,
      webGpuAvailable: params.webGpuAvailable,
      backend: params.backend,
      loadState: params.loadState
    }
  };
}

export function explanationForLevel(report: AnalysisReport, level: "brief" | "standard" | "detailed") {
  if (level === "brief") return [report.summary];
  if (level === "standard") return [report.summary, ...report.reasons.slice(0, 4)];
  return [report.summary, ...report.reasons, ...report.limitations];
}
