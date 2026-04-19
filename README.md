# crossref_news

Live academic news briefing for fraud detection and related research, powered by the Crossref REST API.

The repo now ships as a small full-stack app:

- `backend/crossref-worker/` is the Cloudflare Worker API.
- `crossref_news_frontend/` is the React + Vite frontend.
- `make up`, `make kill`, and `make deploy` are the repo-level entrypoints.
- Before adding or editing frontend text, read `tone_of_voice.md` first.

## What it shows

The current theme focuses on fraud detection in academia, including work around:

- XGBoost
- graph-based models
- payment fraud
- chargebacks
- anomaly detection

The theme system is config-driven so more academic-news categories can be added later without rebuilding the app structure.

## Local development

Start both services from the repo root:

```bash
make up
```

This starts:

- the frontend on [http://127.0.0.1:5173](http://127.0.0.1:5173)
- the Worker on [http://127.0.0.1:8787](http://127.0.0.1:8787)

The frontend uses a Vite proxy at `/api` in development, so it can talk to the Worker without any manual URL setup.

Stop both services with:

```bash
make kill
```

Logs are written to `.make/frontend.log` and `.make/backend.log`.

## Deploy

The production frontend needs the deployed Worker URL at build time.

Set it first:

```bash
export VITE_API_BASE_URL="https://<your-worker>.workers.dev"
```

Then deploy both pieces from the repo root:

```bash
make deploy
```

`make deploy` does three things:

1. builds the frontend for GitHub Pages with `VITE_BASE_PATH=/`
2. publishes the static frontend build with `gh-pages`
3. deploys the Worker with `wrangler deploy`

The frontend uses `HashRouter`, so GitHub Pages can serve deep links without
needing custom server rewrite rules.

If your GitHub Pages project path changes, override `VITE_BASE_PATH` before running the deploy command.

## Backend API

The Worker exposes:

- `GET /` for service metadata and theme configuration
- `GET /news` for the briefing data

Useful query params:

- `theme`: theme id, default `fraud-detection`
- `from` / `to`: optional ISO dates in `YYYY-MM-DD` format
- `days`: fallback sliding window, default `7`
- `term`: repeatable extra query term
- `rowsPerQuery`: Crossref rows per term, default `25`
- `maxResults`: maximum deduplicated results, default `25`
- `mailto`: optional contact email for polite Crossref access

Example:

```bash
curl "http://127.0.0.1:8787/news?theme=fraud-detection&from=2026-04-01&to=2026-04-19&term=xgboost"
```

## Repository notes

- Keep the demo lightweight and stdlib-first unless there is a strong reason not to.
- Keep the frontend/backend changes aligned when the API shape changes.
- Update this README whenever the runtime workflow, command entrypoints, or deployment assumptions change.
- The frontend uses `gh-pages` for publishing and `wrangler` for Worker deployment.
- Cloudflare authentication still needs to be available locally before `wrangler deploy` will succeed.
