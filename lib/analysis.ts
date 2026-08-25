import type { AnalysisElement, AnalysisReport, ElementAnalysis, SearchResult } from "@/types/analysis";

const mockElements: AnalysisElement[] = [
  {
    id: "element_001",
    name: "テレビ",
    description: "壁掛けの薄型ディスプレイ",
    possible_brand: "Sony",
    possible_model: "BRAVIA",
    confidence: 0.92,
    importance: 0.86
  },
  {
    id: "element_002",
    name: "看板文字",
    description: "明るい背景に載った文字列",
    confidence: 0.81,
    importance: 0.95
  }
];

function mockSearch(name: string): SearchResult[] {
  return [
    {
      title: `${name} の参考画像`,
      url: "https://example.com/reference",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
      description: "関連しそうな参考画像の例"
    }
  ];
}

export async function analyzeMock(imageSource: AnalysisReport["imageSource"]): Promise<AnalysisReport> {
  const elementAnalyses: ElementAnalysis[] = mockElements.map((element, index) => {
    const searchResults = mockSearch(element.name);
    return {
      elementId: element.id,
      elementName: element.name,
      summary: `${element.name} は画像内で重要度が高く、形状と文脈の確認が有効です。`,
      evidence: [
        "輪郭が周囲の写りと整合しているように見える",
        "Web上の参考情報と比較する価値がある",
        index === 0 ? "ロゴや製品形状の検証が有効" : "文字の不自然さを重点確認"
      ],
      searchResults,
      bestMatch: {
        title: searchResults[0].title,
        url: searchResults[0].url,
        similarity: index === 0 ? 0.84 : 0.72
      },
      confidence: element.confidence
    };
  });

  return {
    mode: "mock",
    imageSource,
    elements: mockElements,
    elementAnalyses,
    imageFindings: [
      "文字の形状にわずかな不整合の可能性",
      "一部の境界線に人工的な滑らかさの可能性"
    ],
    collageFindings: ["光源と影の関係は概ね自然だが、局所的な整合性を要確認"],
    summary: "複数要素にWeb上の類似候補は見つかる一方、局所的な不自然さもあるため、AI生成・加工の可能性を中程度として評価します。",
    aiGenerationLikelihood: 0.63,
    realImageLikelihood: 0.37,
    reasons: [
      "重要要素の一部に形状・文字面で不自然さの兆候",
      "Web上の候補画像と類似する要素がある",
      "一致しない要素もあり、断定は避けるべき"
    ],
    rawNotes: "開発用モック結果です。APIキー未設定時に表示されます。"
  };
}

export async function analyzeLive(imageSource: AnalysisReport["imageSource"], imageDataUrl: string): Promise<AnalysisReport> {
  const elementAnalyses: ElementAnalysis[] = [];
  const elements: AnalysisElement[] = [];
  const imageFindings = [
    "画像内の主要要素を抽出しました",
    "Web照合の候補を検索しています"
  ];
  return {
    mode: "live",
    imageSource,
    elements,
    elementAnalyses,
    imageFindings,
    collageFindings: [],
    summary: "ライブ解析は API 実装を拡張して利用します。",
    aiGenerationLikelihood: 0.5,
    realImageLikelihood: 0.5,
    reasons: ["APIキーが設定されていません"],
    rawNotes: imageDataUrl.slice(0, 64)
  };
}
