import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSuggestions, submitQuery } from "@/api/client";
import { useQueryHistoryStore } from "@/stores/useQueryHistoryStore";
import type { ConversationTurn, Filters } from "@/types/logistics";

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
    mutationFn: ({
      query,
      filters,
      history,
    }: {
      query: string;
      filters: Filters;
      history?: ConversationTurn[];
    }) => submitQuery(query, filters, history),
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
