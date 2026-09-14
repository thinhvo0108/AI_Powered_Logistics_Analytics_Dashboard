import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSuggestions, submitQuery } from "@/api/client";
import { useQueryHistoryStore } from "@/stores/useQueryHistoryStore";
import type { Filters } from "@/types/logistics";

export function useSuggestions() {
  return useQuery({
    queryKey: ["query-suggestions"],
    queryFn: fetchSuggestions,
    staleTime: Infinity,
  });
}

export function useSubmitQuery() {
  const addToHistory = useQueryHistoryStore((state) => state.addToHistory);

  return useMutation({
    mutationFn: ({ query, filters }: { query: string; filters: Filters }) =>
      submitQuery(query, filters),
    onSuccess: (data, variables) => {
      addToHistory({
        id: crypto.randomUUID(),
        query: variables.query,
        timestamp: Date.now(),
        answer: data.answer,
        toolUsed: data.toolUsed,
        cached: data.cached,
      });
    },
  });
}
