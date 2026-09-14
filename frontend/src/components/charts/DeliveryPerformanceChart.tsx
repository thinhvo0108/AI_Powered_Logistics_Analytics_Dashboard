"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartSpec } from "@/types/logistics";

const COLORS = {
  onTimeCount: "#22c55e",
  delayedCount: "#ef4444",
  onTimeRate: "#3b82f6",
};

interface DeliveryPerformanceChartProps {
  spec: ChartSpec;
}

export function DeliveryPerformanceChart({ spec }: DeliveryPerformanceChartProps) {
  const label = (key: string) => spec.series.find((s) => s.key === key)?.label ?? key;

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
            <ComposedChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey={spec.xKey} tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                dataKey="onTimeCount"
                name={label("onTimeCount")}
                fill={COLORS.onTimeCount}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="delayedCount"
                name={label("delayedCount")}
                fill={COLORS.delayedCount}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="onTimeRate"
                name={label("onTimeRate")}
                stroke={COLORS.onTimeRate}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
