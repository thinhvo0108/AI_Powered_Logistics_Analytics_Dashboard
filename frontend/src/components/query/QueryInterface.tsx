"use client";

import { type KeyboardEvent } from "react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { ApiError } from "@/api/client";

interface QueryInterfaceProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (query: string) => void;
  isPending: boolean;
  error: unknown;
}

export function QueryInterface({ value, onValueChange, onSubmit, isPending, error }: QueryInterfaceProps) {
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isPending) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const errorMessage = error
    ? error instanceof ApiError
      ? error.message
      : "Something went wrong. Please try again."
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Ask about your logistics data... e.g. 'Which carrier had the most delays last month?'"
          className="max-h-[9rem] min-h-[3.25rem] w-full resize-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {isPending ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </span>
            ) : (
              "Enter to submit · Shift+Enter for new line"
            )}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !value.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Ask
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
