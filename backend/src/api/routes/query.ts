import type { FastifyPluginAsync } from "fastify";

// POST /api/query (NL query orchestration) lands in a later step.
const queryRoutes: FastifyPluginAsync = async () => {};

export default queryRoutes;
