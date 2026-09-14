import { useQuery } from "@tanstack/react-query";
import { fetchChartData, fetchFilterOptions } from "@/api/client";
import type { Filters } from "@/types/logistics";

const STALE_TIME = 2 * 60 * 1000;

export function useOrderVolumeChart(
  filters: Filters,
  granularity?: "day" | "week" | "month"
) {
  return useQuery({
    queryKey: ["chart", "order-volume", filters, granularity],
    queryFn: () => fetchChartData("order-volume", filters, granularity),
    staleTime: STALE_TIME,
  });
}

export function useDeliveryPerformanceChart(filters: Filters) {
  return useQuery({
    queryKey: ["chart", "delivery-performance", filters],
    queryFn: () => fetchChartData("delivery-performance", filters),
    staleTime: STALE_TIME,
  });
}

export function useCarrierChart(filters: Filters) {
  return useQuery({
    queryKey: ["chart", "carriers", filters],
    queryFn: () => fetchChartData("carriers", filters),
    staleTime: STALE_TIME,
  });
}

export function useCategoryChart(filters: Filters) {
  return useQuery({
    queryKey: ["chart", "categories", filters],
    queryFn: () => fetchChartData("categories", filters),
    staleTime: STALE_TIME,
  });
}

export function useRegionChart(filters: Filters) {
  return useQuery({
    queryKey: ["chart", "regions", filters],
    queryFn: () => fetchChartData("regions", filters),
    staleTime: STALE_TIME,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: STALE_TIME,
  });
}
