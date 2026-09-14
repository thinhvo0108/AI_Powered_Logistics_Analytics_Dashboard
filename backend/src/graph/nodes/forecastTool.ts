import type { AppState } from "../state.js";
import { getRows } from "../../data/loader.js";
import { runForecast, type ForecastMethod, type ForecastPoint } from "../../forecasting/engine.js";
import { getInventoryRecommendation } from "../../forecasting/recommender.js";
import type { ChartSpec } from "../../schemas/responses.js";
import logger from "../../core/logger.js";

function buildForecastChartSpec(
  historical: { period: string; historicalQty: number }[],
  forecast: ForecastPoint[]
): ChartSpec {
  return {
    chartType: "composed",
    title: "Demand Forecast",
    xKey: "period",
    series: [
      { key: "historicalQty", label: "Historical", color: "#3b82f6" },
      { key: "forecastQty", label: "Forecast", color: "#f97316" },
    ],
    data: [...historical, ...forecast] as Record<string, unknown>[],
  };
}

export async function forecastToolNode(state: AppState): Promise<Partial<AppState>> {
  try {
    const forecastParams = state.forecastParams ?? {};
    const sku = forecastParams.sku as string | undefined;
    const category = forecastParams.category as string | undefined;
    const horizonMonths = (forecastParams.horizonMonths as number) ?? 3;
    const method = (forecastParams.method as ForecastMethod | "auto") ?? "auto";

    const rows = getRows();
    const result = runForecast(rows, sku, category, horizonMonths, method);
    const historical = result.historical.map((h) => ({
      period: h.period,
      historicalQty: h.quantity,
    }));
    const inventoryRecommendation = getInventoryRecommendation(
      result.forecast.map((f) => f.forecastQty)
    );

    return {
      forecastResult: {
        sku: sku ?? null,
        category: category ?? null,
        methodUsed: result.methodUsed,
        methodExplanation: result.methodExplanation,
        residualsStd: result.residualsStd,
        historical,
        forecast: result.forecast,
        inventoryRecommendation,
      },
      chartSpec: buildForecastChartSpec(historical, result.forecast),
      toolUsed: "forecast",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, "Forecast tool failed");

    return { errors: [message], forecastResult: null, toolUsed: "forecast" };
  }
}
