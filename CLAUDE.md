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
   FastAPI Backend  ──────────────────────────────────────┐
        │                                                  │
        ▼                                                  │
  [Input Guardrail]                              REST: /api/dashboard/*
  (off-topic · injection)                        REST: /api/query
        │                                        REST: /api/forecast
        ▼
  LangGraph Workflow
        │
    ┌───┴────────────────┐
    ▼                    ▼
Intent Detection    Tool Router
    │              ┌─────┴──────┐
    │              ▼            ▼
    │         Query Tool   Forecast Tool
    │        (pandas agg)  (sklearn/statsmodels)
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
- **No raw AI SQL** — structured pandas queries only; AI picks query parameters, not SQL strings
- **LLM is a router** — all computation is deterministic Python; AI only interprets intent and selects tools
- **Multi-LLM support** — Ollama (local), RunPod (cloud GPU, OpenAI-compatible), OpenAI API — switchable via `LLM_PROVIDER` env var
- **Read-only data** — CSV loaded once as a pandas DataFrame singleton on startup
- **Explainability first** — every response includes filters applied, metrics used, query plan, and raw data table

---

## Technical Stack

### Backend
- **FastAPI** + Uvicorn (async API)
- **LangGraph** `StateGraph` — orchestration workflow
- **LangChain** — `ChatOllama` / `ChatOpenAI` with `with_structured_output()`
- **pandas** — all data computation (aggregations, filtering, KPI calc)
- **scikit-learn + statsmodels** — forecasting (linear regression, exponential smoothing)
- **structlog** — JSON structured logging
- **pydantic v2** — settings, request/response schemas

### LLM Providers (via `LLM_PROVIDER` env)
| Provider | Env Var | Notes |
|---|---|---|
| `ollama` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Local, free |
| `runpod` | `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, `RUNPOD_MODEL` | Cloud GPU, OpenAI-compatible |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` | Cloud API |

### Frontend
- **Next.js 15** + TypeScript + App Router
- **Tailwind CSS 4** + Shadcn/UI
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
backend/app/
    api/
        routes/
            dashboard.py    # GET /api/dashboard/kpis, /charts/*
            query.py        # POST /api/query  (NL → AI orchestration)
            forecast.py     # POST /api/forecast
        dependencies.py

    core/
        config.py           # Pydantic BaseSettings — LLM, data, server config
        logging.py          # structlog setup

    data/
        loader.py           # CSV → DataFrame singleton (read-only)
        queries.py          # All typed pandas query functions (no AI-generated SQL)

    graph/
        state.py            # AppState TypedDict
        workflow.py         # LangGraph StateGraph definition
        nodes/
            guardrail.py    # Input/output guardrail node
            intent.py       # Intent detection — what does user want?
            query_tool.py   # Analytics tool node (calls data/queries.py)
            forecast_tool.py # Forecasting tool node (calls forecasting/engine.py)
            chart_selector.py # Select chart type from result shape
            formatter.py    # Build final response with explainability

    forecasting/
        engine.py           # Moving avg, linear reg, exp smoothing implementations
        recommender.py      # Inventory recommendation logic

    guardrails/
        input_guard.py      # Off-topic + injection check
        output_guard.py     # Safety screening

    llm/
        client.py           # LLM factory: returns ChatOllama | ChatOpenAI based on LLM_PROVIDER

    schemas/
        requests.py         # QueryRequest, ForecastRequest
        responses.py        # QueryResponse, ChartSpec, ExplainabilityBlock, ForecastResponse

    cache/
        query_cache.py      # In-memory TTL cache for repeated NL queries (bonus)

frontend/src/
    app/(app)/
        dashboard/page.tsx  # KPI cards + static charts
        query/page.tsx      # NL query interface

    components/
        charts/
            OrderVolumeChart.tsx        # AreaChart — orders over time
            DeliveryPerformanceChart.tsx # BarChart — on-time vs delayed
            CarrierBreakdownChart.tsx   # BarChart — delay rate per carrier
            CategoryRevenueChart.tsx    # PieChart — revenue by category
            ForecastChart.tsx           # ComposedChart — historical + forecast
            DynamicChart.tsx            # AI-driven: renders any chart type from ChartSpec
        dashboard/
            KPICards.tsx
            DashboardFilters.tsx
            DataTable.tsx
        query/
            QueryInterface.tsx          # Chat-like input
            QueryResult.tsx             # Shows answer + DynamicChart + ExplainabilityPanel
            QueryHistory.tsx            # Bonus: persisted query history
            ExplainabilityPanel.tsx     # Filters, metrics, query plan, raw data
        layout/
            Sidebar.tsx
            Header.tsx

    hooks/
        useKPIs.ts
        useChartData.ts
        useQuery.ts
        useForecast.ts

    stores/
        useQueryHistoryStore.ts   # Zustand — persisted query history (bonus)
        useFilterStore.ts         # Date range + carrier + region filters

    types/
        logistics.ts              # TypeScript interfaces mirroring API schemas
```

---

## Data Schema

CSV columns: `client_id, order_id, order_date, delivery_date, carrier, origin_city, destination_city, status, sku, product_category, quantity, unit_price_usd, order_value_usd, is_promo, promo_discount_pct, region, warehouse`

Status values: `delivered`, `delayed`, `exception`, `in_transit`, `pending`

Derived fields computed in `data/queries.py`:
- `delivery_days` = `delivery_date - order_date`
- `is_delayed` = `status == "delayed"`
- `is_on_time` = `status == "delivered"`

---

## LangGraph Workflow Nodes

### guardrail (input)
Checks: off-topic queries (non-logistics), prompt injection patterns. Blocks with 400 if violated.

### intent_detection
LLM call with structured output. Determines:
- `tool`: `"query"` | `"forecast"` | `"both"`
- `query_params`: `{metric, dimension, time_range, filters}`
- `forecast_params`: `{sku, category, horizon_months, method}`
- `ambiguous`: bool — triggers clarification response if true

### query_tool
Calls typed function from `data/queries.py` based on `query_params`. Returns `{data: list[dict], aggregation: str, filters_applied: dict}`.

### forecast_tool
Calls `forecasting/engine.py` with `forecast_params`. Returns `{historical: list, forecast: list, method: str, inventory_recommendation: str}`.

### chart_selector
Given result shape and dimension count, selects `chart_type`: `line | bar | pie | area | composed`. Returns `ChartSpec`.

### formatter
Assembles final response: natural language answer + ChartSpec + ExplainabilityBlock (filters, metrics, query plan, data table).

### guardrail (output)
Safety screening of LLM-generated natural language answer.

---

## Engineering Standards

### Type Safety
- Pydantic v2 for all API boundaries
- TypedDict + strict types for LangGraph state
- TypeScript strict mode on frontend

### Testing
- pytest unit tests: `tests/unit/` — data queries, forecasting engine, guardrails (no LLM)
- pytest integration tests: `tests/integration/` — full workflow with mock LLM

### Logging
- structlog JSON — never `print()`
- Request ID injected per API call

### Error Handling
- Every LangGraph node catches exceptions, appends to `state["errors"]`
- Graceful degradation: if forecasting fails, returns query result only
- Ambiguous queries return clarification prompt, not hallucinated data

### Security
- No raw SQL or AI-generated code execution
- All user input sanitized before pandas filtering
- API key auth on all `/api/*` routes (`X-API-Key` header)
- CORS restricted in production

### Caching (Bonus)
- In-memory TTL cache (5 min) on NL query endpoint keyed by normalized query string
- Prevents repeated LLM calls for identical questions
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
API_KEY=dev-secret-key
CORS_ORIGINS=http://localhost:3000

# Data
DATA_PATH=data/mock_logistics_data.csv
```
