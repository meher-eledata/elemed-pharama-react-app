# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Repo-local conventions only. Cross-repo and API-contract rules live in
> `/Users/meherivatury/Desktop/Eledata/hs/agentic-control/CLAUDE.md`. Only `frontend-builder` writes
> code here; build API calls against the recorded contract at
> `/Users/meherivatury/Desktop/Eledata/hs/agentic-control/.claude/memory/api-contract.md`.

## Commands

- `npm run dev` — start Vite dev server (locked to `localhost:5173`, `strictPort: true`)
- `npm run build` — production build via Vite
- `npm run preview` — preview built bundle
- `npm test` — run Jest test suite
- `npx jest path/to/file.test.ts` — run a single test file
- `npx jest -t "test name"` — run a single test by name
- `npx tsc --noEmit` — typecheck (no `typecheck` script today)
- `npm run lint` — lint <!-- ASSUMPTION: lint script added during bootstrap; not present today — verify; see agentic-control/REVIEW.md -->

Never edit `.env*`; never `git push`, deploy, or `rm -rf`. Stay within
`/Users/meherivatury/Desktop/Eledata/hs/elemed-pharama-react-app`.

The app is containerized via the multi-stage `Dockerfile` (Node 20 build → nginx). `VITE_API_BASE_URL` is set as a build ARG and baked into the bundle.

## Environment

- `VITE_API_BASE_URL` — API base URL. Falls back to `http://localhost:3000/api/` if unset. Only `VITE_`-prefixed vars are exposed to the client (`vite.config.ts`).

## Architecture

Single-page React 19 + TypeScript app for a pharmacy management system. State is split between Redux Toolkit (auth, cart) and RTK Query slices (server data). MUI v5 + SCSS for UI.

### Routing & guards (`src/pages/index.tsx`)

All app routes are wrapped in `<ProtectedRoute>` (checks `state.auth.isAuthenticated`). Admin routes are additionally wrapped in `<RoleGuard allowedRoles={['admin', 'Admin']} />`. Auth pages use `AuthLayout`; everything else uses `DashboardLayout`. When adding a new authenticated page, place it inside the `<ProtectedRoute>` block; admin-only pages must go inside the `RoleGuard` block under `ADMIN_CONSTANTS.ROUTE_BASE`.

Top-level modules: `Dashboard`, `Inventory` (+ `InventoryAdjustment`), `Receive` (order-receive / order-details / payment-details), `Master`, `Sales` (history / new / receipt / sale-return), `Admin` (users / reports / settings / audit / detailed-sales).

### Data layer (`src/redux/`)

`store.ts` registers one Redux slice (`authSlice`, `cartSlice`) plus eight RTK Query APIs: `authApi`, `inventoryApi`, `dashboardApi`, `receiveApi`, `salesApi`, `adminApi`, `masterApi`, `reportsApi`. Each API is its own file under `src/redux/slices/`. When adding a new server-data domain, create a new slice file and register both the reducer and middleware in `store.ts`.

`baseQuery.ts` provides `baseQueryWithReauth` — a wrapper around `fetchBaseQuery` that injects the bearer token from `state.auth.token`. Use it (not raw `fetchBaseQuery`) for any new API slice that needs auth. Auth tokens are persisted in `localStorage` under `pharma_auth_token` / `pharma_user` and rehydrated on store init.

### Config-driven UI

`src/config/constants/` holds per-page constant files (labels, column defs, dropdown options, validation messages). Pages import these rather than hardcoding strings. When adding a new page or modal, follow the convention: create `<PageName>.constants.ts` and a matching `<PageName>.labels.ts` under `src/config/label/` if needed.

### Testing

Jest + jsdom + `@testing-library/react`. The custom `jest.preprocessor.cjs` rewrites `import.meta.env.VITE_*` to `process.env.VITE_*` before ts-jest compiles, so Vite-style env reads work in tests without code changes. CSS/SCSS is mocked via `identity-obj-proxy`; static assets via `__mocks__/fileMock.js`.

### Date handling

Dates are formatted as `DD MMM YYYY` (sales) / `DD/MM/YYYY` (other modules) using dayjs with `en-gb` locale (`main.tsx`). When parsing dates from the API, use local-time parsing — recent commits fixed a one-day-shift bug caused by UTC parsing in invoice dates. Match the existing module's format rather than introducing a new one.

### Layout / scaling

The app previously used a `useDisplayScale` hook for manual zoom; this has been removed in favor of rem-based responsive scaling (see comments in `App.tsx` / `main.tsx`). Do not reintroduce manual scaling — it conflicts with the rem approach.
