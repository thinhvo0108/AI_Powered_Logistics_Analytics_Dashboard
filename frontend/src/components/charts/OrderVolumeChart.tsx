"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartSpec } from "@/types/logistics";

const SERIES_COLORS: Record<string, string> = {
  total: "#3b82f6",
  delivered: "#22c55e",
  delayed: "#ef4444",
};

const SERIES_ORDER = ["total", "delivered", "delayed"];

interface OrderVolumeChartProps {
  spec: ChartSpec;
}

export function OrderVolumeChart({ spec }: OrderVolumeChartProps) {
  const seriesKeys = SERIES_ORDER.filter((key) => spec.series.some((s) => s.key === key));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium text-slate-600">{spec.title}</h3>
      <div className="mt-4 h-72">
        {spec.data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                {seriesKeys.map((key) => (
                  <linearGradient key={key} id={`orderVolume-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES_COLORS[key]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={SERIES_COLORS[key]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey={spec.xKey} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {seriesKeys.map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={spec.series.find((s) => s.key === key)?.label ?? key}
                  stroke={SERIES_COLORS[key]}
                  strokeWidth={2}
                  fill={`url(#orderVolume-${key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
