export type ExplanationLevel = "brief" | "standard" | "detailed";

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
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  suspiciousFeatures: SuspiciousFeature[];
};

export type EvidenceItem = {
  type: string;
  strength: number;
  description: string;
};

export type GeminiAnalysisResponse = {
  overallAssessment: {
    aiGeneratedScore: number;
    aiEditedScore: number;
    compositeScore: number;
    handDrawnScore: number;
    ordinaryPhotoScore: number;
    uncertaintyScore: number;
  };
  elements: ElementAnalysis[];
  globalEvidence: EvidenceItem[];
  limitations: string[];
};

export type AnalysisReport = {
  mode: "demo" | "live";
  imageSource: { type: "upload" | "url"; name: string; mimeType: string };
  summary: string;
  overallAssessment: GeminiAnalysisResponse["overallAssessment"];
  elements: ElementAnalysis[];
  globalEvidence: EvidenceItem[];
  limitations: string[];
  reasons: string[];
  diagnostics: {
    requestCount: number;
    durationMs: number;
    demoMode: boolean;
    model: string;
  };
};
