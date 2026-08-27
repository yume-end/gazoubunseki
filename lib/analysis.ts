import type { AnalysisReport, ElementAnalysis, EvidenceItem, LocalImageMetrics, OverallAssessment, SuspiciousFeature } from "@/types/analysis";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pct(value: number) {
  return Math.round(clamp(value) * 100);
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
  let textLikeCount = 0;
  let repetitionHits = 0;
  let compressionHits = 0;

  const rowAverages = new Array<number>(height).fill(0);
  const colAverages = new Array<number>(width).fill(0);
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
      rowAverages[y] += brightness;
      colAverages[x] += brightness;

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

  const textLikeScore = clamp(edgeDensity * 2 + (0.5 - avgBrightness) * 0.3 + contrast * 0.6);
  const skinLikeScore = clamp((skinCount / pixelCount) * 4);
  const repetitionScore = clamp(repetitionHits / Math.max(1, height * 2));
  const compressionArtifactsScore = clamp(compressionHits / Math.max(1, height * 1.5));

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
    textLikeScore,
    skinLikeScore,
    repetitionScore,
    compressionArtifactsScore
  };
}

function chooseLabel(metrics: LocalImageMetrics): { name: string; description: string; brand: string | null; model: string | null; confidence: number; importance: number }[] {
  const labels = [
    { name: "text", description: "文字や記号がありそうな領域", brand: null, model: null, confidence: metrics.textLikeScore, importance: 0.95 },
    { name: "face or person", description: "人物や顔らしさの兆候", brand: null, model: null, confidence: metrics.skinLikeScore, importance: 0.9 },
    { name: "repeated pattern", description: "繰り返し模様やテクスチャのまとまり", brand: null, model: null, confidence: metrics.repetitionScore, importance: 0.72 },
    { name: "reflective surface", description: "鏡やガラスや反射物の可能性", brand: null, model: null, confidence: metrics.symmetryScore, importance: 0.76 },
    { name: "generic object", description: "追加の要素分析に有用な物体候補", brand: null, model: null, confidence: clamp(0.4 + metrics.contrast * 0.4), importance: 0.6 }
  ];
  return labels.sort((a, b) => b.importance - a.importance).slice(0, 4);
}

function makeFeatures(metrics: LocalImageMetrics, label: string): SuspiciousFeature[] {
  const features: SuspiciousFeature[] = [];
  if (metrics.compressionArtifactsScore > 0.55) features.push({ type: "compression", strength: metrics.compressionArtifactsScore, description: "局所的にJPEG由来の圧縮差や再保存跡が疑われます。" });
  if (metrics.repetitionScore > 0.4) features.push({ type: "repetition", strength: metrics.repetitionScore, description: "似た模様や繰り返しが目立ち、合成や拡張の可能性があります。" });
  if (metrics.textLikeScore > 0.45 && label.includes("text")) features.push({ type: "text", strength: metrics.textLikeScore, description: "文字らしい輪郭はありますが、形状が不安定な可能性があります。" });
  if (metrics.symmetryScore > 0.75) features.push({ type: "reflection", strength: metrics.symmetryScore, description: "左右対称性が強く、鏡面や人工的な整列の可能性があります。" });
  if (metrics.skinLikeScore > 0.35) features.push({ type: "anatomy", strength: metrics.skinLikeScore, description: "皮膚らしさはあるものの、人体構造の整合性を追加確認したい領域です。" });
  if (metrics.contrast < 0.18) features.push({ type: "blur", strength: clamp(0.5 - metrics.contrast), description: "全体のコントラストが低く、ぼけや一様化の影響があるかもしれません。" });
  return features.slice(0, 3);
}

export function analyzeLocally(metrics: LocalImageMetrics, opts: { demoMode: boolean; webGpuAvailable: boolean; imageType: string; fileName: string }): AnalysisReport {
  const labels = chooseLabel(metrics);
  const elements: ElementAnalysis[] = labels.map((label, index) => ({
    id: `element_${String(index + 1).padStart(3, "0")}`,
    name: label.name,
    description: label.description,
    importance: label.importance,
    possibleBrand: null,
    possibleModel: null,
    visualConfidence: label.confidence,
    boundingBox: null,
    suspiciousFeatures: makeFeatures(metrics, label.name)
  }));

  const globalEvidence: EvidenceItem[] = [
    { type: "edge_density", strength: metrics.edgeDensity, description: "エッジの密度から、細部の情報量を推定しました。" },
    { type: "symmetry", strength: metrics.symmetryScore, description: "左右対称性の強さを確認しました。" },
    { type: "compression", strength: metrics.compressionArtifactsScore, description: "再保存や圧縮跡の可能性を推定しました。" },
    { type: "repetition", strength: metrics.repetitionScore, description: "模様の繰り返しや複製感を推定しました。" }
  ];

  const aiGeneratedScore = clamp(0.25 + metrics.repetitionScore * 0.35 + metrics.compressionArtifactsScore * 0.25 + (0.2 - metrics.contrast) * 0.4);
  const aiEditedScore = clamp(0.18 + metrics.compressionArtifactsScore * 0.45 + metrics.textLikeScore * 0.12);
  const compositeScore = clamp(0.15 + metrics.repetitionScore * 0.3 + metrics.symmetryScore * 0.2);
  const handDrawnScore = clamp(0.1 + (0.35 - metrics.edgeDensity) * 0.4 + metrics.textLikeScore * 0.1);
  const ordinaryPhotoScore = clamp(0.35 + metrics.edgeDensity * 0.2 + metrics.contrast * 0.25 - metrics.compressionArtifactsScore * 0.2);
  const uncertaintyScore = clamp(1 - Math.max(aiGeneratedScore, aiEditedScore, compositeScore, handDrawnScore, ordinaryPhotoScore) + 0.08);

  const overallAssessment: OverallAssessment = {
    aiGeneratedScore,
    aiEditedScore,
    compositeScore,
    handDrawnScore,
    ordinaryPhotoScore,
    uncertaintyScore
  };

  const derivedScores = {
    aiManipulationScore: clamp((aiGeneratedScore + aiEditedScore + compositeScore) / 3),
    consistencyScore: clamp(ordinaryPhotoScore + (1 - uncertaintyScore) * 0.25)
  };

  const reasons = [
    metrics.textLikeScore > 0.45 ? "文字領域に不安定なエッジや圧縮差の兆候があります。" : "文字らしい領域は強くは検出されませんでした。",
    metrics.repetitionScore > 0.4 ? "繰り返しパターンがやや強く、合成や生成の可能性を少し押し上げます。" : "繰り返し模様は強くありません。",
    metrics.symmetryScore > 0.75 ? "左右対称性が高く、反射や人工的な整列を示す可能性があります。" : "左右対称性は強くありません。",
    metrics.compressionArtifactsScore > 0.55 ? "局所的な圧縮特性が不均一で、再保存や部分編集の可能性があります。" : "強い圧縮破綻は見つかりませんでした。"
  ];

  const limitations = [
    "このアプリは画像の視覚的特徴をAI・画像解析技術によって分析し、AI生成・加工・合成などの可能性を推定する実験的ツールです。結果は確定的な証拠ではありません。",
    "JPEG再保存やスクリーンショットなどによって画像特徴が変化する可能性があります。",
    opts.webGpuAvailable ? "WebGPU は利用可能ですが、現行 MVP では主に Canvas ベースのローカル解析を使っています。" : "WebGPU はこの環境で検出できませんでした。"
  ];

  return {
    mode: opts.demoMode ? "demo" : "live",
    imageSource: { type: "upload", name: opts.fileName, mimeType: opts.imageType },
    summary: opts.demoMode ? "Demo Mode のため、これはローカル解析の挙動を示すサンプルです。" : "ローカル画像統計をもとに、複数の仮説を比較しました。",
    overallAssessment,
    modelScores: overallAssessment,
    derivedScores,
    elements,
    globalEvidence,
    limitations,
    reasons,
    diagnostics: {
      requestCount: 0,
      durationMs: 0,
      demoMode: opts.demoMode,
      model: opts.webGpuAvailable ? "browser-local-canvas+webgpu-detected" : "browser-local-canvas",
      webGpuAvailable: opts.webGpuAvailable
    }
  };
}

export function explanationForLevel(report: AnalysisReport, level: "brief" | "standard" | "detailed") {
  if (level === "brief") return [report.summary];
  if (level === "standard") return [report.summary, ...report.reasons.slice(0, 4)];
  return [report.summary, ...report.reasons, ...report.limitations];
}
