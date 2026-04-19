# Repository Instructions

- Read this file before starting any task in this repo.
- Keep the project lightweight, focused, and easy to review.
- Prefer stdlib-first changes unless a dependency is clearly needed.
- Keep terminal output concise and avoid unnecessary scaffolding.
- Update the README whenever the runtime workflow, CLI, or assumptions change.
- Always commit and push after a change.

## Current project shape

- `backend/crossref-worker/` is the Cloudflare Worker API source of truth.
- `crossref_news_frontend/` is the Vite + React frontend.
- The frontend talks to the Worker through `/api` in development and `VITE_API_BASE_URL` in production.
- GitHub Pages publishes the frontend build from the `gh-pages` branch.

## Repo commands

- `make up` starts the frontend and backend together.
- `make kill` stops both local dev processes.
- `make deploy` builds the frontend, publishes it to GitHub Pages, and runs `wrangler deploy`.

## Editing guidance

- Keep frontend/backend API changes in sync.
- If the theme catalog or query params change, update both the Worker and the frontend UI together.
- Avoid adding new dependencies unless they materially simplify the deploy or runtime flow.
