# Mock Stats API

A lightweight mock stats service for local development of the BMPL players app.

## Purpose

This mock service allows developers to work on the main players app without needing to:
- Run the full stats microservice infrastructure (PostgreSQL, Redis, Celery workers)
- Import real player data from Baseball Reference
- Wait for cache warmup or background tasks

## What it provides

The mock service implements all stats API endpoints with fake but realistic data:

- `GET /api/v1/health` - Health check (reports as "mock" mode)
- `GET /api/v1/metrics` - System metrics (cache, database, environment)
- `GET /api/v1/stats/{bbrefid}/{year}` - Player stats (consistent fake data per player)
- `POST /api/v1/stats/batch` - Batch stats lookup
- `POST /api/v1/admin/import` - Mock import trigger
- `POST /api/v1/admin/warmup` - Mock cache warmup
- `DELETE /api/v1/admin/cache` - Mock cache clear

## Developer Experience

When you run `docker-compose up`, the mock stats service:

1. **Automatically starts** - No manual setup needed
2. **Reports as "MOCK"** - Dashboard clearly shows you're using fake data
3. **Returns instantly** - No network calls to external APIs
4. **Consistent data** - Same player gets same stats on repeated calls
5. **Realistic metrics** - Cache hit rates, database counts, etc.

## Environment Detection

The commissioner dashboard will display a prominent **"MOCK ENVIRONMENT"** banner when connected to this service, so you always know you're working with fake data.

## Switching to Real Stats API

To use the real stats microservice instead:

1. Change `STATS_API_URL` in docker-compose.yml or .env
2. Point to the real stats API (e.g., `http://stats-api:3001`)
3. Dashboard will show "DEVELOPMENT" or "PRODUCTION" instead of "MOCK"

## How it Works

- Built with Flask (lightweight Python web framework)
- Generates random but seeded stats (same player = same stats)
- No database or cache required
- Runs in its own Docker container
- Mounted at port 3001
