export type ExplanationLevel = "brief" | "standard" | "detailed";

export type BoundingBox = { x: number; y: number; width: number; height: number };

export type SuspiciousFeature = {
  type: string;
  strength: number;
  description: string;
};

export type DetectedObject = {
  id: string;
  className: string;
  confidence: number;
  boundingBox: BoundingBox;
  sourceLabel?: string;
  cropDataUrl?: string;
  forensicRelevance?: number;
  relevanceScore?: number;
};

export type ElementAnalysis = {
  id: string;
  name: string;
  description: string;
  importance: number;
  possibleBrand: string | null;
  possibleModel: string | null;
  visualConfidence: number;
  forensicRelevance?: number;
  boundingBox: BoundingBox | null;
  suspiciousFeatures: SuspiciousFeature[];
  detection?: DetectedObject;
};

export type EvidenceItem = {
  type: string;
  strength: number;
  description: string;
};

export type OverallAssessment = {
  aiGeneratedScore: number | null;
  aiEditedScore: number | null;
  compositeScore: number | null;
  handDrawnScore: number | null;
  ordinaryPhotoScore: number | null;
  uncertaintyScore: number;
};

export type PerformanceInfo = {
  modelLoadTimeMs: number | null;
  firstInferenceTimeMs: number | null;
  subsequentInferenceTimeMs: number | null;
  preprocessingTimeMs: number | null;
  totalInferenceTimeMs: number | null;
};

export type ProcessingInfo = {
  inferenceBackend: "webgpu" | "wasm" | "unavailable";
  objectDetectionModel: string;
  modelVersion: string | null;
  processingTimeMs: number;
  backendFallback: {
    occurred: boolean;
    from: "webgpu" | "wasm" | "unavailable" | null;
    to: "webgpu" | "wasm" | "unavailable" | null;
    reason: string | null;
  };
  performance: PerformanceInfo;
};

export type AnalysisReport = {
  mode: "demo" | "live";
  imageSource: { type: "upload" | "url"; name: string; mimeType: string };
  summary: string;
  overallAssessment: OverallAssessment;
  modelScores: OverallAssessment;
  derivedScores: {
    aiManipulationScore: number;
    consistencyScore: number;
  };
  detections: DetectedObject[];
  elements: ElementAnalysis[];
  globalEvidence: EvidenceItem[];
  limitations: string[];
  reasons: string[];
  processingInfo: ProcessingInfo;
  diagnostics: {
    requestCount: number;
    durationMs: number;
    demoMode: boolean;
    model: string;
    webGpuAvailable: boolean;
    backend: "webgpu" | "wasm" | "unavailable";
    loadState: "idle" | "loading" | "ready" | "error";
  };
};

export type LocalImageMetrics = {
  width: number;
  height: number;
  averageBrightness: number;
  brightnessStdDev: number;
  contrast: number;
  edgeDensity: number;
  colorVariance: number;
  saturationVariance: number;
  symmetryScore: number;
  textLikeScore: number;
  skinLikeScore: number;
  repetitionScore: number;
  compressionArtifactsScore: number;
};
