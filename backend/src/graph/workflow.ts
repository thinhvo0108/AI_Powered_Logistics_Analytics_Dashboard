import { END, START, StateGraph } from "@langchain/langgraph";
import { AppStateAnnotation, type AppState } from "./state.js";
import { inputGuardrailNode, outputGuardrailNode } from "./nodes/guardrail.js";
import { intentDetectionNode } from "./nodes/intent.js";
import { queryToolNode } from "./nodes/queryTool.js";
import { forecastToolNode } from "./nodes/forecastTool.js";
import { chartSelectorNode } from "./nodes/chartSelector.js";
import { formatterNode } from "./nodes/formatter.js";

function buildWorkflow() {
  return new StateGraph(AppStateAnnotation)
    .addNode("input_guardrail", inputGuardrailNode)
    .addNode("intent_detection", intentDetectionNode)
    .addNode("query_tool", queryToolNode)
    .addNode("forecast_tool", forecastToolNode)
    .addNode("chart_selector", chartSelectorNode)
    .addNode("formatter", formatterNode)
    .addNode("output_guardrail", outputGuardrailNode)
    .addEdge(START, "input_guardrail")
    .addConditionalEdges(
      "input_guardrail",
      (state: AppState) => (state.guardrailPassed ? "intent_detection" : END),
      { intent_detection: "intent_detection", [END]: END }
    )
    .addConditionalEdges(
      "intent_detection",
      (state: AppState) => {
        if (state.ambiguous || state.tool === "smalltalk") return "formatter";
        if (state.tool === "forecast") return "forecast_tool";
        return "query_tool";
      },
      { formatter: "formatter", forecast_tool: "forecast_tool", query_tool: "query_tool" }
    )
    .addEdge("query_tool", "chart_selector")
    .addEdge("forecast_tool", "chart_selector")
    .addEdge("chart_selector", "formatter")
    .addEdge("formatter", "output_guardrail")
    .addEdge("output_guardrail", END)
    .compile();
}

type Workflow = ReturnType<typeof buildWorkflow>;

let workflow: Workflow | null = null;

/** Compiled LangGraph workflow, built once and cached as a module singleton. */
export function getWorkflow(): Workflow {
  if (!workflow) {
    workflow = buildWorkflow();
  }
  return workflow;
}
