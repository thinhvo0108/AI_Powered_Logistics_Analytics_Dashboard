import { describe, it, expect } from "vitest";
import type { Row } from "../../src/data/loader.js";
import { runForecast } from "../../src/forecasting/engine.js";
import { getInventoryRecommendation } from "../../src/forecasting/recommender.js";

function makeMonthlyRow(period: string, quantity: number, category: string, index: number): Row {
  const orderDate = new Date(`${period}-01T00:00:00Z`);

  return {
    clientId: "client-1",
    orderId: `ORD-${index}`,
    orderDate,
    deliveryDate: orderDate,
    carrier: "FedEx",
    originCity: "CityA",
    destinationCity: "CityB",
    status: "delivered",
    sku: `SKU-${category}`,
    productCategory: category,
    quantity,
    unitPriceUsd: 10,
    orderValueUsd: quantity * 10,
    isPromo: false,
    promoDiscountPct: 0,
    region: "North",
    warehouse: "WH-North",
    deliveryDays: 0,
    isDelayed: false,
    isOnTime: true,
  };
}

function buildHistory(quantities: number[], category: string): Row[] {
  return quantities.map((quantity, i) => {
    const monthIndex = i; // 2023-01, 2023-02, ...
    const year = 2023 + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const period = `${year}-${String(month).padStart(2, "0")}`;
    return makeMonthlyRow(period, quantity, category, i);
  });
}

const FLAT_12 = buildHistory(Array(12).fill(100), "FLAT");
const TREND_12 = buildHistory(
  Array.from({ length: 12 }, (_, i) => 10 * (i + 1)),
  "TREND"
);

describe("runForecast", () => {
  it("moving_average: forecast length matches horizon and values are reasonable", () => {
    const result = runForecast(FLAT_12, undefined, "FLAT", 3, "moving_average");

    expect(result.forecast).toHaveLength(3);
    for (const point of result.forecast) {
      expect(point.forecastQty).toBeGreaterThan(90);
      expect(point.forecastQty).toBeLessThan(110);
    }
  });

  it("linear_regression: with an upward trend, the first forecast exceeds the last historical value", () => {
    const result = runForecast(TREND_12, undefined, "TREND", 3, "linear_regression");
    const lastHistorical = result.historical[result.historical.length - 1].quantity;

    expect(result.forecast[0].forecastQty).toBeGreaterThan(lastHistorical);
  });

  it("exponential_smoothing: with flat data, forecast stays near the historical average", () => {
    const result = runForecast(FLAT_12, undefined, "FLAT", 3, "exponential_smoothing");

    for (const point of result.forecast) {
      expect(point.forecastQty).toBeCloseTo(100, 0);
    }
  });

  it("auto-selects moving_average for short history (< 6 months)", () => {
    const shortHistory = buildHistory([10, 20, 30, 40], "SHORT");
    const result = runForecast(shortHistory, undefined, "SHORT", 3, "auto");

    expect(result.methodUsed).toBe("moving_average");
  });

  it("auto-selects linear_regression for medium history (6-11 months)", () => {
    const mediumHistory = buildHistory([10, 20, 30, 40, 50, 60, 70, 80], "MEDIUM");
    const result = runForecast(mediumHistory, undefined, "MEDIUM", 3, "auto");

    expect(result.methodUsed).toBe("linear_regression");
  });

  it("auto-selects exponential_smoothing for long history (12+ months)", () => {
    const result = runForecast(FLAT_12, undefined, "FLAT", 3, "auto");

    expect(result.methodUsed).toBe("exponential_smoothing");
  });

  it("throws when fewer than 3 months of history are available", () => {
    const tooShort = buildHistory([10, 20], "TOOSHORT");

    expect(() => runForecast(tooShort, undefined, "TOOSHORT", 3, "auto")).toThrow(Error);
  });
});

describe("getInventoryRecommendation", () => {
  it("returns a non-empty string containing numeric values", () => {
    const recommendation = getInventoryRecommendation([100, 110, 90, 105]);

    expect(typeof recommendation).toBe("string");
    expect(recommendation.length).toBeGreaterThan(0);
    expect(recommendation).toMatch(/\d/);
  });
});
