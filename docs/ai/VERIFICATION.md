```bash
yarn format       # prettier src/**/*.{ts,tsx,js,jsx}
yarn typescript   # tsc --noEmit
yarn audit        # ./audit.sh
yarn licenses     # license-checker → licenses*.txt
yarn test         # stencil spec + e2e
yarn build        # full build + docs generation
```

Pre-commit runs: format → typescript → audit → licenses (not test).

For a single component: `yarn test --spec -- src/components/gataca-qr` (adjust path).
