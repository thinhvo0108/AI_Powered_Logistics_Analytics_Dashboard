// Mirrors backend/src/schemas/requests.ts and backend/src/schemas/responses.ts

export interface Filters {
  startDate?: string;
  endDate?: string;
  carrier?: string;
  region?: string;
  status?: string[];
  warehouse?: string;
}

export interface KPIData {
  totalOrders: number;
  deliveredOrders: number;
  delayedOrders: number;
  exceptionOrders: number;
  onTimeDeliveryRate: number;
  avgDeliveryDays: number;
  totalRevenueUsd: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  type?: "bar" | "line";
}

export type ChartType = "line" | "bar" | "area" | "pie" | "composed";

export interface ChartSpec {
  chartType: ChartType;
  title: string;
  xKey: string;
  series: ChartSeries[];
  data: Record<string, unknown>[];
}

export interface ExplainabilityBlock {
  filtersApplied: Record<string, unknown>;
  metricsUsed: string[];
  dimensionsUsed: string[];
  queryPlan: string;
  rowCount: number;
}

export type ToolUsed = "query" | "forecast" | "both" | "clarify";

export interface QueryResponse {
  answer: string;
  chart: ChartSpec | null;
  dataTable: Record<string, unknown>[];
  explainability: ExplainabilityBlock;
  toolUsed: ToolUsed;
  cached: boolean;
  errors: string[];
}

export interface ForecastPoint {
  period: string;
  historicalQty: number | null;
  forecastQty: number | null;
  lowerBound: number;
  upperBound: number;
}

export type ForecastMethod =
  | "auto"
  | "moving_average"
  | "linear_regression"
  | "exponential_smoothing";

export interface ForecastParams {
  sku?: string;
  category?: string;
  horizonMonths?: number;
  method?: ForecastMethod;
}

export interface ForecastResponse {
  sku: string | null;
  category: string | null;
  methodUsed: string;
  methodExplanation: string;
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  inventoryRecommendation: string;
  chart: ChartSpec;
}

export interface FilterOptions {
  carriers: string[];
  regions: string[];
  warehouses: string[];
  statuses: string[];
  dateRange: { min: string; max: string };
}

export interface HealthResponse {
  status: string;
  llmProvider: string;
  timestamp: string;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  answer: string;
  toolUsed: ToolUsed;
  cached: boolean;
}
