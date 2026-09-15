"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Sparkles, TrendingUp } from "lucide-react";
import { ApiError } from "@/api/client";
import { Header } from "@/components/layout/Header";
import { QueryInterface } from "@/components/query/QueryInterface";
import { QueryResult } from "@/components/query/QueryResult";
import { QueryHistory } from "@/components/query/QueryHistory";
import { ContextUsageBadge } from "@/components/query/ContextUsageBadge";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { useSubmitQuery, useSuggestions } from "@/hooks/useQuery";
import { useForecastCategories, useSubmitForecast } from "@/hooks/useForecast";
import { useFilterStore } from "@/stores/useFilterStore";
import { useQueryHistoryStore } from "@/stores/useQueryHistoryStore";
import type { ConversationTurn, ForecastMethod, QueryResponse } from "@/types/logistics";

const FORECAST_METHODS: { value: ForecastMethod; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "moving_average", label: "Moving Average" },
  { value: "linear_regression", label: "Linear Regression" },
  { value: "exponential_smoothing", label: "Exponential Smoothing" },
];

const SUGGESTION_COUNT = 4;
// Sent to the backend so it can resolve follow-ups ("what about UPS?") using
// prior turns — capped to keep the prompt (and payload) from growing unbounded.
const MAX_HISTORY_TURNS = 6;

function ForecastSection() {
  const { data: categories } = useForecastCategories();
  const { mutate, data: forecastResult, isPending, error } = useSubmitForecast();

  const [category, setCategory] = useState<string>("");
  const [horizon, setHorizon] = useState(3);
  const [method, setMethod] = useState<ForecastMethod>("auto");

  // The API requires a specific sku or category — there's no "all categories"
  // forecast — so default to the first one as soon as the list loads instead
  // of leaving an unsubmittable placeholder selected.
  useEffect(() => {
    if (!category && categories && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [category, categories]);

  const handleRunForecast = () => {
    if (!category) return;
    mutate({
      category,
      horizonMonths: horizon,
      method,
    });
  };

  const errorMessage = error
    ? error instanceof ApiError
      ? error.message
      : "Failed to run forecast. Please try again."
    : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <TrendingUp className="h-4 w-4 text-purple-600" />
        Demand Forecast
      </h2>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
          >
            {(categories ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            Horizon: {horizon} {horizon === 1 ? "month" : "months"}
          </label>
          <input
            type="range"
            min={1}
            max={12}
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="h-9 w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as ForecastMethod)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
          >
            {FORECAST_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleRunForecast}
          disabled={isPending || !category}
          className="ml-auto flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Run Forecast
        </button>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {forecastResult && (
        <div className="flex flex-col gap-3">
          <ForecastChart spec={forecastResult.chart} />
          <div className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-800">
            {forecastResult.inventoryRecommendation}
          </div>
        </div>
      )}
    </div>
  );
}

interface ConversationEntry {
  id: string;
  query: string;
  result: QueryResponse;
}

export default function QueryPage() {
  const filters = useFilterStore((s) => s.filters);
  const { data: suggestions } = useSuggestions();
  const { mutate: runQuery, isPending, error } = useSubmitQuery();
  const recordTurn = useQueryHistoryStore((s) => s.recordTurn);

  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  // One id per conversation — every turn rolls into the same sidebar history
  // entry instead of creating a new one each time. Starting a new conversation
  // swaps this for a fresh id, same as reloading the page.
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.length]);

  const startNewConversation = () => {
    setConversation([]);
    setConversationId(crypto.randomUUID());
    setInput("");
  };

  const runAndSubmit = (query: string) => {
    setInput("");

    const history: ConversationTurn[] = conversation.slice(-MAX_HISTORY_TURNS).map((turn) => ({
      query: turn.query,
      answer: turn.result.answer,
    }));

    runQuery(
      { query, filters, history },
      {
        onSuccess: (data) => {
          setConversation((prev) => [...prev, { id: crypto.randomUUID(), query, result: data }]);
          recordTurn(conversationId, {
            query,
            answer: data.answer,
            toolUsed: data.toolUsed,
            cached: data.cached,
          });
        },
      }
    );
  };

  const handleClaritySuggestion = (query: string, autoSubmit: boolean) => {
    if (autoSubmit && query) {
      runAndSubmit(query);
    } else {
      setInput(query);
    }
  };

  const askedQueries = useMemo(() => new Set(conversation.map((t) => t.query)), [conversation]);

  const visibleSuggestions = useMemo(
    () => (suggestions ?? []).filter((s) => !askedQueries.has(s)).slice(0, SUGGESTION_COUNT),
    [suggestions, askedQueries]
  );

  return (
    <div className="flex flex-col">
      <Header
        title="AI Query"
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewConversation}
              disabled={isPending || conversation.length === 0}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              New conversation
            </button>
            <ContextUsageBadge
              usedTurns={Math.min(conversation.length, MAX_HISTORY_TURNS)}
              maxTurns={MAX_HISTORY_TURNS}
            />
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-6">
          {conversation.length === 0 && !isPending ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
              Ask a question about your logistics data to get started.
            </div>
          ) : (
            conversation.map((turn) => (
              <div key={turn.id} className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2 text-sm text-white">
                    {turn.query}
                  </div>
                </div>
                <QueryResult result={turn.result} onSuggestionSelect={handleClaritySuggestion} />
              </div>
            ))
          )}

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 bg-slate-50 pt-2 pb-4">
          <QueryInterface
            value={input}
            onValueChange={setInput}
            onSubmit={runAndSubmit}
            isPending={isPending}
            error={error}
          />

          {visibleSuggestions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
                {conversation.length === 0 ? "Try asking" : "Try related"}
              </span>
              <div className="flex flex-wrap gap-2">
                {visibleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => runAndSubmit(suggestion)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <QueryHistory onRerun={runAndSubmit} />

        <ForecastSection />
      </div>
    </div>
  );
}
