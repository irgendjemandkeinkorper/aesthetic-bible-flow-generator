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

### Local Ollama provider

The browser can use a keyless Ollama server running on the same computer. Install Ollama, pull a supported model, and start the Ollama server with browser origins enabled:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# This environment variable configures the Ollama SERVER process.
# Set it before starting Ollama; it is not an app environment variable.
OLLAMA_ORIGINS='*' ollama serve

# Run in another terminal.
ollama pull llama3.2
ollama pull llava
```

In **Provider Settings**, expand **Local Setup Guide**, save `http://localhost:11434` as the Ollama server URL, and select an Ollama model. Ollama does not require or accept an API key in this integration. The app checks `/api/tags` with a two-second timeout before enabling the provider, then sends non-streaming JSON requests directly from the browser to `/api/generate`.

`OLLAMA_ORIGINS='*'` must be present in the environment of the **Ollama server when it starts**. Adding it to this app's `.env.local`, or setting it after Ollama is already running, does not configure Ollama and will not fix browser CORS failures. If connection fails, confirm Ollama is running, visit `http://localhost:11434/api/tags` from the same browser, restart Ollama with the variable above, and verify `ollama list` includes the selected model.

The Ollama URL field intentionally accepts only loopback HTTP hosts (`localhost`, `127.0.0.1`, or `[::1]`). `OLLAMA_ORIGINS='*'` permits any website loaded in the browser to call Ollama, so use it only on a trusted local machine and stop the server when it is not needed.

The Copilot CLI bridge investigation for the local tier did not produce a shippable endpoint; see [`docs/copilot-cli-bridge-spike.md`](docs/copilot-cli-bridge-spike.md).

## GitHub Pages

The repository includes a GitHub Actions workflow that deploys the client build from `dist/` whenever `main` is updated. The static site includes the curated preset experience. By default, AI requests continue to use the Express API so its Gemini key remains private.

The provider abstraction also supports opt-in, user-supplied Gemini, OpenAI, and Anthropic browser keys. Open **Provider Settings**, save one or more keys, and select a configured provider/model in the generation, image-decoding, or cohesion-audit modal. Bible generation can run against multiple selected cloud models; image tools are enabled only for vision-capable models. When the chosen model cannot generate images, mood-board tiles offer **Copy PromptSpec** instead of **Generate Visual**. Removing a key disables that provider and restores the Express fallback when no browser provider is selected.

> **Browser-key security warning:** Gemini, OpenAI, and Anthropic keys used in this static client are intentionally sent directly from the browser to the provider. They are stored in `localStorage` and are visible to anyone with access to browser developer tools, injected scripts, or the same browser profile. Use restricted, low-quota keys that you own, never use this mode on a shared/public computer, and revoke a key immediately if the browser or deployment may be compromised. The Anthropic client explicitly enables its browser-access escape hatch; OpenAI requests use direct browser fetches. For private production credentials, use the Express server and environment secrets instead.

To use the full AI feature set in production, deploy the Node server to a host that supports environment secrets and set `GEMINI_API_KEY` there.

If the server runs behind a reverse proxy or load balancer, configure Express's `trust proxy` setting and forward `X-Forwarded-For`; otherwise every client shares one rate-limit bucket keyed off the proxy's socket address.

## Scripts

- `npm run dev` — run the Vite + Express development server.
- `npm run build` — build the client and bundled production server.
- `npm run build:client` — build the static site for GitHub Pages.
- `npm run lint` — type-check the project.
- `npm run test` — run the unit and integration test suite.
- `npm run build:figma-plugin` — bundle the local Figma importer.

## Figma interoperability

The app exports a real, versioned interchange document rather than attempting to write a Figma file through the REST API (which does not provide an endpoint for creating file content). Open **Export Tokens**, select **Figma Interchange JSON**, and download the resulting `*.figma.json` file. Import that file with the included development plugin.

### Build and install the plugin

1. Install dependencies and build the plugin with `npm install && npm run build:figma-plugin`.
2. In the Figma desktop app, open **Plugins → Development → Import plugin from manifest…**.
3. Select `figma-plugin/manifest.json` from this repository.
4. Open or create the destination Figma design file, then run **Plugins → Development → Tangle Interchange Importer**.
5. Choose the exported `*.figma.json` file and click **Import into Figma**.

The importer validates the complete document before creating anything. A successful import creates Figma pages, frames, supported scene nodes, local components and instances, local color/effect styles, and prototype reactions. Missing fonts fall back to Inter Regular and are reported only through that visual substitution; malformed documents fail with an error in the plugin UI.

### Interchange format 1.0.0

The authoritative executable schema is [`src/services/figmaInterchange.ts`](src/services/figmaInterchange.ts). Documents use this top-level shape:

```json
{
  "format": "tangle-figma-interchange",
  "version": "1.0.0",
  "name": "Design name",
  "generatedAt": "2026-08-10T00:00:00.000Z",
  "generator": { "name": "Aesthetic Bible Flow Generator", "version": "1.0.0" },
  "tokens": {
    "color/primary": { "$type": "color", "$value": "#3366FF", "$description": "Primary action color" }
  },
  "pages": [{ "id": "page-main", "name": "Main", "children": [] }],
  "prototypeConnections": []
}
```

Every page and node has a document-unique string `id`. Supported node `type` values are `frame`, `rectangle`, `ellipse`, `line`, `text`, `component`, and `instance`. Frames and components recursively contain `children`; instances reference a component's interchange ID through `componentId`. Nodes can specify position, size, visibility, opacity, rotation, solid/linear-gradient fills and strokes, effects, corner radius, and basic auto-layout properties. Text additionally supports characters, font family/style, size, alignment, line height, and letter spacing.

`tokens` is a flat DTCG token set: every entry carries the standard `$type` and `$value` fields, with optional `$description` and `$extensions`. The schema accepts the DTCG types `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, and `typography`. The importer currently turns color tokens into local paint styles and shadow tokens into local effect styles; other token types remain interoperable metadata for downstream tools. A paint or effect can use a local style by setting its `style` to the token key.

Prototype connections reference existing source and target node IDs. Supported triggers are `click`, `hover`, `press`, and `drag`; supported navigation modes are `navigate`, `swap`, `overlay`, and `back`. Optional transitions support instant, dissolve, smart animate, move, push, and slide variants with duration, easing, and direction.

Version `1.0.0` is validated exactly. Importers must reject unknown versions instead of guessing. A future backward-compatible addition should increment the minor version and add an explicit parser/migration path; breaking changes require a new major version. The old private raw-Bible JSON is not accepted as interchange input.

### Compatibility and limitations

- The plugin targets Figma Design and the current Plugin API; FigJam is not supported.
- Vector paths, boolean operations, images, variables, component properties/variants, rich-text ranges, constraints, masks, and remote library styles are outside version 1.0.0.
- Instances must reference a component in the same interchange document. Prototype endpoints must also exist in that document.
- The importer creates new local pages and styles on each run. It does not merge or update a previous import.
- Figma REST API credentials are neither required nor used; import occurs locally inside the open Figma file.
