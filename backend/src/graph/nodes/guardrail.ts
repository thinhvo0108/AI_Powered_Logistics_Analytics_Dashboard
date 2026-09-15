import type { AppState } from "../state.js";
import { maskPII } from "../../guardrails/piiMask.js";

// Off-topic/injection checks run earlier, at the API route (before the graph
// is even invoked, so a rejected query never reaches the LLM at all). This
// node's job is PII masking: strip emails/phone numbers/card numbers/etc.
// from the query before it's sent to any LLM provider, including cloud ones.
export async function inputGuardrailNode(state: AppState): Promise<Partial<AppState>> {
  return {
    query: maskPII(state.query),
    guardrailPassed: true,
    guardrailViolation: null,
  };
}

export async function outputGuardrailNode(state: AppState): Promise<Partial<AppState>> {
  return { answer: state.answer };
}
