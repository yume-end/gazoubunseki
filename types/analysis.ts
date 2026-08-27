export type ExplanationLevel = "brief" | "standard" | "detailed";

export type BoundingBox = { x: number; y: number; width: number; height: number };

export type SuspiciousFeature = {
  type: string;
  strength: number;
  description: string;
};

export type ElementAnalysis = {
  id: string;
  name: string;
  description: string;
  importance: number;
  possibleBrand: string | null;
  possibleModel: string | null;
  visualConfidence: number;
  boundingBox: BoundingBox | null;
  suspiciousFeatures: SuspiciousFeature[];
};

export type EvidenceItem = {
  type: string;
  strength: number;
  description: string;
};

export type OverallAssessment = {
  aiGeneratedScore: number;
  aiEditedScore: number;
  compositeScore: number;
  handDrawnScore: number;
  ordinaryPhotoScore: number;
  uncertaintyScore: number;
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
  elements: ElementAnalysis[];
  globalEvidence: EvidenceItem[];
  limitations: string[];
  reasons: string[];
  diagnostics: {
    requestCount: number;
    durationMs: number;
    demoMode: boolean;
    model: string;
    webGpuAvailable: boolean;
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
