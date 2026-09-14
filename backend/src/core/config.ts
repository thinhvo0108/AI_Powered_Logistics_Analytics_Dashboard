import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  llmProvider: z.enum(["ollama", "runpod", "openai"]).default("ollama"),
  ollamaBaseUrl: z.string().default("http://ollama:11434"),
  ollamaModel: z.string().default("llama3.2:latest"),
  runpodApiKey: z.string().optional(),
  runpodEndpointId: z.string().optional(),
  runpodModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().default("gpt-4o-mini"),
  // Comma-separated key:role pairs, e.g. "dev-secret-key:admin,read-only-key:viewer"
  apiKeys: z.string().default("dev-secret-key:admin"),
  corsOrigins: z.string().default("http://localhost:3000"),
  dataPath: z.string().default("data/mock_logistics_data.csv"),
  queryCacheTtlSeconds: z.coerce.number().default(300),
  port: z.coerce.number().default(8000),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  return ConfigSchema.parse({
    llmProvider: process.env.LLM_PROVIDER,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    ollamaModel: process.env.OLLAMA_MODEL,
    runpodApiKey: process.env.RUNPOD_API_KEY,
    runpodEndpointId: process.env.RUNPOD_ENDPOINT_ID,
    runpodModel: process.env.RUNPOD_MODEL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    apiKeys: process.env.API_KEYS,
    corsOrigins: process.env.CORS_ORIGINS,
    dataPath: process.env.DATA_PATH,
    queryCacheTtlSeconds: process.env.QUERY_CACHE_TTL_SECONDS,
    port: process.env.PORT,
  });
}

export const config: Config = loadConfig();

/** Parses a comma-separated "key:role,key:role" string into a Map<apiKey, role>. */
export function parseApiKeys(raw: string): Map<string, string> {
  const entries = new Map<string, string>();

  for (const pair of raw.split(",")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const [key, role] = trimmed.split(":").map((part) => part?.trim());
    if (key && role) {
      entries.set(key, role);
    }
  }

  return entries;
}
