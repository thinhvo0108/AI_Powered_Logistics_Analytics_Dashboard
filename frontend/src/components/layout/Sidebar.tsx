"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, MessageSquare, TrendingUp, Truck, Circle } from "lucide-react";
import { clsx } from "clsx";
import { fetchHealth } from "@/api/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/query", label: "AI Query", icon: MessageSquare },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
  });

  return (
    <aside className="flex w-[240px] shrink-0 flex-col bg-[#0f172a] text-slate-300">
      <div className="flex items-center gap-2 px-6 py-5 text-white">
        <Truck className="h-6 w-6 text-blue-400" />
        <span className="text-lg font-semibold tracking-tight">LogiAI</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-md border-l-2 px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-400 bg-white/5 text-white"
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-xs font-medium">
          <Circle
            className={clsx(
              "h-2 w-2 shrink-0",
              health?.status === "ok" ? "fill-emerald-400 text-emerald-400" : "fill-slate-500 text-slate-500"
            )}
          />
          <span className="text-slate-400">LLM</span>
          <span className="ml-auto truncate text-slate-200">
            {health?.llmProvider ?? "unknown"}
          </span>
        </div>
      </div>
    </aside>
  );
}
