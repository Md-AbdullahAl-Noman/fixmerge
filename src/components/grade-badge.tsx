const gradeConfig: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/25" },
  B: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/25" },
  C: { bg: "bg-orange-500/10", text: "text-orange-400", ring: "ring-orange-500/25" },
  D: { bg: "bg-red-500/10", text: "text-red-400", ring: "ring-red-500/25" },
  F: { bg: "bg-red-600/10", text: "text-red-500", ring: "ring-red-600/25" },
};

export function GradeBadge({
  grade,
  size = "sm",
}: {
  grade: string;
  size?: "sm" | "lg";
}) {
  const config = gradeConfig[grade] || {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    ring: "ring-zinc-500/25",
  };

  if (size === "lg") {
    return (
      <div
        className={`relative w-[72px] h-[72px] rounded-2xl ${config.bg} ring-1 ${config.ring} flex items-center justify-center`}
      >
        <span className={`text-3xl font-black ${config.text}`}>{grade}</span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-[10px] text-[13px] font-extrabold ring-1 ${config.bg} ${config.text} ${config.ring}`}
    >
      {grade}
    </span>
  );
}
