// TODO: implement — assemble final answer + explainability block
import type { AppState } from "../state.js";

export async function formatterNode(state: AppState): Promise<Partial<AppState>> {
  return {
    answer: state.clarificationPrompt ?? "",
    dataTable: [],
    explainability: {},
  };
}
