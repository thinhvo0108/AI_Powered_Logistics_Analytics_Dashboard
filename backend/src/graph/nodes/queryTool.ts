import type { AppState } from "../state.js";
import { getRows, type Row } from "../../data/loader.js";
import {
  getOrdersOverTime,
  getCarrierBreakdown,
  getRegionBreakdown,
  getCategoryBreakdown,
  getWarehouseBreakdown,
  getDeliveryPerformance,
  getTopDelayedRoutes,
  type Filters,
  type Granularity,
} from "../../data/queries.js";
import logger from "../../core/logger.js";

/** Delay/on-time performance can be sliced by carrier (default), region, warehouse, or
 * time — group by whatever dimension the user actually asked for instead of always
 * defaulting to carrier. */
function getDelayBreakdown(rows: Row[], filters: Filters, dimension: string | undefined): unknown[] {
  switch (dimension) {
    case "region":
      return getRegionBreakdown(rows, filters);
    case "warehouse":
      return getWarehouseBreakdown(rows, filters);
    case "time":
      return getDeliveryPerformance(rows, filters);
    default:
      return getCarrierBreakdown(rows, filters);
  }
}

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
        data = getDelayBreakdown(rows, filters, dimension);
        break;
      case "delivery_time":
        data = getDelayBreakdown(rows, filters, dimension);
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
