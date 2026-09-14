import type {
  ChartSpec,
  Filters,
  FilterOptions,
  ForecastParams,
  ForecastResponse,
  HealthResponse,
  KPIData,
  QueryResponse,
} from "@/types/logistics";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body?.error ?? body?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

function filtersToSearchParams(
  filters: Filters,
  extra?: Record<string, string | undefined>
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.carrier) params.set("carrier", filters.carrier);
  if (filters.region) params.set("region", filters.region);
  if (filters.warehouse) params.set("warehouse", filters.warehouse);
  if (filters.status && filters.status.length > 0) {
    params.set("status", filters.status.join(","));
  }

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
    }
  }

  return params;
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

export function fetchKPIs(filters: Filters): Promise<KPIData> {
  const params = filtersToSearchParams(filters);
  return apiFetch<KPIData>(`/api/dashboard/kpis?${params}`);
}

export type ChartName =
  | "order-volume"
  | "delivery-performance"
  | "carriers"
  | "categories"
  | "regions";

export function fetchChartData(
  chart: ChartName,
  filters: Filters,
  granularity?: "day" | "week" | "month"
): Promise<ChartSpec> {
  const params = filtersToSearchParams(filters, { granularity });
  return apiFetch<ChartSpec>(`/api/dashboard/charts/${chart}?${params}`);
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return apiFetch<FilterOptions>("/api/dashboard/filters/options");
}

export function submitQuery(query: string, filters: Filters): Promise<QueryResponse> {
  return apiFetch<QueryResponse>("/api/query", {
    method: "POST",
    body: JSON.stringify({ query, filters }),
  });
}

export function fetchSuggestions(): Promise<string[]> {
  return apiFetch<string[]>("/api/query/suggestions");
}

export function submitForecast(params: ForecastParams): Promise<ForecastResponse> {
  return apiFetch<ForecastResponse>("/api/forecast", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchForecastCategories(): Promise<string[]> {
  return apiFetch<string[]>("/api/forecast/categories");
}
