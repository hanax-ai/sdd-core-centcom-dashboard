# Implementation Plan: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Directory**: `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 (WO-P2-AUTHOR-001-R1) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/spec.md`

**Work order**: WO-P2-AUTHOR-001 — planning and authoring only; revised under **WO-P2-AUTHOR-001-R1** (planning-artifact remediation only, 2026-07-23, applying the independent review verdict of 2026-07-23 and the Agent Zero decisions recorded there). **This plan does not grant, imply, or request implementation authority** (see `implementation-authorization-boundary.md`). Planning approval (Stage A) is pending; Gate 2 (Stage B — Agent Zero's explicit implementation directive) has been neither requested nor granted.

## Summary

Replace the fixture-only data source behind the CENTCOM dashboard and MCP with a single governed truth path — GitHub sources → server-side reconciliation (fetch → validate → normalize) → **PostgreSQL system of record** → shared server-side data service → transient versioned response → both consumers — beginning with `get_snapshot` as the first live vertical slice (seven tools total, one migrated first, six remaining fixture-backed).

Per Agent Zero's decision (2026-07-23, responding to independent review Finding 1), **PostgreSQL is the operational system of record**: the existing Supabase project already providing MCP OAuth (Supabase is managed PostgreSQL — Root Article II's standardized relational store, not a new datastore kind), carrying a **dedicated non-public application schema** (working name `centcom`) with source-controlled migrations, least-privilege roles (a reconciliation writer role; a serving read-only role), authorization controls, and auditability. PostgreSQL holds the normalized snapshots, ingestion runs, provenance, access-policy state, and audit records; **JSON is limited to fixtures, tests, and transient exports** — never durable application state, never a second datastore.

The serving seam is **PostgreSQL → shared server-side data service → transient versioned response → dashboard and MCP**: the dashboard hydrates the intact Phase 1 synchronous adapter from the transient versioned response, and the MCP consumes the **same** normalized service layer (`[EXT] src/server/centcom-data/`) — no second normalization path, no browser or client access to PostgreSQL credentials, no durable JSON/CSV snapshot files or object-store exports. Reconciliation — the scheduled WRITE path — is a **separate server-side runtime component** from MCP/dashboard serving (the READ paths): a source-controlled **Supabase Edge Function** (`[EXT] supabase/functions/centcom-reconcile/index.ts`) invoked hourly by **Supabase Cron**, plus Agent Zero's on-demand refresh, both invoking the **same ingestion operation**; it never runs in the browser or inside an MCP request, and GitHub Actions is NOT the production scheduler. Determinism holds at the store (normalized snapshot content is byte-identical at rest, per snapshot version), and rollback remains a labeled configuration reversion to fixture-only service — never a data repair.

## Technical Context

**Language/Version**: TypeScript 5.x (dashboard repo's existing toolchain: React 19, TanStack Start/Router, Vite; Node 22 runtime; the Supabase Edge Function runtime for the reconciliation component)

**Primary Dependencies**: Zod 3.x (already the dashboard's validation seam — contract schemas extend `src/data/schemas.ts` patterns); GitHub REST API (server-side only) for repository metadata and branch-head observation. **Mirror-check status (Root Article IV — mirror-only)**: only a **registered, pinned local mirror** of the selected GitHub API/client source satisfies the Mirror-Check Mandate (Agent Zero decision, 2026-07-23; review Finding 4). The proposed source — awaiting Agent Zero ratification — is GitHub's official REST API description (`github/rest-api-description`), pinned and registered under `projects/governance-ops/reference/` by task T002; see Constitution Check (Article IV) and research.md R-3. Installed dependencies and response-shape tests are NOT sufficient grounding; implementation MUST NOT proceed on recalled API shapes.

**Storage**: **PostgreSQL system of record** (root Article II; Agent Zero decision 2026-07-23) — the existing Supabase project's managed PostgreSQL, dedicated non-public `centcom` application schema, source-controlled migrations (`[EXT] supabase/migrations/*_centcom_*.sql`), least-privilege roles (reconciliation writer; serving read-only). It holds the normalized snapshots (versioned, append-only), ingestion runs, provenance, access-policy state, and audit records. **JSON is limited to fixtures, tests, and transient exports** — no durable JSON/CSV snapshot files, no object-store exports, no second datastore. No separate PostgreSQL instance is introduced unless a concrete isolation, capacity, compliance, or deployment blocker is escalated to Agent Zero (risk-register.md R-16); Qdrant is not introduced.

**Testing**: Vitest (dashboard repo's existing suite — 51 tests / 5 files at the historical authoring pin); new contract, mode-confusion, determinism, failure-path, no-change-semantics, rollback, and schema-compilation suites per `test-strategy.md` (tasks T004–T011; `[EXT] src/data/__tests__/`).

**Target Platform**: The dashboard repo's existing deployment lineage (Vite build; Lovable-hosted deployment; nitro `cloudflare-module` preset as retained plumbing), plus the Supabase platform for the `centcom` schema, the reconciliation Edge Function, and its cron schedule. The MCP endpoint's source-controlled home is bound to this same repository and lineage as a proposal requiring planning approval, with a recorded deployment assumption and escalation path (see Project Structure — MCP source binding).

**Project Type**: Operational capability (data pipeline + serving contract) spanning two consumers (dashboard UI, MCP tools) behind one shared server-side data service.

**Performance Goals**: Freshness is ratified (Agent Zero decision, 2026-07-23, closing spec Q-005): reconciliation runs **hourly on schedule plus on-demand**; a served result is **stale when its freshness anchor is more than 2 hours old**. The anchor is **`last_verified_at`** — the `observedAt` of the latest successful ingestion run (`published` or `no-change`), stored in PostgreSQL; staleness is classified at serving time by the shared data service (the only permitted serving-time clock use), and only `stale`/`thresholdExceededBy` may vary between servings of the same snapshot version (research.md R-4; data-model.md S-02). Serving latency is unchanged in kind from Phase 1: consumers read the shared service's transient versioned response; no per-request GitHub calls.

**Constraints**: Read-only toward the governed repository (no write path); credentials server-side only (the GitHub read-only token in the Edge Function environment; PostgreSQL credentials never in any browser or client context); deterministic normalization (byte-identical stored normalized snapshot content per FR-014 and SC-006 as narrowed); the six non-migrated tools must be bit-for-bit unaffected in data source; public-repo-safe artifacts only (no secrets, hostnames beyond public repo identity, or personal data).

**Scale/Scope**: First slice: 1 collection (snapshot) live; 5 collections fixture-backed serving the 6 non-migrated tools (the work-packages collection serves two tools); 2 consumers; 1 governed source repository.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**R1 revision note (2026-07-23)**: this check is re-run under WO-P2-AUTHOR-001-R1 following the independent review verdict of 2026-07-23. Article II is restated: the former "PASS by design avoidance" argument (versioned file-shaped snapshots standing in for a datastore) is **retired** — the review (Finding 1) correctly held those files would have functioned as durable structured application state, exactly what Article II prohibits — and the check now passes because PostgreSQL **is** the mandated store. Article IV is narrowed to the mirror-only grounding route (Finding 4). The R1 remediation is recorded as a revision of this same feature folder's artifacts, dated in each file's header.

### Root Constitution Gate — `.specify/memory/constitution.md` (v2.1.0)

- **Article I (Inference Governance)**: PASS — unchanged: the capability performs no model inference; it is data ingestion and serving. Development agents operating this lifecycle use maintainer-approved hosted models under the existing tooling governance path.
- **Article II (Standardized Data Layer)**: **PASS — because PostgreSQL IS the mandated store.** Per Agent Zero's decision (2026-07-23; spec Q-002 as re-resolved): the operational system of record is PostgreSQL — the existing Supabase project's managed PostgreSQL (a managed instance of Article II's standardized relational store), in a dedicated non-public `centcom` schema with source-controlled migrations and least-privilege roles. Normalized snapshots, ingestion runs, provenance, access-policy state, and audit records all live there; JSON is limited to fixtures, tests, and transient exports, so no bespoke JSON/CSV persistence layer exists anywhere in the design. The R0 "design avoidance" argument is retired, and the former escalation trigger (risk R-07 as an open Article II question) is **resolved by decision** — the register row is retained monitor-only for schema/persistence discipline (risk-register.md R-07). No separate PostgreSQL instance without a concrete escalated blocker; Qdrant not introduced.
- **Article III (Isolated Agent Scopes)**: PASS — all authored artifacts live in this feature folder. **Escalation (per tasks-template Scope Rule)**: implementation tasks necessarily cite paths in the external dashboard repository (`hanax-ai/sdd-core-centcom-dashboard`), which is outside `projects/governance-ops/`. This is not a cross-*project* edit inside the workspace — the dashboard is a separate governed repository with its own work orders — but it is outside the letter of the tasks-template Scope Rule, so it is escalated here rather than silently deviated: **tasks.md marks every external-repo path as `[EXT]`, executable only under Agent Zero's Gate 2 implementation directive (Stage B) by a dashboard-scoped agent, never from this work order.** `supabase/` paths (migrations, Edge Functions) are dashboard-repo `[EXT]` paths in that repository's source-controlled deployment lineage. Under WO-P2-AUTHOR-001 and WO-P2-AUTHOR-001-R1 no file outside this feature folder is written; execution-phase workspace-side tasks write only the enumerated project-level paths under their own authorization (T001/T003/T026 → this folder's `records/`; T002 → `reference/` plus the playbook Section 4 row; T024 → `runbooks/` plus the playbook Section 1 row).
- **Article IV (Mirror-Check Mandate)**: PASS for this plan, with a recorded obligation — this plan proposes no concrete external-API code and grounds no signatures in recall. **The registered, pinned local mirror is the only acceptable grounding route** (Agent Zero decision, 2026-07-23; review Finding 4): before any implementation code that calls the GitHub REST API (or any client library for it) is authored, the mirror of the selected GitHub API/client source MUST be registered in the project registry. The proposed selection — awaiting Agent Zero ratification — is GitHub's official REST API description (`github/rest-api-description`), created and registered by T002 with the pinned revision and dependent design decisions recorded; grounding completes **before dependent implementation is proposed or authorized**. The R0 alternatives (grounding in installed dependencies; response-shape contract tests as grounding) are **struck as insufficient** — see research.md R-3.
- **Article V (Spec-First Lifecycle)**: PASS — spec.md precedes this plan; tasks.md follows it; no implementation is performed under this work order, or under WO-P2-AUTHOR-001-R1, at all.

### Project Constitution Gate — `projects/governance-ops/.specify/memory/constitution.md` (v1.1.1)

- **Article I (Scope Boundary)**: PASS — writes confined to this feature folder; sibling projects untouched; dashboard-repo work is cited as external dependency, never performed here.
- **Article II (Execution-Evidence Test)**: PASS — this is an operational-capability specification (dashboards, evidence pipelines), the class this project's `docs/specs/` explicitly owns per the spec-routing rule. No governance *standard* is defined here.
- **Article III (Record & Churn Discipline)**: PASS — the ingestion record (FR-020) is specified as dated, append-oriented, and persisted in the PostgreSQL system of record; planning artifacts contain no credentials, hostnames beyond public repository identity, tenant identifiers, or personal data; evidence classes respected (all committed content here is class-1 template/specification material; real ingestion evidence is class-2/class-3 by design).
- **Article IV (Local Context Priority)**: PASS — project playbook consulted first (prescribed load order followed; register untouched — specs are not runbooks; a Section 4 row becomes due when the T002 mirror is registered, and a Section 1 runbook row when the incident/rollback runbook is implemented, recorded as task T024).

**Initial Check (pre-research)**: PASS (with the two recorded escalations above: external-repo task paths; mirror-registration precondition)

**Post-Design Check (after Phase 1)**: PASS — design artifacts (data-model.md, contracts/ v1.2.0, quickstart.md) persist all durable state in the mandated PostgreSQL store (no bespoke datastore anywhere), perform no cross-scope writes, ground no external-API usage in recall (contracts are transport-agnostic shapes; GitHub-API grounding is gated on the T002 mirror), and add no inference dependency. Re-affirmed 2026-07-23 after the R1 revisions.

## Project Structure

### Documentation (this feature)

```text
projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/
├── spec.md                                  # Deliverable 1 — operational-capability specification
├── plan.md                                  # Deliverable 2 — this file
├── research.md                              # Phase 0 output (R-1–R-8; R-1/R-3 re-resolved, R-7/R-8 added under R1)
├── data-model.md                            # Phase 1 output
├── contracts/
│   ├── provenance-envelope.md               # Phase 1 output — the per-result envelope contract (v1.2.0; $id urn:centcom:contract:provenance-envelope:1.2.0)
│   └── snapshot-collection.md               # Phase 1 output — the get_snapshot live contract (v1.2.0; $id urn:centcom:contract:snapshot-collection:1.2.0)
├── quickstart.md                            # Phase 1 output — end-to-end validation walkthrough (Stage C acceptance script)
├── tasks.md                                 # Deliverable 3 — task breakdown (separate pass)
├── traceability.md                          # Deliverable 4 — requirements-to-tasks mapping
├── risk-register.md                         # Deliverable 5
├── test-strategy.md                         # Deliverable 6
├── gate-2-entry-criteria.md                 # Deliverable 7 — readiness-to-request-Gate-2 criteria (pre-implementation items only)
├── implementation-authorization-boundary.md # Deliverable 8
└── records/                                 # execution-phase records — created by their own tasks under their own authorization,
                                             # never by this work order (T001 implementation-authorization.md; T003 p2-pre-2-evidence.md;
                                             # T026 acceptance-evidence.md)
```

### Source Code (external repository — NOT writable under this work order)

Implementation, when separately authorized by Agent Zero's Gate 2 implementation directive (Stage B), lands in the dashboard repository (`hanax-ai/sdd-core-centcom-dashboard`; **historical authoring pin `95c8e9c`**, preserved as provenance; **review baseline `49f05bb`**, verified 2026-07-23 after P2-PRE-2 completion and subsequent merges). The governed repository it observes is SDD-Core (`hanax-ai/sdd-core`, `main` at `6994bf6`, re-verified 2026-07-23). The design targets its existing seams; every path below is `[EXT]` (external-repo, future-authorization-only), `supabase/` paths are dashboard-repo `[EXT]` paths in that repository's source-controlled deployment lineage, and **no placeholder locus remains**:

```text
[EXT] supabase/migrations/*_centcom_*.sql            # PostgreSQL `centcom` schema migrations: snapshots, ingestion runs, access-policy
                                                     # state, audit records, least-privilege roles; cron registration migration (T013, T015)
[EXT] supabase/functions/centcom-reconcile/index.ts  # reconciliation Edge Function — the scheduled/on-demand WRITE path
                                                     # (fetch → validate → normalize → publish), invoked by Supabase Cron (T015)
[EXT] src/server/centcom-data/service.ts             # shared server-side data service — the single normalization/serving layer BOTH consumers read (T014)
[EXT] src/server/centcom-data/queries.ts             # PostgreSQL read queries (serving read-only role) + monitoring reads (T014, T025)
[EXT] src/server/centcom-data/envelope.ts            # provenance-envelope construction/verification shared by dashboard + MCP (T014)
[EXT] src/routes/mcp.ts                              # MCP endpoint handler — TanStack server-handler route implementing the MCP Streamable HTTP endpoint (T018)
[EXT] src/server/mcp/tools.ts                        # the seven MCP tools: get_snapshot live from the shared service; six fixture-backed with enforced envelopes (T018, T019)
[EXT] src/server/mcp/auth.ts                         # authorization distinct from authentication: allowlist policy, tool-level control, token audience validation (T021)
[EXT] src/data/schemas.ts                            # contract schemas extended (envelope v1.2.0, snapshot-live v1.2.0; $id URNs) — existing Zod seam (T012)
[EXT] src/data/adapter.ts                            # per-collection source selection fixture | live; dashboard adapter hydrated from the shared
                                                     # service's transient versioned response; mode surfaced, not hardcoded (T016)
[EXT] src/data/__tests__/                            # contract, mode-confusion, determinism, failure-path, no-change, rollback,
                                                     # schema-compilation, consumer-consistency suites (T004–T011, T020)
[EXT] src/components/, src/routes/                   # dashboard surfaces: data-mode indicator, source/freshness disclosures, mixed-state labeling (T017)
```

**MCP source binding (review Finding 3; bound proposal requiring planning approval — research.md R-8)**: no repo-visible MCP implementation existed at review time; the Lovable-hosted MCP endpoint was an externally hosted surface with unresolved canonical source. This plan binds the MCP's future source-controlled home to the **dashboard repository** — the exact paths above (`src/routes/mcp.ts`; `src/server/mcp/`) — on recorded evidence: the repo already ships a repo-visible server handler deployed through the same Lovable lineage (`src/routes/sitemap.xml.ts`), demonstrating that server routes deploy from repository source. **Recorded assumption**: Lovable deploys repo-visible server routes to the hosted endpoint AND the platform's `/mcp` path can be routed to `src/routes/mcp.ts`. **Validating this assumption is an explicit readiness-to-request-Gate-2 item** (`gate-2-entry-criteria.md`; risk-register.md R-15). **Escalation path**: if Lovable cannot deploy the MCP from repository-visible source, a separate service repository is proposed and escalated to Agent Zero **before planning approval** — never silently substituted. **Write scopes**: dashboard repo = MCP endpoint + tool modules + shared data service + migrations + Edge Functions (all `[EXT]`, dashboard-scoped agent, future authorization); governance-ops = planning artifacts, records, and runbooks only. Testing, rollback, and operational ownership are stated by owner role — dashboard-scoped implementing agent (code, tests, deployment), CENTCOM operator (reconciliation/serving operation, rollback execution), governance-ops (records and acceptance evidence), Agent Zero (authorization decisions) — never by named persons.

**Structure Decision**: one shared server-side data service inside the dashboard repo (`src/server/centcom-data/`) is the single normalized read surface (FR-001/FR-002): the dashboard hydrates its Phase 1 adapter from the service's transient versioned response, and the MCP endpoint consumes the same service in-process — neither consumer fetches, normalizes, or reads PostgreSQL independently, so divergence is structurally prevented rather than policed. Reconciliation is a separate server-side WRITE component (the Edge Function) that *publishes to* PostgreSQL; consumers never call GitHub directly.

## Phase 0: Outline & Research

Unknowns extracted from Technical Context → resolved in `research.md` (R-1–R-6 authored under WO-P2-AUTHOR-001; R-1 and R-3 superseded and re-resolved, and R-7/R-8 added, under WO-P2-AUTHOR-001-R1):

1. **R-1 — Operational persistence and the serving seam** (re-resolved 2026-07-23): PostgreSQL — the existing Supabase project's managed PostgreSQL, dedicated `centcom` schema — is the operational system of record per Agent Zero; the file-shaped durable snapshot of R0 is superseded (review Finding 1); the Phase 1 synchronous adapter contract is preserved via transient-response hydration from the shared data service.
2. **R-2 — Authoritative source paths for the snapshot collection**: four observed facts (repository identity, default-branch head SHA, latest commit title, observation timestamp); enumeration normative in `contracts/snapshot-collection.md` (v1.2.0); the single authoritative no-change rule — a new snapshot version exists **iff** normalized content changes; a no-change run advances freshness via the run record.
3. **R-3 — GitHub API grounding under Article IV** (re-resolved 2026-07-23): **mirror-only**; proposed source `github/rest-api-description`, pinned and registered via T002; the two former alternatives (installed dependencies; response-shape tests) struck as insufficient; **the source selection awaits Agent Zero ratification**.
4. **R-4 — Freshness cadence and staleness threshold** (ratified 2026-07-23): hourly + on-demand; stale after 2 hours; `last_verified_at` anchor; serving-time classification scoped to the single anchor comparison; exhaustive varying-field list (`stale`, `thresholdExceededBy`).
5. **R-5 — AuthN vs authZ layering** (posture resolved): allowlist-first authorization over the existing OAuth surface; token audience validation; tool-level policy; serving posture decided by Agent Zero 2026-07-23 — public dashboard access limited to explicitly public-class snapshot fields; MCP access stays OAuth-protected; no non-public collection migrates until authorization and revocation controls are operational and validated.
6. **R-6 — Mode-confusion test design**: classification-from-result-alone tests plus the fixture-poisoning canary, plus the **schema-compilation validation step** added under R1 (URN-resolved `$id` references; task T011).
7. **R-7 — Reconciliation runtime** (new under R1): source-controlled Supabase Edge Function invoked by Supabase Cron; one ingestion operation for both scheduled and on-demand invocation; never in-browser, never inside an MCP request; GitHub Actions is not the production scheduler.
8. **R-8 — MCP source-controlled home** (new under R1): bound to the dashboard repository (see Project Structure — MCP source binding); the Lovable deployment assumption recorded, with a readiness-to-request-Gate-2 validation item and a pre-planning-approval escalation path.

**Output**: `research.md` — all Technical Context NEEDS CLARIFICATION items resolved. Two governed follow-ups await Agent Zero action, tracked in `gate-2-entry-criteria.md` and the R1 handoff: ratification of the R-3 mirror-source selection, and validation (or escalation) of the R-8 deployment assumption.

## Phase 1: Design & Contracts

1. **Entities** → `data-model.md`: Governed Repository, Ingestion Run, Validated Snapshot, Provenance Envelope, Collection, Contract Version, Fixture Dataset, Ingestion Record, Access Policy — fields, relationships, state transitions (S-01 ingestion-run lifecycle with terminal outcomes `published` | `failed-retrieval` | `failed-validation` | `no-change`; S-02 freshness states anchored to `last_verified_at`; S-03 collection migration states). Every durable entity persists in the PostgreSQL `centcom` schema; JSON appears only as fixtures, tests, and transient exports.
2. **Contracts** → `contracts/` (both **v1.2.0**):
   - `provenance-envelope.md` v1.2.0 — the envelope every result carries (FR-008/FR-009/FR-010), with embedded JSON Schema (`$id: urn:centcom:contract:provenance-envelope:1.2.0`), field semantics, mixed-mode composition rules with **required constituent `contractVersion`**, and the scoped serving-time freshness rule (only `stale`/`thresholdExceededBy` vary; the envelope's `observedAt` is the stored `last_verified_at`, never the serving clock).
   - `snapshot-collection.md` v1.2.0 — the live `get_snapshot` contract (FR-004/FR-005/FR-006): source enumeration, validated shape, staleness disclosure, failure fallbacks; declares its own contract version in header and schema (`$id: urn:centcom:contract:snapshot-collection:1.2.0`) and references the envelope schema by `$id` URN — never by file path; both schemas must be loaded for compilation, proven by the schema-compilation validation task (T011).
3. **Contract test scenarios**: defined inside each contract file; each scenario must fail until an implementation exists (one exception: the schema-compilation check passes as soon as the contract schemas themselves compile with cross-references resolved — tasks.md T011).
4. **Validation walkthrough** → `quickstart.md`: end-to-end verification narrative (reconcile → validate → publish to PostgreSQL → serve through the shared data service → verify provenance → no-change run recorded with no new snapshot version and an advanced anchor → simulate failure → rollback), usable as the **Stage C** acceptance script (T026) — executed only after the Gate 2 directive, never before it.
5. **Project knowledge**: no new global conventions introduced; the project playbook gains a Section 4 row when the T002 mirror is registered and a Section 1 register row when the incident/rollback runbook is implemented (T024) — deferred deliberately, not forgotten.

**Output**: `data-model.md`, `contracts/provenance-envelope.md` (v1.2.0), `contracts/snapshot-collection.md` (v1.2.0), `quickstart.md`.

## Phase 2: Task Planning Approach

*Executed as a separate pass — `tasks.md` exists in this folder (revised under R1); approach described here per template.*

**Task Generation Strategy**: derive from Phase 1 artifacts — each contract → contract test task (T004, T005) then implementation task (T012); the schema-compilation validation as its own CI-runnable task (T011); the durable entities → PostgreSQL `centcom` schema migrations (T013); the reconciliation runtime → Edge Function + cron registration (T015); the serving path → shared data service (T014), adapter hydration from the transient versioned response (T016), MCP endpoint and tools (T018/T019); each user story → integration/acceptance coverage (T017, T020, T026); each FR group → at least one task (verified in `traceability.md`). Every task cites exact file paths — zero placeholders (the MCP endpoint, tool modules, shared data service, migrations, and Edge Function paths are bound above); external-repo paths are tagged `[EXT]` and blocked on T001's recorded Gate 2 directive.

**Ordering Strategy**: TDD order (contract, mode-confusion, determinism, failure-path, no-change, rollback, and schema-compilation tests T004–T011 before implementation T012–T016); dependency order (schemas → migrations → shared data service → reconciliation → adapter hydration → serving surfaces → security and operations); `[P]` only for genuinely independent files.

**Stage sequencing (three-stage model, FR-030)**: **Stage A** — Agent Zero approves spec.md + plan.md (planning approval; the workspace-side readiness items T002 and T003 complete alongside it); **Stage B** — Agent Zero issues the explicit Gate 2 implementation directive ("Approved for implementation: \<exact spec/plan\>"), recorded verbatim by T001 — **Gate 2 IS the implementation authorization**, and no implementation evidence is or may be a prerequisite to it; **Stage C** — `[EXT]` implementation executes, then validation and acceptance review (quickstart walkthrough, acceptance evidence, T026). P2-PRE-2 (`Dashboard CI / required` bound to job `required`, source GitHub Actions; `main` ruleset Active; deny/allow control-effectiveness proof on dashboard PR #14; canonical command `npm run verify` = `format:check` → `lint --max-warnings 8` → `typecheck` → `test:ci` → `build` → `verify:generated`) is **COMPLETED AND OPERATIONAL** (2026-07-23): T003 incorporates its recorded evidence rather than awaiting delivery, and Stage C acceptance verifies the implementation merged through that operational gate (FR-029, SC-008).

**Output**: 26 numbered tasks (T001–T026) in `tasks.md`.

## Complexity Tracking

No constitution violations requiring justification. Two recorded escalations (not violations) remain: external-repo task paths (Article III scope-rule adaptation, documented above) and the Article IV mirror-registration precondition (T002 — mirror-only route; source selection awaiting Agent Zero ratification). Both carry readiness-to-request-Gate-2 checks. The R0 escalation trigger for durable-cache storage (former risk R-07) is retired: the Article II question is resolved by decision — PostgreSQL is the mandated store — and the register row is monitor-only for schema/persistence discipline (risk-register.md R-07); the remaining storage-related escalation path is a separate-PostgreSQL-instance proposal on a concrete isolation/capacity/compliance/deployment blocker (risk-register.md R-16).

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (`research.md` written; R-1/R-3 re-resolved and R-7/R-8 added under R1)
- [x] Phase 1: Design complete (`data-model.md`, `contracts/` v1.2.0, `quickstart.md` written and revised under R1)
- [x] Phase 2: Task planning approach described (tasks.md authored in the separate pass and revised under R1)

**Gate Status**:

- [x] Initial Constitution Check: PASS (root **and** project constitutions; two escalations recorded)
- [x] Post-Design Constitution Check: PASS (re-run 2026-07-23 under R1 — Article II restated on the PostgreSQL decision; Article IV narrowed to mirror-only)
- [x] All NEEDS CLARIFICATION resolved (two governed follow-ups await Agent Zero action: R-3 mirror-source ratification; R-8 deployment-assumption validation or escalation)
- [x] Complexity deviations documented (none required beyond the recorded escalations)

**Authorization Status (honest state under R1)**:

- [ ] Independent re-review of the remediated package — pending (the next step)
- [ ] Stage A planning approval (spec.md + plan.md) — **pending; not granted**
- [ ] Stage B Gate 2 implementation directive — **not requested and not granted** (T001 records it verbatim if and when Agent Zero issues it)
- [ ] Stage C implementation / validation / acceptance — not started; no `[EXT]` task is authorized

---

*Gated by `.specify/memory/constitution.md` (workspace root, v2.1.0) and `projects/governance-ops/.specify/memory/constitution.md` (v1.1.1) — see the Constitution Check above. Authored under WO-P2-AUTHOR-001; revised under WO-P2-AUTHOR-001-R1 (2026-07-23), applying the independent review verdict of 2026-07-23 and the Agent Zero decisions recorded there. Approval of this plan is a planning approval only (Stage A); implementation authority arrives solely as Agent Zero's explicit Gate 2 implementation directive (Stage B), as described in `implementation-authorization-boundary.md`.*
