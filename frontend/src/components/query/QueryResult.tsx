"use client";

import { AlertTriangle } from "lucide-react";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { ExplainabilityPanel } from "@/components/query/ExplainabilityPanel";
import type { QueryResponse } from "@/types/logistics";

interface QueryResultProps {
  result: QueryResponse;
}

export function QueryResult({ result }: QueryResultProps) {
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
