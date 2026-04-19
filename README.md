# crossref_news

Academic news using the Crossref REST API.

This repo contains a small Python demo that searches recent scholarly metadata
for fraud-detection-adjacent topics, deduplicates overlapping records, and
prints a concise briefing in the terminal.

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
- Crossref politely prefers contact info in requests, so `--mailto` or
  `CROSSREF_MAILTO` is recommended.
- Search results are metadata-only and may vary depending on how publishers
  expose titles, dates, abstracts, and links in Crossref.
