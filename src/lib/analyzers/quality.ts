import { ChangedFile, Finding } from "../types";
import { extractAddedLines } from "./utils";

interface Rule {
  pattern: RegExp;
  title: string;
  description: string;
  severity: Finding["severity"];
  suggestion: string;
  skipIf?: (content: string, filename: string) => boolean;
}

const QUALITY_RULES: Rule[] = [
  {
    pattern: /^.{200,}$/,
    title: "Line too long",
    description:
      "Lines over 200 characters hurt readability and make diffs harder to review.",
    severity: "low",
    suggestion: "Break long lines into multiple lines or extract variables.",
  },
  {
    pattern:
      /\/\/\s*eslint-disable|#\s*noqa|\/\/\s*@ts-ignore|#\s*type:\s*ignore/,
    title: "Linter suppression",
    description:
      "A linter/type-checker warning was suppressed. This may hide real issues.",
    severity: "medium",
    suggestion: "Fix the underlying issue instead of suppressing the warning.",
  },
  {
    pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}|except\s+\w+\s*:\s*\n\s*pass/,
    title: "Empty error handler",
    description:
      "Silently swallowing exceptions hides bugs and makes debugging impossible.",
    severity: "high",
    suggestion:
      "Log the error or re-raise it. At minimum, add a comment explaining why it's safe.",
  },
  {
    pattern: /\bany\b/,
    title: "Use of 'any' type",
    description:
      "Using 'any' in TypeScript defeats the purpose of type checking.",
    severity: "medium",
    suggestion: "Use a specific type, unknown, or a generic.",
    skipIf: (_content, filename) =>
      !filename.endsWith(".ts") && !filename.endsWith(".tsx"),
  },
  {
    pattern: /import\s+\*\s+from/,
    title: "Wildcard import",
    description:
      "Wildcard imports make it unclear what names are in scope and cause namespace pollution.",
    severity: "low",
    suggestion: "Import specific names you need.",
  },
  {
    pattern: /^\s*from\s+\S+\s+import\s+\*/,
    title: "Python wildcard import",
    description:
      "from module import * pollutes the namespace and makes the code harder to understand.",
    severity: "medium",
    suggestion: "Import specific names: from module import ClassName, function_name.",
  },
];

const LARGE_DIFF_THRESHOLD = 500;

export function analyzeQuality(files: ChangedFile[]): Finding[] {
  const findings: Finding[] = [];
  let totalAdditions = 0;

  for (const file of files) {
    if (file.status === "removed") continue;
    totalAdditions += file.additions;

    // Scan diff
    if (file.patch) {
      const addedLines = extractAddedLines(file.patch);
      for (const { lineNumber, content } of addedLines) {
        for (const rule of QUALITY_RULES) {
          if (rule.skipIf && rule.skipIf(content, file.filename)) continue;
          if (rule.pattern.test(content)) {
            findings.push({
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              filePath: file.filename,
              lineNumber,
              codeSnippet: content.trim(),
              suggestion: rule.suggestion,
              category: "quality",
            });
          }
        }
      }
    }

    // Large file change
    if (file.additions > LARGE_DIFF_THRESHOLD) {
      findings.push({
        title: `Large file change (${file.additions} lines added)`,
        description: `${file.filename} has ${file.additions} added lines — large changes are harder to review.`,
        severity: "medium",
        filePath: file.filename,
        codeSnippet: "",
        suggestion: "Split into smaller, focused PRs when possible.",
        category: "quality",
      });
    }
  }

  // PR-level checks
  if (totalAdditions > 1000) {
    findings.push({
      title: `Very large PR (${totalAdditions} lines added across ${files.length} files)`,
      description:
        "Large PRs are hard to review thoroughly and more likely to contain bugs.",
      severity: "high",
      filePath: "(entire PR)",
      codeSnippet: "",
      suggestion: "Break into smaller, incremental PRs with clear scope.",
      category: "quality",
    });
  }

  if (files.length > 20) {
    findings.push({
      title: `PR touches many files (${files.length})`,
      description:
        "Changing many files in one PR increases merge conflict and bug risk.",
      severity: "medium",
      filePath: "(entire PR)",
      codeSnippet: "",
      suggestion: "Consider splitting by feature or module.",
      category: "quality",
    });
  }

  return findings;
}
