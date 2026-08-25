import { NextResponse } from "next/server";
import { analyzeWithGemini, getGeminiConfig, mockGeminiResponse } from "@/lib/gemini";
import { buildReportFromGemini, parseGeminiAnalysis } from "@/lib/analysis";

export const runtime = "nodejs";

type AnalyzeRequest = {
  imageDataUrl?: string;
  sourceType?: "upload" | "url";
  fileName?: string;
  mimeType?: string;
};

function isValidDataUrl(value: string) {
  return /^data:image\/(jpeg|png|webp);base64,/i.test(value);
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const body = (await req.json()) as AnalyzeRequest;
    if (!body.imageDataUrl || !isValidDataUrl(body.imageDataUrl)) {
      return NextResponse.json({ error: "有効な画像データがありません。" }, { status: 400 });
    }

    const sourceType = body.sourceType ?? "upload";
    const fileName = body.fileName ?? "image";
    const mimeType = body.mimeType ?? "image/jpeg";
    const config = getGeminiConfig();

    if (config.demoMode || !config.apiKey) {
      const report = buildReportFromGemini(mockGeminiResponse(), {
        mode: "demo",
        sourceType,
        fileName,
        mimeType,
        requestCount: 0,
        durationMs: Date.now() - startedAt,
        model: config.model,
        demoMode: true
      });
      return NextResponse.json({ report });
    }

    const raw = await analyzeWithGemini({ imageDataUrl: body.imageDataUrl, fileName, mimeType, model: config.model });
    const parsed = parseGeminiAnalysis(raw);
    const report = buildReportFromGemini(parsed, {
      mode: "live",
      sourceType,
      fileName,
      mimeType,
      requestCount: 1,
      durationMs: Date.now() - startedAt,
      model: config.model,
      demoMode: false
    });

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
