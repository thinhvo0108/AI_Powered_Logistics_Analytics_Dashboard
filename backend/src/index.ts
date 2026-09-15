import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { ZodError } from "zod";
import { config, parseApiKeys } from "./core/config.js";
import logger from "./core/logger.js";
import "./data/loader.js";
import dashboardRoutes from "./api/routes/dashboard.js";
import queryRoutes from "./api/routes/query.js";
import forecastRoutes from "./api/routes/forecast.js";

export async function buildApp() {
  const app = Fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: config.corsOrigins.split(",").map((origin) => origin.trim()),
  });
  await app.register(helmet);

  // No route wraps its own Zod .parse(request.body/query) in a try/catch, so a
  // malformed request throws all the way up here — turn that into a clean 400
  // instead of Fastify's default 500 with a raw stringified ZodError.
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: error.issues.map((issue) => issue.message).join("; "),
        details: error.issues.map((issue) => ({
          path: issue.path.join(".") || undefined,
          message: issue.message,
        })),
      });
    }

    logger.error({ err: error }, "Unhandled error");
    return reply.code(500).send({ error: "Internal server error" });
  });

  const apiKeys = parseApiKeys(config.apiKeys);

  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/api/")) {
      return;
    }

    const apiKey = request.headers["x-api-key"];
    if (typeof apiKey !== "string" || !apiKeys.has(apiKey)) {
      await reply.code(401).send({ error: "Unauthorized: missing or invalid API key" });
    }
  });

  app.get("/health", async () => ({
    status: "ok",
    llmProvider: config.llmProvider,
    timestamp: new Date().toISOString(),
  }));

  await app.register(dashboardRoutes, { prefix: "/api" });
  await app.register(queryRoutes, { prefix: "/api" });
  await app.register(forecastRoutes, { prefix: "/api" });

  return app;
}

async function start(): Promise<void> {
  const app = await buildApp();

  await app.listen({ host: "0.0.0.0", port: config.port });

  logger.info(
    { port: config.port, llmProvider: config.llmProvider },
    "Logistics Analytics backend started"
  );
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  });
}
