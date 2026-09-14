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
