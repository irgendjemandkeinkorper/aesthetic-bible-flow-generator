# Aesthetic Bible Flow Generator

A zero-install, browser-direct workbench for creating and comparing **Aesthetic Bibles**: practical design systems for games and visual projects. Open the static GitHub Pages build, bring your own model credentials (or a local Ollama server), and generate art-direction documents without installing the application or sending keys through this repository's server.

**[Open the browser workbench](https://irgendjemandkeinkorper.github.io/aesthetic-bible-flow-generator/)**

An Aesthetic Bible captures a project's manifesto, palette, typography, shape language, interface/HUD rules, mood-board prompts, fine-tuning controls, and optional creative-direction fields such as perspective, mechanics, rendering style, artistic influences, and music direction.

## What makes the workbench useful

- **Multi-provider generation:** run the same brief against one or more configured Gemini, OpenAI, Anthropic, or Ollama models. Provider capabilities gate vision and image-generation controls, and every completed request records provider/model metadata and metrics.
- **Durable run history:** successful, failed, and cancelled runs are stored locally. Runs can be pinned, cleared, or exported; history imports validate the complete file before one atomic write and ignore IDs already present.
- **Side-by-side comparison:** select two to four successful runs for synchronized palette, typography, geometry, and music columns.
- **Deterministic diffing:** compare two selected Bibles field-by-field without another model call.
- **Convergence/divergence audit:** ask the active provider to summarize agreement, disagreement, and recommendations across selected outputs.
- **Portable outputs:** export CSS, Markdown, a complete Bible JSON document, Unity/C# tokens, or the versioned Figma interchange format.

## Zero-install setup

Open the deployed static site and choose **Provider Settings** (the gear button). Credentials are saved only in that browser profile's `localStorage`; cloud requests go directly from the browser to the selected provider.

> Browser-held keys are visible to anyone with developer-tools access, injected scripts, or access to the same browser profile. Use restricted, low-quota keys on a private device and revoke any key you believe was exposed. Do not use production or shared credentials.

### Gemini

1. Create a Gemini API key in Google AI Studio.
2. In **Provider Settings**, paste it into **Gemini API key** and select **Save**.
3. Select an enabled Gemini model in a generation, image-decoding, or audit flow.

The browser adapter supports structured text and vision requests. It does not generate mood-board images; unsupported image actions expose the prompt specification instead.

### OpenAI

1. Create a project API key in the OpenAI platform and apply an appropriate budget/restrictions.
2. Paste it into **OpenAI API key** in **Provider Settings**, then select **Save**.
3. Select an enabled OpenAI model in the relevant flow.

OpenAI requests are made with direct browser `fetch` calls. The key must begin with `sk-` and satisfy the adapter's local format check.

### Anthropic

1. Create an API key in the Anthropic Console and restrict its usage as appropriate.
2. Paste it into **Anthropic API key** in **Provider Settings**, then select **Save**.
3. Select an enabled Anthropic model in the relevant flow.

The Anthropic SDK is intentionally configured for browser access. The key must begin with `sk-ant-` and satisfy the adapter's local format check.

### Local Ollama

Ollama requires no API key. It must run on the same machine as the browser, and the workbench accepts only plain-HTTP loopback URLs (`localhost`, `127.0.0.1`, or `[::1]`). Paths, credentials, query strings, and fragments are rejected outright—enter the bare server root (e.g. `http://localhost:11434`, not `http://localhost:11434/api`) or the connection will fail validation.

```sh
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Set this in the Ollama server process environment before it starts
OLLAMA_ORIGINS='*' ollama serve

# In another terminal
ollama pull llama3.2
ollama pull llava
```

Enter `http://localhost:11434` as the **Ollama server URL** and save it. If connection fails, confirm `ollama serve` is still running, open `http://localhost:11434/api/tags` in the same browser, and verify installed models with `ollama list`. For a browser CORS error, stop Ollama and restart it with `OLLAMA_ORIGINS='*'` set before launch. `OLLAMA_ORIGINS` is an Ollama environment variable, not a workbench setting.

> `OLLAMA_ORIGINS='*'` allows any website open in your browser to call the local Ollama server. Use it only on a trusted local machine, and stop Ollama when it is not needed.

## Comparison is an architectural pillar

Generation is deliberately treated as an experiment, not a one-shot answer. Each provider/model result becomes an independent run. The comparison workspace then layers three distinct tools over the same history:

1. A two-to-four-column visual comparison with synchronized scrolling.
2. A local, deterministic field diff between a left and right run.
3. An optional provider-backed convergence/divergence audit across the selected Bibles.

This separation keeps basic comparison available offline while making the interpretive audit explicit and cancellable. History is browser-local, capped at 25 unpinned runs, and retains pinned runs.

## Figma and wireframe export

The **Figma JSON** export is a versioned `tangle-figma-interchange` document, not a raw Bible dump and not a Figma REST call. It contains a flat DTCG token set, pages, supported scene nodes, local components/instances, and prototype connections. The local plugin in [`figma-plugin/`](figma-plugin/) validates the entire document before creating anything and rolls back pages created by a failed import.

Build and install the importer:

```sh
npm install
npm run build:figma-plugin
```

Then in Figma Desktop choose **Plugins → Development → Import plugin from manifest…**, select `figma-plugin/manifest.json`, run **Tangle Interchange Importer**, and choose the exported `*.figma.json` file.

Interchange `1.0.0` supports frames, rectangles, ellipses, lines, text, components, instances, solid/linear-gradient paint, effects, basic auto-layout, local color/effect styles, and click/hover/press/drag prototype connections. It does not support FigJam, vector paths, boolean operations, images, variables, variants/component properties, rich-text ranges, constraints, masks, or remote library styles. Imports create new local pages/styles; they do not merge an earlier Figma import.

## The M0–M7 build backlog

The repository was developed through eight milestones, with each layer preserving the behavior below it:

| Milestone | Delivered |
| --- | --- |
| **M0 — Foundation** | MIT licensing, clean dependency lock, canonical Zod schemas, presets, and the initial Vitest safety net. |
| **M1 — Provider core** | Provider adapter contract, browser Gemini adapter, structured validation/repair pipeline, and run metrics. |
| **M2 — Static/BYO operation** | Provider settings, local-server detection, Bible import/export, and GitHub Pages build hardening. |
| **M3 — Provider expansion** | OpenAI and Anthropic adapters, provider/model selection, and capability gating. |
| **M4 — Local models** | Ollama adapter, localhost/CORS setup guidance, and a [documented Copilot CLI bridge investigation](docs/copilot-cli-bridge-spike.md) (negative result). |
| **M5 — Creative direction** | Perspective, mechanics, rendering style, artistic influences, and music-direction fields. |
| **M6 — Compare and learn** | Fan-out cancellation, persistent run history, synchronized comparison, deterministic diffing, and convergence/divergence auditing. |
| **M7 — Polish and hardening** | Portfolio documentation, atomic/idempotent validated imports, and a network-isolated Playwright smoke test in CI. |

## Local development

The hosted static client needs no installation. Repository development uses Node.js 22:

```sh
npm ci
npm run dev
```

The optional Express path reads `GEMINI_API_KEY` from the environment (see `.env.example`) so a server-side Gemini key is not exposed to the client. The static BYO-provider path remains available without that server.

Useful commands:

```sh
npm run lint                 # app + Figma plugin type-check
npm test -- --run            # Vitest suite
npm run build                # client and production server bundle
npm run build:client         # static GitHub Pages client
npm run build:figma-plugin   # Figma importer bundle
npm run test:e2e             # Playwright smoke test
```

## Import safety and compatibility

Complete Bible JSON and exported run-history JSON are validated with Zod before use. Unknown fields are stripped, optional M1–M6 fields remain backward compatible, malformed imports produce a readable message, and no state is updated until the complete input succeeds. Re-importing the same run export is idempotent by run ID.

The project is licensed under the [MIT License](LICENSE).
