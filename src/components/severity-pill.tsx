const severityConfig: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 ring-red-500/20",
  high: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
  medium: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  low: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
  info: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

export function SeverityPill({ severity, count }: { severity: string; count?: number }) {
  const style = severityConfig[severity] || "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20";
  const label = count !== undefined ? `${count} ${severity}` : severity;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[11px] font-semibold uppercase tracking-wide ring-1 ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${severity === "critical" ? "bg-red-400" : severity === "high" ? "bg-rose-400" : severity === "medium" ? "bg-amber-400" : severity === "low" ? "bg-yellow-400" : "bg-zinc-400"}`} />
      {label}
    </span>
  );
}

const categoryIcons: Record<string, string> = {
  bug: "B",
  security: "S",
  complexity: "C",
  quality: "Q",
};

export function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[11px] font-semibold bg-[var(--accent-glow)] text-[var(--accent-light)] ring-1 ring-[var(--accent)]/15 uppercase tracking-wide">
      <span className="w-4 h-4 rounded-[5px] bg-[var(--accent)]/20 flex items-center justify-center text-[9px] font-bold">
        {categoryIcons[category] || "?"}
      </span>
      {category}
    </span>
  );
}
