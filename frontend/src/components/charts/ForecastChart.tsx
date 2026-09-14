"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartSpec } from "@/types/logistics";

const COLORS = {
  historical: "#3b82f6",
  forecast: "#f97316",
  band: "#94a3b8",
};

interface ForecastChartProps {
  spec: ChartSpec;
}

function findKey(spec: ChartSpec, pattern: RegExp): string | undefined {
  return spec.series.find((s) => pattern.test(s.key))?.key;
}

// Backend encodes the forecast method as "<title> — <method name>" so this
// component can show it as a subtitle without a dedicated ChartSpec field.
function splitTitle(title: string): { main: string; subtitle?: string } {
  const [main, subtitle] = title.split(" — ");
  return { main, subtitle };
}

export function ForecastChart({ spec }: ForecastChartProps) {
  const historicalKey = findKey(spec, /historical/i) ?? "historicalQty";
  const forecastKey = findKey(spec, /forecast/i) ?? "forecastQty";
  const lowerKey = findKey(spec, /lower/i);
  const upperKey = findKey(spec, /upper/i);
  const label = (key: string) => spec.series.find((s) => s.key === key)?.label ?? key;

  const { main, subtitle } = splitTitle(spec.title);

  const todayX = useMemo(() => {
    let lastHistoricalX: string | number | undefined;
    for (const row of spec.data) {
      if (row[historicalKey] != null) {
        lastHistoricalX = row[spec.xKey] as string | number;
      }
    }
    return lastHistoricalX;
  }, [spec.data, spec.xKey, historicalKey]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-medium text-slate-600">{main}</h3>
      {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
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
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#3b82f6", fillOpacity: 0.06 }}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {todayX !== undefined ? (
                <ReferenceLine
                  x={todayX}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{ value: "Today", position: "top", fontSize: 12, fill: "#64748b" }}
                />
              ) : null}
              <Bar
                dataKey={historicalKey}
                name={label(historicalKey)}
                fill={COLORS.historical}
                radius={[4, 4, 0, 0]}
              />
              {lowerKey ? (
                <Line
                  type="monotone"
                  dataKey={lowerKey}
                  name={label(lowerKey)}
                  stroke={COLORS.band}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              ) : null}
              {upperKey ? (
                <Line
                  type="monotone"
                  dataKey={upperKey}
                  name={label(upperKey)}
                  stroke={COLORS.band}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey={forecastKey}
                name={label(forecastKey)}
                stroke={COLORS.forecast}
                strokeDasharray="6 3"
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
