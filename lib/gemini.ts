const DEFAULT_MODEL = "gemini-3-flash";

export function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    demoMode: process.env.DEMO_MODE === "true"
  };
}

export async function analyzeWithGemini(input: { imageDataUrl: string; fileName: string; mimeType: string; model?: string }) {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) throw new Error("GEMINI_API_KEY が設定されていません。");

  const selectedModel = input.model?.trim() || model;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "あなたは画像フォレンジックの補助AIです。画像内の重要な要素と不自然な特徴を分析してください。インターネット検証は行わず、視覚分析だけを返してください。必ずJSONのみを返してください。"
            },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageDataUrl.split(",")[1] ?? ""
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Gemini のレート制限に達しました。しばらく待ってから再試行してください。");
    if (response.status === 404) throw new Error(`指定したモデルが利用できません。GEMINI_MODEL=${selectedModel} を確認してください。`);
    const text = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini の応答が空でした。");
  return text;
}

export function mockGeminiResponse() {
  return {
    overallAssessment: {
      aiGeneratedScore: 0.28,
      aiEditedScore: 0.34,
      compositeScore: 0.22,
      handDrawnScore: 0.03,
      ordinaryPhotoScore: 0.39,
      uncertaintyScore: 0.24
    },
    elements: [
      {
        id: "element_001",
        name: "text",
        description: "看板やラベルの文字領域",
        importance: 0.9,
        possibleBrand: null,
        possibleModel: null,
        visualConfidence: 0.78,
        boundingBox: null,
        suspiciousFeatures: [
          {
            type: "text_anomaly",
            strength: 0.42,
            description: "文字の線幅や間隔に軽微な不自然さがあります。"
          }
        ]
      }
    ],
    globalEvidence: [
      {
        type: "lighting",
        strength: 0.31,
        description: "全体の光源関係は概ね自然ですが、局所的に解釈が分かれます。"
      }
    ],
    limitations: [
      "この結果は Demo Mode の例示です。",
      "インターネットによる検証は行っていません。"
    ]
  };
}
