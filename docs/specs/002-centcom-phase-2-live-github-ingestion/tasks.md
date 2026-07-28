# Tasks: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Branch / Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 under **WO-P2-AUTHOR-001-R1**
**Input**: Design documents from `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/`
**Prerequisites**: `spec.md` (complete), `plan.md` (complete)

**R1 revision note**: revised under WO-P2-AUTHOR-001-R1 (independent review verdict 2026-07-23). Persistence moved to PostgreSQL as the operational system of record (root Article II); the canonical Gate 2 sequence restored (planning approval → Gate 2 implementation directive → implementation/validation/acceptance); the MCP source bound to exact dashboard-repo paths (no placeholder locus); Article IV grounding narrowed to a registered, pinned mirror; contract and state-model reconciliations propagated (no-change semantics, freshness/determinism boundary, schema `$id` URNs). This revision changes no authorization state: planning approval is pending and Gate 2 has been neither requested nor granted.

> **AUTHORING-ONLY STATUS**: this task list is a planning artifact authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1. **No task below is authorized for execution.** Execution of any `[EXT]` task requires Agent Zero's explicit **Gate 2 implementation directive** — "Approved for implementation: <exact spec/plan>" — issued after planning approval and recorded verbatim by T001. Gate 2 IS the implementation authorization; no green test, merged PR, working demo, or approved planning artifact substitutes for it. `gate-2-entry-criteria.md` defines when Gate 2 may be *requested* (readiness-to-request-Gate-2 criteria — pre-implementation items only); see `implementation-authorization-boundary.md` for the full three-stage sequence.

## Format: `[ID] [P?] [EXT?] Description — file path(s)`

- **[P]**: parallel-safe — touches different files than every other [P] task in its phase, no dependency on an incomplete task
- **[EXT]**: path resolves in the **external dashboard repository** (`hanax-ai/sdd-core-centcom-dashboard`; historical authoring pin `95c8e9c`, review baseline `49f05bb` verified 2026-07-23), NOT in this workspace. Escalated per plan.md Constitution Check (Article III): such tasks are executable only under Agent Zero's Gate 2 implementation directive, by a dashboard-scoped agent, never under WO-P2-AUTHOR-001 or WO-P2-AUTHOR-001-R1. `[EXT]` paths are relative to the dashboard repo root; `supabase/` paths (migrations, Edge Functions) are dashboard-repo `[EXT]` paths in that repository's source-controlled deployment lineage.

## Scope Rule (Isolated Agent Scopes)

Per the root constitution's *Isolated Agent Scopes* article: workspace-side tasks write only inside `projects/governance-ops/`. The dashboard is a separate governed repository — `[EXT]` tasks are external work assigned to a dashboard-scoped agent under the Gate 2 implementation directive; from this workspace they are dependencies to be evidenced, not edits to be performed. This adaptation of the template Scope Rule is escalated and recorded in `plan.md` (it is not a silent deviation). Write scopes: dashboard repo = MCP endpoint + tool modules + shared data service + migrations + Edge Functions; governance-ops workspace = planning artifacts, records, and runbooks only.

## Path Conventions

- Workspace paths begin `projects/governance-ops/`.
- `[EXT]` paths are dashboard-repo-relative and begin `[EXT] <path>`.
- Every task cites the exact file(s) it touches. `[EXT]` paths that do not yet exist in the dashboard repo (`src/routes/mcp.ts`, `src/server/mcp/`, `src/server/centcom-data/`, `supabase/migrations/`, `supabase/functions/centcom-reconcile/`) are governed path-creation targets bound in plan.md (MCP source binding); there are no placeholder loci.

---

## Phase 3.1: Setup & Preconditions

Stage sequencing (see `implementation-authorization-boundary.md`): T002 and T003 are workspace-side readiness-to-request-Gate-2 items completed alongside planning approval (Stage A); T001 records the Stage B directive when — and only when — Agent Zero issues it.

- [ ] T001 Record Agent Zero's **Gate 2 implementation directive** verbatim ("Approved for implementation: <exact spec/plan>"), the dashboard base commit, and the assigned implementing agent — `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/records/implementation-authorization.md` (Stage B; BLOCKS all `[EXT]` tasks. The directive follows planning approval; no implementation evidence is or may be a prerequisite to it.)
- [ ] T002 Article IV grounding (Mirror-Check Mandate): create and register the **pinned local mirror of `github/rest-api-description`** (GitHub's official REST API OpenAPI description — the source of truth for the endpoint signatures and behaviors the reconciliation operation depends on) under `projects/governance-ops/reference/`, add its Section 4 playbook row, and record the pinned revision plus the dependent design decisions — `projects/governance-ops/reference/github-rest-api-description/` (mirror), `projects/governance-ops/knowledge/instructions.md` (Section 4 table) (workspace-side; source selection requires Agent Zero ratification; BLOCKS T015 and every GitHub-API-dependent design decision — grounding completes BEFORE dependent implementation is proposed or authorized)
- [ ] T003 Incorporate the **completed** P2-PRE-2 evidence (P2-PRE-2 is COMPLETED AND OPERATIONAL — this task records, it does not await): canonical command `npm run verify` = `format:check` → `lint --max-warnings 8` (warning budget 8 enforced) → `typecheck` → `test:ci` → `build` → `verify:generated` (routeTree cleanliness); workflows `.github/workflows/dashboard-ci.yml`, `dependency-audit.yml`, `dependency-review.yml` (actions pinned; checkouts hardened `persist-credentials: false`); required status **"Dashboard CI / required"** bound to job `required`, source GitHub Actions; `main` ruleset Active; deny/allow control-effectiveness proof on dashboard PR #14 (deliberate failure isolated → blocked; corrected → passed; commits `7d92f7d`, `658e4b3`, `9352c4c`); delivered via merged PRs #3 and #14; Dependabot operational (actions bumps merged via PRs #6/#7/#8) — `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/records/p2-pre-2-evidence.md` (workspace-side; FR-029, SC-008)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation.** (One exception: T011 validates the contract schemas themselves and passes as soon as both schemas compile with cross-references resolved — it still precedes implementation.)

- [ ] T004 [P] [EXT] Contract test: provenance envelope v1.2.0 — every tool result and dashboard collection validates against the envelope schema; missing/extra fields fail; **every mixed-mode constituent envelope carries the required `contractVersion`**; freshness fields obey the scoped serving-time rule (`stale`, plus `thresholdExceededBy` when stale, are the ONLY serving-time-varying fields; `observedAt` equals the stored `last_verified_at` anchor, never the serving clock) — `src/data/__tests__/provenance-envelope.contract.test.ts` (contracts/provenance-envelope.md C-ENV scenarios)
- [ ] T005 [P] [EXT] Contract test: live snapshot collection v1.2.0 — shape, SHA format, observation timestamp, staleness disclosure, and the contract's own declared version — `src/data/__tests__/snapshot-live.contract.test.ts` (contracts/snapshot-collection.md scenarios C-SNAP-1..8 and C-SNAP-10; C-SNAP-9 is the schema-compilation scenario, executed by T011 and pre-Gate-2 by the workspace-side G-09 run)
- [ ] T006 [P] [EXT] Mode-confusion suite (FR-011, SC-009): classification from result alone across live/fixture/stale/mixed; fixture-poisoning canary (a marker value present only in fixtures must never appear in a result labeled live) — `src/data/__tests__/mode-confusion.test.ts`
- [ ] T007 [P] [EXT] Determinism test (FR-014, SC-006): re-running normalization on the same recorded source revision under the same contract version reproduces the **stored normalized snapshot content** byte-identically; observation metadata (run identifiers, timestamps, snapshot version assignment) is excluded from the guarantee; determinism inputs = source content at the pinned revision + contract version + normalization rules — `src/data/__tests__/ingest-determinism.test.ts`
- [ ] T008 [P] [EXT] Failure-path tests (FR-016/FR-017/FR-018, SC-004): retrieval failure → last-known-good snapshot with staleness disclosure; validation failure → reject + retain prior published snapshot + contextual error record; no-snapshot → labeled fixture fallback; **PostgreSQL unavailable at serving time → bundled fixture dataset with full fixture labeling per snapshot contract §8 P-3a (C-SNAP-10; never a blank surface, crash, falsely live result, or stale-as-fresh), outage surfaced to monitoring (FR-028)**; mid-ingestion read → prior published snapshot only — `src/data/__tests__/ingest-failure-paths.test.ts`
- [ ] T009 [P] [EXT] No-change semantics test (FR-020; data-model.md E-02/E-03/S-01): a run whose observed head SHA and normalized content are identical to the current published snapshot records an ingestion run with outcome `no-change`, creates **no** new snapshot version, and advances the freshness anchor (`last_verified_at`); a new snapshot version is created **iff** normalized content changes — `src/data/__tests__/ingest-no-change.test.ts`
- [ ] T010 [P] [EXT] Rollback test (FR-019, SC-005): fixture-only configuration returns all seven tools and the dashboard to correctly labeled fixture service with no data repair — `src/data/__tests__/rollback-fixture-mode.test.ts`
- [ ] T011 [P] [EXT] Schema-compilation validation (CI-runnable): Ajv (or equivalent) compiles all contract schemas with every cross-reference resolved — schemas registered by `$id` URN (`urn:centcom:contract:provenance-envelope:1.2.0`, `urn:centcom:contract:snapshot-collection:1.2.0`); the snapshot schema's `$ref` to the envelope URN resolves with both schemas loaded; zero `.md`-path `$ref`s — `src/data/__tests__/contract-schema-compilation.test.ts` (test-strategy.md schema-compilation layer). **Gate 2 readiness does NOT depend on this task**: G-09's pre-Gate-2 evidence comes from the workspace-side compilation run against the contract-embedded schemas (`gate-2-entry-criteria.md` G-09); T011 encodes that same check as a persistent CI suite after the Stage B directive.

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T012 [EXT] Contract schemas in the shared validation seam: provenance envelope v1.2.0 (required constituent `contractVersion`; scoped freshness fields) and live snapshot v1.2.0, each carrying its `$id` URN and cross-referencing by URN, reusing the Phase 1 `isoString` discipline — `src/data/schemas.ts` (extend) (satisfies T004, T005, T011)
- [ ] T013 [EXT] PostgreSQL schema migrations: dedicated non-public **`centcom`** application schema in the existing Supabase project (managed PostgreSQL — the operational system of record, root Article II) — normalized snapshot content and snapshot versions; append-oriented ingestion runs with strictly increasing anchors enforced at ingestion validation AND by a **database-side monotonic guard** (trigger/constraint on `ingestion_runs` insert rejecting any successful row whose `observedAt` is not strictly later than the current maximum successful anchor; the `snapshots` row commits in the producing run's transaction — data-model.md E-08); provenance; access-policy state; audit records; least-privilege roles (reconciliation writer role; serving read-only role) — `supabase/migrations/*_centcom_*.sql` (new; source-controlled) (satisfies parts of T008, T009)
- [ ] T014 [EXT] Shared server-side data service — the single normalization/serving layer BOTH consumers read (FR-001/FR-002): PostgreSQL queries, envelope construction, staleness classification computed at serving time against the stored `last_verified_at` anchor (2-hour threshold; the ONLY permitted serving-time clock use; only `stale`/`thresholdExceededBy` vary), and transient versioned response assembly — `src/server/centcom-data/service.ts`, `src/server/centcom-data/queries.ts`, `src/server/centcom-data/envelope.ts` (new) (satisfies parts of T004, T005, T008; depends on T012, T013)
- [ ] T015 [EXT] Ingestion operation + reconciliation Edge Function: server-side observation of the governed repository (enumerated observables only; grounded per T002; read-only token, server-side only) → validation → deterministic normalization → publish a new snapshot version **iff** normalized content changed, recording `published`/`no-change`/failure run outcomes with monotonic anchors; runs are **serialized single-flight per collection** (`pg_advisory_xact_lock` or equivalent, bound here; the observation timestamp is injected only after the lock is acquired — data-model.md E-02) so overlapping scheduled and on-demand runs never interleave; **one** ingestion operation invoked by BOTH the hourly Supabase Cron schedule and Agent Zero's on-demand refresh; runs neither in the browser nor inside an MCP request — `supabase/functions/centcom-reconcile/index.ts` (new) + cron registration migration `supabase/migrations/*_centcom_cron_*.sql` (satisfies T007, T009, parts of T008; depends on T002, T013)
- [ ] T016 [EXT] Adapter source selection + hydration: per-collection `fixture | live` mode surfaced from data (never hardcoded copy); the dashboard hydrates the Phase 1 adapter from the shared service's **transient versioned response** (no browser access to PostgreSQL credentials; no durable snapshot files — JSON remains fixtures/tests/transient exports only); five non-migrated collections (serving the six non-migrated tools) pinned to fixture with `authoritative: false` + warning — `src/data/adapter.ts` (modify) (satisfies parts of T006, T010; depends on T014)

## Phase 3.4: Integration

- [ ] T017 [EXT] Dashboard surfaces the envelope: data-mode indicator and source/freshness disclosures driven by adapter output (replacing Phase 1's hardcoded "fixture" copy), mixed-state labeling on aggregate views (FR-010); public dashboard access limited to **explicitly public-class snapshot fields** (Agent Zero serving-posture decision, 2026-07-23) — `src/components/top-bar.tsx`, `src/routes/sources.tsx`, `src/routes/index.tsx` (modify) (depends on T016)
- [ ] T018 [EXT] MCP endpoint + live `get_snapshot`: TanStack server-handler route implementing the MCP Streamable HTTP endpoint, serving `get_snapshot` from the shared data service — no independent fetch, normalization, or second truth path (FR-001/FR-002) — `src/routes/mcp.ts` (new), `src/server/mcp/tools.ts` (new) (depends on T014)
- [ ] T019 [EXT] Six remaining tools: enforce fixture envelope + non-authority warning on every result (FR-004/FR-007/FR-009) — `src/server/mcp/tools.ts` (same module as T018) (depends on T012, T018)
- [ ] T020 [EXT] End-to-end consistency check: dashboard and MCP outputs identical for the same collection at the same snapshot version (SC-003) — `src/data/__tests__/consumer-consistency.test.ts` (new) (depends on T017, T019)

## Phase 3.5: Security & Operations

- [ ] T021 [EXT] Authorization enforcement distinct from authentication: user allowlist/role policy backed by the `centcom` access-policy tables, tool-level access control, token audience validation (FR-021/FR-022/FR-023); MCP access remains OAuth-protected; **no non-public collection migrates until authorization and revocation controls are operational and validated** (Agent Zero decision, 2026-07-23) — `src/server/mcp/auth.ts` (new) (depends on T013, T018)
- [ ] T022 [EXT] Secret-handling verification: automated zero-secret scan over client-reachable/committed surfaces (client bundles, results, logs, committed configuration incl. the committed Edge Function source), plus inspection of the Edge Function's environment/secret handling verifying the required server-side secrets live only in server-side secret storage — excluded from the zero count by design, per quickstart Step 14.1 (FR-024, SC-007) — `supabase/functions/centcom-reconcile/` + CI-integrated scan (acceptance evidence; depends on T015)
- [ ] T023 [EXT] Rate limiting and backoff: MCP invocation limits at the endpoint; reconciliation respects the live source's rate limits with defined backoff; exhaustion degrades per FR-018, never crashes or silently skips (FR-025) — `supabase/functions/centcom-reconcile/index.ts`, `src/routes/mcp.ts` (depends on T015, T018)
- [ ] T024 Incident & rollback runbook: source compromise, credential leak, mislabeled-data serving; each with the FR-019 rollback path; register the runbook — `projects/governance-ops/runbooks/centcom-live-data-incident-rollback.md` (new), `projects/governance-ops/knowledge/instructions.md` (Section 1 register row) (depends on T010 semantics; workspace-side)
- [ ] T025 [EXT] Operational monitoring: ingestion health (last successful run / `last_verified_at`, failure streak, staleness) and serving health read from the `centcom` run and audit tables; invocation audit log without secret material (FR-026/FR-028) — `src/server/centcom-data/queries.ts` (extend), `src/server/mcp/tools.ts` (extend) (depends on T014, T015, T018)

## Phase 3.6: Acceptance

- [ ] T026 Execute the `quickstart.md` acceptance walkthrough end to end (Stage C — post-implementation validation and acceptance review); record evidence as safe references; assemble the acceptance handoff for Agent Zero's acceptance review — `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/records/acceptance-evidence.md` (depends on ALL prior tasks; Stage C evidence follows the Gate 2 directive and is never a prerequisite to it)

---

## Dependencies

- T002 and T003 are workspace-side readiness-to-request-Gate-2 items: both complete before Gate 2 is requested (`gate-2-entry-criteria.md`); the MCP home-binding validation recorded there is likewise pre-Gate-2, as is G-09's workspace-side schema-compilation run (no `[EXT]` task is a Gate 2 prerequisite — T011 is the Stage C CI counterpart of G-09, not its precondition)
- T001 blocks every `[EXT]` task (the recorded Gate 2 directive IS the implementation authorization; Stage B precedes all execution)
- T002 blocks T015 and every GitHub-API-dependent design decision (Article IV grounding precedes GitHub-API code)
- Tests T004–T011 before implementation T012–T016 (TDD)
- T012, T013 → T014; T013 → T015; T014 → T016, T018; T016 → T017; T018 → T019, T021, T023; T015 → T022, T023; T014 + T015 + T018 → T025; T017 + T019 → T020
- T024 (workspace-side) may proceed once T010's rollback semantics are fixed; must complete before T026
- Everything before T026

## Parallel Example

```
# Stage A (readiness, workspace-side, after planning approval):
Agent W1 → T002: mirror creation + registration
Agent W2 → T003: P2-PRE-2 completed-evidence record

# After T001 (Gate 2 directive recorded): test authoring fans out —
Agent A → T004: provenance-envelope contract test
Agent B → T005: snapshot-live contract test
Agent C → T006: mode-confusion suite
Agent D → T007: determinism test
Agent E → T008: failure-path tests
Agent F → T009: no-change semantics test
Agent G → T010: rollback test
Agent H → T011: schema-compilation validation
```

## Notes

- Every `[EXT]` path is exact; no placeholder locus remains. The MCP source is bound to the dashboard repository (plan.md MCP source binding): the repo already ships a repo-visible server-handler route deployed through the same Lovable lineage (`src/routes/sitemap[.]xml.ts`), evidencing that server routes deploy from repository source. **Recorded assumption**: the platform can route the hosted `/mcp` path to `src/routes/mcp.ts`; validating this is a readiness-to-request-Gate-2 item (`gate-2-entry-criteria.md`) — if the platform cannot deploy the MCP from repository-visible source, a separate service repository is proposed and escalated to Agent Zero BEFORE planning approval.
- Reconciliation (the scheduled WRITE path, T015) and MCP/dashboard serving (the READ paths, T014/T016/T018) are separate server-side runtime components; the reconciliation job never runs in the browser or inside an MCP request, and GitHub Actions is NOT the production scheduler — Supabase Cron invokes the Edge Function.
- PostgreSQL is the operational system of record (root Article II); JSON is limited to fixtures, tests, and transient exports. No task produces a durable JSON/CSV snapshot file, object-store export, or any second datastore.
- No task may weaken, bypass, or absorb P2-PRE-2; P2-PRE-2 is completed and operational, and its evidence is incorporated by T003 (FR-029). CI work remains externally owned.
- GitHub-API-dependent tasks require the Article IV mirror registered by T002 before code is proposed; installed dependencies and response-shape tests are NOT sufficient grounding.
- The eight Fast Refresh warnings, unrelated Phase 1 audit findings, UI redesign, and the remaining six tools' live migration are all out of scope (WO-P2-AUTHOR-001 §7; unchanged under R1).

## Validation Checklist

*GATE: All items must pass before this task list is considered execution-ready*

- [x] Every requirement in spec.md is covered by at least one task (see `traceability.md`)
- [x] Every entity in spec.md has a model/creation task (envelope → T012/T014; validated snapshot, ingestion run, ingestion record → T013/T015; access policy → T013/T021; contract version → T012; fixture dataset pre-exists)
- [x] All tests come before their corresponding implementation tasks
- [x] Every task cites at least one exact repository file path — zero placeholder paths (the MCP endpoint, tool modules, shared data service, migrations, and Edge Function paths are bound in plan.md)
- [x] Workspace-scope rule satisfied; every out-of-workspace path is explicitly `[EXT]`-escalated per plan.md
- [x] No [P] task modifies the same file as another [P] task
- [x] Parallel [P] tasks are truly independent
- [x] Dependencies section reflects all ordering constraints
- [ ] Execution-ready — **intentionally unchecked**: execution requires Agent Zero's Gate 2 implementation directive (Stage B, recorded by T001), which has been neither requested nor granted (see the authoring-only status banner)
