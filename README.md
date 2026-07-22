# SDD-Core SITREP — Situation Report

An **evidence-backed, read-only executive dashboard** for the [`hanax-ai/sdd-core`](https://github.com/hanax-ai/sdd-core) repository. SITREP answers five executive questions — _Are we on plan? What is blocked? Where is decision debt? What is shipping? What can we trust?_ — without ever mutating the target repo.

> **Status:** Phase 1 · Fixture snapshot · read-only. All data flows through a typed adapter so Phase 2 (live GitHub ingestion) can swap in without UI changes.

---

## Product principles (the "why")

1. **Product Truth Rule** — verification results of `unknown` or `flaky` **never** count as passing. If evidence is missing, the UI says so.
2. **One version of the truth** — every KPI, ratio, and bucket is computed by a single helper in `src/data/metrics.ts`. Routes never re-derive math.
3. **Deterministic by construction** — no `Math.random`, no `Date.now` in render paths. Scenarios are pure functions over frozen fixtures.
4. **Read-only boundary** — no GitHub tokens live in the browser. The adapter is the only seam that ever touches source data.
5. **Every claim is provenanced** — each entity carries `provenance { sourceType, sourcePath, observedAt, confidence, parsingWarnings }` and the UI surfaces it.

---

## What's in the box

| Route                                 | Executive question it answers             |
| ------------------------------------- | ----------------------------------------- |
| `/` Overview                          | Are we on plan?                           |
| `/plan` Plan & Roadmap                | What's the shape of the work?             |
| `/work-packages` Work Packages        | Where is execution stuck?                 |
| `/issues` Issues & Defects            | What's actively broken?                   |
| `/governance` Governance & Gates      | What's waiting on a decision?             |
| `/quality` Quality                    | What can we trust to be correct?          |
| `/deliverables` Deliverables Register | What is actually shipping (and drifting)? |
| `/activity` Activity                  | What changed recently?                    |
| `/sources` Sources                    | Where did every number come from?         |

Global affordances: ⌘K command palette (deep-links via `?highlight=<id>`), scenario picker (`?scenario=`), URL-synced filters, skip-to-content, and a persistent "Fixture snapshot" disclosure pill.

---

## Architecture

```text
fixtures.ts ──► schemas.ts (Zod) ──► adapter.ts ──► scenarios.ts ──► view (DataView)
                     │                                                    │
                     ▼                                                    ▼
              parse at module load                              metrics.ts (FORMULAS)
                                                                          │
                                                                          ▼
                                                                    routes / components
```

- **`src/data/schemas.ts`** — Zod boundary. Every fixture row is validated at module load; invalid data throws with a labeled `[data-boundary]` error.
- **`src/data/adapter.ts`** — the only data seam. Phase 2 replaces its internals; UI is unaffected.
- **`src/data/scenarios.ts`** — pure functions producing `baseline`, `gate-blocked`, `decision-heavy`, `defect-heavy`, `all-clear`. Fixtures are never mutated.
- **`src/data/metrics.ts`** — canonical `FORMULAS` constant + centralized helpers (`ratioToPct`, `workPackageAcceptancePct`, `phaseCompletion`, `statusBuckets`, `gateSplit`, `deliverableDrift`, `deliverableExceptions`, `decisionDebt`).

---

## Correction Plan · evidence

| CP    | What it enforces                                           | Evidence                                                                                                                                                                                                                       |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CP-1  | No `Math.random` / non-determinism                         | `rg "Math.random\|Date.now\(\)" src` returns no render-path hits                                                                                                                                                               |
| CP-2  | Zod schema boundary on all fixtures                        | `src/data/schemas.ts` + `src/data/__tests__/adapter.schemas.test.ts`                                                                                                                                                           |
| CP-3  | Centralized formulas (one version of truth)                | `FORMULAS` in `src/data/metrics.ts`; `metrics-centralized.test.ts`                                                                                                                                                             |
| CP-4  | `decisionDebt` population invariants                       | `metrics.test.ts` locks Awaiting WPs + Pending Gates                                                                                                                                                                           |
| CP-5  | Deterministic scenario engine, URL-synced                  | `src/data/scenarios.ts`, `scenario-context.tsx`, `scenarios.test.ts`                                                                                                                                                           |
| CP-6  | Global search + URL-synced filters                         | `src/components/command-palette.tsx`, `src/hooks/use-url-state.ts`, `use-highlight.ts`                                                                                                                                         |
| CP-7  | Vitest infrastructure                                      | `vitest.config.ts`, `bun run test:run` → **51 tests, 5 files, green**                                                                                                                                                          |
| CP-8  | "SDD-Core SITREP — Situation Report" branding + disclosure | `top-bar.tsx` fixture pill; per-route `head()` metadata                                                                                                                                                                        |
| CP-9  | WCAG AA sweep                                              | skip-link + `<main id="main-content">` in `__root.tsx`; `aria-current`, `aria-expanded`/`controls`, `aria-pressed`, `role="group"`, keyboard-activatable rows, `aria-label` on icon buttons, `aria-hidden` on decorative icons |
| CP-10 | This README                                                | you are here                                                                                                                                                                                                                   |

---

## Product Truth Rule — enforced in code

```ts
// src/data/metrics.ts
export function isPassing(result: VerificationResult): boolean {
  // 'unknown' and 'flaky' are NEVER passing, by construction.
  return result === "passed";
}
```

Regression test in `src/data/__tests__/metrics.test.ts` fails the build if this ever regresses.

---

## Running locally

```sh
bun install
bun run dev          # http://localhost:8080
bun run test:run     # 51 tests · 5 files
bun run build        # production build
```

## Scenarios

Append `?scenario=<id>` or use the top-bar picker:

- `baseline` — realistic mid-flight state
- `gate-blocked` — Gate 2 blockage dominates
- `decision-heavy` — pending decisions pile up
- `defect-heavy` — quality regressions dominate
- `all-clear` — everything green (sanity check)

## Deep-linking

Every entity is addressable: `?highlight=<id>` scrolls to and outlines the target row across routes. The ⌘K palette emits these links.

---

## Read-only guarantee

SITREP has no write path to `hanax-ai/sdd-core`. No tokens, no mutations, no webhooks out. Phase 2 will introduce a **server-side** ingestion job that writes into the adapter's cache — the browser will still never hold a GitHub token.

## Built with

TanStack Start · TypeScript · React 19 · Tailwind CSS v4 · shadcn/ui · Zod · Vitest · cmdk

---

## Retained Lovable dependencies (disclosure)

SITREP is a bounded Phase 1 correction pass. It intentionally retains the following Lovable-authored integrations from the original scaffold. These are build/runtime plumbing only — they do not affect the read-only product boundary, the fixture-only data path, or any of the CP-1→CP-10 invariants — but they are called out explicitly so the retention is auditable:

- **Lovable Vite configuration** — `vite.config.ts` imports `defineConfig` from `@lovable.dev/vite-tanstack-config` (devDependency). This preset bundles the TanStack Start Vite plugin, the TanStack devtools plugin (dev only), `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, `nitro` (build only, targeting Cloudflare Workers), `VITE_*` env injection, the `@/` path alias, React/TanStack dedupe, error-logger plugins, and sandbox host/port detection. Removing it would require re-authoring the entire Vite/Nitro pipeline; it is kept as-is.
- **Synchronization safeguards** — `src/server.ts` wraps `@tanstack/react-start/server-entry` to normalize h3-swallowed SSR errors (`{"unhandled":true,"message":"HTTPError"}`) into the branded error page, and `src/lib/error-capture.ts` records the original `Error`/`unhandledrejection` out-of-band so the wrapper can recover the real stack. `src/start.ts` installs a `requestMiddleware` (`errorMiddleware`) that catches server-function throws and renders the same branded page. These preserve stack fidelity across the Worker/h3 boundary; they are Lovable-authored patterns retained verbatim.
- **Runtime error-reporting integration** — `src/lib/lovable-error-reporting.ts` forwards React error-boundary faults to `window.__lovableEvents.captureException` and `window.__lovableReportRuntimeError` (both provided by the Lovable editor's `lovable.js`; no-op in production). It is invoked from the root `errorComponent` in `src/routes/__root.tsx`. This exists so runtime errors surface inside the editor preview; it ships no data off the client at runtime outside the editor.

Nothing in the above list opens a write path to `hanax-ai/sdd-core`, holds credentials, or reaches the network at runtime outside the editor preview.
