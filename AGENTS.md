# AGENTS.md

## Project

SimDive is an educational dive computer simulator (decompression teaching tool). It is a static web app with no backend.

- Stack: Vue 3 + TypeScript + Vite, Chart.js (`vue-chartjs`), Vitest + `@vue/test-utils` + jsdom, ESLint + Prettier.
- The application lives in `web/`. The repository root only holds tooling (`justfile`, `docker-compose.yml`, `.nvmrc`, `.github/`) and documentation.
- Key locations:
  - `web/src/components/`: Vue components
  - `web/src/composables/`: domain logic (`useDiveEngine.ts` simulation engine, `useDecompression.ts` Bühlmann ZHL-16C, `useAirConsumption.ts`)
  - `web/src/types/dive.ts`: shared types
  - `web/public/data/dive-profiles.json`: dive profiles loaded at runtime (format documented in `README.md`)
  - Unit tests: `__tests__/*.spec.ts` next to the code they test

## Environment

- Node is **not** installed on the host. Never run `node`, `npm` or `npx` directly: always go through Docker.
- Node version is defined in `.nvmrc`; it is passed to Docker Compose by the `justfile`.
- `justfile` recipes (run `just` to list them all):
  - `just run`: start the `simdive` container (dev server on http://localhost:5173)
  - `just stop` / `just restart` / `just status` / `just logs`
  - `just exec <command>`: run a non-interactive command in the container, from the `web/` project directory (e.g. `just exec npm install`, `just exec npm run build`)
  - `just shell`: interactive shell in the container (humans only: agents should prefer `just exec`)
- The container must be running before `just exec`, `just lint`, `just format` or `just test`; `just ci` and `just check` start it automatically.

## Validation

Run `just ci` before considering a change done. In order, it:

1. Starts the Docker container
2. Runs the linter (`npm run lint`)
3. Runs the format checker (`npm run format:check`)
4. Runs unit tests (`npm run test:run`)

If errors occur, use `just lint fix` or `just format` to auto-fix.

`just ci` does **not** type-check: also run `just exec npm run build` (`vue-tsc` + `vite build`) when touching TypeScript or Vue files.

## Conventions

- Language: UI strings and documentation (README, CONTRIBUTING...) are in French; code identifiers, commit messages and code comments are in English.
- Add or update tests alongside any behaviour change, especially in `web/src/composables/`.
- Decompression and air consumption calculations are safety-sensitive teaching material: do not change formulas or constants without explicit justification (source/reference) and tests covering the expected values.
- When adding a dive profile, keep its `id` unique and values realistic.
- Do not commit `web/dist/` or `web/node_modules/`.

## Commit

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`...), with an optional scope, e.g. `fix(decompression): ...`, `chore(deps): ...`.
- Work on a branch and open a pull request against `main`; do not commit directly to `main`.
- CI (`.github/workflows/ci.yml`) runs lint, format check, tests and a Gitleaks secret scan on every PR. Deployment to Cloudflare Pages (`deploy.yml`) is manual only.
