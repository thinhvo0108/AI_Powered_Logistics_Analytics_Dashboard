import { z } from "zod";

export const KPIResponseSchema = z.object({
  totalOrders: z.number(),
  deliveredOrders: z.number(),
  delayedOrders: z.number(),
  exceptionOrders: z.number(),
  onTimeDeliveryRate: z.number(),
  avgDeliveryDays: z.number(),
  totalRevenueUsd: z.number(),
});
export type KPIResponse = z.infer<typeof KPIResponseSchema>;

export const ChartSeriesSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string(),
});
export type ChartSeries = z.infer<typeof ChartSeriesSchema>;

export const ChartSpecSchema = z.object({
  chartType: z.enum(["line", "bar", "area", "pie", "composed"]),
  title: z.string(),
  xKey: z.string(),
  series: z.array(ChartSeriesSchema),
  data: z.array(z.record(z.string(), z.unknown())),
});
export type ChartSpec = z.infer<typeof ChartSpecSchema>;

export const ExplainabilityBlockSchema = z.object({
  filtersApplied: z.record(z.string(), z.unknown()),
  metricsUsed: z.array(z.string()),
  dimensionsUsed: z.array(z.string()),
  queryPlan: z.string(),
  rowCount: z.number(),
});
export type ExplainabilityBlock = z.infer<typeof ExplainabilityBlockSchema>;

export const QueryResponseSchema = z.object({
  answer: z.string(),
  chart: ChartSpecSchema.nullable(),
  dataTable: z.array(z.record(z.string(), z.unknown())),
  explainability: ExplainabilityBlockSchema,
  toolUsed: z.enum(["query", "forecast", "both", "clarify"]),
  cached: z.boolean().default(false),
  errors: z.array(z.string()).default([]),
});
export type QueryResponse = z.infer<typeof QueryResponseSchema>;

export const ForecastPointSchema = z.object({
  period: z.string(),
  historicalQty: z.number().nullable(),
  forecastQty: z.number().nullable(),
  lowerBound: z.number(),
  upperBound: z.number(),
});
export type ForecastPoint = z.infer<typeof ForecastPointSchema>;

export const ForecastResponseSchema = z.object({
  sku: z.string().nullable(),
  category: z.string().nullable(),
  methodUsed: z.string(),
  methodExplanation: z.string(),
  historical: z.array(ForecastPointSchema),
  forecast: z.array(ForecastPointSchema),
  inventoryRecommendation: z.string(),
  chart: ChartSpecSchema,
});
export type ForecastResponse = z.infer<typeof ForecastResponseSchema>;
