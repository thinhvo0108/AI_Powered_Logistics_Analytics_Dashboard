import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { config, parseApiKeys } from "./core/config.js";
import logger from "./core/logger.js";
import "./data/loader.js";
import dashboardRoutes from "./api/routes/dashboard.js";
import queryRoutes from "./api/routes/query.js";
import forecastRoutes from "./api/routes/forecast.js";

async function buildApp() {
  const app = Fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: config.corsOrigins.split(",").map((origin) => origin.trim()),
  });
  await app.register(helmet);

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

start().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
