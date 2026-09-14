import type { FastifyPluginAsync } from "fastify";

// KPI and chart endpoints (GET /api/dashboard/kpis, /api/dashboard/charts/*) land in a later step.
const dashboardRoutes: FastifyPluginAsync = async () => {};

export default dashboardRoutes;
