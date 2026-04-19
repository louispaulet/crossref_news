# crossref_news

Academic news using the Crossref REST API.

This repo includes a small Python demo for local terminal exploration and a
Cloudflare Workers backend POC that serves the actual API. The Worker is the
backend entrypoint for Crossref-backed academic news lookups.

## Backend

The backend lives in `backend/crossref-worker/` and uses `wrangler` directly.
It exposes a JSON API at `GET /news` and supports browser access with CORS.

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

- The backend is intentionally lightweight and dependency-free beyond `wrangler`.
- Crossref politely prefers contact info in requests, so `--mailto` or
  `CROSSREF_MAILTO` is recommended.
- Search results are metadata-only and may vary depending on how publishers
  expose titles, dates, abstracts, and links in Crossref.
- Cloudflare authentication is not configured on this machine yet, so run
  `wrangler login` before attempting to deploy.
