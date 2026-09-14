// TODO: implement — wire up guardrails/inputGuard.ts and guardrails/outputGuard.ts
import type { AppState } from "../state.js";

export async function inputGuardrailNode(_state: AppState): Promise<Partial<AppState>> {
  return { guardrailPassed: true, guardrailViolation: null };
}

export async function outputGuardrailNode(state: AppState): Promise<Partial<AppState>> {
  return { answer: state.answer };
}
