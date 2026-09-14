import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchSuggestions, submitQuery } from "@/api/client";
import type { ConversationTurn, Filters } from "@/types/logistics";

export function useSuggestions() {
  return useQuery({
    queryKey: ["query-suggestions"],
    queryFn: fetchSuggestions,
    staleTime: Infinity,
  });
}

export function useSubmitQuery() {
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
  });
}
