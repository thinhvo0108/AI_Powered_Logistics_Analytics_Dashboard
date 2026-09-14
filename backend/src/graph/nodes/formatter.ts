import { HumanMessage } from "@langchain/core/messages";
import type { AppState } from "../state.js";
import type { ExplainabilityBlock } from "../../schemas/responses.js";
import { getLLM } from "../../llm/client.js";
import { checkOutput } from "../../guardrails/outputGuard.js";
import logger from "../../core/logger.js";

function buildPrompt(state: AppState): string | null {
  if (state.queryResult) {
    const data = (state.queryResult.data as unknown[]) ?? [];
    return (
      `Based on this data:\n${JSON.stringify(data.slice(0, 5))}\n` +
      `Answer in 2-3 sentences with specific numbers.\n` +
      `User asked: ${state.query}`
    );
  }

  if (state.forecastResult) {
    return (
      `Based on this forecast:\n${JSON.stringify(state.forecastResult)}\n` +
      `Summarize trend, key numbers, inventory action in 2-3 sentences.\n` +
      `User asked: ${state.query}`
    );
  }

  return null;
}

function buildExplainability(state: AppState): ExplainabilityBlock {
  const queryResult = state.queryResult;
  const forecastResult = state.forecastResult;

  const metric = (queryResult?.metric as string) ?? (forecastResult?.methodUsed as string) ?? "";
  const dimension =
    (queryResult?.dimension as string | null) ??
    (forecastResult?.sku as string | null) ??
    (forecastResult?.category as string | null) ??
    null;
  const rowCount =
    (queryResult?.rowCount as number | undefined) ??
    (forecastResult?.historical as unknown[] | undefined)?.length ??
    0;

  return {
    filtersApplied: (state.filters as Record<string, unknown>) ?? {},
    metricsUsed: metric ? [metric] : [],
    dimensionsUsed: dimension ? [dimension] : [],
    queryPlan: `Aggregated ${metric || "n/a"} grouped by ${dimension ?? "none"}, returned ${rowCount} rows`,
    rowCount,
  };
}

export async function formatterNode(state: AppState): Promise<Partial<AppState>> {
  if (state.ambiguous) {
    return {
      answer: state.clarificationPrompt ?? "",
      toolUsed: "clarify",
      dataTable: [],
      chartSpec: null,
      explainability: {
        filtersApplied: {},
        metricsUsed: [],
        dimensionsUsed: [],
        queryPlan: "Query was ambiguous — could not route without clarification.",
        rowCount: 0,
      },
    };
  }

  const prompt = buildPrompt(state);

  try {
    let answer = "";

    if (prompt) {
      const llm = getLLM(0.3);
      const response = await llm.invoke([new HumanMessage(prompt)]);
      const raw =
        typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      answer = checkOutput(raw);
    }

    const dataTable = (
      (state.queryResult?.data as Record<string, unknown>[] | undefined) ??
      (state.forecastResult?.historical as Record<string, unknown>[] | undefined) ??
      []
    ).slice(0, 20);

    return {
      answer,
      toolUsed: state.tool,
      dataTable,
      explainability: buildExplainability(state),
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, "Formatter failed");

    return {
      answer: "",
      toolUsed: state.tool,
      dataTable: [],
      explainability: buildExplainability(state),
      errors: [message],
    };
  }
}
