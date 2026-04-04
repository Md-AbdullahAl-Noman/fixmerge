import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const analysisId = parseInt(id, 10);

  const analysis = await prisma.pRAnalysis.findUnique({
    where: { id: analysisId },
    include: { issues: { orderBy: [{ severity: "asc" }, { category: "asc" }] } },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const grade = getGrade(analysis.score);

  return NextResponse.json({
    id: analysis.id,
    repo: analysis.repoFullName,
    prNumber: analysis.prNumber,
    prTitle: analysis.prTitle,
    prUrl: analysis.prUrl,
    author: analysis.author,
    status: analysis.status,
    score: analysis.score,
    grade,
    totalIssues: analysis.totalIssues,
    critical: analysis.criticalCount,
    high: analysis.highCount,
    medium: analysis.mediumCount,
    low: analysis.lowCount,
    mergedAt: analysis.mergedAt?.toISOString() || null,
    createdAt: analysis.createdAt.toISOString(),
    completedAt: analysis.completedAt?.toISOString() || null,
    issues: analysis.issues.map((i) => ({
      id: i.id,
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      filePath: i.filePath,
      lineNumber: i.lineNumber,
      codeSnippet: i.codeSnippet,
      suggestion: i.suggestion,
    })),
  });
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
