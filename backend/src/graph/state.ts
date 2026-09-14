import { Annotation } from "@langchain/langgraph";

export const AppStateAnnotation = Annotation.Root({
  query: Annotation<string>,
  filters: Annotation<Record<string, unknown>>,
  guardrailPassed: Annotation<boolean>,
  guardrailViolation: Annotation<string | null>,
  tool: Annotation<"query" | "forecast" | "both" | "clarify">,
  queryParams: Annotation<Record<string, unknown>>,
  forecastParams: Annotation<Record<string, unknown>>,
  ambiguous: Annotation<boolean>,
  clarificationPrompt: Annotation<string | null>,
  queryResult: Annotation<Record<string, unknown> | null>,
  forecastResult: Annotation<Record<string, unknown> | null>,
  chartSpec: Annotation<Record<string, unknown> | null>,
  answer: Annotation<string>,
  dataTable: Annotation<Record<string, unknown>[]>,
  explainability: Annotation<Record<string, unknown>>,
  toolUsed: Annotation<string>,
  errors: Annotation<string[]>({
    reducer: (a: string[], b: string[]) => a.concat(b),
    default: () => [],
  }),
});

export type AppState = typeof AppStateAnnotation.State;
