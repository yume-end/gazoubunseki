import type { AnalysisReport, GeminiAnalysisResponse, ExplanationLevel } from "@/types/analysis";

export function normalizeScore(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
}

export function parseGeminiAnalysis(raw: string): GeminiAnalysisResponse {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  let parsed: Partial<GeminiAnalysisResponse>;
  try {
    parsed = JSON.parse(cleaned) as Partial<GeminiAnalysisResponse>;
  } catch {
    throw new Error("Gemini の応答を JSON として解析できませんでした。");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Gemini の応答を JSON として解析できませんでした。");

  const overall = parsed.overallAssessment ?? {};
  return {
    overallAssessment: {
      aiGeneratedScore: normalizeScore(overall.aiGeneratedScore),
      aiEditedScore: normalizeScore(overall.aiEditedScore),
      compositeScore: normalizeScore(overall.compositeScore),
      handDrawnScore: normalizeScore(overall.handDrawnScore),
      ordinaryPhotoScore: normalizeScore(overall.ordinaryPhotoScore),
      uncertaintyScore: normalizeScore(overall.uncertaintyScore)
    },
    elements: Array.isArray(parsed.elements)
      ? parsed.elements.map((element, index) => ({
          id: typeof element?.id === "string" ? element.id : `element_${String(index + 1).padStart(3, "0")}`,
          name: typeof element?.name === "string" ? element.name : "unknown",
          description: typeof element?.description === "string" ? element.description : "",
          importance: normalizeScore(element?.importance),
          possibleBrand: typeof element?.possibleBrand === "string" ? element.possibleBrand : null,
          possibleModel: typeof element?.possibleModel === "string" ? element.possibleModel : null,
          visualConfidence: normalizeScore(element?.visualConfidence),
          boundingBox: element?.boundingBox && typeof element.boundingBox === "object" ? element.boundingBox : null,
          suspiciousFeatures: Array.isArray(element?.suspiciousFeatures)
            ? element.suspiciousFeatures.map((feature) => ({
                type: String(feature?.type ?? "unknown"),
                strength: normalizeScore(feature?.strength),
                description: String(feature?.description ?? "")
              }))
            : []
        }))
      : [],
    globalEvidence: Array.isArray(parsed.globalEvidence)
      ? parsed.globalEvidence.map((item) => ({
          type: String(item?.type ?? "unknown"),
          strength: normalizeScore(item?.strength),
          description: String(item?.description ?? "")
        }))
      : [],
    limitations: Array.isArray(parsed.limitations) ? parsed.limitations.map(String) : []
  };
}
