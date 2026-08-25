export type ExplanationLevel = "brief" | "standard" | "detailed";

export type AnalysisElement = {
  id: string;
  name: string;
  description: string;
  possible_brand?: string;
  possible_model?: string;
  confidence: number;
  importance: number;
};

export type SearchResult = {
  title: string;
  url: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  productName?: string;
};

export type ElementAnalysis = {
  elementId: string;
  elementName: string;
  summary: string;
  evidence: string[];
  searchResults: SearchResult[];
  bestMatch?: {
    title: string;
    url: string;
    similarity: number;
  };
  confidence: number;
};

export type AnalysisReport = {
  mode: "mock" | "live";
  imageSource: { type: "upload" | "url"; name: string; mimeType: string };
  elements: AnalysisElement[];
  elementAnalyses: ElementAnalysis[];
  imageFindings: string[];
  collageFindings: string[];
  summary: string;
  aiGenerationLikelihood: number;
  realImageLikelihood: number;
  reasons: string[];
  rawNotes?: string;
};
