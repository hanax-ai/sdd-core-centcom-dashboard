# Quickstart: CENTCOM Phase 2 — Stage C End-to-End Acceptance Walkthrough

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 (WO-P2-AUTHOR-001-R1) | **Plan**: [plan.md](./plan.md) (Phase 1 output)

**Work order**: WO-P2-AUTHOR-001, revised under WO-P2-AUTHOR-001-R1 — planning and authoring only. **This walkthrough is a planning artifact. It does not grant, imply, or request implementation authority** (see `implementation-authorization-boundary.md`). It belongs to **Stage C** of the three-stage sequence (FR-030): Stage A — Agent Zero approves the planning artifacts; Stage B — Agent Zero issues the explicit Gate 2 implementation directive ("Approved for implementation: \<exact spec/plan\>") — Gate 2 IS the implementation authorization; Stage C — implementation, then validation and acceptance review. This walkthrough is *executed* only as task **T026** (`tasks.md`), after the Gate 2 directive is recorded (T001) and the implementation it authorized is complete. Nothing in this walkthrough is a prerequisite to the Gate 2 directive; acceptance evidence is a Stage C product, never a Gate 2 input.

## Purpose and Standing

This document is the end-to-end acceptance script for the first live vertical slice: `get_snapshot` migrated to validated live GitHub data served from the PostgreSQL system of record, with the remaining six tools explicitly fixture-backed — **seven tools total, one migrated first, six remaining** (FR-004). An acceptor (human or agent acting for Agent Zero) follows the numbered steps in order; each step states its expected outcome and the requirement(s) or success criteria it proves. A step that does not produce its expected outcome is a **blocking finding**: acceptance stops, the finding is recorded, and the walkthrough resumes only after the finding is resolved or Agent Zero directs otherwise.

The walkthrough exercises the one truth path end to end: GitHub sources → server-side reconciliation (ingestion, validation, deterministic normalization) → versioned validated snapshot in the PostgreSQL `centcom` schema → shared server-side data service → transient versioned response → **both** the dashboard and the MCP (FR-001, FR-002). It never requires a consumer to call GitHub directly, never places PostgreSQL credentials in a browser or client context, and never requires write access to the governed repository.

## Conventions

- **Governed repository**: the SDD-Core repository (`hanax-ai/sdd-core`), the live source `get_snapshot` reports (spec Q-001). Recorded baselines: SDD-Core `main` = `6994bf6` (re-verified 2026-07-23); dashboard historical authoring pin = `95c8e9c` (preserved as provenance); dashboard review baseline = `49f05bb` (verified 2026-07-23). The walkthrough runs against the heads current at execution time; the baselines are recorded starting points, not required states.
- **Evidence discipline**: every step's evidence is recorded as **safe references** — commit SHAs, workflow-run URLs, test-run identifiers, snapshot version identifiers, ingestion-run identifiers, redacted result excerpts. No credentials, tokens, private hostnames, or personal data may appear in any recorded evidence (FR-024; project constitution Article III).
- **Contract references**: envelope field semantics and scenarios per `contracts/provenance-envelope.md` (contract version 1.2.0; C-ENV-1..8); live snapshot shape and scenarios per `contracts/snapshot-collection.md` (contract version 1.2.0; C-SNAP-1..10); entity and state-model definitions per `data-model.md` (E-01..E-09; S-01..S-03); test-suite mapping per `test-strategy.md`.
- **Envelope minimum** (checked repeatedly below, FR-008/FR-009): `dataMode` (`fixture` | `live` | `mixed`), `authoritative` (boolean), `sourceRepository`, `sourceCommitSha` (or fixture `datasetVersion` when `dataMode` is `fixture`), `observedAt`, `contractVersion`, `datasetVersion` (when applicable), `governanceWarning` (when authority cannot be established), and the always-explicit `stale` (with `thresholdExceededBy` present iff stale). **Every mixed-mode constituent envelope carries its own `contractVersion`** (envelope contract v1.2.0).
- **Freshness discipline** (`data-model.md` S-02): on live results `observedAt` equals the stored `last_verified_at` anchor — the `observedAt` of the latest successful ingestion run (`published` or `no-change`) — never the serving clock. Staleness is classified at serving time by the shared data service against the 2-hour threshold; `stale` and `thresholdExceededBy` are the **only** response fields that may vary with the serving instant.
- **Store inspection**: steps that inspect stored state read the `centcom` schema's snapshot and ingestion-run relations (`data-model.md` E-03/E-08) through authorized read-only access. JSON appears only as fixtures, tests, and transient exports — there is no durable file-shaped snapshot store to inspect.

---

## Step 1 — Verify Stage C preconditions

Confirm, before touching any pipeline surface:

1. `records/implementation-authorization.md` exists and captures **Agent Zero's Gate 2 implementation directive verbatim** ("Approved for implementation: \<exact spec/plan\>"), the dashboard base commit, and the assigned implementing agent (**T001**). Planning approval (Stage A) alone does not satisfy this record — Gate 2 IS the implementation authorization, and it preceded the implementation under acceptance (FR-030).
2. The Article IV mirror is registered per **T002**: the pinned local mirror of `github/rest-api-description` under `projects/governance-ops/reference/`, with its playbook Section 4 registry row, recorded pinned revision, and the dependent design decisions. A registered, pinned mirror is the only sufficient grounding — installed dependencies and response-shape tests are not.
3. `records/p2-pre-2-evidence.md` exists and incorporates the **completed** P2-PRE-2 evidence (**T003**; P2-PRE-2 is COMPLETED AND OPERATIONAL as of 2026-07-23): the operational `Dashboard CI / required` status and the deny/allow control-effectiveness proof (dashboard PR #14), cited as safe references. P2-PRE-2 is externally owned; this step consumes its recorded evidence and never absorbs its work (FR-029).
4. The dashboard quality gate holds at the implementation head: the canonical `npm run verify` chain (`format:check` → `lint --max-warnings 8` → `typecheck` → `test:ci` → `build` → `verify:generated`) is green, and the implementation under acceptance merged through the operational `Dashboard CI / required` gate (FR-029).

**Expected outcome**: all four records/checks are present and current. If any is missing, the walkthrough MUST NOT proceed — acceptance is blocked with the missing precondition named as the reason. (The readiness-to-request-Gate-2 criteria in `gate-2-entry-criteria.md` were satisfied before Gate 2 was requested; this step confirms their records still stand, it does not re-run them.)

**Proves**: FR-029, FR-030, SC-008 (the Stage C side of the evidence chain).

## Step 2 — Run reconciliation against the governed repository

Trigger one **on-demand invocation of the reconciliation Edge Function** (`[EXT] supabase/functions/centcom-reconcile/index.ts`, T015) — the same single ingestion operation Supabase Cron invokes hourly. The run observes the enumerated observables of the governed repository (repository identity, default-branch name, head commit SHA, latest commit title; the observation instant is injected exactly once per run — FR-005, FR-012); validates the retrieved content against the snapshot contract (FR-003, FR-013); normalizes deterministically (FR-014); and, because normalized content differs from the currently published snapshot (or no snapshot exists yet), publishes a new snapshot version **transactionally in PostgreSQL** (FR-015; a reader never observes a partial write). The run executes server-side only — never in the browser and never inside an MCP request.

**Expected outcome**: the run completes with a `published` outcome and a new snapshot version row exists in the `centcom` schema. (If a current snapshot already exists and the governed head has not moved, the run legitimately records `no-change` — that behavior is drilled in Step 8; for this step, use the first run against the store or a run following a real change so a publishing run is exercised.) No credential or token material appears in run output or logs.

**Proves**: FR-003, FR-005, FR-012, FR-013 (execution path); FR-020 (outcome recorded — inspected next).

## Step 3 — Inspect the ingestion run and stored snapshot in PostgreSQL

Read (read-only) the `centcom` schema rows the Step 2 run produced. Verify:

1. The ingestion-run row states the trigger (`on-demand`), the source revision(s) read, the validation outcome, the produced snapshot version, and the run's single observation timestamp (FR-020; `data-model.md` E-02/E-08).
2. The snapshot row carries its own `snapshotVersion` and is pinned to the source commit SHA(s) it derives from; its stored normalized content conforms to the contract shape (FR-015; `contracts/snapshot-collection.md` §3).
3. The pinned SHA resolves to a real commit in the governed repository, and it equals the head SHA the producing run itself recorded at observation time — the ingestion-run row is the contemporaneous witness of head-at-observation. Current repository history can prove a SHA resolves and sits on the default branch; it cannot retroactively prove that SHA was the head at a past instant, so the retroactive claim rests on the ingestion record, with a public-history spot-check as corroboration only.
4. The snapshot's observation timestamp matches the producing run's row, and ingestion-run anchors are strictly increasing (`contracts/snapshot-collection.md` V-6).

**Expected outcome**: run row and snapshot row agree on version, pinned SHA, and timestamps; the pinned SHA is the observed head.

**Proves**: FR-015, FR-020, SC-001 (retroactive verifiability from the ingestion record).

## Step 4 — Verify served `get_snapshot` on both consumers

Call `get_snapshot` via the MCP endpoint (`[EXT] src/routes/mcp.ts`, T018), and open the dashboard surface backed by the same collection (T016/T017). Both consumers read through the **shared data service** (`[EXT] src/server/centcom-data/`, T014), which returns a **transient versioned response** — constructed per request from stored state, never persisted as a file. Verify on **both**:

1. The served result reflects the observed repository head from Step 3 — repository identity, head SHA, latest commit title.
2. The provenance envelope declares `dataMode: live`, `authoritative` per the first-slice authority policy (envelope contract §3: `false` with `governanceWarning` unless an explicit Agent Zero authority decision for the live collection is recorded — cite that decision record if `true`), `sourceRepository` naming the governed repository, `sourceCommitSha` equal to the pinned SHA, **`observedAt` equal to the stored `last_verified_at` anchor** (at this point, the Step 2 run's observation instant — never the serving clock), the current `contractVersion` (1.2.0), and `stale: false` within the 2-hour threshold (FR-008, FR-016).
3. The dashboard and MCP outputs for this collection at this snapshot version are identical — one truth path, no divergent computation or independent normalization (FR-001, FR-002; the T020 consumer-consistency test corroborates by automation).
4. The public dashboard surface exposes only explicitly public-class snapshot fields, and MCP access is OAuth-protected (Agent Zero serving-posture decision, 2026-07-23; spec Q-004).

**Expected outcome**: both surfaces present the same head with matching, complete envelopes; zero divergence; no PostgreSQL credential reaches any client context.

**Proves**: SC-001, SC-003; FR-001, FR-002, FR-008; first half of FR-006 (served result matches the governed repository's actual head at observation time).

## Step 5 — Verify the six non-migrated tools

Call each of the six fixture-backed tools: `list_work_packages`, `get_work_package`, `list_defects`, `list_gates`, `list_decisions`, `get_metrics`. Verify each result declares `dataMode: fixture`, `authoritative: false`, the fixture `datasetVersion`, and an explicit `governanceWarning` that the result does not establish governance approval or project status (FR-007, FR-009). Confirm the mode-confusion suite (T006, FR-011) passes, including the fixture-poisoning canary: the fixture-only marker value never appears in any result labeled `live`.

**Expected outcome**: 6 of 6 tools fixture-labeled and non-authoritative; 0 results present fixture content as live; mode-confusion suite green.

**Proves**: FR-004, FR-007, FR-009, FR-011, SC-002, SC-009 (fixture condition).

## Step 6 — Verify mixed-state labeling on aggregate surfaces

Inspect every surface that combines the live snapshot with fixture-backed collections — dashboard pages, aggregate metrics, status summaries, and any tool result composing both. Verify each declares `dataMode: mixed`, declares authority per constituent collection, and is never presented as wholly live (FR-010). **Every constituent envelope carries its own `contractVersion`** (envelope contract v1.2.0; C-ENV-5). The dashboard's data-mode indicator (T017) must be driven by adapter output, not hardcoded copy.

**Expected outcome**: every aggregate surface is labeled `mixed` with per-collection authority and per-constituent `contractVersion`; 0 surfaces present the mixed state as wholly live.

**Proves**: FR-010, SC-002, SC-009 (mixed condition).

## Step 7 — Change detection: the live source changes the served result

Advance the governed repository's observable state: a new commit on the default branch merged under normal governance. **One real default-branch change is required to accept FR-006's second half.** Replaying two recorded successive repository states may *supplement* the drill — replay validates normalization and version-change handling (FR-014, FR-015) — but replay never changes the live source: an execution that substitutes replay for the real change leaves FR-006's live-change criterion **open**, and Step 15 MUST record that gap as an unresolved finding (blocking unless Agent Zero directs otherwise). Trigger a new reconciliation run. Verify:

1. The new run publishes a new snapshot version pinned to the new head SHA — a new version exists **because normalized content changed** (`data-model.md` S-01) — and its ingestion-run row shows a strictly later observation anchor.
2. Both consumers now serve the new head — never a silently cached older state presented as current.

**Expected outcome**: the served result demonstrably tracks the live source across successive ingestions (C-SNAP-3).

**Proves**: FR-006 (second half — changing the live source changes the served result; proven only by the real-change path, never by replay alone), FR-016 (freshness advance), SC-001.

## Step 8 — No-change drill: run recorded, anchor advances, no new version

Trigger a reconciliation run while the governed head and its normalized content are unchanged since Step 7. Verify (C-SNAP-8; T009; `data-model.md` E-02/E-03/S-01):

1. The run is recorded in the ingestion record with outcome **`no-change`** and its own observation timestamp (FR-020).
2. The `last_verified_at` anchor advances to that timestamp.
3. **No new snapshot version is created**: the snapshot-version count is unchanged, and a new version is created iff normalized content changes (FR-015).
4. Served results on both consumers now carry the advanced `observedAt` (the new anchor) with the **unchanged** `snapshotVersion` and unchanged content — freshness advances via the run record, never via version churn.

**Expected outcome**: run recorded; anchor advanced; zero new snapshot versions; served `snapshotVersion` unchanged.

**Proves**: FR-014, FR-015, FR-020 (no-change semantics); SC-001 (the anchor remains truthful).

## Step 9 — Failure drills: retrieval failure, validation failure, PostgreSQL unavailable

Execute the drills against the failure-path suite's scenarios (T008; `test-strategy.md`):

1. **Retrieval failure**: simulate an unreachable live source (or exhausted rate limit, FR-025). Verify consumers receive the last validated snapshot with `observedAt` (the stored anchor) unchanged and an explicit staleness disclosure once the anchor is past threshold — never presented as fresh — and the failed run is recorded in the ingestion record (FR-016, FR-018, FR-020).
2. **Validation failure**: simulate retrieved content that violates the contract (malformed shape or out-of-vocabulary value). Verify the content is rejected at the validation boundary, the failure record identifies the collection, source location, rule violated, and offending revision (FR-003), and the previously published snapshot remains in service (FR-017, FR-018).
3. **PostgreSQL unavailable at serving time**: simulate the store being unreachable from the shared data service. Verify consumers receive the bundled fixture dataset with full fixture labeling per the snapshot contract's P-3a policy (degraded store-outage serving; `contracts/snapshot-collection.md` §8, C-SNAP-10) — never a blank surface, a crash, unvalidated content, a falsely live result, or stale-as-fresh (FR-018) — and the outage is surfaced to monitoring (FR-028).
4. In all drills: no unlabeled fallback. Restore each condition; verify the next successful run or request resumes live service cleanly.

**Expected outcome**: 100% of served results during the drills are well-formed and correctly labeled (stale, fixture, or degraded); service resumes cleanly on recovery.

**Proves**: SC-004; FR-016, FR-017, FR-018, FR-020, FR-025 (degradation path).

## Step 10 — Rollback drill: directed reversion to fixture-only

Execute a directed rollback per the incident and rollback runbook (T024): a **single governed reversion** returns the capability to fixture-only operation. Verify:

1. The reversion is one configuration action — no data repair, no store surgery, no per-tool edits; the published snapshot rows in PostgreSQL are retained untouched (FR-019).
2. All seven tools and the dashboard serve fixture data with correct fixture labeling: `dataMode: fixture`, `authoritative: false`, `datasetVersion`, `governanceWarning` present (FR-009).
3. The mode-confusion suite (FR-011) and the rollback test (T010) pass in the fixture-only configuration.
4. Restore live configuration and re-verify Step 4 to confirm the rollback is reversible without residue.

**Expected outcome**: rollback completes as a single governed action; all surfaces correctly fixture-labeled; suites green in fixture-only mode.

**Proves**: FR-019, SC-005.

## Step 11 — Determinism check: byte-identical stored normalized content

Select the snapshot versions served during this walkthrough (at minimum the Step 2 and Step 7 versions). For each, re-run normalization on the same recorded source revision under the same contract version and compare the output byte-for-byte against the **stored normalized snapshot content** in PostgreSQL (T007). Observation metadata — run identifiers, timestamps, snapshot version assignment — is excluded from the comparison (SC-006 as narrowed; `contracts/snapshot-collection.md` §5). Determinism inputs are exactly: source content at the pinned revision, contract version, and the normalization rules.

**Expected outcome**: byte-identical reproduction of stored normalized content for 100% of sampled snapshot versions; any content difference is a blocking finding.

**Proves**: FR-014, SC-006.

## Step 12 — Freshness drill: the 2-hour threshold

With scheduled reconciliation suspended for the drill (or with an aged anchor simulated per the T008 tooling), let the stored `last_verified_at` anchor fall more than 2 hours in the past, then request the snapshot on both consumers. Verify (C-SNAP-4; C-ENV-6; `data-model.md` S-02):

1. The envelope declares `stale: true` with a valid `thresholdExceededBy` duration — these are the **only** fields that changed relative to a fresh serving of the same snapshot version; the serving-time classification by the shared data service is the only serving-time clock use in the design.
2. `observedAt` remains the stored anchor, unchanged — stale data is never re-timestamped or presented as fresh.
3. Resume the schedule (or trigger an on-demand refresh): the next successful run advances the anchor, after which `stale` returns to `false` and `thresholdExceededBy` is absent.

**Expected outcome**: staleness appears exactly at the disclosed fields, exactly past the 2-hour threshold, and clears on the next successful run.

**Proves**: FR-016, SC-004 (staleness disclosure path); the scoped serving-time rule of envelope contract v1.2.0.

## Step 13 — Schema-compilation check

Run the CI-runnable schema-compilation validation (T011): Ajv (or equivalent) loads the provenance-envelope and snapshot-collection schemas registered by their `$id` URNs (`urn:centcom:contract:provenance-envelope:1.2.0`, `urn:centcom:contract:snapshot-collection:1.2.0`) and compiles them with every cross-reference resolved — the snapshot schema's `$ref` to the envelope URN resolves with both schemas loaded, and zero document-path `$ref`s exist.

**Expected outcome**: compilation succeeds with all cross-references resolved; the CI run is cited as evidence (C-SNAP-9; `test-strategy.md` schema-compilation layer).

**Proves**: FR-013; SC-002 (schema resolvability).

## Step 14 — Security checks

Execute the security acceptance checks:

1. **Secret scan** (T022): run the automated zero-secret scan over the client-reachable and committed surfaces — client bundles, MCP results, logs, and committed configuration/repository content — and confirm 0 credentials, tokens, or secret material **there**. The required server-side secrets are excluded from the zero-secret assertion by design: the live-source token and the PostgreSQL credentials MUST exist, but only inside server-side secret storage (the Edge Function's environment/secret handling), verified by inspection rather than by the zero count — the live-source token scoped read-only, the serving path using the read-only role, the reconciliation writer role confined to the Edge Function. A required secret appearing in any zero-secret surface is a scan failure (FR-024, SC-007).
2. **Audience validation** (FR-023): present an otherwise-valid token issued for a different resource; verify the MCP rejects it.
3. **Authorization distinct from authentication** (FR-021): authenticate as an app user who is *not* on the access policy's allowlist/role for governance data (the `centcom` access-policy state, T021); verify access is denied — authentication alone grants nothing.
4. **Tool-level access control** (FR-022): verify an individual tool (or its live data) can be restricted to authorized principals, and that the restriction is enforced on invocation (T021).
5. Confirm invocation logging captured the walkthrough's calls — who called which tool when — with no secrets or token contents recorded (FR-026).

**Expected outcome**: scan clean; the deny cases deny; the allow cases allow; audit log complete and secret-free.

**Proves**: SC-007; FR-021, FR-022, FR-023, FR-024, FR-026.

## Step 15 — Record acceptance evidence

Assemble `records/acceptance-evidence.md` (T026): for each of Steps 1–14, record the safe references produced — ingestion-run and snapshot version identifiers, commit SHAs, test-run results, workflow-run URLs, redacted excerpts — and map each to the FR/SC it proves (cross-checked against `traceability.md`). Confirm the Stage C acceptance chain: the recorded Gate 2 directive (T001) preceded the implementation, and the implementation merged through the operational `Dashboard CI / required` gate (SC-008's Stage C check). Note any unresolved finding or accepted risk (per `risk-register.md`). Present the assembled evidence to Agent Zero in the acceptance handoff.

**Expected outcome**: a complete, public-repository-safe evidence record; every walkthrough step evidenced or its gap named. **Acceptance itself is Agent Zero's decision — completing this walkthrough does not constitute acceptance, and no artifact in this folder grants implementation or acceptance authority** (FR-030).

**Proves**: closes SC-008's evidence chain; satisfies FR-020's auditability intent at the acceptance level; completes T026.

---

## Coverage Summary

| Step | Subject | Proves |
|---|---|---|
| 1 | Stage C preconditions (T001/T002/T003) | FR-029, FR-030, SC-008 |
| 2 | Reconciliation run (Edge Function) | FR-003, FR-005, FR-012, FR-013, FR-020 |
| 3 | Ingestion run + snapshot in PostgreSQL | FR-015, FR-020, SC-001 |
| 4 | Served snapshot, both consumers (transient response) | FR-001, FR-002, FR-006 (part), FR-008, SC-001, SC-003 |
| 5 | Six non-migrated tools | FR-004, FR-007, FR-009, FR-011, SC-002, SC-009 |
| 6 | Mixed-state labeling (per-constituent `contractVersion`) | FR-010, SC-002, SC-009 |
| 7 | Change detection (real default-branch change required; replay supplemental only) | FR-006, FR-016, SC-001 |
| 8 | No-change drill (anchor advances; no new version) | FR-014, FR-015, FR-020, SC-001 |
| 9 | Failure drills (retrieval, validation, PG-unavailable) | FR-016, FR-017, FR-018, FR-020, FR-025, SC-004 |
| 10 | Rollback drill | FR-019, SC-005 |
| 11 | Determinism (stored normalized content) | FR-014, SC-006 |
| 12 | Freshness drill (2-hour threshold) | FR-016, SC-004 |
| 13 | Schema compilation ($id URNs) | FR-013, SC-002 |
| 14 | Security checks | FR-021..FR-024, FR-026, SC-007 |
| 15 | Evidence assembly | SC-008 closure; T026 |

Requirements not directly exercised here: FR-027 (data classification) is recorded before Gate 2 is requested, as a readiness-to-request-Gate-2 item (`gate-2-entry-criteria.md`); FR-028 (monitoring and incident coverage) is accepted through its own artifacts and tasks (T024, T025), reviewed at the Stage C acceptance review rather than walked through step-by-step.

---

*Gated by `.specify/memory/constitution.md` (workspace root, v2.1.0) and `projects/governance-ops/.specify/memory/constitution.md` (v1.1.1). This walkthrough is authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23). It is executable only as T026 in Stage C — after Agent Zero's explicit Gate 2 implementation directive (Stage B, recorded verbatim by T001), which has been neither requested nor granted — see `implementation-authorization-boundary.md`.*
