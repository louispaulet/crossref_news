# crossref_news

Academic news using the Crossref REST API.

This repo contains a small Python demo that searches recent scholarly metadata
for fraud-detection-adjacent topics, deduplicates overlapping records, and
prints a concise briefing in the terminal.

It also now includes a Vite + React + Tailwind frontend prototype in
`crossref_news_frontend/`. That app is a static, backend-agnostic academic news
landing page for now, so it can be developed before the API is ready.

It also includes a Cloudflare Workers backend POC in
`backend/crossref-worker/`. That Worker is the backend entrypoint for
Crossref-backed academic news lookups.

## Backend

The backend uses `wrangler` directly and exposes a JSON API at `GET /news`
with browser-friendly CORS.

Run it locally with:

```bash
cd backend/crossref-worker
npx --yes wrangler dev
```

Example requests:

```bash
curl "http://127.0.0.1:8787/news"
curl "http://127.0.0.1:8787/news?days=14&term=graph%20neural%20networks&term=chargeback%20fraud"
curl "http://127.0.0.1:8787/news?rowsPerQuery=50&maxResults=15&mailto=you@example.com"
```

Query params:

- `days`: positive integer, default `7`
- `rowsPerQuery`: positive integer, default `25`
- `maxResults`: positive integer, default `25`
- `mailto`: optional contact email for polite Crossref access
- `term`: repeatable search term; defaults are the same Crossref fraud-detection-adjacent topics used by the demo

The response includes the search window, effective terms, and normalized
results deduplicated by DOI/title and sorted by recency and relevance.

## Python Demo

The Python script remains in the repo as a local reference implementation.

## What it looks for

By default the demo searches the last 7 days for combinations of:

- fraud detection
- credit card fraud
- XGBoost
- chargebacks
- payment fraud
- payment service providers
- payment processing fraud
- graph machine learning fraud

The output is deduplicated by DOI and normalized title so a preprint and its
published version collapse into one briefing entry when possible.

## Run it

```bash
python3 crossref_news_demo.py
```

Useful options:

```bash
python3 crossref_news_demo.py --days 14
python3 crossref_news_demo.py --term "graph neural networks" --term "chargeback fraud"
python3 crossref_news_demo.py --rows-per-query 50 --max-results 15
python3 crossref_news_demo.py --mailto you@example.com
```

## Notes

- The script uses only the Python standard library.
- The backend is intentionally lightweight and dependency-free beyond `wrangler`.
- Crossref politely prefers contact info in requests, so `--mailto` or
  `CROSSREF_MAILTO` is recommended.
- Search results are metadata-only and may vary depending on how publishers
  expose titles, dates, abstracts, and links in Crossref.
- The frontend prototype currently uses mocked article cards and no live API
  calls.
- Cloudflare authentication is not configured on this machine yet, so run
  `wrangler login` before attempting to deploy.
