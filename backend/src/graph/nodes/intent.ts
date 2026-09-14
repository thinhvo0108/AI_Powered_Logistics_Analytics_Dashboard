// TODO: implement — LLM structured-output intent detection
import type { AppState } from "../state.js";

export async function intentDetectionNode(_state: AppState): Promise<Partial<AppState>> {
  return {
    tool: "query",
    queryParams: {},
    forecastParams: {},
    ambiguous: false,
    clarificationPrompt: null,
  };
}
