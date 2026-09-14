// TODO: implement — call forecasting/engine.ts based on state.forecastParams
import type { AppState } from "../state.js";

export async function forecastToolNode(_state: AppState): Promise<Partial<AppState>> {
  return { forecastResult: null, toolUsed: "forecast" };
}
