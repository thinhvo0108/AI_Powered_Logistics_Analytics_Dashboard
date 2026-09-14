"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import type { ChartSpec } from "@/types/logistics";

const LOW_COLOR = "#22c55e";
const MID_COLOR = "#f97316";
const HIGH_COLOR = "#ef4444";

function colorForDelayRate(rate: number): string {
  if (rate < 10) return LOW_COLOR;
  if (rate < 20) return MID_COLOR;
  return HIGH_COLOR;
}

interface CarrierBreakdownChartProps {
  spec: ChartSpec;
}

export function CarrierBreakdownChart({ spec }: CarrierBreakdownChartProps) {
  const valueKey = spec.series[0]?.key ?? "delayRate";
  const categoryKey = spec.xKey;

  const sortedData = useMemo(
    () => [...spec.data].sort((a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0)),
    [spec.data, valueKey]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium text-slate-600">{spec.title}</h3>
      <div className="mt-4 h-72">
        {sortedData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ top: 8, right: 44, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey={categoryKey}
                width={110}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                cursor={{ fill: "#3b82f6", fillOpacity: 0.06 }}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={valueKey} name={spec.series[0]?.label ?? "Delay Rate"} radius={[0, 4, 4, 0]}>
                {sortedData.map((row, i) => (
                  <Cell key={i} fill={colorForDelayRate(Number(row[valueKey] ?? 0))} />
                ))}
                <LabelList
                  dataKey={valueKey}
                  position="right"
                  formatter={(value: number | string) => `${Number(value).toFixed(1)}%`}
                  style={{ fontSize: 12, fill: "#334155" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
