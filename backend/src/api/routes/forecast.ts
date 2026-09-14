import type { FastifyPluginAsync } from "fastify";
import { ForecastRequestSchema } from "../../schemas/requests.js";
import type { ForecastResponse, ForecastPoint, ChartSpec } from "../../schemas/responses.js";
import { getRows } from "../../data/loader.js";
import { runForecast } from "../../forecasting/engine.js";
import { getInventoryRecommendation } from "../../forecasting/recommender.js";

function buildChartSpec(historical: ForecastPoint[], forecast: ForecastPoint[]): ChartSpec {
  return {
    chartType: "composed",
    title: "Demand Forecast",
    xKey: "period",
    series: [
      { key: "historicalQty", label: "Historical", color: "#3b82f6" },
      { key: "forecastQty", label: "Forecast", color: "#f97316" },
    ],
    data: [...historical, ...forecast] as unknown as Record<string, unknown>[],
  };
}

const forecastRoutes: FastifyPluginAsync = async (app) => {
  app.post("/forecast", async (request, reply) => {
    const { sku, category, horizonMonths, method } = ForecastRequestSchema.parse(request.body);

    try {
      const rows = getRows();
      const result = runForecast(rows, sku, category, horizonMonths, method);

      const historical: ForecastPoint[] = result.historical.map((h) => ({
        period: h.period,
        historicalQty: h.quantity,
        forecastQty: null,
        lowerBound: h.quantity,
        upperBound: h.quantity,
      }));

      const forecast: ForecastPoint[] = result.forecast.map((f) => ({
        period: f.period,
        historicalQty: null,
        forecastQty: f.forecastQty,
        lowerBound: f.lowerBound,
        upperBound: f.upperBound,
      }));

      const inventoryRecommendation = getInventoryRecommendation(
        result.forecast.map((f) => f.forecastQty)
      );

      const response: ForecastResponse = {
        sku: sku ?? null,
        category: category ?? null,
        methodUsed: result.methodUsed,
        methodExplanation: result.methodExplanation,
        historical,
        forecast,
        inventoryRecommendation,
        chart: buildChartSpec(historical, forecast),
      };

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.code(400).send({ error: message });
    }
  });

  app.get("/forecast/skus", async () => {
    const skus = new Set<string>();
    for (const row of getRows()) skus.add(row.sku);
    return Array.from(skus).sort();
  });

  app.get("/forecast/categories", async () => {
    const categories = new Set<string>();
    for (const row of getRows()) categories.add(row.productCategory);
    return Array.from(categories).sort();
  });
};

export default forecastRoutes;
