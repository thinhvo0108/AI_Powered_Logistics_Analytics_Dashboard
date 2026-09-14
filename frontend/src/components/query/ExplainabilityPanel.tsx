"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import type { ExplainabilityBlock, ToolUsed } from "@/types/logistics";

interface ExplainabilityPanelProps {
  explainability: ExplainabilityBlock;
  dataTable: Record<string, unknown>[];
  toolUsed: ToolUsed;
  cached: boolean;
}

const TOOL_BADGE_CLASS: Record<ToolUsed, string> = {
  query: "border-blue-200 bg-blue-50 text-blue-600",
  forecast: "border-purple-200 bg-purple-50 text-purple-600",
  both: "border-orange-200 bg-orange-50 text-orange-600",
  clarify: "border-slate-200 bg-slate-100 text-slate-600",
};

const PREVIEW_ROWS = 10;

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ExplainabilityPanel({
  explainability,
  dataTable,
  toolUsed,
  cached,
}: ExplainabilityPanelProps) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(() => {
    const first = dataTable[0];
    if (!first) return [];
    return Object.keys(first).map((key) => ({ key, label: key }));
  }, [dataTable]);

  const filterEntries = Object.entries(explainability.filtersApplied).filter(
    ([, val]) => val != null && val !== ""
  );
  const visibleRows = showAll ? dataTable : dataTable.slice(0, PREVIEW_ROWS);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          View explanation
        </span>
        <div className="flex items-center gap-2">
          <Badge className={TOOL_BADGE_CLASS[toolUsed]}>{toolUsed}</Badge>
          {cached && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-600">cached</Badge>}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          {filterEntries.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Filters
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {filterEntries.map(([key, val]) => (
                  <Badge key={key} className="border-slate-200 bg-slate-50 text-slate-600">
                    {key}: {String(val)}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {explainability.metricsUsed.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Metrics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {explainability.metricsUsed.map((metric) => (
                  <Badge key={metric} className="border-blue-200 bg-blue-50 text-blue-600">
                    {metric}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {explainability.dimensionsUsed.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Dimensions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {explainability.dimensionsUsed.map((dimension) => (
                  <Badge key={dimension} className="border-purple-200 bg-purple-50 text-purple-600">
                    {dimension}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Query Plan
            </h4>
            <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
              {explainability.queryPlan}
            </pre>
          </section>

          {dataTable.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Data ({explainability.rowCount.toLocaleString()} rows)
              </h4>
              <DataTable
                columns={columns}
                data={visibleRows}
                exportFilename="query-result.csv"
                maxHeight="320px"
              />
              {dataTable.length > PREVIEW_ROWS && (
                <button
                  type="button"
                  onClick={() => setShowAll((s) => !s)}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  {showAll ? "Show fewer rows" : `Show all ${dataTable.length} rows`}
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
