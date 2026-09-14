"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { History, Trash2, X } from "lucide-react";
import { useQueryHistoryStore } from "@/stores/useQueryHistoryStore";

interface QueryHistoryProps {
  onRerun: (query: string) => void;
}

const TRUNCATE_LENGTH = 60;

function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

export function QueryHistory({ onRerun }: QueryHistoryProps) {
  const [open, setOpen] = useState(false);
  const history = useQueryHistoryStore((s) => s.history);
  const clearHistory = useQueryHistoryStore((s) => s.clearHistory);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 top-20 z-20 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
      >
        <History className="h-4 w-4" />
        History
        {history.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
            {history.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-slate-900/20"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-80 max-w-full flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Query History</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No queries yet</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onRerun(item.query);
                          setOpen(false);
                        }}
                        className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                          </span>
                          {item.cached && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                              cached
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-700">
                          {truncate(item.query, TRUNCATE_LENGTH)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {history.length > 0 && (
              <div className="border-t border-slate-200 p-3">
                <button
                  type="button"
                  onClick={clearHistory}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
