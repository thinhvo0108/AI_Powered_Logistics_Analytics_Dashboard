import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConfig = {
  llmProvider: "openai" as "ollama" | "runpod" | "openai",
  ollamaBaseUrl: "http://ollama:11434",
  ollamaModel: "llama3.2:latest",
  runpodApiKey: undefined as string | undefined,
  runpodEndpointId: undefined as string | undefined,
  runpodModel: undefined as string | undefined,
  openaiApiKey: "sk-test",
  openaiModel: "gpt-4o-mini",
};

vi.mock("../../src/core/config.js", () => ({ config: mockConfig }));
vi.mock("../../src/core/logger.js", () => ({
  default: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { invokeWithFallback } = await import("../../src/llm/client.js");

describe("invokeWithFallback", () => {
  beforeEach(() => {
    mockConfig.llmProvider = "openai";
  });

  it("returns the primary call's result when it succeeds", async () => {
    const invocation = vi.fn().mockResolvedValue("primary-ok");

    const result = await invokeWithFallback(invocation);

    expect(result).toBe("primary-ok");
    expect(invocation).toHaveBeenCalledTimes(1);
  });

  it("retries with an Ollama fallback when the primary call throws", async () => {
    const invocation = vi
      .fn()
      .mockRejectedValueOnce(new Error("OpenAI quota exceeded"))
      .mockResolvedValueOnce("fallback-ok");

    const result = await invokeWithFallback(invocation);

    expect(result).toBe("fallback-ok");
    expect(invocation).toHaveBeenCalledTimes(2);
  });

  it("does not retry (and rethrows) when Ollama is already the primary provider", async () => {
    mockConfig.llmProvider = "ollama";
    const invocation = vi.fn().mockRejectedValue(new Error("Ollama unreachable"));

    await expect(invokeWithFallback(invocation)).rejects.toThrow("Ollama unreachable");
    expect(invocation).toHaveBeenCalledTimes(1);
  });

  it("propagates the fallback's error when both primary and fallback fail", async () => {
    const invocation = vi
      .fn()
      .mockRejectedValueOnce(new Error("OpenAI down"))
      .mockRejectedValueOnce(new Error("Ollama also down"));

    await expect(invokeWithFallback(invocation)).rejects.toThrow("Ollama also down");
    expect(invocation).toHaveBeenCalledTimes(2);
  });
});
