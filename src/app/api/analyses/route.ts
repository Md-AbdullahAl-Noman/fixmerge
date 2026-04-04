import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const analyses = await prisma.pRAnalysis.findMany({
    where: repo ? { repoFullName: repo } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(
    analyses.map((a) => ({
      id: a.id,
      repo: a.repoFullName,
      prNumber: a.prNumber,
      prTitle: a.prTitle,
      author: a.author,
      status: a.status,
      score: a.score,
      grade: getGrade(a.score),
      totalIssues: a.totalIssues,
      critical: a.criticalCount,
      high: a.highCount,
      medium: a.mediumCount,
      low: a.lowCount,
      createdAt: a.createdAt.toISOString(),
    }))
  );
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
