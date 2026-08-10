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
