import { describe, it, expect } from "vitest";
import type { Row } from "../../src/data/loader.js";
import {
  applyFilters,
  getKPIs,
  getOrdersOverTime,
  getCarrierBreakdown,
  getRegionBreakdown,
  getCategoryBreakdown,
  getSkuHistory,
} from "../../src/data/queries.js";

interface RowSpec {
  orderDate: string;
  deliveryDate: string | null;
  carrier: string;
  region: string;
  category: string;
  status: string;
  value: number;
  quantity: number;
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function makeRow(spec: RowSpec, index: number): Row {
  const orderDate = toUtcDate(spec.orderDate);
  const deliveryDate = spec.deliveryDate ? toUtcDate(spec.deliveryDate) : null;
  const deliveryDays = deliveryDate
    ? (deliveryDate.getTime() - orderDate.getTime()) / 86_400_000
    : null;

  return {
    clientId: "client-1",
    orderId: `ORD-${index}`,
    orderDate,
    deliveryDate,
    carrier: spec.carrier,
    originCity: "CityA",
    destinationCity: "CityB",
    status: spec.status,
    sku: spec.category === "BOOK" ? "BOOK-100" : "PEN-200",
    productCategory: spec.category,
    quantity: spec.quantity,
    unitPriceUsd: spec.value / spec.quantity,
    orderValueUsd: spec.value,
    isPromo: false,
    promoDiscountPct: 0,
    region: spec.region,
    warehouse: spec.region === "North" ? "WH-North" : "WH-South",
    deliveryDays,
    isDelayed: spec.status === "delayed",
    isOnTime: spec.status === "delivered",
  };
}

// 20 rows across Jan/Feb 2024, 3 carriers, 2 regions, 2 categories, statuses
// mixing delivered/delayed/exception. Values chosen so every aggregate below
// has a hand-computed expected result.
const SPECS: RowSpec[] = [
  { orderDate: "2024-01-05", deliveryDate: "2024-01-07", carrier: "FedEx", region: "North", category: "BOOK", status: "delivered", value: 100, quantity: 5 },
  { orderDate: "2024-01-06", deliveryDate: "2024-01-12", carrier: "DHL", region: "North", category: "PENCIL", status: "delayed", value: 50, quantity: 10 },
  { orderDate: "2024-01-07", deliveryDate: "2024-01-09", carrier: "UPS", region: "South", category: "BOOK", status: "delivered", value: 120, quantity: 3 },
  { orderDate: "2024-01-08", deliveryDate: null, carrier: "FedEx", region: "South", category: "PENCIL", status: "exception", value: 30, quantity: 2 },
  { orderDate: "2024-01-09", deliveryDate: "2024-01-11", carrier: "DHL", region: "North", category: "BOOK", status: "delivered", value: 200, quantity: 8 },
  { orderDate: "2024-01-10", deliveryDate: "2024-01-20", carrier: "UPS", region: "North", category: "PENCIL", status: "delayed", value: 40, quantity: 4 },
  { orderDate: "2024-01-11", deliveryDate: "2024-01-13", carrier: "FedEx", region: "South", category: "BOOK", status: "delivered", value: 150, quantity: 6 },
  { orderDate: "2024-01-12", deliveryDate: "2024-01-14", carrier: "DHL", region: "South", category: "PENCIL", status: "delivered", value: 60, quantity: 5 },
  { orderDate: "2024-01-13", deliveryDate: "2024-01-25", carrier: "UPS", region: "North", category: "BOOK", status: "delayed", value: 180, quantity: 7 },
  { orderDate: "2024-01-14", deliveryDate: "2024-01-16", carrier: "FedEx", region: "North", category: "PENCIL", status: "delivered", value: 45, quantity: 3 },
  { orderDate: "2024-02-05", deliveryDate: "2024-02-07", carrier: "FedEx", region: "North", category: "BOOK", status: "delivered", value: 110, quantity: 5 },
  { orderDate: "2024-02-06", deliveryDate: "2024-02-08", carrier: "DHL", region: "North", category: "PENCIL", status: "delivered", value: 55, quantity: 6 },
  { orderDate: "2024-02-07", deliveryDate: null, carrier: "UPS", region: "South", category: "BOOK", status: "exception", value: 130, quantity: 4 },
  { orderDate: "2024-02-08", deliveryDate: "2024-02-18", carrier: "FedEx", region: "South", category: "PENCIL", status: "delayed", value: 35, quantity: 3 },
  { orderDate: "2024-02-09", deliveryDate: "2024-02-11", carrier: "DHL", region: "North", category: "BOOK", status: "delivered", value: 210, quantity: 9 },
  { orderDate: "2024-02-10", deliveryDate: "2024-02-12", carrier: "UPS", region: "North", category: "PENCIL", status: "delivered", value: 42, quantity: 4 },
  { orderDate: "2024-02-11", deliveryDate: "2024-02-21", carrier: "FedEx", region: "South", category: "BOOK", status: "delayed", value: 160, quantity: 7 },
  { orderDate: "2024-02-12", deliveryDate: "2024-02-14", carrier: "DHL", region: "South", category: "PENCIL", status: "delivered", value: 65, quantity: 5 },
  { orderDate: "2024-02-13", deliveryDate: "2024-02-15", carrier: "UPS", region: "North", category: "BOOK", status: "delivered", value: 190, quantity: 8 },
  { orderDate: "2024-02-14", deliveryDate: "2024-02-16", carrier: "FedEx", region: "North", category: "PENCIL", status: "delivered", value: 48, quantity: 4 },
];

const rows = SPECS.map(makeRow);

describe("getKPIs", () => {
  it("computes totals, rates, and revenue correctly across the full dataset", () => {
    const kpis = getKPIs(rows, {});

    expect(kpis.totalOrders).toBe(20);
    expect(kpis.deliveredOrders).toBe(13);
    expect(kpis.delayedOrders).toBe(5);
    expect(kpis.exceptionOrders).toBe(2);
    expect(kpis.onTimeDeliveryRate).toBe(65);
    expect(kpis.avgDeliveryDays).toBe(4.11);
    expect(kpis.totalRevenueUsd).toBe(2020);
  });
});

describe("getOrdersOverTime", () => {
  it("groups orders by month", () => {
    const points = getOrdersOverTime(rows, {}, "month");

    expect(points).toEqual([
      { date: "2024-01", total: 10, delivered: 6, delayed: 3 },
      { date: "2024-02", total: 10, delivered: 7, delayed: 2 },
    ]);
  });
});

describe("getCarrierBreakdown", () => {
  it("computes delayRate = delayed / total and sorts by delayRate desc", () => {
    const breakdown = getCarrierBreakdown(rows, {});

    expect(breakdown.map((c) => c.carrier)).toEqual(["UPS", "FedEx", "DHL"]);

    const ups = breakdown.find((c) => c.carrier === "UPS")!;
    expect(ups.total).toBe(6);
    expect(ups.delayed).toBe(2);
    expect(ups.delayRate).toBe(33.33);

    const fedex = breakdown.find((c) => c.carrier === "FedEx")!;
    expect(fedex.total).toBe(8);
    expect(fedex.delayed).toBe(2);
    expect(fedex.delayRate).toBe(25);

    const dhl = breakdown.find((c) => c.carrier === "DHL")!;
    expect(dhl.total).toBe(6);
    expect(dhl.delayed).toBe(1);
    expect(dhl.delayRate).toBe(16.67);
  });
});

describe("getRegionBreakdown", () => {
  it("sums revenue per region", () => {
    const breakdown = getRegionBreakdown(rows, {});

    const north = breakdown.find((r) => r.region === "North")!;
    const south = breakdown.find((r) => r.region === "South")!;

    expect(north.total).toBe(12);
    expect(north.revenue).toBe(1270);
    expect(south.total).toBe(8);
    expect(south.revenue).toBe(750);
  });
});

describe("getCategoryBreakdown", () => {
  it("sorts categories by revenue descending", () => {
    const breakdown = getCategoryBreakdown(rows, {});

    expect(breakdown.map((c) => c.productCategory)).toEqual(["BOOK", "PENCIL"]);

    const book = breakdown[0];
    expect(book.total).toBe(10);
    expect(book.revenue).toBe(1550);
    expect(book.avgOrderValue).toBe(155);

    const pencil = breakdown[1];
    expect(pencil.total).toBe(10);
    expect(pencil.revenue).toBe(470);
    expect(pencil.avgOrderValue).toBe(47);
  });
});

describe("getSkuHistory", () => {
  it("filters by category and aggregates quantity/revenue per month", () => {
    const history = getSkuHistory(rows, undefined, "BOOK", "month");

    expect(history).toEqual([
      { period: "2024-01", quantity: 29, revenue: 750 },
      { period: "2024-02", quantity: 33, revenue: 800 },
    ]);
  });
});

describe("applyFilters", () => {
  it("filters by date range", () => {
    const filtered = applyFilters(rows, { startDate: "2024-02-01" });
    expect(filtered).toHaveLength(10);
    expect(filtered.every((r) => r.orderDate >= toUtcDate("2024-02-01"))).toBe(true);
  });

  it("filters by carrier", () => {
    const filtered = applyFilters(rows, { carrier: "DHL" });
    expect(filtered).toHaveLength(6);
    expect(filtered.every((r) => r.carrier === "DHL")).toBe(true);
  });

  it("filters by status", () => {
    const filtered = applyFilters(rows, { status: ["delayed"] });
    expect(filtered).toHaveLength(5);
    expect(filtered.every((r) => r.status === "delayed")).toBe(true);
  });

  it("returns an empty array for a carrier that does not exist", () => {
    const filtered = applyFilters(rows, { carrier: "Nonexistent" });
    expect(filtered).toEqual([]);
  });
});
