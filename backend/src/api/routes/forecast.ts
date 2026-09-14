import type { FastifyPluginAsync } from "fastify";

// POST /api/forecast lands in a later step.
const forecastRoutes: FastifyPluginAsync = async () => {};

export default forecastRoutes;
