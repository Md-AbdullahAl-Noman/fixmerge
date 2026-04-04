import { ChangedFile, Finding } from "../types";
import { extractAddedLines } from "./utils";

interface Rule {
  pattern: RegExp;
  title: string;
  description: string;
  severity: Finding["severity"];
  suggestion: string;
}

const DIFF_RULES: Rule[] = [
  {
    pattern: /==\s*null\b|!=\s*null\b/i,
    title: "Loose null comparison",
    description:
      "Using == or != with null can lead to unexpected type coercion in JS/TS.",
    severity: "medium",
    suggestion: "Use === null or !== null for strict comparison.",
  },
  {
    pattern: /except\s*:/,
    title: "Bare except clause",
    description:
      "Catching all exceptions hides bugs and makes debugging difficult.",
    severity: "high",
    suggestion: "Catch specific exceptions: except ValueError, except KeyError, etc.",
  },
  {
    pattern: /except\s+Exception\s*:/,
    title: "Broad exception catch",
    description:
      "Catching Exception is too broad — it swallows errors you likely want to propagate.",
    severity: "medium",
    suggestion: "Narrow the exception type to what you actually expect.",
  },
  {
    pattern: /\.forEach\(.*\basync\b/,
    title: "Async inside forEach",
    description:
      "forEach does not await async callbacks — promises will fire-and-forget.",
    severity: "high",
    suggestion: "Use for...of loop or Promise.all(arr.map(async ...)) instead.",
  },
  {
    pattern: /\beval\s*\(/,
    title: "Use of eval()",
    description:
      "eval() executes arbitrary code and is almost always a security risk.",
    severity: "critical",
    suggestion:
      "Refactor to avoid eval. Use JSON.parse, Function constructor, or a safe parser.",
  },
  {
    pattern: /TODO|FIXME|HACK|XXX|TEMP/,
    title: "Unresolved TODO/FIXME marker",
    description:
      "Code with TODO/FIXME markers was merged — these should be resolved or tracked.",
    severity: "low",
    suggestion: "Resolve the TODO or create a tracked issue before merging.",
  },
  {
    pattern: /console\.(log|debug|info|warn|error)\s*\(/,
    title: "Console statement left in code",
    description: "Console statements should not be in production code.",
    severity: "low",
    suggestion: "Remove console statements or use a proper logging framework.",
  },
  {
    pattern: /\bdebugger\b/,
    title: "Debugger statement",
    description: "A debugger statement will pause execution in development tools.",
    severity: "high",
    suggestion: "Remove the debugger statement before merging.",
  },
  {
    pattern: /\bprint\s*\(/,
    title: "Print statement in code",
    description: "Print statements are likely debug leftovers. Use logging in production.",
    severity: "low",
    suggestion: "Replace with logging.info() or logging.debug().",
  },
  {
    pattern: /sleep\s*\(\s*\d+\s*\)/,
    title: "Hardcoded sleep",
    description:
      "Hardcoded sleep() calls suggest flaky timing logic or debug leftovers.",
    severity: "medium",
    suggestion: "Use proper synchronization, retries, or event-based waiting.",
  },
  {
    pattern: /password\s*=\s*['"][^'"]+['"]/i,
    title: "Hardcoded password",
    description: "A password appears to be hardcoded in the source.",
    severity: "critical",
    suggestion: "Use environment variables or a secrets manager.",
  },
  {
    pattern: /(api[_-]?key|secret[_-]?key|token)\s*=\s*['"][^'"]{8,}['"]/i,
    title: "Hardcoded secret/token",
    description: "An API key or secret appears to be hardcoded.",
    severity: "critical",
    suggestion: "Use environment variables or a secrets vault.",
  },
  {
    pattern: /\.then\s*\([^)]*\)\s*$/m,
    title: "Unhandled promise (.then without .catch)",
    description: "Promise chain without a .catch() may silently swallow errors.",
    severity: "medium",
    suggestion: "Add .catch() or use async/await with try/catch.",
  },
  {
    pattern: /\bvar\s+\w+\s*=/,
    title: "Use of 'var' keyword",
    description: "'var' has function-scoping that causes subtle bugs. Use let/const.",
    severity: "low",
    suggestion: "Replace var with let or const.",
  },
];

const PYTHON_MUTABLE_DEFAULT = /def\s+\w+\s*\([^)]*=\s*(\[\s*]|\{\s*}|set\s*\(\s*\))/;

export function analyzeBugs(files: ChangedFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    if (file.status === "removed") continue;

    // Scan diff
    if (file.patch) {
      const addedLines = extractAddedLines(file.patch);
      for (const { lineNumber, content } of addedLines) {
        for (const rule of DIFF_RULES) {
          if (rule.pattern.test(content)) {
            findings.push({
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              filePath: file.filename,
              lineNumber,
              codeSnippet: content.trim(),
              suggestion: rule.suggestion,
              category: "bug",
            });
          }
        }
      }
    }

    // Full file analysis for Python mutable defaults
    if (file.rawContent && file.filename.endsWith(".py")) {
      const lines = file.rawContent.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (PYTHON_MUTABLE_DEFAULT.test(lines[i])) {
          findings.push({
            title: "Mutable default argument",
            description:
              "Using mutable default arguments (list, dict) causes shared state between calls.",
            severity: "high",
            filePath: file.filename,
            lineNumber: i + 1,
            codeSnippet: lines[i].trim(),
            suggestion:
              "Use None as default and initialize inside the function body.",
            category: "bug",
          });
        }
      }
    }
  }

  return findings;
}
