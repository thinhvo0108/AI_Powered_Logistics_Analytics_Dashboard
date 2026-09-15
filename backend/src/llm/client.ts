import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { config } from "../core/config.js";
import logger from "../core/logger.js";

/**
 * Factory returning the LangChain chat model for the configured LLM_PROVIDER.
 * RunPod is served through ChatOpenAI since its vLLM endpoint is OpenAI-compatible.
 */
export function getLLM(temperature = 0): BaseChatModel {
  switch (config.llmProvider) {
    case "ollama":
      return new ChatOllama({
        baseUrl: config.ollamaBaseUrl,
        model: config.ollamaModel,
        temperature,
      });

    case "runpod":
      if (!config.runpodApiKey || !config.runpodEndpointId) {
        throw new Error("RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID must be set when LLM_PROVIDER=runpod");
      }
      return new ChatOpenAI({
        apiKey: config.runpodApiKey,
        configuration: {
          baseURL: `https://api.runpod.ai/v2/${config.runpodEndpointId}/openai/v1`,
        },
        model: config.runpodModel ?? "meta-llama/Llama-3.2-3B-Instruct",
        temperature,
      });

    case "openai":
      if (!config.openaiApiKey) {
        throw new Error("OPENAI_API_KEY must be set when LLM_PROVIDER=openai");
      }
      return new ChatOpenAI({
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
        temperature,
      });

    default: {
      const exhaustiveCheck: never = config.llmProvider;
      throw new Error(`Unknown LLM_PROVIDER: ${exhaustiveCheck}`);
    }
  }
}

function getOllamaFallback(temperature: number): BaseChatModel {
  return new ChatOllama({
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
    temperature,
  });
}

/**
 * Runs an LLM call against the configured provider, retrying once against the
 * local Ollama instance if the primary call throws (e.g. OpenAI quota
 * exhausted, RunPod endpoint unreachable). No-op passthrough when Ollama is
 * already the primary provider — there's no different fallback to retry with.
 *
 * `invocation` receives whichever chat model to use and performs the actual
 * `.invoke()` (optionally via `.withStructuredOutput()` first) — this keeps
 * the fallback logic in one place while call sites keep their own usage
 * pattern (plain invoke vs. structured output).
 */
export async function invokeWithFallback<T>(
  invocation: (llm: BaseChatModel) => Promise<T>,
  temperature = 0
): Promise<T> {
  const primary = getLLM(temperature);

  try {
    return await invocation(primary);
  } catch (error) {
    if (config.llmProvider === "ollama") {
      throw error;
    }

    logger.warn(
      { err: error, provider: config.llmProvider },
      "Primary LLM call failed, retrying with Ollama fallback"
    );

    return await invocation(getOllamaFallback(temperature));
  }
}

/**
 * Lightweight connectivity probe used by /health. A failure here means the
 * configured provider is unreachable or misconfigured, not that the app is down.
 */
export async function healthCheckLLM(): Promise<boolean> {
  try {
    const llm = getLLM();
    await llm.invoke("Say 'ok'");
    return true;
  } catch (error) {
    logger.warn({ err: error, provider: config.llmProvider }, "LLM health check failed");
    return false;
  }
}
