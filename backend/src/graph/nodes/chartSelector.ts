import type { AppState } from "../state.js";
import type { ChartSpec, ChartSeries } from "../../schemas/responses.js";

const COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  red: "#ef4444",
  orange: "#f97316",
  purple: "#8b5cf6",
  yellow: "#eab308",
};

const PIE_SLICES = [
  COLORS.blue,
  COLORS.green,
  COLORS.red,
  COLORS.orange,
  COLORS.purple,
  COLORS.yellow,
  "#06b6d4",
  "#ec4899",
];

function series(key: string, label: string, color: string): ChartSeries {
  return { key, label, color };
}

function detectDimensionKey(row: Record<string, unknown>): "carrier" | "region" | "warehouse" {
  if ("carrier" in row) return "carrier";
  if ("region" in row) return "region";
  return "warehouse";
}

function buildOrderVolumeChart(data: Record<string, unknown>[]): ChartSpec {
  return {
    chartType: "area",
    title: "Order Volume Over Time",
    xKey: "date",
    series: [
      series("total", "Total", COLORS.blue),
      series("delivered", "Delivered", COLORS.green),
      series("delayed", "Delayed", COLORS.red),
    ],
    data,
  };
}

function buildDeliveryPerformanceChart(data: Record<string, unknown>[]): ChartSpec {
  return {
    chartType: "composed",
    title: "Delivery Performance Over Time",
    xKey: "period",
    series: [
      series("onTimeCount", "On-Time", COLORS.green),
      series("delayedCount", "Delayed", COLORS.red),
      series("onTimeRate", "On-Time Rate", COLORS.blue),
    ],
    data,
  };
}

function buildCategoryPieChart(data: Record<string, unknown>[]): ChartSpec {
  return {
    chartType: "pie",
    title: "Revenue by Category",
    xKey: "productCategory",
    series: [series("revenue", "Revenue", COLORS.blue)],
    data: data.map((row, i) => ({ ...row, color: PIE_SLICES[i % PIE_SLICES.length] })),
  };
}

function buildBreakdownBarChart(
  data: Record<string, unknown>[],
  xKey: string,
  metricSeries: ChartSeries,
  title: string
): ChartSpec {
  return {
    chartType: "bar",
    title,
    xKey,
    series: [metricSeries],
    data,
  };
}

function buildTopRoutesChart(data: Record<string, unknown>[]): ChartSpec {
  const withRoute = data.map((row) => ({
    ...row,
    route: `${row.originCity} → ${row.destinationCity}`,
  }));

  return {
    chartType: "bar",
    title: "Most Delayed Routes",
    xKey: "route",
    series: [series("delayRate", "Delay Rate", COLORS.red)],
    data: withRoute,
  };
}

function buildForecastChart(forecastResult: Record<string, unknown>): ChartSpec {
  const historical = (forecastResult.historical as Record<string, unknown>[]) ?? [];
  const forecast = (forecastResult.forecast as Record<string, unknown>[]) ?? [];

  return {
    chartType: "composed",
    title: "Demand Forecast",
    xKey: "period",
    series: [
      series("historicalQty", "Historical", COLORS.blue),
      series("forecastQty", "Forecast", COLORS.orange),
    ],
    data: [...historical, ...forecast],
  };
}

function buildQueryChart(queryResult: Record<string, unknown>): ChartSpec | null {
  const metric = queryResult.metric as string;
  const dimension = queryResult.dimension as string | null;
  const data = (queryResult.data as Record<string, unknown>[]) ?? [];

  if (data.length === 0) return null;

  switch (metric) {
    case "order_volume":
      return buildOrderVolumeChart(data);

    case "delay_rate":
      if (dimension === "time") return buildDeliveryPerformanceChart(data);
      return buildBreakdownBarChart(
        data,
        detectDimensionKey(data[0]),
        series("delayRate", "Delay Rate", COLORS.red),
        "Delay Rate by Carrier"
      );

    case "carrier_performance":
      return buildBreakdownBarChart(
        data,
        "carrier",
        series("delayRate", "Delay Rate", COLORS.red),
        "Carrier Performance"
      );

    case "delivery_time":
      return buildBreakdownBarChart(
        data,
        "carrier",
        series("avgDeliveryDays", "Avg Delivery Days", COLORS.purple),
        "Average Delivery Time by Carrier"
      );

    case "revenue":
      if (dimension === "region") {
        return buildBreakdownBarChart(
          data,
          "region",
          series("revenue", "Revenue", COLORS.green),
          "Revenue by Region"
        );
      }
      return data.length <= 8
        ? buildCategoryPieChart(data)
        : buildBreakdownBarChart(
            data,
            "productCategory",
            series("revenue", "Revenue", COLORS.green),
            "Revenue by Category"
          );

    case "region_breakdown":
      return buildBreakdownBarChart(
        data,
        "region",
        series("delayRate", "Delay Rate", COLORS.red),
        "Delay Rate by Region"
      );

    case "category_breakdown":
      return data.length <= 8
        ? buildCategoryPieChart(data)
        : buildBreakdownBarChart(
            data,
            "productCategory",
            series("revenue", "Revenue", COLORS.green),
            "Revenue by Category"
          );

    case "top_routes":
      return buildTopRoutesChart(data);

    default:
      return null;
  }
}

export function chartSelectorNode(state: AppState): Partial<AppState> {
  if (state.forecastResult) {
    return { chartSpec: buildForecastChart(state.forecastResult) };
  }

  if (state.queryResult) {
    return { chartSpec: buildQueryChart(state.queryResult) };
  }

  return { chartSpec: null };
}
