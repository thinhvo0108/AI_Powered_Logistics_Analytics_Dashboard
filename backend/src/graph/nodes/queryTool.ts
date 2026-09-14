import type { AppState } from "../state.js";
import { getRows } from "../../data/loader.js";
import {
  getOrdersOverTime,
  getCarrierBreakdown,
  getRegionBreakdown,
  getCategoryBreakdown,
  getDeliveryPerformance,
  getTopDelayedRoutes,
  type Filters,
  type Granularity,
} from "../../data/queries.js";
import logger from "../../core/logger.js";

export async function queryToolNode(state: AppState): Promise<Partial<AppState>> {
  const start = performance.now();
  try {
    const queryParams = state.queryParams ?? {};
    const metric = queryParams.metric as string;
    const dimension = queryParams.dimension as string | undefined;
    const granularity = (queryParams.granularity as Granularity) ?? "month";
    const topN = (queryParams.topN as number) ?? 10;
    const timeRangeOverride = queryParams.timeRangeOverride as
      | { startDate: string; endDate: string }
      | undefined;

    const filters: Filters = {
      ...(state.filters as Filters),
      ...(timeRangeOverride ?? {}),
    };

    const rows = getRows();
    let data: unknown[];

    switch (metric) {
      case "order_volume":
        data = getOrdersOverTime(rows, filters, granularity);
        break;
      case "carrier_performance":
        data = getCarrierBreakdown(rows, filters);
        break;
      case "delay_rate":
        data =
          dimension === "time"
            ? getDeliveryPerformance(rows, filters)
            : getCarrierBreakdown(rows, filters);
        break;
      case "delivery_time":
        data = getCarrierBreakdown(rows, filters);
        break;
      case "revenue":
        data =
          dimension === "region"
            ? getRegionBreakdown(rows, filters)
            : getCategoryBreakdown(rows, filters);
        break;
      case "region_breakdown":
        data = getRegionBreakdown(rows, filters);
        break;
      case "category_breakdown":
        data = getCategoryBreakdown(rows, filters);
        break;
      case "top_routes":
        data = getTopDelayedRoutes(rows, filters, topN);
        break;
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }

    return {
      queryResult: {
        data,
        metric,
        dimension: dimension ?? null,
        filtersApplied: filters,
        rowCount: data.length,
        executionTimeMs: performance.now() - start,
      },
      toolUsed: "query",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, "Query tool failed");

    return { errors: [message], queryResult: null, toolUsed: "query" };
  }
}
