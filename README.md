
# SpinSmith — Frontend (MVP)

A minimal Vite + React + TypeScript + Tailwind app that mocks the SpinSmith playlist builder UI.

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Scripts

- `npm run dev` — start local dev server
- `npm run build` — type-check + build for production (to `dist/`)
- `npm run preview` — serve the built app locally

## Tech

- Vite (bundler + dev server)
- React 18 + TypeScript
- TailwindCSS 3

## Notes

- This is a client-side mock; the “Generate Playlist” logic uses a small in-memory catalog.
- Export to Spotify is a stub in this MVP. In production you'd add Spotify OAuth and playlist creation.
- The main UI lives in `src/App.tsx`.

## Git Setup

```bash
git init
git branch -M main
git add .
git commit -m "init: SpinSmith MVP frontend (Vite+React+TS+Tailwind)"
git remote add origin <your-repo-url>
git push -u origin main
```
