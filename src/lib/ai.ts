const OPENAI_API = "https://api.openai.com/v1/chat/completions";

function getApiKey(): string | null {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || null;
}

export function isAIConfigured(): boolean {
  return !!getApiKey();
}

async function chat(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("AI API key not configured");

  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const baseUrl = process.env.AI_BASE_URL || OPENAI_API;

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function explainIssue(issue: {
  title: string;
  description: string;
  severity: string;
  category: string;
  filePath: string;
  lineNumber?: number | null;
  codeSnippet: string;
  suggestion: string;
}): Promise<string> {
  const messages = [
    {
      role: "system",
      content: `You are a senior software engineer explaining code issues to a developer. Be concise, practical, and direct. Use markdown formatting. Structure your response as:
1. **Why this matters** (1-2 sentences on real-world impact)
2. **The problem** (what's wrong in the code)
3. **How to fix** (concrete fix with a short code example if relevant)

Keep the total response under 200 words. No fluff.`,
    },
    {
      role: "user",
      content: `Explain this ${issue.severity} ${issue.category} issue:

**${issue.title}**
${issue.description}

File: ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ""}
${issue.codeSnippet ? `Code: \`${issue.codeSnippet}\`` : ""}
${issue.suggestion ? `Suggestion: ${issue.suggestion}` : ""}`,
    },
  ];

  return chat(messages);
}

export async function summarizeAnalysis(analysis: {
  prTitle: string;
  repo: string;
  score: number;
  grade: string;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  issues: {
    title: string;
    category: string;
    severity: string;
    filePath: string;
  }[];
}): Promise<string> {
  const issuesList = analysis.issues
    .slice(0, 15)
    .map((i) => `- [${i.severity}] ${i.title} (${i.filePath})`)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `You are a senior code reviewer providing a concise PR analysis summary. Use markdown. Be direct, professional, and actionable. Structure as:

1. **Verdict** — One sentence overall assessment
2. **Key risks** — Top 2-3 things to address first (if any)
3. **Recommendation** — What the team should do next

Keep it under 150 words. If the score is high and issues are low/none, be positive but brief.`,
    },
    {
      role: "user",
      content: `Summarize this PR analysis:

PR: "${analysis.prTitle}" in ${analysis.repo}
Score: ${analysis.score}/100 (Grade ${analysis.grade})
Issues: ${analysis.totalIssues} total — ${analysis.critical} critical, ${analysis.high} high, ${analysis.medium} medium, ${analysis.low} low

${issuesList || "No issues found."}`,
    },
  ];

  return chat(messages);
}
