# CLAUDE.md

## Project Overview

AI-Powered Logistics Analytics Dashboard — a full-stack application for a logistics client that delivers:

1. **Descriptive Analytics** — KPI dashboard (total orders, delays, on-time rate, avg delivery time) with Recharts visualizations
2. **Diagnostic Analytics** — natural-language query interface powered by LangGraph AI orchestration (Query Tool)
3. **Predictive Analytics** — demand forecasting per SKU/category (Forecasting Tool) using moving average, linear regression, or exponential smoothing

This is a senior AI engineering portfolio project. The AI layer is a **routing and orchestration system** — it never generates answers without calling a computation tool. Every response includes full explainability (filters, metrics, query plan, underlying data).

---

## Architecture

```
Frontend (Next.js 15 + Tailwind + Recharts)
        │
        ▼
   Fastify Backend (Node.js 22 + TypeScript)
        │
        ├── REST: GET /api/dashboard/*  (static KPIs + charts)
        ├── REST: POST /api/query       (NL → LangGraph workflow)
        └── REST: POST /api/forecast    (direct forecasting)
                │
                ▼
        [Input Guardrail]
        (off-topic · injection)
                │
                ▼
        LangGraph Workflow (@langchain/langgraph)
                │
            ┌───┴────────────────┐
            ▼                    ▼
    Intent Detection        Tool Router
            │              ┌─────┴──────┐
            │              ▼            ▼
            │         Query Tool   Forecast Tool
            │        (TS arrays)   (simple-statistics)
            │              │            │
            └──────────────┼────────────┘
                           ▼
                  Chart Type Selector
                           │
                           ▼
                 Response Formatter
                 (answer + explainability)
                           │
                           ▼
                  [Output Guardrail]
                           │
                           ▼
                   Final Response
                   (answer + chart spec + query plan + data table)
```

Key design decisions:
- **No raw AI-generated code execution** — structured query params only; AI picks parameters, not SQL or code
- **LLM is a router** — all computation is deterministic TypeScript; AI only interprets intent and selects tools
- **Multi-LLM support** — Ollama (local), RunPod (cloud GPU, OpenAI-compatible), OpenAI API — switchable via `LLM_PROVIDER` env var
- **Read-only data** — CSV loaded once into memory as an array of typed objects on startup
- **Explainability first** — every response includes filters applied, metrics used, query plan, and raw data table

---

## Technical Stack

### Backend
- **Node.js 22** + **TypeScript** (strict mode)
- **Fastify v5** — fast, TypeScript-native HTTP framework with schema validation
- **Zod** — runtime schema validation for all API boundaries
- **@langchain/langgraph** — LangGraph JS/TS orchestration workflow
- **@langchain/ollama** + **@langchain/openai** — LLM provider adapters
- **csv-parse** — CSV data loading (read-only, loaded once on startup)
- **simple-statistics** — linear regression, descriptive stats for forecasting
- **pino** — JSON structured logging (Fastify default)
- **vitest** — unit and integration tests

### LLM Providers (via `LLM_PROVIDER` env)
| Provider | Env Var | Notes |
|---|---|---|
| `ollama` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Local, free |
| `runpod` | `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, `RUNPOD_MODEL` | Cloud GPU, OpenAI-compatible |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` | Cloud API |

### Frontend
- **Next.js 15** + TypeScript + App Router
- **Tailwind CSS 4** + Shadcn/UI (Radix UI primitives)
- **Recharts 2** — AreaChart, BarChart, LineChart, PieChart, ComposedChart
- **TanStack Query (React Query 5)** — server state / caching
- **Zustand** — client state (query history, filters)
- **Lucide React** — icons

### Infrastructure
- **Docker Compose** — local dev stack (backend + frontend + Ollama)
- **docker-compose.prod.yml** — production variant

---

## Project Structure

```
backend/src/
    api/
        routes/
            dashboard.ts    # GET /api/dashboard/kpis, /charts/*
            query.ts        # POST /api/query  (NL → LangGraph workflow)
            forecast.ts     # POST /api/forecast
    
    core/
        config.ts           # Zod-validated env config (dotenv + zod)
        logger.ts           # pino logger setup

    data/
        loader.ts           # CSV → typed Row[] singleton (read-only)
        queries.ts          # All typed TS query functions (aggregations, filtering)

    graph/
        state.ts            # AppState interface + Annotation definitions
        workflow.ts         # LangGraph StateGraph definition
        nodes/
            guardrail.ts    # Input/output guardrail node
            intent.ts       # Intent detection — what does user want?
            queryTool.ts    # Analytics tool node (calls data/queries.ts)
            forecastTool.ts # Forecasting tool node (calls forecasting/engine.ts)
            chartSelector.ts # Select chart type from result shape
            formatter.ts    # Build final response with explainability

    forecasting/
        engine.ts           # Moving avg, linear reg, exp smoothing implementations
        recommender.ts      # Inventory recommendation logic

    guardrails/
        inputGuard.ts       # Off-topic + injection check (pattern-based)
        outputGuard.ts      # Safety screening of LLM answer

    llm/
        client.ts           # LLM factory: returns Ollama | OpenAI (RunPod) based on LLM_PROVIDER

    schemas/
        requests.ts         # Zod schemas — QueryRequest, ForecastRequest, Filters
        responses.ts        # Zod schemas — KPIResponse, ChartSpec, QueryResponse, ForecastResponse

    cache/
        queryCache.ts       # In-memory TTL cache for repeated NL queries (bonus)

    index.ts                # Fastify app entry point, plugin registration, lifespan

frontend/src/
    app/(app)/
        dashboard/page.tsx  # KPI cards + static charts
        query/page.tsx      # NL query interface

    components/
        charts/
            OrderVolumeChart.tsx
            DeliveryPerformanceChart.tsx
            CarrierBreakdownChart.tsx
            CategoryRevenueChart.tsx
            ForecastChart.tsx
            DynamicChart.tsx            # AI-driven: renders any chart type from ChartSpec
        dashboard/
            KPICards.tsx
            DashboardFilters.tsx
            DataTable.tsx
        query/
            QueryInterface.tsx
            QueryResult.tsx
            QueryHistory.tsx            # Bonus: persisted query history
            ExplainabilityPanel.tsx
        layout/
            Sidebar.tsx
            Header.tsx

    hooks/
        useKPIs.ts
        useChartData.ts
        useQuery.ts
        useForecast.ts

    stores/
        useQueryHistoryStore.ts         # Zustand — persisted query history (bonus)
        useFilterStore.ts

    types/
        logistics.ts                    # TypeScript interfaces mirroring API schemas
```

---

## Data Schema

CSV columns: `client_id, order_id, order_date, delivery_date, carrier, origin_city, destination_city, status, sku, product_category, quantity, unit_price_usd, order_value_usd, is_promo, promo_discount_pct, region, warehouse`

Status values: `delivered`, `delayed`, `exception`, `in_transit`, `pending`

Derived fields computed in `data/queries.ts`:
- `deliveryDays` = `(new Date(delivery_date) - new Date(order_date)) / 86_400_000`
- `isDelayed` = `status === "delayed"`
- `isOnTime` = `status === "delivered"`

---

## LangGraph Workflow Nodes (JS/TS)

### guardrail (input)
Pattern-based checks: off-topic queries (non-logistics), prompt injection. Blocks with HTTP 400 if violated.

### intent_detection
LLM call with structured output (`withStructuredOutput()`). Determines:
- `tool`: `"query"` | `"forecast"` | `"both"` | `"clarify"`
- `queryParams`: `{metric, dimension, granularity, topN, timeRangeOverride}`
- `forecastParams`: `{sku, category, horizonMonths, method}`
- `ambiguous`: boolean — triggers clarification response if true

### query_tool
Calls typed function from `data/queries.ts` based on `queryParams`. Returns `{data: Row[], metric, filtersApplied}`.

### forecast_tool
Calls `forecasting/engine.ts` with `forecastParams`. Returns `{historical, forecast, method, inventoryRecommendation}`.

### chart_selector
Given result shape and dimension count, selects `chartType`: `line | bar | pie | area | composed`. Returns `ChartSpec`.

### formatter
Assembles final response: LLM-generated natural language answer + ChartSpec + ExplainabilityBlock (filters, metrics, query plan, data table).

### guardrail (output)
Safety screening of LLM-generated answer text.

---

## Engineering Standards

### Type Safety
- Zod schemas for all API input/output boundaries
- TypeScript strict mode throughout backend
- TypeScript strict mode on frontend

### Testing
- vitest unit tests: `tests/unit/` — data queries, forecasting engine, guardrails (no LLM)
- vitest integration tests: `tests/integration/` — full workflow with mocked LLM

### Logging
- pino JSON logger — never `console.log()` in production code
- Request ID injected per API call via Fastify request lifecycle

### Error Handling
- Every LangGraph node catches exceptions, appends to `state.errors`
- Graceful degradation: if forecasting fails, returns query result only
- Ambiguous queries return clarification prompt, not hallucinated data

### Security
- No eval(), no dynamic code execution from user input
- All user input sanitized before data filtering
- API key auth on all `/api/*` routes (`X-API-Key` header)
- Fastify helmet for security headers
- CORS restricted in production

### Caching (Bonus)
- In-memory TTL cache (5 min) on NL query endpoint keyed by SHA-256 of normalized query + filters
- Cache hit includes `"cached": true` in response

---

## Environment Variables (.env.sample)

```
# LLM Provider: ollama | runpod | openai
LLM_PROVIDER=ollama

# Ollama (local)
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:latest

# RunPod (cloud GPU — OpenAI-compatible)
RUNPOD_API_KEY=
RUNPOD_ENDPOINT_ID=
RUNPOD_MODEL=meta-llama/Llama-3.2-3B-Instruct

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# API
API_KEYS=dev-secret-key:admin
CORS_ORIGINS=http://localhost:3000

# Data
DATA_PATH=data/mock_logistics_data.csv

# Cache
QUERY_CACHE_TTL_SECONDS=300
```

---

## Running the Project

```bash
# 1. Copy env file and fill in values
cp .env.sample .env

# 2. Start everything (Ollama model is pulled automatically)
docker compose up --build

# 3. Access
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:8000
#   API docs:  http://localhost:8000/documentation  (Fastify Swagger)
#   Health:    http://localhost:8000/health
```

To switch LLM provider: set `LLM_PROVIDER=openai` (or `runpod`) and fill in the corresponding keys in `.env`.
