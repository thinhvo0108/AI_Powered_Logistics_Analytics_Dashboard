import * as ss from "simple-statistics";
import { addMonths, format, parse } from "date-fns";
import { getSkuHistory } from "../data/queries.js";
import type { Row } from "../data/loader.js";

export type ForecastMethod = "moving_average" | "linear_regression" | "exponential_smoothing";

export interface HistoricalPoint {
  period: string;
  quantity: number;
}

export interface ForecastPoint {
  period: string;
  forecastQty: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  methodUsed: ForecastMethod;
  methodExplanation: string;
  residualsStd: number;
}

const METHOD_EXPLANATIONS: Record<ForecastMethod, (months: number) => string> = {
  moving_average: (months) =>
    `Moving average of the last ${Math.min(3, months)} months, selected because fewer than 6 months of history are available.`,
  linear_regression: (months) =>
    `Linear regression trend fit across ${months} months of history, selected because 6-11 months of data are available.`,
  exponential_smoothing: (months) =>
    `Exponential smoothing (alpha=0.3) across ${months} months of history, selected because 12+ months of data are available.`,
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function nextPeriods(lastPeriod: string, horizon: number): string[] {
  const base = parse(lastPeriod, "yyyy-MM", new Date());
  return Array.from({ length: horizon }, (_, i) => format(addMonths(base, i + 1), "yyyy-MM"));
}

function selectMethod(historyLength: number): ForecastMethod {
  if (historyLength < 6) return "moving_average";
  if (historyLength < 12) return "linear_regression";
  return "exponential_smoothing";
}

function movingAverage(
  quantities: number[],
  window: number,
  horizon: number
): { values: number[]; residualsStd: number } {
  const recent = quantities.slice(-window);
  const avg = ss.mean(recent);
  const residuals = recent.map((q) => q - avg);

  return { values: Array(horizon).fill(avg), residualsStd: ss.standardDeviation(residuals) };
}

function linearRegressionForecast(
  quantities: number[],
  horizon: number
): { values: number[]; residualsStd: number } {
  const points: [number, number][] = quantities.map((q, i) => [i, q]);
  const line = ss.linearRegression(points);
  const predict = ss.linearRegressionLine(line);
  const residuals = quantities.map((q, i) => q - predict(i));
  const n = quantities.length;

  return {
    values: Array.from({ length: horizon }, (_, i) => predict(n + i)),
    residualsStd: ss.standardDeviation(residuals),
  };
}

function exponentialSmoothing(
  quantities: number[],
  alpha: number,
  horizon: number
): { values: number[]; residualsStd: number } {
  const smoothed = [quantities[0]];
  for (let i = 1; i < quantities.length; i++) {
    smoothed.push(alpha * quantities[i] + (1 - alpha) * smoothed[i - 1]);
  }
  const residuals = quantities.map((q, i) => q - smoothed[i]);
  const last = smoothed[smoothed.length - 1];

  return { values: Array(horizon).fill(last), residualsStd: ss.standardDeviation(residuals) };
}

export function runForecast(
  rows: Row[],
  sku?: string,
  category?: string,
  horizonMonths = 3,
  method: ForecastMethod | "auto" = "auto"
): ForecastResult {
  const history = getSkuHistory(rows, sku, category, "month");
  if (history.length < 3) {
    throw new Error("Not enough historical data (need >= 3 months)");
  }

  const methodUsed = method === "auto" ? selectMethod(history.length) : method;
  const quantities = history.map((h) => h.quantity);
  const periods = nextPeriods(history[history.length - 1].period, horizonMonths);

  const { values, residualsStd } =
    methodUsed === "moving_average"
      ? movingAverage(quantities, 3, horizonMonths)
      : methodUsed === "linear_regression"
        ? linearRegressionForecast(quantities, horizonMonths)
        : exponentialSmoothing(quantities, 0.3, horizonMonths);

  const forecast: ForecastPoint[] = periods.map((period, i) => {
    const value = values[i];
    const margin = methodUsed === "linear_regression" ? 1.28 * residualsStd : value * 0.2;

    return {
      period,
      forecastQty: round2(value),
      lowerBound: round2(Math.max(0, value - margin)),
      upperBound: round2(value + margin),
    };
  });

  return {
    historical: history.map((h) => ({ period: h.period, quantity: h.quantity })),
    forecast,
    methodUsed,
    methodExplanation: METHOD_EXPLANATIONS[methodUsed](quantities.length),
    residualsStd: round2(residualsStd),
  };
}
