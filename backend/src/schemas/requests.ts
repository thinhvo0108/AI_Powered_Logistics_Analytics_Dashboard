import { z } from "zod";

export const FiltersSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  carrier: z.string().optional(),
  region: z.string().optional(),
  status: z.array(z.string()).optional(),
  warehouse: z.string().optional(),
});
export type Filters = z.infer<typeof FiltersSchema>;

export const DashboardQuerySchema = z.object({
  filters: FiltersSchema.default({}),
  granularity: z.enum(["day", "week", "month"]).default("month"),
});
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export const NLQueryRequestSchema = z.object({
  query: z.string().min(3).max(500),
  filters: FiltersSchema.default({}),
});
export type NLQueryRequest = z.infer<typeof NLQueryRequestSchema>;

export const ForecastRequestSchema = z
  .object({
    sku: z.string().optional(),
    category: z.string().optional(),
    horizonMonths: z.number().int().min(1).max(12).default(3),
    method: z
      .enum(["auto", "moving_average", "linear_regression", "exponential_smoothing"])
      .default("auto"),
  })
  .refine((d) => d.sku || d.category, { message: "Provide sku or category" });
export type ForecastRequest = z.infer<typeof ForecastRequestSchema>;
