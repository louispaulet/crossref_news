# Agent Notes

Read this file before starting any task in this repository.

## Repo Layout

- `backend/crossref-worker/` is the Cloudflare Worker API.
- `crossref_news_frontend/` is the React + Vite frontend.
- `Makefile` is the preferred local entrypoint for running, stopping, and deploying the app.

## Working Rules

- Before adding or editing frontend text, read `tone_of_voice.md` first.
- Keep copy precise, neutral, and evidence-led.
- Keep frontend and backend changes aligned when the API shape changes.
- Prefer small, targeted edits that preserve the current app structure.
- Update `README.md` whenever the workflow, commands, or deployment assumptions change.

## Common Commands

- `make up` starts the frontend and Worker locally.
- `make kill` stops local processes created by `make up`.
- `make deploy` builds the frontend, publishes it with `gh-pages`, and deploys the Worker with `wrangler`.

## Notes For Future Changes

- The frontend uses GitHub Pages, so route and base-path changes should be checked carefully.
- Cloudflare credentials are required for local Worker development and deployment.
- If you touch user-facing text, keep the tone plain and functional rather than promotional.
