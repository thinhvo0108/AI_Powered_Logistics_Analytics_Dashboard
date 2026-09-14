import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QueryHistoryItem } from "@/types/logistics";

const MAX_HISTORY_ITEMS = 50;

interface QueryHistoryState {
  history: QueryHistoryItem[];
  addToHistory: (item: QueryHistoryItem) => void;
  clearHistory: () => void;
}

export const useQueryHistoryStore = create<QueryHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history].slice(0, MAX_HISTORY_ITEMS),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    { name: "logiai-query-history" }
  )
);
