import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getRows } from "../../data/loader.js";
import {
  getKPIs,
  getOrdersOverTime,
  getDeliveryPerformance,
  getCarrierBreakdown,
  getCategoryBreakdown,
  getRegionBreakdown,
  getFilterOptions,
  type Filters,
  type Granularity,
} from "../../data/queries.js";
import type { ChartSpec, ChartSeries } from "../../schemas/responses.js";

const COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  red: "#ef4444",
  orange: "#f97316",
  purple: "#8b5cf6",
  yellow: "#eab308",
};

const PIE_SLICES = [COLORS.blue, COLORS.green, COLORS.red, COLORS.orange, COLORS.purple, COLORS.yellow];

const FilterQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  carrier: z.string().optional(),
  region: z.string().optional(),
  warehouse: z.string().optional(),
  status: z.string().optional(),
});

const OrderVolumeQuerySchema = FilterQuerySchema.extend({
  granularity: z.enum(["day", "week", "month"]).default("month"),
});

function toFilters(query: z.infer<typeof FilterQuerySchema>): Filters {
  return {
    startDate: query.startDate,
    endDate: query.endDate,
    carrier: query.carrier,
    region: query.region,
    warehouse: query.warehouse,
    status: query.status
      ? query.status
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  };
}

function series(key: string, label: string, color: string): ChartSeries {
  return { key, label, color };
}

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard/kpis", async (request) => {
    const query = FilterQuerySchema.parse(request.query);
    const filters = toFilters(query);

    return getKPIs(getRows(), filters);
  });

  app.get("/dashboard/charts/order-volume", async (request) => {
    const query = OrderVolumeQuerySchema.parse(request.query);
    const filters = toFilters(query);
    const granularity: Granularity = query.granularity;
    const data = getOrdersOverTime(getRows(), filters, granularity);

    const chart: ChartSpec = {
      chartType: "area",
      title: "Order Volume Over Time",
      xKey: "date",
      series: [
        series("total", "Total", COLORS.blue),
        series("delivered", "Delivered", COLORS.green),
        series("delayed", "Delayed", COLORS.red),
      ],
      data: data as unknown as Record<string, unknown>[],
    };

    return chart;
  });

  app.get("/dashboard/charts/delivery-performance", async (request) => {
    const query = FilterQuerySchema.parse(request.query);
    const filters = toFilters(query);
    const data = getDeliveryPerformance(getRows(), filters);

    const chart: ChartSpec = {
      chartType: "composed",
      title: "Delivery Performance Over Time",
      xKey: "period",
      series: [
        series("onTimeCount", "On-Time", COLORS.green),
        series("delayedCount", "Delayed", COLORS.red),
        series("onTimeRate", "On-Time Rate", COLORS.blue),
      ],
      data: data as unknown as Record<string, unknown>[],
    };

    return chart;
  });

  app.get("/dashboard/charts/carriers", async (request) => {
    const query = FilterQuerySchema.parse(request.query);
    const filters = toFilters(query);
    const data = getCarrierBreakdown(getRows(), filters);

    const chart: ChartSpec = {
      chartType: "bar",
      title: "Carrier Delay Rate",
      xKey: "carrier",
      series: [series("delayRate", "Delay Rate", COLORS.red)],
      data: data as unknown as Record<string, unknown>[],
    };

    return chart;
  });

  app.get("/dashboard/charts/categories", async (request) => {
    const query = FilterQuerySchema.parse(request.query);
    const filters = toFilters(query);
    const data = getCategoryBreakdown(getRows(), filters);

    const chart: ChartSpec = {
      chartType: "pie",
      title: "Revenue by Category",
      xKey: "productCategory",
      series: [series("revenue", "Revenue", COLORS.blue)],
      data: data.map((row, i) => ({ ...row, color: PIE_SLICES[i % PIE_SLICES.length] })),
    };

    return chart;
  });

  app.get("/dashboard/charts/regions", async (request) => {
    const query = FilterQuerySchema.parse(request.query);
    const filters = toFilters(query);
    const data = getRegionBreakdown(getRows(), filters);

    const chart: ChartSpec = {
      chartType: "bar",
      title: "Delay Rate by Region",
      xKey: "region",
      series: [series("delayRate", "Delay Rate", COLORS.red)],
      data: data as unknown as Record<string, unknown>[],
    };

    return chart;
  });

  app.get("/dashboard/filters/options", async () => {
    return getFilterOptions(getRows());
  });
};

export default dashboardRoutes;
