import { HumanMessage } from "@langchain/core/messages";
import type { AppState } from "../state.js";
import type { ExplainabilityBlock } from "../../schemas/responses.js";
import { getLLM } from "../../llm/client.js";
import { checkOutput } from "../../guardrails/outputGuard.js";
import logger from "../../core/logger.js";

function describeFilters(filtersApplied: Record<string, unknown> | undefined): string {
  const entries = Object.entries(filtersApplied ?? {}).filter(
    ([, val]) => val != null && val !== ""
  );
  if (entries.length === 0) return "no filters";
  return entries.map(([key, val]) => `${key}=${JSON.stringify(val)}`).join(", ");
}

/** Returns null when there's nothing for the LLM to summarize — the caller should
 * fall back to a deterministic "no data found" answer instead of risking the LLM
 * filling the gap with outside knowledge. */
function buildPrompt(state: AppState): string | null {
  if (state.queryResult) {
    const data = (state.queryResult.data as unknown[]) ?? [];
    if (data.length === 0) return null;

    return (
      `Based ONLY on this data (do not use any outside knowledge):\n${JSON.stringify(data.slice(0, 5))}\n` +
      `Answer in 2-3 sentences with specific numbers.\n` +
      `User asked: ${state.query}`
    );
  }

  if (state.forecastResult) {
    const historical = (state.forecastResult.historical as unknown[] | undefined) ?? [];
    const forecast = (state.forecastResult.forecast as unknown[] | undefined) ?? [];
    if (historical.length === 0 && forecast.length === 0) return null;

    return (
      `Based ONLY on this forecast (do not use any outside knowledge):\n${JSON.stringify(state.forecastResult)}\n` +
      `Summarize trend, key numbers, inventory action in 2-3 sentences.\n` +
      `User asked: ${state.query}`
    );
  }

  return null;
}

function buildNoDataAnswer(state: AppState): string {
  if (state.queryResult) {
    const filtersApplied = state.queryResult.filtersApplied as Record<string, unknown> | undefined;
    return `No matching data was found for your query (filters: ${describeFilters(filtersApplied)}). Try a different time range or removing a filter.`;
  }

  if (state.forecastResult) {
    return "No historical data was found for that SKU/category, so a forecast could not be generated.";
  }

  return "";
}

const DEFAULT_SMALLTALK_REPLY =
  "Hi there! I'm a logistics analytics assistant — I can help with order volumes, delivery delays, carrier performance, and demand forecasts. For anything outside that, I may not have the ability to help.";

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
  if (state.tool === "smalltalk") {
    return {
      answer: state.clarificationPrompt ?? DEFAULT_SMALLTALK_REPLY,
      toolUsed: "smalltalk",
      dataTable: [],
      chartSpec: null,
      explainability: {
        filtersApplied: {},
        metricsUsed: [],
        dimensionsUsed: [],
        queryPlan: {
          steps: ["Greeting or small talk — no data tool needed."],
          computation: "N/A",
          dataShape: "empty",
          executionTimeMs: 0,
        },
        rowCount: 0,
      },
    };
  }

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
    } else if (state.queryResult || state.forecastResult) {
      answer = buildNoDataAnswer(state);
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
