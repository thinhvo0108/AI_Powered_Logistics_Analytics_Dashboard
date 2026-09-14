"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Extra content rendered before the clock, e.g. a status badge. */
  right?: ReactNode;
}

export function Header({ title, breadcrumb = [], onRefresh, isRefreshing = false, right }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        {breadcrumb.length > 0 && (
          <nav className="mb-0.5 text-xs text-slate-400">
            {breadcrumb.join(" / ")}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {right}
        <span className="text-sm text-slate-500">
          {now ? format(now, "MMM d, yyyy · h:mm a") : ""}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          <RotateCcw className={clsx("h-4 w-4", isRefreshing && "animate-spin")} />
        </button>
      </div>
    </header>
  );
}
