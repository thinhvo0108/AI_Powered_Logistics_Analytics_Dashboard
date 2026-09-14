import * as ss from "simple-statistics";

export function getInventoryRecommendation(
  forecastValues: number[],
  leadTimeDays = 7,
  Z = 1.65
): string {
  const avgMonthlyDemand = ss.mean(forecastValues);
  const stdDev = ss.standardDeviation(forecastValues) || avgMonthlyDemand * 0.2;
  const safetyStock = Math.ceil(Z * stdDev * Math.sqrt(leadTimeDays / 30));
  const reorderPoint = Math.ceil(avgMonthlyDemand * (leadTimeDays / 30) + safetyStock);

  return (
    `Forecasted demand averages ${avgMonthlyDemand.toFixed(1)} units/month (std dev ${stdDev.toFixed(1)}). ` +
    `With a ${leadTimeDays}-day lead time, carry a safety stock of ${safetyStock} units (Z=${Z} service factor ` +
    `to buffer demand variability) and reorder once inventory falls to ${reorderPoint} units ` +
    `(expected demand during lead time plus safety stock).`
  );
}
