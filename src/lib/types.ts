export interface ChangedFile {
  filename: string;
  status: string; // added, modified, removed, renamed
  patch: string;
  additions: number;
  deletions: number;
  rawContent?: string;
}

export interface Finding {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  filePath: string;
  lineNumber?: number;
  codeSnippet: string;
  suggestion: string;
  category: "bug" | "security" | "complexity" | "quality";
}

export type Severity = Finding["severity"];
export type Category = Finding["category"];
