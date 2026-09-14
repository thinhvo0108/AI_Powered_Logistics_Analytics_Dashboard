"use client";

import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { ChartSpec } from "@/types/logistics";

const PALETTE = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ef4444"];

interface CategoryRevenueChartProps {
  spec: ChartSpec;
}

export function CategoryRevenueChart({ spec }: CategoryRevenueChartProps) {
  const valueKey = spec.series[0]?.key ?? "revenue";
  const nameKey = spec.xKey;

  const total = useMemo(
    () => spec.data.reduce((sum, row) => sum + Number(row[valueKey] ?? 0), 0),
    [spec.data, valueKey]
  );

  const formattedTotal = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(total),
    [total]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium text-slate-600">{spec.title}</h3>
      <div className="relative mt-4 h-72">
        {spec.data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spec.data}
                  dataKey={valueKey}
                  nameKey={nameKey}
                  cx="42%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                >
                  {spec.data.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div
              className="pointer-events-none absolute flex flex-col items-center"
              style={{ left: "42%", top: "50%", transform: "translate(-50%, -50%)" }}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Revenue</span>
              <span className="text-lg font-semibold text-slate-900">{formattedTotal}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
