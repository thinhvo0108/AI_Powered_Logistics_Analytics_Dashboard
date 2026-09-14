"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartSpec } from "@/types/logistics";

const BRAND_PALETTE = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#8b5cf6",
  "#eab308",
  "#06b6d4",
  "#ec4899",
];

const tickFormatter = (v: string | number) => v.toLocaleString();

interface DynamicChartProps {
  spec: ChartSpec;
  height?: number;
}

function renderChart(spec: ChartSpec) {
  const margin = { top: 8, right: 16, left: 0, bottom: 0 };

  switch (spec.chartType) {
    case "area":
      return (
        <AreaChart data={spec.data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={spec.xKey} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {spec.series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      );

    case "bar": {
      const vertical = spec.data.length > 6 && spec.series.length === 1;
      return (
        <BarChart data={spec.data} layout={vertical ? "vertical" : "horizontal"} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          {vertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
              <YAxis
                type="category"
                dataKey={spec.xKey}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={tickFormatter}
                width={120}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={spec.xKey} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
            </>
          )}
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {spec.series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      );
    }

    case "line":
      return (
        <LineChart data={spec.data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={spec.xKey} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {spec.series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      );

    case "pie": {
      const valueKey = spec.series[0]?.key ?? "value";
      return (
        <PieChart>
          <Pie
            data={spec.data}
            dataKey={valueKey}
            nameKey={spec.xKey}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {spec.data.map((_, i) => (
              <Cell key={i} fill={BRAND_PALETTE[i % BRAND_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      );
    }

    case "composed":
      return (
        <ComposedChart data={spec.data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={spec.xKey} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={tickFormatter} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {spec.series.map((s) =>
            s.type === "line" ? (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} />
            ) : (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
            )
          )}
        </ComposedChart>
      );

    default:
      return <div />;
  }
}

export function DynamicChart({ spec, height = 300 }: DynamicChartProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">{spec.title}</h3>
      <div className="mt-4" style={{ height }}>
        {spec.data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart(spec)}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
