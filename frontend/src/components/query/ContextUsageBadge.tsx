"use client";

import { Gauge } from "lucide-react";
import { clsx } from "clsx";

interface ContextUsageBadgeProps {
  usedTurns: number;
  maxTurns: number;
}

export function ContextUsageBadge({ usedTurns, maxTurns }: ContextUsageBadgeProps) {
  const percent = maxTurns > 0 ? Math.min(100, Math.round((usedTurns / maxTurns) * 100)) : 0;
  const full = percent >= 100;
  const high = percent >= 60;

  const title = full
    ? `Context full — only the last ${maxTurns} turns are sent to the AI; earlier turns in this conversation are dropped.`
    : `${usedTurns} of ${maxTurns} most recent turns are included as conversation context.`;

  return (
    <div
      title={title}
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        full
          ? "border-red-200 bg-red-50 text-red-600"
          : high
            ? "border-amber-200 bg-amber-50 text-amber-600"
            : "border-slate-200 bg-white text-slate-500"
      )}
    >
      <Gauge className="h-3.5 w-3.5" />
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
        <span
          className={clsx(
            "absolute inset-y-0 left-0 rounded-full transition-[width]",
            full ? "bg-red-500" : high ? "bg-amber-500" : "bg-blue-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </span>
      Context {percent}%
    </div>
  );
}
