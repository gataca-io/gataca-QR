> Index only. Details in sibling `docs/ai/` files.

**Stack:** Stencil 2 + TS + SCSS (shadow DOM). JSX via Stencil `h`. QR rendering: `qr-code-styling`. React wrappers: `@stencil/react-output-target` → `gatacaqr-react/`. Jest + Puppeteer e2e. Node for dev/build.

**Commands:** `yarn start` (dev :3000, watch) · `yarn build` (dist + docs) · `yarn test` / `yarn test.watch` · `yarn typescript` · `yarn format` · `yarn generate` (scaffold) · `yarn audit` · `yarn licenses`
**Pre-commit:** format → typescript → audit → licenses

**Map:**
- `src/components/` — web components (each: `*.tsx`, `*.scss`, `readme.md`, `*.e2e.ts`)
  - `gataca-qrdisplay` — QR display only
  - `gataca-qr` — polling session flow
  - `gataca-qrws` / `gataca-ssibuttonws` — WebSocket variants
  - `gataca-ssibutton` — button-style login
  - `gataca-autoqr` — remote config (WIP)
- `src/utils/utils.tsx` — shared types, `RESULT_STATUS`, mobile/deep-link helpers
- `src/index-*.html` — per-component dev demos
- `stencil.config.ts` — outputs, React target, Sass, dev proxy hook
- `dev-server-proxy.js` — same-origin proxy for local Connect/Nucleus (`/__gataca_dev_proxy/*`)
- `gatacaqr-react/` — generated React proxy components (regenerated on build)

**Integration model:** Parent app supplies callbacks (`createSession`, `checkStatus` or WS endpoints). Library does not call Gataca APIs directly except via host-provided functions/endpoints. See component `readme.md` files.

**Where to look:** Props/events → component `*.tsx` · Shared types → `src/utils/utils.tsx` · Styles → co-located `*.scss` · Dev demos → `src/index-*.html` · Build config → `stencil.config.ts`

**Do not touch without explicit instruction:** `gatacaqr-react/` (generated) · `dist/`, `loader/`, `docs.json`, `stats.json` · version/release CI (`.github/workflows/createQRVersion.yml`) · bulk formatting (pre-commit)

**Prompting:** Name component + variant (QR vs QRWS). State integration style (polling vs WS). Scope UI vs props/callback contract. Run `yarn typescript` + targeted tests — see `VERIFICATION.md`.
