# Commands

From `package.json` only. No Makefile in this repo.

| Command | Purpose |
| --- | --- |
| `yarn start` | Stencil dev :3000, watch + serve |
| `yarn build` | Production build + docs |
| `yarn test` | Jest spec + Puppeteer e2e |
| `yarn test.watch` | Tests in watch mode |
| `yarn typescript` | `tsc --noEmit` |
| `yarn format` | Prettier on `src/**/*.{ts,tsx,js,jsx}` |
| `yarn generate` | `stencil generate` scaffold |
| `yarn audit` | `./audit.sh` |
| `yarn licenses` | license-checker → `licenses*.txt` |

Pre-commit: format → typescript → audit → licenses.
