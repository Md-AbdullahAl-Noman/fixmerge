/**
 * Parse a unified diff patch to extract added lines with their line numbers.
 */
export function extractAddedLines(
  patch: string
): { lineNumber: number; content: string }[] {
  const lines: { lineNumber: number; content: string }[] = [];
  let currentLine = 0;

  for (const raw of patch.split("\n")) {
    if (raw.startsWith("@@")) {
      const match = raw.match(/\+(\d+)/);
      if (match) currentLine = parseInt(match[1], 10);
      continue;
    }
    if (raw.startsWith("+") && !raw.startsWith("+++")) {
      lines.push({ lineNumber: currentLine, content: raw.slice(1) });
      currentLine++;
    } else if (raw.startsWith("-")) {
      continue;
    } else {
      currentLine++;
    }
  }
  return lines;
}
