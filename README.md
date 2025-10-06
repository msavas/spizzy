
# SpinSmith — Frontend (MVP)

A minimal Vite + React + TypeScript + Tailwind app for the SpinSmith playlist builder. The UI now shares domain logic with a
Node server that can proxy to ChatGPT (or fall back to the heuristic generator) for playlist suggestions.

## Quickstart

```bash
# Install dependencies (frontend + optional server helpers)
npm install

# In one terminal
npm run dev
# http://localhost:5173

# Optional: run the API server in another terminal (requires OPENAI_API_KEY for ChatGPT mode)
npm run dev:server
# http://localhost:3000
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run dev:server` — boot the Node API server (uses heuristic fallback if no OpenAI key)
- `npm run build` — type-check + build for production (to `dist/`)
- `npm run build:server` — emit compiled server JS into `dist/server`
- `npm run start:server` — start the compiled server from `dist/server`
- `npm run preview` — serve the built app locally

## Tech

- Vite (bundler + dev server)
- React 18 + TypeScript
- TailwindCSS 3

## Notes

- The client can run completely offline using the in-browser heuristic generator; the API server exposes the same logic and can
  be configured with `OPENAI_API_KEY` to call ChatGPT for track selection.
- Export to Spotify is a stub in this MVP. In production you'd add Spotify OAuth and playlist creation.
- The main UI lives in `src/App.tsx`.
- Shared ride-planning logic lives in `shared/` and is consumed by both the client and the server.

## Git Setup

```bash
git init
git branch -M main
git add .
git commit -m "init: SpinSmith MVP frontend (Vite+React+TS+Tailwind)"
git remote add origin <your-repo-url>
git push -u origin main
```
