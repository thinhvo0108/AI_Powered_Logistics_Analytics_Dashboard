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

function describeDataShape(data: Record<string, unknown>[] | undefined): string {
  if (!data || data.length === 0) return "empty array";
  return `Array<{ ${Object.keys(data[0]).join(", ")} }> × ${data.length}`;
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
  const executionTimeMs =
    (queryResult?.executionTimeMs as number | undefined) ??
    (forecastResult?.executionTimeMs as number | undefined) ??
    0;

  let steps: string[];
  let computation: string;
  let dataShape: string;

  if (queryResult) {
    const filtersApplied = (queryResult.filtersApplied as Record<string, unknown>) ?? {};
    const filterDesc = Object.entries(filtersApplied)
      .filter(([, val]) => val != null && val !== "")
      .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
      .join(", ");

    steps = [
      "Load rows from in-memory dataset",
      filterDesc ? `Apply filters: ${filterDesc}` : "Apply no filters",
      `Aggregate metric "${metric}"${dimension ? ` grouped by "${dimension}"` : ""}`,
      `Return ${rowCount} rows`,
    ];
    computation = "TypeScript";
    dataShape = describeDataShape(queryResult.data as Record<string, unknown>[] | undefined);
  } else if (forecastResult) {
    const methodUsed = (forecastResult.methodUsed as string) ?? "unknown";
    const target =
      (forecastResult.sku as string | null) ?? (forecastResult.category as string | null) ?? "all products";
    const forecastLength = (forecastResult.forecast as unknown[] | undefined)?.length ?? 0;

    steps = [
      `Load historical monthly demand for ${target}`,
      `Select forecasting method: ${methodUsed}`,
      (forecastResult.methodExplanation as string) ?? `Run ${methodUsed}`,
      `Generate ${forecastLength} forecast period(s) and inventory recommendation`,
    ];
    computation = methodUsed === "moving_average" ? "Moving Average" : "simple-statistics";
    dataShape = describeDataShape(forecastResult.historical as Record<string, unknown>[] | undefined);
  } else {
    steps = ["No tool executed"];
    computation = "N/A";
    dataShape = "empty";
  }

  return {
    filtersApplied: (state.filters as Record<string, unknown>) ?? {},
    metricsUsed: metric ? [metric] : [],
    dimensionsUsed: dimension ? [dimension] : [],
    queryPlan: { steps, computation, dataShape, executionTimeMs },
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
        queryPlan: {
          steps: ["Query was ambiguous — could not determine tool without clarification."],
          computation: "N/A",
          dataShape: "empty",
          executionTimeMs: 0,
        },
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
