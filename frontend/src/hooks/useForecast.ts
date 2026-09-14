import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchForecastCategories, submitForecast } from "@/api/client";
import type { ForecastParams } from "@/types/logistics";

export function useForecastCategories() {
  return useQuery({
    queryKey: ["forecast-categories"],
    queryFn: fetchForecastCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSubmitForecast() {
  return useMutation({
    mutationFn: (params: ForecastParams) => submitForecast(params),
  });
}
