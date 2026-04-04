import { NextRequest, NextResponse } from "next/server";
import { explainIssue, isAIConfigured } from "@/lib/ai";

export async function POST(request: NextRequest) {
  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI not configured. Add AI_API_KEY to .env" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const explanation = await explainIssue(body);
    return NextResponse.json({ explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
