import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getLLM } from "../../llm/client.js";
import { getDateRange } from "../../data/loader.js";
import logger from "../../core/logger.js";
import type { AppState } from "../state.js";

const QueryParamsSchema = z.object({
  metric: z.enum([
    "order_volume",
    "delay_rate",
    "delivery_time",
    "revenue",
    "carrier_performance",
    "region_breakdown",
    "category_breakdown",
    "top_routes",
  ]),
  dimension: z.enum(["carrier", "region", "category", "warehouse", "time"]).optional(),
  granularity: z.enum(["day", "week", "month"]).default("month"),
  topN: z.number().default(10),
  timeRangeOverride: z.object({ startDate: z.string(), endDate: z.string() }).optional(),
});

const ForecastParamsSchema = z.object({
  sku: z.string().optional(),
  category: z.string().optional(),
  horizonMonths: z.number().default(3),
  method: z.string().default("auto"),
});

const IntentResultSchema = z.object({
  tool: z.enum(["query", "forecast", "both", "clarify"]),
  queryParams: QueryParamsSchema.optional(),
  forecastParams: ForecastParamsSchema.optional(),
  ambiguous: z.boolean(),
  clarificationPrompt: z.string().optional(),
});

function buildSystemPrompt(): string {
  const { startDate, endDate } = getDateRange();

  return `You are an AI assistant for a logistics analytics platform. Interpret the user question
and output a structured routing decision. The data contains: orders, delivery status
(delivered/delayed/exception), carriers, regions, SKUs, product categories, warehouses, dates.

The dataset only covers orders from ${startDate} to ${endDate}. Do not assume any other
date range from your own knowledge (e.g. today's date or a "recent" year).

Available tools:
- query: historical analytics (KPIs, aggregations, breakdowns, comparisons)
- forecast: predicting future demand for a SKU or category
- both: question asks for both historical context AND a forecast
- clarify: question is genuinely ambiguous — cannot route without clarification

Only set queryParams.timeRangeOverride when the user explicitly names a date, month, or
year. If they don't mention a time period, omit timeRangeOverride entirely so the query
runs over the full dataset — never invent or guess a date range.

queryParams.dimension controls how results are grouped, and it is easy to forget — pay
close attention to the noun the user groups/breaks down by:
- "by region" / "which region" / "per region" -> dimension: "region"
- "by carrier" / "which carrier" / "per carrier" -> dimension: "carrier"
- "by warehouse" -> dimension: "warehouse"
- "by category" -> dimension: "category"
- "over time" / "by month" / "trend" -> dimension: "time"
If the question names one of these nouns, you MUST set dimension to match it — do not
leave dimension unset in that case. Only omit dimension when the question genuinely
names none of them.

NEVER answer from memory. ALWAYS route to a tool.`;
}

export async function intentDetectionNode(state: AppState): Promise<Partial<AppState>> {
  try {
    const structuredLLM = getLLM().withStructuredOutput(IntentResultSchema, { method: "jsonSchema" });
    const result = await structuredLLM.invoke([
      new SystemMessage(buildSystemPrompt()),
      new HumanMessage(state.query),
    ]);

    return {
      tool: result.tool,
      queryParams: result.queryParams ?? {},
      forecastParams: result.forecastParams ?? {},
      ambiguous: result.ambiguous,
      clarificationPrompt: result.clarificationPrompt ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, "Intent detection failed");

    return {
      tool: "clarify",
      ambiguous: true,
      clarificationPrompt:
        "I couldn't determine how to answer that question. Could you rephrase it or be more specific?",
      errors: [message],
    };
  }
}
