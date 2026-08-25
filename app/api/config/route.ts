import { NextResponse } from "next/server";
import { getGeminiConfig } from "@/lib/gemini";

export function GET() {
  const config = getGeminiConfig();
  return NextResponse.json({
    demoMode: config.demoMode,
    model: config.model,
    hasApiKey: Boolean(config.apiKey)
  });
}
