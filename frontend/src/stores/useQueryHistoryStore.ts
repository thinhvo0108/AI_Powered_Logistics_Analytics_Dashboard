import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QueryHistoryItem, ToolUsed } from "@/types/logistics";

const MAX_HISTORY_ITEMS = 50;

interface RecordTurnInput {
  query: string;
  answer: string;
  toolUsed: ToolUsed;
  cached: boolean;
}

interface QueryHistoryState {
  history: QueryHistoryItem[];
  /** Adds a new conversation entry on its first turn, or rolls a follow-up
   * into the existing entry for `conversationId` — so a multi-turn chat stays
   * one history item instead of one per question. */
  recordTurn: (conversationId: string, turn: RecordTurnInput) => void;
  clearHistory: () => void;
}

export const useQueryHistoryStore = create<QueryHistoryState>()(
  persist(
    (set) => ({
      history: [],
      recordTurn: (conversationId, turn) =>
        set((state) => {
          const now = Date.now();
          const existing = state.history.find((item) => item.id === conversationId);
          const rest = state.history.filter((item) => item.id !== conversationId);

          const updated: QueryHistoryItem = existing
            ? {
                ...existing,
                turnCount: existing.turnCount + 1,
                updatedAt: now,
                lastAnswer: turn.answer,
                lastToolUsed: turn.toolUsed,
                cached: turn.cached,
              }
            : {
                id: conversationId,
                firstQuery: turn.query,
                turnCount: 1,
                timestamp: now,
                updatedAt: now,
                lastAnswer: turn.answer,
                lastToolUsed: turn.toolUsed,
                cached: turn.cached,
              };

          return { history: [updated, ...rest].slice(0, MAX_HISTORY_ITEMS) };
        }),
      clearHistory: () => set({ history: [] }),
    }),
    // Renamed key: the persisted shape changed from one-entry-per-question to
    // one-entry-per-conversation, so old entries are incompatible and are left
    // behind rather than migrated.
    { name: "logiai-query-history-v2" }
  )
);
