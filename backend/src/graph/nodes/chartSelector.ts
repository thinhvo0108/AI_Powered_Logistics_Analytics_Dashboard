// TODO: implement — select chartType from result shape
import type { AppState } from "../state.js";

export function chartSelectorNode(_state: AppState): Partial<AppState> {
  return { chartSpec: null };
}
