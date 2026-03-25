<div align="center">

# IDR Exchange Rates API

[![Made with Bun](https://img.shields.io/badge/Bun-v1.0.+-FBF0DF.svg?logo=bun)](https://bun.sh) [![Powered by TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Built with Elysia](https://img.shields.io/badge/Elysia-Latest-B355F9.svg)](https://elysiajs.com/)

API that scrapes public bank websites and returns Indonesian Rupiah (IDR) exchange rates as JSON. Built with Bun, Elysia, and TypeScript.

**Personal learning project** — this repository is for exploring technologies and practicing API design; it is not a commercial product or an official service.

[Getting started](#getting-started) • [API documentation](#api-documentation) • [Configuration](#configuration) • [Project structure](#project-structure)

</div>

## Overview

The main goal is learning: modern backend patterns (routing, validation, OpenAPI, error handling, CORS), HTML scraping, and a maintainable codebase.

The API exposes HTTP endpoints with a consistent JSON shape (`success`, `message`, `data` or `error`). Data comes from banks’ public pages; successful responses per bank may be served from a **short in-memory cache (~45 seconds)** to reduce load on upstream sites.

### Key features

- **Multiple sources**: BCA, Bank Indonesia (BI), BNI, BRI, Mandiri
- **OpenAPI / Swagger UI** at `/docs`, JSON spec at `/docs/json`
- **CORS** for browser access (GET, HEAD, OPTIONS); optional origin allowlist via environment
- **Request correlation**: `x-request-id` header (client-provided or server-generated) echoed on responses
- **Error handling**: uniform JSON errors (404, 422 validation, 500) at the application level
- **Response validation** per route using TypeBox schemas and registered models for documentation

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (latest recommended)

### Install and run

```bash
git clone https://github.com/k-ardliyan/idr-exchange-rates.git
cd idr-exchange-rates
bun install
```

- **Development (watch):** `bun run dev` — same as `bun --watch src/index.ts` (auto-reload)
- **Production build:** `bun run build` — bundles to `dist/index.js` with `--target bun` (recommended in Elysia docs)
- **Run the bundle:** `bun run start` — sets `NODE_ENV=production` and runs `dist/index.js` (`package.json` scripts use the **Bun shell**, so `NODE_ENV=...` works on Windows too)
- **Without a build (quick check):** `bun run preview` — runs `src/index.ts` directly with `NODE_ENV=production` (handy for local tests, not the intended deploy path)

Default server: `http://localhost:3000` (override with `PORT`).

## API documentation

| Method | Path           | Description                                   |
| ------ | -------------- | --------------------------------------------- |
| GET    | `/`            | Redirects to `/docs`                          |
| GET    | `/api`         | Short API metadata (name, version, docs link) |
| GET    | `/api/bca`     | BCA rates                                     |
| GET    | `/api/bi`      | Bank Indonesia rates                          |
| GET    | `/api/bni`     | BNI rates                                     |
| GET    | `/api/bri`     | BRI rates                                     |
| GET    | `/api/mandiri` | Mandiri rates                                 |
| GET    | `/docs`        | Swagger UI                                    |
| GET    | `/docs/json`   | OpenAPI specification (JSON)                  |

## Configuration

| Variable      | Description                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`        | HTTP port (default `3000`)                                                                                                          |
| `NODE_ENV`    | Set to `production` to hide internal error details in 500 responses                                                                 |
| `CORS_ORIGIN` | Comma-separated origins; empty = permissive CORS for any origin (no credentials). If set, credentials are enabled for those origins |

## Project structure

- `src/index.ts` — server bootstrap: CORS, `derive` / `onAfterResponse`, Swagger, `onError`
- `src/routes.ts` — `/api` route aggregation and shared model plugin
- `src/plugins/api-models.ts` — OpenAPI model registration (per-bank success/error envelopes)
- `src/lib/create-scrape-route.ts` — GET route factory for scraping, timeout, cache, and `status()` errors
- `src/models/api-response.ts` — shared JSON envelope schemas
- `src/features/<bank>/` — `route.ts`, `service.ts`, `scraper.ts`, `schema.ts` per source

## Tech stack

- [Bun](https://bun.sh/) — runtime and package manager
- [Elysia](https://elysiajs.com/) — HTTP framework
- [@elysiajs/swagger](https://github.com/elysiajs/swagger) — interactive API docs
- [@elysiajs/cors](https://github.com/elysiajs/cors) — CORS
- [Cheerio](https://cheerio.js.org/) — server-side HTML parsing
- TypeScript

## Disclaimer

Rates are obtained by scraping public bank pages and are **not guaranteed** to be accurate or up to date. Do not rely on them as the sole basis for financial decisions; always confirm with official bank channels.
