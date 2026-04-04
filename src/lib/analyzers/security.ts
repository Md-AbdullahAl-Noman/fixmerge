import { ChangedFile, Finding } from "../types";
import { extractAddedLines } from "./utils";

interface Rule {
  pattern: RegExp;
  title: string;
  description: string;
  severity: Finding["severity"];
  suggestion: string;
}

const SECURITY_RULES: Rule[] = [
  {
    pattern: /(SELECT|INSERT|UPDATE|DELETE)\s+.*\+\s*['"]?\w+/i,
    title: "Possible SQL injection",
    description:
      "String concatenation in SQL query — this is vulnerable to SQL injection.",
    severity: "critical",
    suggestion: "Use parameterized queries or an ORM.",
  },
  {
    pattern: /`.*\b(SELECT|INSERT|UPDATE|DELETE)\b/i,
    title: "SQL in template literal",
    description: "Building SQL with template literals is a SQL injection vector.",
    severity: "critical",
    suggestion: "Use parameterized queries with placeholders.",
  },
  {
    pattern: /f['"].*\b(SELECT|INSERT|UPDATE|DELETE)\b/i,
    title: "SQL in f-string",
    description: "Building SQL with f-strings is a SQL injection vector.",
    severity: "critical",
    suggestion: "Use parameterized queries with placeholders.",
  },
  {
    pattern: /innerHTML\s*=/,
    title: "Direct innerHTML assignment",
    description:
      "Setting innerHTML with untrusted input causes XSS vulnerabilities.",
    severity: "high",
    suggestion: "Use textContent or a sanitization library like DOMPurify.",
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    title: "React dangerouslySetInnerHTML",
    description:
      "Using dangerouslySetInnerHTML can expose XSS if input isn't sanitized.",
    severity: "high",
    suggestion: "Ensure the HTML is sanitized or use a safe alternative.",
  },
  {
    pattern: /document\.write\s*\(/,
    title: "document.write usage",
    description: "document.write can be exploited for XSS and blocks rendering.",
    severity: "high",
    suggestion: "Use DOM APIs like createElement/appendChild.",
  },
  {
    pattern: /(os\.system|subprocess\.call|subprocess\.Popen)\s*\(.*\+/i,
    title: "Command injection risk",
    description:
      "Building shell commands with string concatenation is vulnerable to injection.",
    severity: "critical",
    suggestion:
      "Use subprocess with a list of arguments, never string concatenation.",
  },
  {
    pattern: /pickle\.loads?\s*\(/,
    title: "Unsafe deserialization (pickle)",
    description:
      "pickle.load with untrusted data allows arbitrary code execution.",
    severity: "critical",
    suggestion: "Use json or a safe serialization format for untrusted data.",
  },
  {
    pattern: /yaml\.load\s*\([^)]*\)(?!.*Loader)/,
    title: "Unsafe YAML loading",
    description:
      "yaml.load without a safe Loader can execute arbitrary Python code.",
    severity: "high",
    suggestion: "Use yaml.safe_load() or specify Loader=yaml.SafeLoader.",
  },
  {
    pattern: /verify\s*=\s*False/i,
    title: "SSL verification disabled",
    description:
      "Disabling SSL verification makes connections vulnerable to MITM attacks.",
    severity: "high",
    suggestion: "Enable SSL verification or use a proper certificate.",
  },
  {
    pattern: /(CORS|cors).*\*|Access-Control-Allow-Origin.*\*/,
    title: "Wildcard CORS policy",
    description:
      "Allowing all origins with CORS * exposes the API to any domain.",
    severity: "medium",
    suggestion: "Restrict allowed origins to trusted domains.",
  },
  {
    pattern: /(md5|sha1)\s*\(/i,
    title: "Weak hash algorithm",
    description: "MD5/SHA1 are cryptographically broken for security purposes.",
    severity: "medium",
    suggestion: "Use SHA-256 or bcrypt/argon2 for password hashing.",
  },
  {
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/i,
    title: "Insecure HTTP URL",
    description: "Using HTTP instead of HTTPS transmits data in plaintext.",
    severity: "medium",
    suggestion: "Use HTTPS for all external URLs.",
  },
  {
    pattern: /chmod\s+777/,
    title: "World-writable permissions",
    description:
      "chmod 777 makes files readable, writable, and executable by everyone.",
    severity: "high",
    suggestion:
      "Use the most restrictive permissions possible (e.g., 644 for files, 755 for dirs).",
  },
];

export function analyzeSecurity(files: ChangedFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    if (file.status === "removed") continue;

    // Scan diff lines
    if (file.patch) {
      const addedLines = extractAddedLines(file.patch);
      for (const { lineNumber, content } of addedLines) {
        for (const rule of SECURITY_RULES) {
          if (rule.pattern.test(content)) {
            findings.push({
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              filePath: file.filename,
              lineNumber,
              codeSnippet: content.trim(),
              suggestion: rule.suggestion,
              category: "security",
            });
          }
        }
      }
    }

    // File-level checks
    if (/\.(env|env\.local|env\.production)$/.test(file.filename)) {
      findings.push({
        title: "Environment file in repository",
        description:
          "An .env file is part of this PR. It may contain secrets.",
        severity: "critical",
        filePath: file.filename,
        codeSnippet: "",
        suggestion: "Add .env files to .gitignore and use a secrets manager.",
        category: "security",
      });
    }

    if (/\.(pem|key|p12|pfx)$/.test(file.filename)) {
      findings.push({
        title: "Private key file committed",
        description:
          "A private key or certificate file is part of this PR.",
        severity: "critical",
        filePath: file.filename,
        codeSnippet: "",
        suggestion: "Remove the key from the repo and rotate it immediately.",
        category: "security",
      });
    }
  }

  return findings;
}
