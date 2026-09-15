"use client";

import { AlertTriangle, Bot, History, TrendingUp, RotateCcw } from "lucide-react";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { ExplainabilityPanel } from "@/components/query/ExplainabilityPanel";
import type { QueryResponse } from "@/types/logistics";

interface QueryResultProps {
  result: QueryResponse;
  onSuggestionSelect?: (query: string, autoSubmit: boolean) => void;
}

interface ClarifySuggestion {
  label: string;
  icon: typeof History;
  query?: string;
}

function getClarifySuggestions(clarificationPrompt: string): ClarifySuggestion[] {
  const lower = clarificationPrompt.toLowerCase();
  const suggestions: ClarifySuggestion[] = [];

  if (lower.includes("historical")) {
    suggestions.push({
      label: "Show historical data",
      icon: History,
      query: "Show me order and delivery performance data for the last 3 months",
    });
  }

  if (lower.includes("forecast")) {
    suggestions.push({
      label: "Run forecast",
      icon: TrendingUp,
      query: "Forecast demand for all categories over the next 3 months",
    });
  }

  suggestions.push({ label: "Rephrase question", icon: RotateCcw });

  return suggestions.slice(0, 3);
}

export function QueryResult({ result, onSuggestionSelect }: QueryResultProps) {
  if (result.toolUsed === "clarify") {
    const suggestions = getClarifySuggestions(result.answer);

    return (
      <div className="animate-fade-in flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm leading-relaxed text-blue-900">{result.answer}</p>
          </div>
        </div>

        <div className="ml-11 flex flex-wrap gap-2">
          {suggestions.map(({ label, icon: Icon, query }) => (
            <button
              key={label}
              type="button"
              onClick={() => onSuggestionSelect?.(query ?? "", Boolean(query))}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (result.toolUsed === "smalltalk") {
    return (
      <div className="animate-fade-in flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Bot className="h-4 w-4" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm leading-relaxed text-blue-900">{result.answer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {result.errors.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{result.errors.join(" ")}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm leading-relaxed text-slate-800">{result.answer}</p>
      </div>

      {result.chart && <DynamicChart spec={result.chart} />}

      <ExplainabilityPanel
        explainability={result.explainability}
        dataTable={result.dataTable}
        toolUsed={result.toolUsed}
        cached={result.cached}
        raw={result}
      />
    </div>
  );
}
