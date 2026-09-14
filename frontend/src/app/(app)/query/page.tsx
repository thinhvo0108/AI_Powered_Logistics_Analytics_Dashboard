"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { QueryInterface } from "@/components/query/QueryInterface";
import { QueryResult } from "@/components/query/QueryResult";
import { QueryHistory } from "@/components/query/QueryHistory";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { useSubmitQuery, useSuggestions } from "@/hooks/useQuery";
import { useForecastCategories, useSubmitForecast } from "@/hooks/useForecast";
import { useFilterStore } from "@/stores/useFilterStore";
import type { ForecastMethod, QueryResponse } from "@/types/logistics";

const FORECAST_METHODS: { value: ForecastMethod; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "moving_average", label: "Moving Average" },
  { value: "linear_regression", label: "Linear Regression" },
  { value: "exponential_smoothing", label: "Exponential Smoothing" },
];

const RELATED_COUNT = 3;

function ForecastSection() {
  const { data: categories } = useForecastCategories();
  const { mutate, data: forecastResult, isPending, error } = useSubmitForecast();

  const [category, setCategory] = useState<string>("");
  const [horizon, setHorizon] = useState(3);
  const [method, setMethod] = useState<ForecastMethod>("auto");

  const handleRunForecast = () => {
    mutate({
      category: category || undefined,
      horizonMonths: horizon,
      method,
    });
  };

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
            <option value="">All categories</option>
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
          disabled={isPending}
          className="ml-auto flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Run Forecast
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">Failed to run forecast. Please try again.</p>
      )}

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

export default function QueryPage() {
  const filters = useFilterStore((s) => s.filters);
  const { data: suggestions } = useSuggestions();
  const { mutate: runQuery } = useSubmitQuery();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);

  const runAndSubmit = (query: string) => {
    setInput(query);
    runQuery({ query, filters }, { onSuccess: setResult });
  };

  const handleClaritySuggestion = (query: string, autoSubmit: boolean) => {
    if (autoSubmit && query) {
      runAndSubmit(query);
    } else {
      setInput(query);
    }
  };

  const relatedSuggestions = useMemo(
    () => (suggestions ?? []).filter((s) => s !== input).slice(0, RELATED_COUNT),
    [suggestions, input]
  );

  return (
    <div className="flex flex-col">
      <Header title="AI Query" />

      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col gap-4 lg:w-[60%]">
            <QueryInterface value={input} onValueChange={setInput} onResult={setResult} />

            {result && (
              <>
                <QueryResult result={result} onSuggestionSelect={handleClaritySuggestion} />

                {relatedSuggestions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Sparkles className="h-3.5 w-3.5" />
                      Try related
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {relatedSuggestions.map((suggestion) => (
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
              </>
            )}
          </div>

          <div className="lg:w-[40%]">
            <QueryHistory onRerun={runAndSubmit} />
          </div>
        </div>

        <ForecastSection />
      </div>
    </div>
  );
}
