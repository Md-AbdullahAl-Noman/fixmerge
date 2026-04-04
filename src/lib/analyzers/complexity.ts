import { ChangedFile, Finding } from "../types";

const MAX_COMPLEXITY = parseInt(process.env.MAX_COMPLEXITY || "15", 10);
const MAX_FUNCTION_LENGTH = parseInt(process.env.MAX_FUNCTION_LENGTH || "50", 10);
const MAX_FILE_LENGTH = parseInt(process.env.MAX_FILE_LENGTH || "500", 10);

const FUNCTION_PATTERNS: Record<string, RegExp> = {
  python: /^(\s*)def\s+(\w+)\s*\(/gm,
  javascript:
    /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))/gm,
  typescript:
    /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*(?::\s*\w+(?:<[^>]+>)?)?\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/gm,
};

const BRANCHING_KEYWORDS =
  /\b(if|else\s+if|elif|else|for|while|switch|case|catch|except|&&|\|\||and|or|\?)\b/g;

function detectLanguage(filename: string): string | null {
  const map: Record<string, string> = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mjs": "javascript",
  };
  for (const [ext, lang] of Object.entries(map)) {
    if (filename.endsWith(ext)) return lang;
  }
  return null;
}

function countNestingDepth(lines: string[]): number {
  let maxDepth = 0;
  for (const line of lines) {
    const stripped = line.trimEnd();
    if (!stripped) continue;
    const indent = line.length - line.trimStart().length;
    const depth = Math.floor(indent / 4);
    maxDepth = Math.max(maxDepth, depth);
  }
  return maxDepth;
}

function cyclomaticComplexity(body: string): number {
  const matches = body.match(BRANCHING_KEYWORDS);
  return 1 + (matches ? matches.length : 0);
}

function extractPythonBody(lines: string[], start: number): string[] {
  if (start >= lines.length) return [];
  const baseIndent = lines[start].length - lines[start].trimStart().length;
  const body: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const stripped = lines[i].trim();
    if (!stripped) {
      body.push(lines[i]);
      continue;
    }
    const indent = lines[i].length - lines[i].trimStart().length;
    if (indent <= baseIndent) break;
    body.push(lines[i]);
  }
  return body;
}

function extractBraceBody(lines: string[], start: number): string[] {
  let depth = 0;
  const body: string[] = [];
  let foundOpen = false;
  for (let i = start; i < lines.length; i++) {
    body.push(lines[i]);
    depth += (lines[i].match(/{/g) || []).length;
    depth -= (lines[i].match(/}/g) || []).length;
    if (lines[i].includes("{")) foundOpen = true;
    if (foundOpen && depth <= 0) break;
  }
  return body;
}

export function analyzeComplexity(files: ChangedFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    if (file.status === "removed") continue;

    // File length
    if (file.rawContent) {
      const lineCount = file.rawContent.split("\n").length;
      if (lineCount > MAX_FILE_LENGTH) {
        findings.push({
          title: `Large file (${lineCount} lines)`,
          description: `This file has ${lineCount} lines, exceeding the threshold of ${MAX_FILE_LENGTH}.`,
          severity: "medium",
          filePath: file.filename,
          codeSnippet: "",
          suggestion: "Consider splitting this file into smaller, focused modules.",
          category: "complexity",
        });
      }

      // Function analysis
      const lang = detectLanguage(file.filename);
      if (lang) {
        const pattern = FUNCTION_PATTERNS[lang];
        if (pattern) {
          const allLines = file.rawContent.split("\n");
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;

          while ((match = regex.exec(file.rawContent)) !== null) {
            const funcName = match[1] || match[2] || "unknown";
            const startLine = file.rawContent
              .slice(0, match.index)
              .split("\n").length - 1;

            const bodyLines =
              lang === "python"
                ? extractPythonBody(allLines, startLine)
                : extractBraceBody(allLines, startLine);

            const funcLength = bodyLines.length;
            const bodyText = bodyLines.join("\n");

            if (funcLength > MAX_FUNCTION_LENGTH) {
              findings.push({
                title: `Long function: ${funcName}() (${funcLength} lines)`,
                description: `Function '${funcName}' is ${funcLength} lines, exceeding ${MAX_FUNCTION_LENGTH}.`,
                severity: "medium",
                filePath: file.filename,
                lineNumber: startLine + 1,
                codeSnippet: "",
                suggestion:
                  "Break the function into smaller, well-named helper functions.",
                category: "complexity",
              });
            }

            const complexity = cyclomaticComplexity(bodyText);
            if (complexity > MAX_COMPLEXITY) {
              findings.push({
                title: `High complexity: ${funcName}() (complexity=${complexity})`,
                description: `Function '${funcName}' has cyclomatic complexity ${complexity}, exceeding ${MAX_COMPLEXITY}.`,
                severity: complexity > MAX_COMPLEXITY * 1.5 ? "high" : "medium",
                filePath: file.filename,
                lineNumber: startLine + 1,
                codeSnippet: "",
                suggestion:
                  "Simplify control flow: extract conditions, use early returns, or split logic.",
                category: "complexity",
              });
            }

            const depth = countNestingDepth(bodyLines);
            if (depth >= 5) {
              findings.push({
                title: `Deep nesting: ${funcName}() (depth=${depth})`,
                description: `Function '${funcName}' has nesting depth ${depth}, which hurts readability.`,
                severity: "medium",
                filePath: file.filename,
                lineNumber: startLine + 1,
                codeSnippet: "",
                suggestion:
                  "Flatten with early returns, guard clauses, or extracted helpers.",
                category: "complexity",
              });
            }
          }
        }
      }
    }
  }

  return findings;
}
