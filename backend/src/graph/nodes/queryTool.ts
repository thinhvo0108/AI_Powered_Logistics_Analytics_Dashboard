// TODO: implement — call data/queries.ts based on state.queryParams
import type { AppState } from "../state.js";

export async function queryToolNode(_state: AppState): Promise<Partial<AppState>> {
  return { queryResult: null, toolUsed: "query" };
}
