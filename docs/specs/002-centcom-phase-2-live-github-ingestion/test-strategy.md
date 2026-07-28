# Test & Validation Strategy: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 (WO-P2-AUTHOR-001-R1) | **Deliverable**: 6 of 8 (WO-P2-AUTHOR-001 §6)

**Inputs**: `spec.md` (FR-001..FR-030, SC-001..SC-009), `plan.md`, `data-model.md` (E-01..E-09, S-01..S-03), `tasks.md` (T001–T026, revised), `contracts/provenance-envelope.md` (contract version 1.2.0), `contracts/snapshot-collection.md` (contract version 1.2.0), `quickstart.md`, `gate-2-entry-criteria.md`

**Work order**: WO-P2-AUTHOR-001 — planning and authoring only; revised under **WO-P2-AUTHOR-001-R1** (planning-artifact remediation, 2026-07-23). **This strategy is a planning artifact; it does not grant, imply, or request implementation authority** (see `implementation-authorization-boundary.md`). The test suites described here are *specified*, not written; writing them is `[EXT]` work under tasks.md, executable only after Agent Zero's explicit **Gate 2 implementation directive** (Stage B, recorded verbatim by T001).

**R1 revision note**: revised under WO-P2-AUTHOR-001-R1 (independent review verdict 2026-07-23). Layers realigned to the PostgreSQL design (root Article II): a schema-compilation validation layer added (Finding 5.5); no-change semantics tested as one authoritative rule (Finding 5.1); freshness anchored to `last_verified_at` with the ratified 2-hour threshold and an exhaustive varying-field rule (Finding 5.2); the determinism boundary narrowed to stored normalized content (Finding 5.3); PostgreSQL-layer verification added (Finding 1); consumer consistency restated as both consumers traversing the same shared server-side data service (Finding 3); the testing sequence realigned to the canonical three-stage model (Finding 2); the completed P2-PRE-2 evidence incorporated (reconciliation). This revision changes no authorization state: planning approval is pending and Gate 2 has been neither requested nor granted.

---

## 1. Strategy Overview

### 1.1 TDD ordering is a gate, not a preference

Per tasks.md Phase 3.2, every test suite in this strategy MUST exist and MUST fail before any corresponding implementation task in Phase 3.3 begins ("Tests T004–T011 before implementation T012–T016"). This is the enforcement mechanism for the spec's central discipline: the contracts (`contracts/provenance-envelope.md`, `contracts/snapshot-collection.md`) define observable behavior first; implementation earns acceptance by turning pre-existing failing tests green, never by writing tests to match code. One deliberate exception is recorded in tasks.md: the schema-compilation validation (T011) verifies the contract schemas themselves and passes as soon as both schemas compile with cross-references resolved — it still precedes implementation. The ordering is verified at acceptance (T026) by evidence that the test suites predate their implementations in the change history.

### 1.2 One truth path makes consumer consistency first-class

FR-001/FR-002 require that the dashboard and the MCP read the same validated, versioned snapshot from the PostgreSQL system of record through **the same shared server-side data service** — `PostgreSQL → shared data service ([EXT] src/server/centcom-data/) → transient versioned response → dashboard and MCP` — no competing ingestion, no divergent normalization, no browser access to PostgreSQL credentials. A test strategy for a one-truth-path architecture must therefore treat **consumer-consistency testing as a first-class layer**, not an integration afterthought: proving that both consumers emit identical values for the same collection at the same snapshot version (SC-003, T020) is as load-bearing as proving that any single consumer is correct. A defect that makes the two surfaces diverge is a specification violation of the same severity as serving mislabeled data.

### 1.3 Honesty properties are tested as invariants

Three properties from spec.md are tested as invariants that must hold in *every* suite, not only their dedicated ones:

1. **No result without an envelope** (FR-008, SC-002) — every assertion on a served result begins by validating its provenance envelope, including the required `contractVersion` on every mixed-mode constituent envelope (contract version 1.2.0).
2. **No fixture presented as live, no live presented as fixture** (FR-011, SC-009) — the mode-confusion suite is the dedicated proof, but every other suite asserts the expected `dataMode` on its results.
3. **No stale presented as fresh, no silence on failure** (FR-016..FR-018, SC-004) — failure paths always yield a well-formed, honestly labeled result.

### 1.4 Count discipline

Wherever suites enumerate tools, the count is stated unambiguously per FR-004: **seven tools total; one (`get_snapshot`) migrated to live first; six remaining explicitly fixture-backed during the first slice.**

### 1.5 Where testing sits in the three-stage sequence

The canonical sequence (`implementation-authorization-boundary.md`; FR-030) places testing activity precisely:

- **Pre-Gate-2 (readiness to request Gate 2)**: planning-level checks only — planning artifacts reviewed and approved (Stage A), decisions recorded, the completed P2-PRE-2 evidence recorded (T003), and the schema-compilation check of the contract schemas embedded in the planning artifacts (§2.2), which requires no implementation. `gate-2-entry-criteria.md` contains only such pre-implementation items. **No suite execution, implementation evidence, drill, or acceptance result is — or may be — a prerequisite to the Gate 2 directive.**
- **Stage B — Gate 2**: Agent Zero issues the explicit implementation directive ("Approved for implementation: \<exact spec/plan\>"), recorded verbatim by T001. Gate 2 IS the implementation authorization.
- **Stage C — implementation → validation → acceptance review**: the suites in §2 are authored (tests first, per §1.1), implementation turns them green under the operational CI gate (§4), and the `quickstart.md` acceptance walkthrough is executed as T026.

---

## 2. Test Layers

### 2.1 Contract tests (T004, T005)

**Suites**: `src/data/__tests__/provenance-envelope.contract.test.ts` `[EXT]`; `src/data/__tests__/snapshot-live.contract.test.ts` `[EXT]`

**Normative scenario source**: the two contract files in `contracts/`. The scenario definitions there prevail over any paraphrase; this strategy records coverage intent only.

- **C-ENV scenarios** (`contracts/provenance-envelope.md`, contract version 1.2.0): the envelope contract — presence and completeness of the minimum fields (`dataMode`, `authoritative`, `sourceRepository`, `sourceCommitSha` or fixture/dataset version when `dataMode` is `fixture`, `observedAt`, `contractVersion`, `datasetVersion` when applicable, `governanceWarning` when authority cannot be established) per FR-008/FR-009; rejection of missing or extra fields; mixed-mode composition rules per FR-010 (a mixed result declares `dataMode: mixed` with per-constituent-collection authority and is never presentable as wholly live); **every mixed-mode constituent envelope carries the required `contractVersion`** (v1.1.0 rule); and the scoped freshness rule of §2.6.
- **C-SNAP-1..10** (`contracts/snapshot-collection.md`, contract version 1.2.0): ten scenarios exercising the live `get_snapshot` contract — validated shape and allowed vocabularies (FR-013), commit-SHA format and resolvability (FR-005, SC-001), observation-timestamp discipline and monotonic anchors (FR-005; V-6), source-change propagation (FR-006), snapshot version pinning (FR-015), staleness disclosure at the 2-hour threshold (FR-016), failure fallbacks (FR-018), no-change run semantics (C-SNAP-8; §2.5), schema compilation (C-SNAP-9; §2.2), and the store-outage fallback (C-SNAP-10; §2.7 item 4; contract §8 P-3a).

**Pass condition**: every scenario in both contract files has a test that fails against the review baseline (`49f05bb` — no live implementation exists) and passes only when the corresponding implementation (T012–T016) conforms, under the Stage B directive — **with two exceptions**: C-ENV-8 and C-SNAP-9 are the schema-compilation scenarios (§2.2), which pass as soon as the schemas compile and are not implementation-gated; T005 therefore covers C-SNAP-1..8 and C-SNAP-10, while C-SNAP-9 belongs to T011. A contract change without a matching contract-version change is a test failure by design (Contract Version is a governed entity — `data-model.md` E-06).

### 2.2 Schema-compilation validation (T011)

**Suite**: `src/data/__tests__/contract-schema-compilation.test.ts` `[EXT]` — the CI-runnable proof that the contract schemas are independently resolvable (R1 Finding 5.5; scenario C-SNAP-9).

- Ajv (or an equivalent JSON Schema validator) compiles **all** contract schemas with **every cross-reference resolved**: schemas are registered by their `$id` URNs (`urn:centcom:contract:provenance-envelope:1.2.0`, `urn:centcom:contract:snapshot-collection:1.2.0`); the snapshot schema's `$ref` to the envelope URN resolves with both schemas loaded together; **zero `$ref`s point to document paths** — a `$ref` that names a file rather than a schema `$id` is a failure.
- This layer is unique in two ways. First, it is executable at **planning level**: the schemas it compiles are embedded in the contract documents, so the check requires no implementation. The **pre-Gate-2 G-09 evidence is produced by a workspace-side run** of this check against the contract-embedded schemas (`gate-2-entry-criteria.md` G-09) — never by T011 itself, which as an `[EXT]` task is blocked on the Gate 2 directive. Second, once authored as T011 (post-directive) the same check persists as a CI-runnable suite under the enforcement gate (§4), so a future contract edit that breaks resolvability blocks merge.
- Unlike every other Phase 3.2 suite, this test passes as soon as the schemas compile (tasks.md notes the exception); it still precedes implementation and guards it thereafter.

### 2.3 Mode-confusion suite (T006)

**Suite**: `src/data/__tests__/mode-confusion.test.ts` `[EXT]` — the dedicated proof of FR-011 and SC-009.

- **Classification-from-result-alone**: for each of the seven tools, in each of the four conditions (live, fixture, stale, mixed), a test harness given only the result — no configuration, no external context — must classify its `dataMode` and `authoritative` status correctly, 100% of trials (SC-009). During the first slice this means `get_snapshot` classifies as `live` (or `stale`-disclosed live, or labeled fallback) and each of the six non-migrated tools classifies as `fixture` with `authoritative: false` and the non-authority warning (FR-009).
- **Fixture-poisoning canary** (research.md R-6): the fixture dataset carries a marker value that exists only in fixtures. The suite asserts that this canary **never appears in any result labeled `live`**. If fixture-derived content leaks into a live-labeled result anywhere in the path — adapter mis-selection, fallback without relabeling, mixed content presented as wholly live — the canary surfaces it as a hard failure rather than a silent mislabeling.
- **Suite-level failure rule** (FR-011): the suite MUST fail if any surface serves fixture-derived content without fixture labeling or live content without live labeling. This suite also runs in fixture-only configuration to verify rollback labeling (see §2.8 and SC-005).

### 2.4 Determinism suite (T007)

**Suite**: `src/data/__tests__/ingest-determinism.test.ts` `[EXT]` — the proof of FR-014 and SC-006, at the boundary fixed under R1 (Finding 5.3).

- **The guarantee**: re-running normalization on the same recorded source revision under the same contract version reproduces the **stored normalized snapshot content** byte-identically — stable serialization, pinned key order, no wall-clock or random inputs inside normalization (the observation timestamp is run metadata, injected once per ingestion run and recorded on the run — `data-model.md` E-02; T015).
- **Determinism inputs, enumerated**: source content at the pinned revision + contract version + normalization rules. Nothing else.
- **Excluded from the guarantee**: observation metadata — run identifiers, timestamps, snapshot version assignment (SC-006 as narrowed under R1).
- **The boundary**: byte-identity applies to stored normalized snapshot content **at rest, per snapshot version, in PostgreSQL**. Transient responses are deterministic given (snapshot version, stored anchor, serving-instant freshness classification); only the freshness fields enumerated in §2.6 legitimately vary between servings. The suite asserts both halves: stored content reproduces byte-identically, and two servings of the same snapshot version differ in at most `stale`/`thresholdExceededBy`.
- Reproducibility underwrites the auditor scenario (spec.md User Story 4): a served value is reconstructible from its pinned source revision plus the ingestion record (FR-015).

### 2.5 No-change semantics suite (T009)

**Suite**: `src/data/__tests__/ingest-no-change.test.ts` `[EXT]` — the proof of the one authoritative no-change rule (R1 Finding 5.1; `data-model.md` E-02/E-03/S-01; scenario C-SNAP-8).

- A run whose observed head SHA and normalized content are identical to the current published snapshot records an ingestion run with outcome **`no-change`**, creates **no new snapshot version**, and **advances the freshness anchor** (`last_verified_at` = the run's `observedAt`).
- A new snapshot version is created **if and only if normalized content changes** — the suite asserts both directions: no version churn on identical content, and a new version (pinned to the new head, with a distinct `snapshotVersion`) when content changes.
- The served result after a no-change run carries the **unchanged** `snapshotVersion` with the **advanced** `observedAt` (the stored anchor) — freshness advances via the run record, never via version churn (FR-015, FR-020).
- **Anchor monotonicity**: ingestion-run anchors are strictly increasing; a run whose `observedAt` is not strictly later than the latest recorded successful run's fails ingestion validation (clock-skew edge case; `contracts/snapshot-collection.md` V-6), retaining the stored anchor and published snapshot.

### 2.6 Freshness and anchor verification (cross-cutting)

The freshness model (R1 Finding 5.2; `data-model.md` S-02; `contracts/snapshot-collection.md` §6) is verified across T004, T005, and T008 rather than in a separate suite:

- **Anchor**: `last_verified_at` — the `observedAt` of the latest successful ingestion run (`published` or `no-change`), stored in PostgreSQL. Tests assert the served `observedAt` (payload and envelope) equals the stored anchor, **never the serving clock**.
- **Threshold**: a result is stale **2 hours** after `last_verified_at` (Agent Zero decision, 2026-07-23; FR-016). Tests exercise both sides of the threshold: within 2 hours → `stale: false`, no `thresholdExceededBy`; past it → `stale: true` with a valid `thresholdExceededBy` and `observedAt` unchanged.
- **Scoped serving-time clock rule**: staleness classification is computed at serving time by the shared data service against the stored anchor — **the only permitted serving-time clock use**. Tests assert no other served field derives from the serving clock.
- **Varying-field exhaustiveness**: the permitted serving-time-varying response fields are exactly `stale` and (when stale) `thresholdExceededBy`. The verification is exhaustive by construction: serve the same snapshot version twice at different simulated instants and assert the responses are identical except in those two fields. The internal `aging` state never appears in any envelope (`data-model.md` S-02).

### 2.7 Failure-path suite (T008)

**Suite**: `src/data/__tests__/ingest-failure-paths.test.ts` `[EXT]` — the proof of FR-016..FR-018 and SC-004, exercising all five specified failure behaviors:

1. **Retrieval failure**: live source unreachable → the last validated snapshot is served with an explicit staleness disclosure once the anchor is past threshold; `observedAt` unchanged; never presented as fresh (FR-016, FR-018).
2. **Validation failure**: retrieved content violating the contract (malformed, out-of-vocabulary, contract-violating) is rejected at the validation boundary; the failure is recorded with collection, source location, rule violated, and offending revision (FR-003); the previously published snapshot remains in service (FR-018).
3. **No-snapshot fallback**: when no validated live snapshot has ever been published, the fixture-backed result is served declaring `dataMode: fixture`, `authoritative: false` — never an unlabeled or empty result (FR-018).
4. **PostgreSQL unavailable at serving time**: the shared data service cannot reach the system of record → the bundled fixture dataset is served with full fixture labeling per the snapshot contract's P-3a policy, and the outage is surfaced to monitoring — never a blank surface, a crash, a falsely live result, or stale-as-fresh (FR-018, FR-028, SC-004; C-SNAP-10 — contract §8 P-3a).
5. **Mid-ingestion atomicity**: a consumer reading during an in-progress ingestion observes only the prior published snapshot — publication is a transactional supersession in PostgreSQL; a partial write is never observable (spec.md edge case; `data-model.md` S-01/E-03; T013/T015).

In every case the served result remains well-formed and correctly labeled — zero blank surfaces, crashes, or unlabeled fallbacks (SC-004) — and the ingestion outcome (`published`, validation failure, retrieval failure, `no-change`) is asserted present in the append-only ingestion-run record in PostgreSQL (FR-020).

### 2.8 Rollback suite (T010)

**Suite**: `src/data/__tests__/rollback-fixture-mode.test.ts` `[EXT]` — the proof of FR-019 and SC-005.

- A directed rollback is a **single governed reversion to fixture-only configuration**: after it, all seven tools and the dashboard serve fixture data with correct fixture labeling (`dataMode: fixture`, `authoritative: false`, non-authority warning), and the reversion requires **no data repair** — the stored snapshots and run records in PostgreSQL are untouched; only the serving configuration reverts.
- Verification is defined by SC-005 as the mode-confusion suite (§2.3) passing in fixture-only configuration — rollback correctness is labeling correctness, re-proven by the same instrument that proves it in the mixed state.
- This suite's semantics also fix the rollback path cited by the incident/rollback runbook (T024) and the incident procedures required by FR-028.

### 2.9 PostgreSQL layer verification (T013; exercised via T008/T009)

The system of record (root Article II; `[EXT]` `supabase/migrations/*_centcom_*.sql`, the dedicated non-public `centcom` schema in the existing Supabase managed PostgreSQL) is verified at its own layer:

- **Migrations apply cleanly**: the source-controlled migrations apply in order to a clean database and produce the complete `centcom` schema — snapshot versions and normalized content, append-only ingestion runs, provenance, access-policy state, audit records. A migration that fails to apply, or applies only partially, blocks everything downstream of T013.
- **Least-privilege roles enforced**: the reconciliation **writer role** can write ingestion runs and publish snapshot versions but holds no privileges outside the `centcom` schema; the serving **read-only role** (used by the shared data service) cannot INSERT, UPDATE, or DELETE. Tests assert the denials, not just the grants. No PostgreSQL credential is ever present in browser or client code (FR-024; serving-path rule).
- **Append-only ingestion runs**: application roles cannot UPDATE or DELETE ingestion-run rows — the record is append-only by privilege, not by convention (FR-020); anchor monotonicity is enforced at ingestion validation (§2.5), backed by single-flight run serialization (`data-model.md` E-02) and the database-side monotonic guard (E-08): tests assert the store itself **rejects** a successful row whose `observedAt` is not strictly later than the current maximum successful anchor, and that a snapshot row commits only in its producing run's transaction.
- **Atomic publication**: snapshot supersession is transactional; the mid-ingestion read behavior of §2.7 item 5 is the observable proof.

These properties are exercised by the failure-path and no-change suites (T008, T009) where observable through the service, and by direct migration/role verification recorded as Stage C acceptance evidence (T026) where they are not.

### 2.10 Consumer-consistency suite (T020)

**Suite**: `src/data/__tests__/consumer-consistency.test.ts` `[EXT]` — the proof of FR-001/FR-002 and SC-003.

- For the same collection at the same snapshot version, dashboard output and MCP output are **identical** — zero divergence in any comparison (SC-003; spec.md User Story 4, acceptance scenario 2).
- The suite compares values *and* provenance envelopes: both consumers must declare the same snapshot version, source commit SHA, and observation timestamp for the same read, proving both traverse **the same shared server-side data service** (`[EXT] src/server/centcom-data/` — T014): the dashboard by hydrating its Phase 1 adapter from the service's transient versioned response (T016), the MCP (`[EXT] src/routes/mcp.ts`, `[EXT] src/server/mcp/`) by calling the same service layer (T018) — never by computing independently.
- Coverage spans the migrated collection (live) and the five fixture-backed collections, so the one-truth-path property is proven in both modes and in the mixed aggregate state (FR-010).

### 2.11 Security verification (T021, T022, T023)

Security requirements are verified by a mix of automated tests and inspected evidence:

- **Secret scan (SC-007, FR-024)**: an automated scan proves zero credentials, tokens, or secret material in the client-reachable and committed surfaces — client bundles, MCP results, logs, and committed configuration, including the **committed source** of the reconciliation Edge Function (`[EXT] supabase/functions/centcom-reconcile/`) (T022). The Edge Function's **environment/secret storage is excluded from the zero count by design** — the live-source token and PostgreSQL credentials MUST exist there, and are verified by inspection (token scoped read-only; least-privilege roles), per quickstart Step 14.1; a required secret appearing in any zero-secret surface is a scan failure. The scan runs locally and as CI-integrated acceptance evidence; its results are recorded per T026.
- **Token audience validation (FR-023)**: tests prove that a token issued for a different resource is rejected even if otherwise valid (T021; `[EXT] src/server/mcp/auth.ts`).
- **Tool-level access control (FR-022, FR-021)**: tests prove that authorization is distinct from authentication — an authenticated app user without authorization is denied per the access policy backed by the `centcom` access-policy tables, and individual tools (or the live data they serve) can be restricted to authorized principals (T021). MCP access remains OAuth-protected, and no non-public collection migrates until authorization and revocation controls are operational and validated (Agent Zero decision, 2026-07-23).
- **Audit-log hygiene (FR-026)**: invocation-log assertions confirm who-called-what-when is recorded without secrets or token contents.

Rate-limit behavior (FR-025, T023) is verified within the failure-path discipline: exhaustion degrades per FR-018 (labeled, well-formed), never crashes or silently skips — at both the MCP endpoint and the reconciliation Edge Function.

### 2.12 Regression protection

- **Phase 1 baseline stays green**: the dashboard's baseline suite — **51 of 51 tests passing** at the historical authoring pin `95c8e9c` (repair commit `42e94eb`, PR #2 merged; lint 0 errors with 8 accepted Fast Refresh warnings), reconfirmed at the review baseline `49f05bb` (verified 2026-07-23) — MUST remain fully green throughout Phase 2 implementation. Any Phase 1 test failure blocks acceptance regardless of new-suite status.
- **Six non-migrated tools byte-unaffected** (FR-007, FR-004): during the first slice, the six fixture-backed tools' data source is verifiably unchanged — their results continue to declare fixture provenance (fixture dataset version, `authoritative: false`, non-authority warning), and the mode-confusion suite (§2.3) proves live and fixture modes cannot be confused. The adapter pins these collections to fixture mode surfaced from data, never hardcoded copy (T016, T019).
- Refactoring the eight accepted Fast Refresh warnings is out of scope (WO-P2-AUTHOR-001 §7; unchanged under R1) and MUST NOT be smuggled in through test-enablement changes.

---

## 3. Test Data Policy

Governed by the project constitution's record-and-churn discipline (evidence classes) and the public-repository-safe constraint (plan.md Constraints):

1. **Committed test inputs are synthetic only (class-1)**. All fixtures committed with the test suites — envelope samples, snapshot shapes, poisoned-canary datasets, simulated failure responses — are synthetic, deterministic, and clearly versioned. JSON here is exactly what the Article II decision permits: fixtures and test material, never durable application state (Agent Zero decision, 2026-07-23). The Phase 1 fixture dataset retains its role as the labeled, non-authoritative fallback and the source for the six non-migrated tools (spec.md Key Entities: Fixture Dataset).
2. **Recorded real source states are class-2/class-3 safe references, never committed test inputs**. Evidence that a served live snapshot matched the governed repository's actual head (SC-001, FR-006) is captured as safe references — commit SHAs, run URLs, ingestion-run record excerpts from PostgreSQL — in `records/` per T026, not baked into committed suites. Committed tests MUST NOT depend on the live state of `hanax-ai/sdd-core` to pass; live-state verification belongs to the acceptance walkthrough (§5).
3. **No secrets, no private hostnames, no personal data** in any test fixture, name, or assertion message (FR-024, SC-007). Public repository identity (`hanax-ai/sdd-core`) is the only permitted real-world identifier.
4. **Canary integrity**: the fixture-poisoning canary value (§2.3) is part of the versioned fixture dataset; changing it is a governed fixture-dataset version change, reflected in `datasetVersion` in fixture envelopes.

---

## 4. Environments and the Enforcement Point

### 4.1 Local execution

All suites run locally under the dashboard repo's existing toolchain (Vitest; plan.md Technical Context) as the development-time feedback loop. Local runs are **evidence, not enforcement**.

### 4.2 The P2-PRE-2 CI gate is the enforcement point — and it is operational

The externally owned work package **P2-PRE-2 — Dashboard CI and Merge Protection** (VS Code/Codex, under its own directive) is **COMPLETED AND OPERATIONAL** (2026-07-23). Its recorded evidence (incorporated by T003; FR-029, SC-008):

- Canonical command **`npm run verify`** = `format:check` → `lint --max-warnings 8` (warning budget 8 enforced) → `typecheck` → `test:ci` → `build` → `verify:generated` (routeTree cleanliness).
- Workflows `.github/workflows/dashboard-ci.yml`, `dependency-audit.yml`, `dependency-review.yml` — actions pinned; checkouts hardened with `persist-credentials: false`.
- Required status **"Dashboard CI / required"** bound to job name `required`, source GitHub Actions; the `main` ruleset is **Active**.
- Deny/allow control-effectiveness proof executed on dashboard PR #14: a deliberate failure isolated → demonstrably blocked; corrected → passed (commits `7d92f7d`, `658e4b3`, `9352c4c`). Delivered via merged PRs #3 and #14; Dependabot operational (actions bumps merged via PRs #6/#7/#8).

That gate is where the suites in this strategy become **blocking**: a red suite prevents merge rather than merely reporting. The Phase 2 suites land in the repository whose CI already runs `test:ci`, so they enter enforcement by existing behavior.

Boundary discipline: **this strategy consumes that gate; it never defines it.** This document does not design GitHub Actions workflows, edit workflow files or package scripts, configure branch protection or rulesets, or re-perform the deny/allow gate test — all of that was P2-PRE-2 scope, is complete, and may not be absorbed or re-opened here. What this strategy relies on is only what FR-029 records: the operational, control-effective `Dashboard CI / required` gate that Stage C implementation must merge through.

> Local validation is evidence; GitHub CI is enforcement. A PR description is neither.

### 4.3 Sequencing consequence

The stage model (§1.5) fixes what runs when:

- **Pre-Gate-2**: only planning-level checks — artifact review, recorded decisions and evidence (T002, T003), and the schema-compilation check against the embedded contract schemas (§2.2). Readiness to request Gate 2 (`gate-2-entry-criteria.md`) requires **no** suite execution, no implementation, no drill.
- **After the Stage B directive (recorded by T001)**: suite authoring fans out first (T004–T011, failing by design), then implementation (T012–T016) turns them green.
- **Stage C acceptance**: no implementation is accepted unless its suites run green under the operational `Dashboard CI / required` gate and it merged through that gate (FR-029, SC-008 — a Stage C acceptance check, verified at T026, never a prerequisite to Gate 2).

---

## 5. Acceptance Evidence

### 5.1 quickstart.md is the acceptance script

The end-to-end validation walkthrough in `quickstart.md` — ingest → validate → serve → verify provenance → simulate failure → rollback — is the acceptance script for the first slice. Executing it end to end is task **T026** (Stage C — post-implementation validation and acceptance review), which depends on all prior tasks and closes Phase 3.6. Stage C evidence follows the Gate 2 directive; it is never a prerequisite to it.

### 5.2 Evidence recording

Per T026, walkthrough evidence is recorded as safe references in `records/acceptance-evidence.md`: suite results under the CI gate, the secret-scan output (SC-007), the live-vs-actual-head verification (SC-001, FR-006 — including the demonstration that changing the live source changes the served result after the next ingestion), the no-change semantics demonstration (§2.5 — run recorded, anchor advanced, no new version), the consumer-consistency comparison (SC-003), the rollback demonstration (SC-005), and the PostgreSQL-layer verifications of §2.9, each mapped to the FR/SC it proves (cross-checked against `traceability.md`). Real ingestion evidence is class-2/class-3 (§3.2); the acceptance record cites it, it does not embed secrets or bulk raw payloads.

### 5.3 What acceptance does not confer

Passing every suite and completing the walkthrough is Stage C validation evidence for Agent Zero's **acceptance review** — the review that follows implementation. It does not retroactively constitute or substitute for the Gate 2 directive (which necessarily preceded the implementation, recorded by T001), does not grant implementation authority for the remaining six tools' migration, and does not confer any other authorization — those remain Agent Zero's explicit decisions (`implementation-authorization-boundary.md`; FR-030).

---

## 6. Coverage Summary

| Suite / verification | Primary requirements | Success criteria | Tasks | Test locus (`[EXT]` unless noted) |
|---|---|---|---|---|
| Envelope contract tests (C-ENV scenarios, v1.2.0 — incl. constituent `contractVersion`; scoped freshness fields) | FR-008, FR-009, FR-010 | SC-002 | T004 → T012, T014 | `src/data/__tests__/provenance-envelope.contract.test.ts` |
| Snapshot contract tests (C-SNAP-1..8, C-SNAP-10, v1.2.0; C-SNAP-9 → schema-compilation row) | FR-004, FR-005, FR-006, FR-013, FR-015, FR-016 | SC-001, SC-002 | T005 → T012, T014, T015 | `src/data/__tests__/snapshot-live.contract.test.ts` |
| Schema-compilation validation (URN `$id`s; cross-refs resolved; CI-runnable) | FR-008, FR-013 | SC-002 | T011 → T012 | `src/data/__tests__/contract-schema-compilation.test.ts` |
| Mode-confusion suite (incl. fixture-poisoning canary) | FR-011, FR-007, FR-009, FR-010 | SC-009, SC-002 | T006 → T016, T019 | `src/data/__tests__/mode-confusion.test.ts` |
| Determinism suite (stored-content boundary) | FR-014 | SC-006 | T007 → T015 | `src/data/__tests__/ingest-determinism.test.ts` |
| No-change semantics suite (anchor advances; no version churn) | FR-014, FR-015, FR-020 | SC-006 | T009 → T013, T015 | `src/data/__tests__/ingest-no-change.test.ts` |
| Freshness/anchor verification (2 h threshold; varying-field exhaustiveness) | FR-016 | SC-004 | T004, T005, T008 → T014 | within the envelope, snapshot, and failure-path suites |
| Failure-path suite (retrieval, validation, no-snapshot, PG-unavailable, atomicity) | FR-016, FR-017, FR-018, FR-003, FR-020 | SC-004 | T008 → T013, T014, T015 | `src/data/__tests__/ingest-failure-paths.test.ts` |
| Rollback suite | FR-019 | SC-005 | T010 → T016, T024 | `src/data/__tests__/rollback-fixture-mode.test.ts` |
| PostgreSQL layer (migrations apply; least-privilege roles; append-only runs; atomic publish) | FR-015, FR-020, FR-021, FR-024 | SC-004 | T013; exercised by T008, T009; evidenced at T026 | `supabase/migrations/*_centcom_*.sql` + §2.9 verifications |
| Consumer-consistency suite (both consumers through the same data service) | FR-001, FR-002, FR-010 | SC-003 | T020 (depends T017, T019) | `src/data/__tests__/consumer-consistency.test.ts` |
| Security verification (secret scan; audience; tool-level access; audit hygiene; rate limits) | FR-021, FR-022, FR-023, FR-024, FR-025, FR-026 | SC-007 | T021, T022, T023 | `src/server/mcp/auth.ts` tests; scan over bundles/results/logs/config incl. `supabase/functions/centcom-reconcile/` |
| Regression protection (Phase 1 baseline; six tools unaffected) | FR-004, FR-007 | SC-002 | T016, T019 (guarded by all suites) | existing dashboard suite (51/51 at `95c8e9c`; review baseline `49f05bb`) + §2.3 suite |
| Acceptance walkthrough | FR-006, FR-029, FR-030 | SC-001..SC-009 (checked in aggregate) | T026 (workspace-side record); T003 gate evidence | `quickstart.md` script; `records/acceptance-evidence.md` |

Persistence note: PostgreSQL is the operational system of record (root Article II; Agent Zero decision, 2026-07-23) — no suite may introduce a durable JSON/CSV snapshot file, object-store export, or any second datastore as a test convenience, and JSON remains limited to fixtures, tests, and transient exports. Should any suite's implementation surface a genuine need for a datastore beyond the mandated store — or for a separate PostgreSQL instance on isolation, capacity, compliance, or deployment grounds — that is the risk **R-07** escalation trigger and goes to Agent Zero before implementation. Broader risk coverage (provenance, mixed-mode, authentication versus authorization, data drift, CI dependency, rollback) is maintained in `risk-register.md`.

---

*Gated by the same constitutions as `plan.md`. Authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23). Approval of this strategy is a planning approval only (Stage A); no suite herein may be written or executed under WO-P2-AUTHOR-001 or WO-P2-AUTHOR-001-R1 — execution requires Agent Zero's explicit Gate 2 implementation directive (Stage B, recorded by T001) — see `implementation-authorization-boundary.md` and the tasks.md authoring-only banner.*
