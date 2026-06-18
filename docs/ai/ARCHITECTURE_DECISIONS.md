> Repo-inferred; treat as as-built.

**Package:** `@gataca/qr` — publishable Stencil library (`dist/`, `loader/`).

**Components:** Shadow-DOM custom elements. Internal UI as TSX subcomponents under `components/`. Polling (`gataca-qr`, `gataca-ssibutton`) vs WebSocket (`*-ws`) — same UX, different host integration.

**Session flow:** Host must provide `createSession` + `checkStatus` (polling) or `socketEndpoint` + WS handlers. V3+ requires auth request + session id. `qrRole`: `connect` | `certify` (mandatory).

**Outputs:** dist ESM/CJS, custom elements, docs-readme/json/vscode, www demos, React proxies.

**Dev:** Stencil dev server :3000; `dev-server-proxy.js` avoids CORS for Connect/Nucleus dev APIs.

**Types:** `noUnusedLocals`/`noUnusedParameters` on; decorators enabled. Some callback props typed loosely (`any`) — match existing when extending.

**Testing:** `stencil test --spec --e2e`; Puppeteer for e2e. Sparse coverage — add tests for changed behavior.

**Open:** `gataca-autoqr` WIP. Backend contract details live in host app + component readmes, not this repo.
