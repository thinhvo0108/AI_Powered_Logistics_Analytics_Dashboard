import { format, startOfWeek } from "date-fns";
import { parseDate, type Row } from "./loader.js";

export type Granularity = "day" | "week" | "month";

export interface Filters {
  startDate?: string;
  endDate?: string;
  carrier?: string;
  region?: string;
  status?: string[];
  warehouse?: string;
}

export interface KPIResult {
  totalOrders: number;
  deliveredOrders: number;
  delayedOrders: number;
  exceptionOrders: number;
  onTimeDeliveryRate: number;
  avgDeliveryDays: number;
  totalRevenueUsd: number;
}

export interface TimeSeriesPoint {
  date: string;
  total: number;
  delivered: number;
  delayed: number;
}

export interface PerformancePoint {
  period: string;
  onTimeCount: number;
  delayedCount: number;
  onTimeRate: number;
}

export interface CarrierRow {
  carrier: string;
  total: number;
  delayed: number;
  delayRate: number;
  avgDeliveryDays: number;
}

export interface RegionRow {
  region: string;
  total: number;
  delayed: number;
  delayRate: number;
  revenue: number;
}

export interface CategoryRow {
  productCategory: string;
  total: number;
  revenue: number;
  avgOrderValue: number;
}

export interface WarehouseRow {
  warehouse: string;
  total: number;
  delayed: number;
  delayRate: number;
}

export interface RouteRow {
  originCity: string;
  destinationCity: string;
  total: number;
  delayed: number;
  delayRate: number;
}

export interface HistoryPoint {
  period: string;
  quantity: number;
  revenue: number;
}

export interface FilterOptions {
  carriers: string[];
  regions: string[];
  warehouses: string[];
  statuses: string[];
  dateRange: { min: string; max: string };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? round2((numerator / denominator) * 100) : 0;
}

function average(values: number[]): number {
  return values.length > 0 ? round2(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

/** Rebuilds a Date from its UTC calendar components so date-fns (local-time) formatting matches the source date. */
function localAnchor(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function formatDateOnly(date: Date): string {
  return format(localAnchor(date), "yyyy-MM-dd");
}

function periodKey(date: Date, granularity: Granularity): string {
  const anchor = localAnchor(date);
  switch (granularity) {
    case "day":
      return format(anchor, "yyyy-MM-dd");
    case "week":
      return format(startOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd");
    case "month":
      return format(anchor, "yyyy-MM");
  }
}

function deliveryDaysOf(rows: Row[]): number[] {
  return rows
    .map((r) => r.deliveryDays)
    .filter((d): d is number => d !== null);
}

export function applyFilters(rows: Row[], filters: Filters): Row[] {
  const start = filters.startDate ? parseDate(filters.startDate) : undefined;
  const end = filters.endDate ? parseDate(filters.endDate) : undefined;

  return rows.filter((row) => {
    if (start && row.orderDate < start) return false;
    if (end && row.orderDate > end) return false;
    if (filters.carrier && row.carrier !== filters.carrier) return false;
    if (filters.region && row.region !== filters.region) return false;
    if (filters.warehouse && row.warehouse !== filters.warehouse) return false;
    if (filters.status && filters.status.length > 0 && !filters.status.includes(row.status)) {
      return false;
    }
    return true;
  });
}

export function getKPIs(rows: Row[], filters: Filters): KPIResult {
  const filtered = applyFilters(rows, filters);
  const totalOrders = filtered.length;
  const deliveredOrders = filtered.filter((r) => r.status === "delivered").length;
  const delayedOrders = filtered.filter((r) => r.status === "delayed").length;
  const exceptionOrders = filtered.filter((r) => r.status === "exception").length;

  return {
    totalOrders,
    deliveredOrders,
    delayedOrders,
    exceptionOrders,
    onTimeDeliveryRate: ratio(deliveredOrders, totalOrders),
    avgDeliveryDays: average(deliveryDaysOf(filtered)),
    totalRevenueUsd: round2(filtered.reduce((sum, r) => sum + r.orderValueUsd, 0)),
  };
}

export function getOrdersOverTime(
  rows: Row[],
  filters: Filters,
  granularity: Granularity
): TimeSeriesPoint[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => periodKey(r.orderDate, granularity));

  const points: TimeSeriesPoint[] = Array.from(groups.entries()).map(([date, groupRows]) => ({
    date,
    total: groupRows.length,
    delivered: groupRows.filter((r) => r.isOnTime).length,
    delayed: groupRows.filter((r) => r.isDelayed).length,
  }));

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function getDeliveryPerformance(rows: Row[], filters: Filters): PerformancePoint[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => periodKey(r.orderDate, "month"));

  const points: PerformancePoint[] = Array.from(groups.entries()).map(([period, groupRows]) => {
    const onTimeCount = groupRows.filter((r) => r.isOnTime).length;
    const delayedCount = groupRows.filter((r) => r.isDelayed).length;

    return {
      period,
      onTimeCount,
      delayedCount,
      onTimeRate: ratio(onTimeCount, onTimeCount + delayedCount),
    };
  });

  return points.sort((a, b) => a.period.localeCompare(b.period));
}

export function getCarrierBreakdown(rows: Row[], filters: Filters): CarrierRow[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => r.carrier);

  const result: CarrierRow[] = Array.from(groups.entries()).map(([carrier, groupRows]) => {
    const total = groupRows.length;
    const delayed = groupRows.filter((r) => r.isDelayed).length;

    return {
      carrier,
      total,
      delayed,
      delayRate: ratio(delayed, total),
      avgDeliveryDays: average(deliveryDaysOf(groupRows)),
    };
  });

  return result.sort((a, b) => b.delayRate - a.delayRate || b.total - a.total);
}

export function getRegionBreakdown(rows: Row[], filters: Filters): RegionRow[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => r.region);

  const result: RegionRow[] = Array.from(groups.entries()).map(([region, groupRows]) => {
    const total = groupRows.length;
    const delayed = groupRows.filter((r) => r.isDelayed).length;

    return {
      region,
      total,
      delayed,
      delayRate: ratio(delayed, total),
      revenue: round2(groupRows.reduce((sum, r) => sum + r.orderValueUsd, 0)),
    };
  });

  return result.sort((a, b) => b.delayRate - a.delayRate || b.total - a.total);
}

export function getCategoryBreakdown(rows: Row[], filters: Filters): CategoryRow[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => r.productCategory);

  const result: CategoryRow[] = Array.from(groups.entries()).map(([productCategory, groupRows]) => {
    const total = groupRows.length;
    const revenue = round2(groupRows.reduce((sum, r) => sum + r.orderValueUsd, 0));

    return {
      productCategory,
      total,
      revenue,
      avgOrderValue: average(groupRows.map((r) => r.orderValueUsd)),
    };
  });

  return result.sort((a, b) => b.revenue - a.revenue);
}

export function getWarehouseBreakdown(rows: Row[], filters: Filters): WarehouseRow[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => r.warehouse);

  const result: WarehouseRow[] = Array.from(groups.entries()).map(([warehouse, groupRows]) => {
    const total = groupRows.length;
    const delayed = groupRows.filter((r) => r.isDelayed).length;

    return { warehouse, total, delayed, delayRate: ratio(delayed, total) };
  });

  return result.sort((a, b) => b.delayRate - a.delayRate || b.total - a.total);
}

export function getTopDelayedRoutes(rows: Row[], filters: Filters, topN = 10): RouteRow[] {
  const filtered = applyFilters(rows, filters);
  const groups = groupBy(filtered, (r) => `${r.originCity} ${r.destinationCity}`);

  const result: RouteRow[] = Array.from(groups.values()).map((groupRows) => {
    const total = groupRows.length;
    const delayed = groupRows.filter((r) => r.isDelayed).length;

    return {
      originCity: groupRows[0].originCity,
      destinationCity: groupRows[0].destinationCity,
      total,
      delayed,
      delayRate: ratio(delayed, total),
    };
  });

  return result.sort((a, b) => b.delayRate - a.delayRate || b.total - a.total).slice(0, topN);
}

export function getSkuHistory(
  rows: Row[],
  sku?: string,
  category?: string,
  granularity: Granularity = "month"
): HistoryPoint[] {
  let filtered = rows;
  if (sku) {
    filtered = filtered.filter((r) => r.sku === sku);
  } else if (category) {
    filtered = filtered.filter((r) => r.productCategory === category);
  }

  const groups = groupBy(filtered, (r) => periodKey(r.orderDate, granularity));

  const points: HistoryPoint[] = Array.from(groups.entries()).map(([period, groupRows]) => ({
    period,
    quantity: groupRows.reduce((sum, r) => sum + r.quantity, 0),
    revenue: round2(groupRows.reduce((sum, r) => sum + r.orderValueUsd, 0)),
  }));

  return points.sort((a, b) => a.period.localeCompare(b.period));
}

export function getFilterOptions(rows: Row[]): FilterOptions {
  const orderDates = rows.map((r) => r.orderDate.getTime());

  return {
    carriers: uniqueSorted(rows.map((r) => r.carrier)),
    regions: uniqueSorted(rows.map((r) => r.region)),
    warehouses: uniqueSorted(rows.map((r) => r.warehouse)),
    statuses: uniqueSorted(rows.map((r) => r.status)),
    dateRange: {
      min: orderDates.length > 0 ? formatDateOnly(new Date(Math.min(...orderDates))) : "",
      max: orderDates.length > 0 ? formatDateOnly(new Date(Math.max(...orderDates))) : "",
    },
  };
}
