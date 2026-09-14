import { useQuery } from "@tanstack/react-query";
import { fetchKPIs } from "@/api/client";
import type { Filters } from "@/types/logistics";

const STALE_TIME = 2 * 60 * 1000;

export function useKPIs(filters: Filters) {
  return useQuery({
    queryKey: ["kpis", filters],
    queryFn: () => fetchKPIs(filters),
    staleTime: STALE_TIME,
  });
}
