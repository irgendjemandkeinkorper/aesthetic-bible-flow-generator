# Aesthetic Bible Flow Generator

An AI-powered art-direction workspace for generating cohesive aesthetic bibles, mood boards, UI tokens, and visual cohesion audits for speculative games and worlds.

## Local development

Prerequisite: Node.js 22+

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY to .env.local for AI-backed features.
npm run dev
```

The local server runs at `http://localhost:3000`.

## GitHub Pages

The repository includes a GitHub Actions workflow that deploys the client build from `dist/` whenever `main` is updated. The static site includes the curated preset experience; AI generation, image decoding, regeneration, and cohesion audits require the Express server because the Gemini API key must remain private.

To use the full AI feature set in production, deploy the Node server to a host that supports environment secrets and set `GEMINI_API_KEY` there.

## Scripts

- `npm run dev` — run the Vite + Express development server.
- `npm run build` — build the client and bundled production server.
- `npm run build:client` — build the static site for GitHub Pages.
- `npm run lint` — type-check the project.
