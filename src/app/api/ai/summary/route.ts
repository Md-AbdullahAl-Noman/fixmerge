import { NextRequest, NextResponse } from "next/server";
import { summarizeAnalysis, isAIConfigured } from "@/lib/ai";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI not configured. Add AI_API_KEY to .env" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get("id");

  if (!analysisId) {
    return NextResponse.json({ error: "Missing id param" }, { status: 400 });
  }

  const analysis = await prisma.pRAnalysis.findUnique({
    where: { id: parseInt(analysisId, 10) },
    include: { issues: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  try {
    const summary = await summarizeAnalysis({
      prTitle: analysis.prTitle,
      repo: analysis.repoFullName,
      score: analysis.score,
      grade: getGrade(analysis.score),
      totalIssues: analysis.totalIssues,
      critical: analysis.criticalCount,
      high: analysis.highCount,
      medium: analysis.mediumCount,
      low: analysis.lowCount,
      issues: analysis.issues.map((i) => ({
        title: i.title,
        category: i.category,
        severity: i.severity,
        filePath: i.filePath,
      })),
    });
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
