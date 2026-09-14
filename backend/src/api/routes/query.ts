import type { FastifyPluginAsync } from "fastify";
import { NLQueryRequestSchema } from "../../schemas/requests.js";
import type { QueryResponse, ChartSpec, ExplainabilityBlock } from "../../schemas/responses.js";
import { checkInput } from "../../guardrails/inputGuard.js";
import { queryCache } from "../../cache/queryCache.js";
import { getWorkflow } from "../../graph/workflow.js";

const SUGGESTIONS = [
  "Which carrier has the highest delay rate?",
  "Show me order volume by month for 2025",
  "What is the on-time delivery rate by region?",
  "Predict demand for BOOK category for the next 3 months",
  "What are the top 10 most delayed shipping routes?",
  "How does FedEx compare to DHL on delivery time?",
  "Show revenue breakdown by product category",
  "Forecast PENCIL SKU demand for the next 6 months",
  "Show me data for next month",
  "How is FedEx doing?",
  "What should I order more of?",
];

const queryRoutes: FastifyPluginAsync = async (app) => {
  app.post("/query", async (request, reply) => {
    const { query, filters, history } = NLQueryRequestSchema.parse(request.body);
    const hasContext = history.length > 0;

    // Follow-up answers depend on the conversation so far, not just the raw query
    // text — caching them under a key that ignores history would risk serving a
    // stale, context-specific answer into an unrelated conversation.
    const cacheKey = queryCache.makeKey(query, filters);
    const cachedResponse = !hasContext ? (queryCache.get(cacheKey) as QueryResponse | null) : null;
    if (cachedResponse) {
      return { ...cachedResponse, cached: true };
    }

    const guardrailResult = checkInput(query, { hasContext });
    if (!guardrailResult.passed) {
      return reply.code(400).send({
        error: "Query rejected by input guardrail",
        violationType: guardrailResult.violationType,
        detail: guardrailResult.detail,
      });
    }

    const graph = getWorkflow();
    const result = await graph.invoke({
      query,
      history,
      filters: filters as Record<string, unknown>,
      errors: [],
    });

    const response: QueryResponse = {
      answer: result.answer ?? "",
      chart: (result.chartSpec as ChartSpec | null) ?? null,
      dataTable: result.dataTable ?? [],
      explainability: result.explainability as ExplainabilityBlock,
      toolUsed: (result.toolUsed as QueryResponse["toolUsed"]) ?? "clarify",
      cached: false,
      errors: result.errors ?? [],
    };

    if (!hasContext) {
      queryCache.set(cacheKey, response);
    }

    return response;
  });

  app.get("/query/suggestions", async () => SUGGESTIONS);
};

export default queryRoutes;
