# Traceability: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 under **WO-P2-AUTHOR-001-R1**

**Work order**: WO-P2-AUTHOR-001 (authoring) and WO-P2-AUTHOR-001-R1 (remediation revision) — planning and authoring only; implementation authority not granted — see `implementation-authorization-boundary.md`

**Deliverable**: 4 of 8 — requirements-to-deliverables-to-tasks traceability mapping (Launch Packet WO-P2-AUTHOR-001 §6, item 4). This R1 revision also satisfies the R1 directive's deliverable 4 (updated requirements-to-plan-to-task-to-test traceability).

**Inputs traced**: Launch Packet WO-P2-AUTHOR-001 (`claude-code-phase-2-authoring-directive.md`) §4.1–§4.4, §5–§10 · Remediation directive WO-P2-AUTHOR-001-R1 (`claude-wo-p2-author-001-r1-remediation-directive.md`), required changes 1–12, applying the independent review verdict of 2026-07-23 · `spec.md` FR-001..FR-030, SC-001..SC-009 (R1 revision) · `plan.md` · `tasks.md` T001..T026 (R1 revision) · contract scenarios C-ENV-n (`contracts/provenance-envelope.md`, contract version 1.2.0) and C-SNAP-1..10 (`contracts/snapshot-collection.md`, contract version 1.2.0) · test suites named per `test-strategy.md` and `tasks.md`

**Accepted baseline** (recorded once per WO-P2-AUTHOR-001 §8; re-verified 2026-07-23 under R1; reused here): SDD-Core `main` `6994bf6` (re-verified 2026-07-23); dashboard `main` historical authoring pin `95c8e9c` (preserved as provenance); dashboard review baseline `49f05bb` (verified 2026-07-23, after P2-PRE-2 completion and subsequent merges); repair commit `42e94eb` (PR #2 merged); 51/51 tests, lint 0 errors + 8 accepted warnings at the authoring pin. P2-PRE-2 is **COMPLETED AND OPERATIONAL** (2026-07-23). Seven MCP tools total; one (`get_snapshot`) migrates to live first; six remain explicitly fixture-backed during the first slice. Six collections; five fixture-backed in the first slice (the work-packages collection serves two tools).

---

## Purpose and Method

This document proves three coverage claims and records their exceptions honestly:

1. **Directive coverage** — every obligation in the authorizing directive (WO-P2-AUTHOR-001) AND every required change in the remediation directive (WO-P2-AUTHOR-001-R1) maps to at least one functional requirement (FR) in `spec.md` and/or a named artifact/section in this feature folder (Table 1).
2. **Requirement coverage** — every FR-001..FR-030 maps to at least one task T001..T026 in `tasks.md` (R1 numbering) that implements or verifies it, and to at least one test scenario or evidence procedure that proves it (Table 2). No FR is unmapped.
3. **Success-criterion coverage** — every SC-001..SC-009 maps to the quickstart step or test suite that produces its acceptance evidence (Table 3).

A reverse index (Table 4) confirms no orphan tasks, the deliverables checklist (Table 5) maps directive §6 items 1–8 to the eight artifact files, and the Gaps register (Table 6) states, without concealment, everything that is only partially covered, deliberately deferred, or closed under R1 with the closing decision cited.

Test scenario notation: `C-ENV-n` = contract scenarios in `contracts/provenance-envelope.md` (contract version 1.2.0); `C-SNAP-n` = contract scenarios in `contracts/snapshot-collection.md` (contract version 1.2.0, C-SNAP-1..10); named suites (mode-confusion, determinism, failure-path, no-change, rollback, schema-compilation, consumer-consistency, secret-scan) are specified in `test-strategy.md` and carried by tasks T004–T011, T020, T022; the quickstart acceptance walkthrough is `quickstart.md`, executed by T026 in Stage C (post-Gate-2 validation and acceptance review).

Identifier note: Table 6 gap rows use `GAP-n` identifiers; zero-padded `G-0N` identifiers always refer to the readiness-to-request-Gate-2 criteria in `gate-2-entry-criteria.md`.

> Nothing in this mapping grants, implies, or requests implementation authority. Task IDs are cited as planned work only; no task in `tasks.md` is authorized for execution under WO-P2-AUTHOR-001 or WO-P2-AUTHOR-001-R1. Execution of `[EXT]` tasks requires Agent Zero's explicit Gate 2 implementation directive (Stage B), recorded verbatim by T001.

---

## Table 1 — Directive Obligation Coverage

Each obligation of Launch Packet WO-P2-AUTHOR-001 is assigned an ID (`D-<section>-<n>`) and mapped to the spec requirement(s) and/or artifact(s) that satisfy it. The R1 remediation directive's twelve required changes follow as `D-R1-1..12`.

### §4.1 First vertical slice

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-4.1-1 | Make `get_snapshot` the first live vertical slice | FR-004, FR-005; `contracts/snapshot-collection.md`; plan.md Summary |
| D-4.1-2 | Keep the remaining six tools explicitly fixture-backed during that slice | FR-004, FR-007; T016, T019 |
| D-4.1-3 | State the count unambiguously: seven tools total, one migrated first, six remaining | FR-004 (count mandated wherever migration state is described); spec.md Accepted Baseline State; plan.md Summary; this document's header |
| D-4.1-4 | Define acceptance criteria proving `get_snapshot` is sourced from validated GitHub content rather than fixtures | FR-005, FR-006; SC-001; `quickstart.md` verify-provenance and change-detection steps; mode-confusion suite fixture-poisoning canary (T006) |
| D-4.1-5 | Define rollback and failure behavior when GitHub data cannot be retrieved or validated | FR-018, FR-019; spec.md User Story 3; failure-path suite (T008), rollback suite (T010); `risk-register.md` (rollback risk) |

### §4.2 Provenance and authority contract

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-4.2-1 | Every result carries at minimum: `dataMode` (`fixture`\|`live`\|`mixed`), `authoritative`, source repository, source commit SHA (or dataset/fixture version when fixture), observation timestamp, schema/contract version, dataset/fixture version when applicable, and an explicit warning when the result cannot establish governance approval or project status | FR-008, FR-009; `contracts/provenance-envelope.md` (C-ENV scenarios, v1.2.0 — every constituent envelope carries `contractVersion`); T004, T012, T014 |
| D-4.2-2 | A mixed live/fixture state must never be presented as wholly live | FR-010; SC-002; spec.md User Story 2 scenario 2; T016, T017; mode-confusion suite (T006) |
| D-4.2-3 | Authority declared per result and, where necessary, per collection | FR-008, FR-010; `contracts/provenance-envelope.md` mixed-mode composition rules; `data-model.md` (Provenance Envelope, Collection entities) |

### §4.3 Validation and normalization

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-4.3-1 | Authoritative GitHub source paths | FR-012; `research.md` R-2; `contracts/snapshot-collection.md` §2 source enumeration; T015 |
| D-4.3-2 | Schemas and allowed status vocabularies | FR-013; `data-model.md`; `contracts/` (both files, v1.2.0); T012 |
| D-4.3-3 | Validation failures and error reporting | FR-003; T008, T012, T015; failure-path suite |
| D-4.3-4 | Normalization rules | FR-014; `contracts/snapshot-collection.md` §5; T015 |
| D-4.3-5 | Caching and freshness rules | FR-016 (bound to the ratified numbers — hourly scheduled + on-demand; stale after 2 h; Agent Zero decision 2026-07-23, spec Q-005); `contracts/snapshot-collection.md` §6; T014 (serving-time classification against the stored `last_verified_at` anchor) |
| D-4.3-6 | Commit pinning | FR-015; T015; C-SNAP scenarios (SHA-pinned snapshot version) |
| D-4.3-7 | Deterministic result construction | FR-014; SC-006 (narrowed under R1 to stored normalized snapshot content); T015; determinism suite (T007) |
| D-4.3-8 | Behavior for missing, malformed, stale, or contradictory source records | FR-017 (with FR-018 fallback ordering); spec.md Edge Cases; T008, T015 |
| D-4.3-9 | Test fixtures that prove live and fixture modes cannot be confused | FR-011; SC-009; `research.md` R-6; T006 (mode-confusion suite, fixture-poisoning canary) |

### §4.4 Security and operations

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-4.4-1 | Authentication versus authorization | FR-021; `research.md` R-5; T021; `risk-register.md` (authN-vs-authZ risk) |
| D-4.4-2 | Account eligibility and revocation | FR-021 (explicit user-access policy: eligibility, allowlist or role model, revocation); `data-model.md` (Access Policy entity); T013 (access-policy tables), T021 |
| D-4.4-3 | Tool-level access control | FR-022; T021 |
| D-4.4-4 | Token audience validation | FR-023; T021 |
| D-4.4-5 | Rate limits | FR-025; T023 |
| D-4.4-6 | Audit and invocation logging | FR-026; T025 |
| D-4.4-7 | Secret handling | FR-024; SC-007; T015 (server-side read-only token), T022 (secret-scan verification) |
| D-4.4-8 | Privacy and data classification | FR-027; spec.md Q-004 — **resolved** by Agent Zero's serving-posture decision (2026-07-23): public dashboard access limited to explicitly public-class snapshot fields; MCP access OAuth-protected; no non-public collection migrates until authorization and revocation controls are operational and validated (GAP-2 closed) |
| D-4.4-9 | Operational monitoring | FR-028; T025 |
| D-4.4-10 | Incident and rollback procedures | FR-028 (incident procedure), FR-019 (rollback path); T024 (runbook, workspace-side); `risk-register.md` |

### §5 External CI prerequisite (P2-PRE-2, owned by VS Code/Codex)

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-5-1 | Record P2-PRE-2 as an external prerequisite to accepting Phase 2 implementation code | FR-029 (restated under R1 as incorporating the **completed** evidence); spec.md Governing Context and Accepted Baseline State; `gate-2-entry-criteria.md` |
| D-5-2 | Identify the dependency in the Phase 2 plan and task graph | plan.md task-planning approach; tasks.md T003 + Dependencies section ("T002 and T003 are workspace-side readiness-to-request-Gate-2 items: both complete before Gate 2 is requested") |
| D-5-3 | Require evidence that the dashboard's GitHub CI gate is operational — the `Dashboard CI / required` status plus the deliberate deny/allow control-effectiveness test — before Phase 2 implementation is accepted | FR-029; SC-008; T003 (`records/p2-pre-2-evidence.md` — records the COMPLETED evidence: required status "Dashboard CI / required"; deny/allow proof on dashboard PR #14, commits `7d92f7d`/`658e4b3`/`9352c4c`; delivered via PRs #3 and #14); `gate-2-entry-criteria.md`; the Stage C merge-path check at acceptance (T026) |
| D-5-4 | Must NOT design the workflow, edit workflow files or package scripts, configure branch protection or rulesets, perform the pass/fail gate test, or absorb P2-PRE-2 into this scope | FR-029 ("no artifact in this feature may absorb or re-perform P2-PRE-2 work"); tasks.md Notes ("No task may weaken, bypass, or absorb P2-PRE-2; ... CI work remains externally owned"); no task in T001–T026 performs CI work — T003 records externally produced evidence only |
| D-5-5 | The governing lesson ("Local validation is evidence; GitHub CI is enforcement. A PR description is neither.") may be cited in risk or dependency sections | `risk-register.md` (CI-dependency risk); `gate-2-entry-criteria.md` |

### §6 Required deliverables

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-6-1..8 | Produce deliverables 1–8 | Table 5 (Deliverables Checklist), below |

### §7 Scope exclusions

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-7-1 | Do not implement or combine: P2-PRE-2 workflow work; Fast Refresh warning refactors; unrelated Phase 1 audit findings; UI redesign or feature expansion; `verify-layout` policy changes; live ingestion code; MCP server changes; deployments or repository governance changes | tasks.md Notes (exclusions restated; unchanged under R1); tasks.md authoring-only banner (no execution authorized); spec.md Q-003 (six-tool migration excluded from first slice); `implementation-authorization-boundary.md`; no artifact in this folder contains implementation code |

### §8 Repository-status check economy

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-8-1 | One lightweight default-branch head check at the start of the authoring activity; reuse that state; recheck only on defined triggers | spec.md Accepted Baseline State — head check performed 2026-07-22 (SDD-Core `6994bf6`, dashboard `95c8e9c`); re-verified 2026-07-23 under R1 (a defined trigger: the independent review baseline reconciliation), adding the dashboard review baseline `49f05bb` while preserving the historical authoring pin; all sibling artifacts reuse the recorded state |

### §9 Stop condition

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-9-1 | After producing the planning artifacts, stop and present for review; do not begin implementation, open a PR, or infer Gate 2 approval | FR-030 (three-stage model); `implementation-authorization-boundary.md`; tasks.md authoring-only banner and intentionally unchecked "Execution-ready" gate; T001 (the Gate 2 implementation directive must be recorded verbatim before any `[EXT]` task) |

### §10 Required handoff to the coordinator

| ID | Directive obligation | Satisfied by |
|---|---|---|
| D-10-1 | Return a self-contained handoff (work-order ID, repository/base commits, files authored, requirements-to-deliverables coverage summary, unresolved questions and risks, constitution/scope-check results, no-implementation confirmation, exact next approval requested) | The handoff is produced at work-order completion, outside this feature folder's eight §6 deliverables. This document supplies its requirements-to-deliverables coverage summary; plan.md Constitution Check supplies the constitution/scope results; `risk-register.md` and Table 6 supply the open questions and risks. See GAP-4. |

### WO-P2-AUTHOR-001-R1 §Required Changes (remediation directive, 2026-07-23)

Each of the R1 directive's twelve required changes, mapped to the artifact(s) and section(s) that implement it in the revised package.

| ID | R1 required change | Satisfied by |
|---|---|---|
| D-R1-1 | Replace operational JSON-file persistence with PostgreSQL as the authoritative Article-II-compliant datastore | FR-001, FR-015, FR-020; spec.md Q-002 (superseding answer, 2026-07-23) and Key Entities; plan.md Storage/Constitution Check (Article II); `data-model.md`; `contracts/snapshot-collection.md` §1 (Persistence); tasks.md T013 (dedicated non-public `centcom` schema, least-privilege roles) |
| D-R1-2 | Limit JSON to fixtures, tests, and transient exports | spec.md Assumptions and Q-002; `contracts/snapshot-collection.md` §1; tasks.md Notes ("No task produces a durable JSON/CSV snapshot file, object-store export, or any second datastore"); `test-strategy.md` test-data policy |
| D-R1-3 | Restore the canonical Gate 2 sequence (planning approval → Agent Zero's explicit Gate 2 implementation directive → implementation and validation) | spec.md User Story 5 and FR-030 (three-stage model); `implementation-authorization-boundary.md`; `gate-2-entry-criteria.md` (readiness-to-request-Gate-2 criteria; pre-implementation items only); tasks.md authoring-only banner, Phase 3.1 stage sequencing, T001; this document's boundary note and footer |
| D-R1-4 | Identify the actual MCP repository, runtime, deployment ownership, integration path, write scopes, and exact implementation file paths | plan.md (MCP source binding: dashboard repository, evidenced by the repo-visible server-handler route `src/routes/sitemap[.]xml.ts` in the same Lovable deployment lineage); tasks.md Path Conventions, Scope Rule (write scopes), Notes (recorded assumption + escalation path), T018/T019/T021 (`[EXT] src/routes/mcp.ts`, `[EXT] src/server/mcp/tools.ts`, `[EXT] src/server/mcp/auth.ts`); `contracts/snapshot-collection.md` §1 (Serving path); GAP-5 |
| D-R1-5 | Explain how the dashboard and MCP consume the same PostgreSQL-backed normalized source | FR-001, FR-002; `contracts/snapshot-collection.md` §1 (PostgreSQL → shared server-side data service → transient versioned response → dashboard/MCP); tasks.md T014 (shared service `[EXT] src/server/centcom-data/`), T016 (adapter hydration), T018 (MCP reads the same service); consumer-consistency suite (T020) |
| D-R1-6 | Require a registered, pinned local mirror of the selected GitHub API/client source under Article IV | spec.md Assumptions (mirror-only grounding; Agent Zero decision 2026-07-23); plan.md Constitution Check (Article IV — mirror-only route); tasks.md T002 (pinned mirror of `github/rest-api-description` under `projects/governance-ops/reference/`, Section 4 registry row); GAP-6 |
| D-R1-7 | Reconcile the no-change snapshot, freshness, determinism, contract-version, mixed-mode envelope, and JSON Schema contradictions | spec.md Edge Cases, FR-014/FR-015/FR-016, SC-006; `data-model.md` E-02/E-03/S-01; `contracts/snapshot-collection.md` §5 (one authoritative no-change rule), §6 (freshness anchor `last_verified_at`, 2 h threshold, scoped serving-time classification, exhaustive varying-field list); `contracts/provenance-envelope.md` v1.1.0 (required constituent `contractVersion`); tasks.md T004, T005, T007, T009; quickstart.md (the no-change acceptance step expects **no** new snapshot version) |
| D-R1-8 | Make every JSON Schema reference independently resolvable and add a schema-compilation validation step | `$id` URN scheme (`urn:centcom:contract:<name>:<version>`) in both contracts; `contracts/snapshot-collection.md` §3 (envelope `$ref` by URN, never a `.md` path) and scenario C-SNAP-9; tasks.md T011 (CI-runnable Ajv compilation); `test-strategy.md` schema-compilation layer |
| D-R1-9 | Incorporate completed P2-PRE-2 CI, ruleset, and deny/allow evidence | spec.md Accepted Baseline State (full evidence summary) and FR-029 (COMPLETED AND OPERATIONAL); tasks.md T003 (records, does not await); SC-008; D-5-3 above |
| D-R1-10 | Preserve dashboard commit `95c8e9c` as the historical authoring pin and record `49f05bb` as the review baseline | spec.md Accepted Baseline State (both rows); tasks.md `[EXT]` definition; this document's Accepted baseline line; D-8-1 above |
| D-R1-11 | Represent unresolved decisions, artifact status, planning approval, and Gate 2 status accurately | spec.md Status line ("Remediated under WO-P2-AUTHOR-001-R1 — awaiting independent review (planning approval pending; Gate 2 not requested)"); spec.md Q-004/Q-005 marked Resolved with the 2026-07-23 decisions and dates; spec.md checklist scope note (internal critic findings vs. independent review findings, precisely scoped); tasks.md R1 revision note ("changes no authorization state"); Table 6 below (open items kept open) |
| D-R1-12 | Provide a finding-by-finding disposition and revised handoff for independent review | The finding-by-finding disposition lives **in this feature folder** as `r1-finding-disposition.md` — an R1 addition alongside the eight original §6 artifacts. The revised handoff is returned at R1 work-order completion outside the folder (same pattern as D-10-1; see GAP-4). This document supplies the updated traceability the disposition cites (R1 deliverable 4). |

---

## Table 2 — FR-to-Task-to-Test Matrix

Every functional requirement, the task(s) that implement or verify it, and the test scenario(s) or evidence procedure that prove it. Task IDs and file paths match `tasks.md` (R1 revision) exactly; `[EXT]` marks external-dashboard-repo tasks executable only under Agent Zero's Gate 2 implementation directive (Stage B, recorded by T001).

| FR | Requirement (abbreviated) | Task(s) | Proving scenario(s) / evidence |
|---|---|---|---|
| FR-001 | Single normalized truth path: GitHub sources → validation/normalization → PostgreSQL system of record → shared data model → both consumers | T014, T016, T018 [EXT] | Consumer-consistency suite (T020, `consumer-consistency.test.ts`); quickstart serve + verify-provenance steps (T026) |
| FR-002 | No competing implementations, divergent normalization, or separate sources of truth | T014, T018 [EXT] (the MCP reads the same shared data service; no independent normalization path) | Consumer-consistency suite (T020); SC-003 evidence |
| FR-003 | Validation boundary rejects malformed/out-of-vocabulary content; failures recorded with collection, source, rule, revision | T012, T015 [EXT] | C-SNAP-1, C-SNAP-6 (T005); failure-path suite (T008, `ingest-failure-paths.test.ts`) — validation failure → reject + retain prior published snapshot + contextual error record |
| FR-004 | `get_snapshot` first and only migrated collection; six remain fixture-backed; count stated unambiguously (7 total / 1 first / 6 remaining) | T016, T018, T019 [EXT] | Mode-confusion suite (T006); C-ENV fixture-labeling scenarios (T004); C-SNAP-3, C-SNAP-7 (T005); quickstart walkthrough confirms per-tool modes (T026) |
| FR-005 | Live snapshot sourced from the governed repository's observable state — never hand-authored, never fixture-derived | T015 [EXT] (grounding precondition T002) | C-SNAP-2, C-SNAP-3 (T005); fixture-poisoning canary in mode-confusion suite (T006) |
| FR-006 | First-slice acceptance evidence: served SHA matches actual head at observation time; changing the source changes the served result | T026 (with T015, T018 [EXT] as producers) | Quickstart acceptance walkthrough — ingest → verify-provenance → change-detection steps; C-SNAP-2, C-SNAP-3; `records/acceptance-evidence.md` |
| FR-007 | Six non-migrated tools verifiably unchanged in data source; fixture provenance declared; modes cannot be confused | T019, T006 [EXT] | Mode-confusion suite (T006); C-ENV fixture-honesty / non-authority-warning scenarios (T004) |
| FR-008 | Every result carries the provenance envelope (dataMode, authoritative, source repository, source commit SHA or fixture version, observation timestamp, contract version — including `contractVersion` on every mixed-mode constituent envelope) | T012, T014 [EXT] | C-ENV scenarios via contract test T004 (`provenance-envelope.contract.test.ts`, envelope v1.2.0) |
| FR-009 | Explicit warning when governance approval/status cannot be established; fixture results declare `authoritative: false` | T014, T019 [EXT] | C-ENV warning-field scenarios (T004); mode-confusion suite (T006) |
| FR-010 | Mixed results declare `dataMode: mixed` with per-collection authority; never presented as wholly live at any surface | T014, T016, T017 [EXT] | C-ENV mixed-composition scenarios (T004); mode-confusion suite mixed-condition trials (T006); SC-002/SC-009 evidence |
| FR-011 | Test fixtures prove live and fixture modes cannot be confused; suite fails on any mislabeled surface | T006 [EXT] | Mode-confusion suite itself (`mode-confusion.test.ts`), including the fixture-poisoning canary (research.md R-6) |
| FR-012 | Authoritative source paths enumerated per migrated collection; content outside them cannot influence results | T015 [EXT] (enumeration defined in `contracts/snapshot-collection.md` §2, research.md R-2) | C-SNAP-1 (closure rule V-4, T005); quickstart ingest step (T026) |
| FR-013 | Allowed status vocabularies and record shapes per collection; out-of-vocabulary values fail validation, never coerced | T012 [EXT] | C-SNAP-1 vocabulary/shape-closure scenarios via contract test T005 (`snapshot-live.contract.test.ts`); C-SNAP-9 schema compilation (T011) |
| FR-014 | Deterministic normalization: byte-identical stored normalized snapshot content from same source at same revision under same contract version; observation metadata excluded | T015 [EXT] | Determinism suite (T007, `ingest-determinism.test.ts`); C-SNAP-8 (T009); SC-006 evidence |
| FR-015 | Snapshot pinned to source commit SHA(s); carries its own snapshot version in the PostgreSQL system of record; new version iff normalized content changes; consumers can identify the version read | T013, T015 [EXT] | C-SNAP-2, C-SNAP-3, C-SNAP-8 (T005/T009); quickstart verify-provenance step (T026) |
| FR-016 | Ratified freshness: hourly scheduled + on-demand; stale 2 h after the stored `last_verified_at` anchor; serving-time classification by the shared data service (the only permitted serving-time clock use); staleness disclosure; never stale-as-fresh | T014 [EXT] (classification), T015 [EXT] (anchor-advancing runs) | C-SNAP-4 (T005); C-ENV staleness scenarios (T004); failure-path suite staleness cases (T008) |
| FR-017 | Per-collection policy for missing/malformed/stale/contradictory records (reject / quarantine-with-disclosure / last-known-good-with-disclosure); silence not permitted | T013, T015 [EXT] (policies fixed in `contracts/snapshot-collection.md` §8 before migration) | Failure-path suite (T008); C-SNAP-5, C-SNAP-6, C-SNAP-10 |
| FR-018 | On retrieval/validation failure: serve last validated snapshot with staleness disclosure; else labeled fixture; never unvalidated live, blank, or unlabeled fallback | T014, T015, T016 [EXT] | Failure-path suite (T008): retrieval failure → last-known-good + disclosure; no-snapshot → labeled fixture fallback; PostgreSQL-unavailable → bundled fixture with full fixture labeling (contract §8 P-3a); mid-ingestion read → prior published snapshot only; C-SNAP-5..7, C-SNAP-10; quickstart simulate-failure step (T026) |
| FR-019 | Directed rollback to fixture-only as a single governed reversion, correctly labeled, no data repair | T016 [EXT]; T024 (runbook, workspace-side) | Rollback suite (T010, `rollback-fixture-mode.test.ts`); mode-confusion suite passing in fixture-only configuration (T006); quickstart rollback step (T026); SC-005 evidence |
| FR-020 | Append-oriented ingestion record of all outcomes (published, validation failure, retrieval failure, no-change) in PostgreSQL, monotonic anchors, reconstructable | T013, T015 [EXT] (tables + writer); T025 [EXT] (surfacing) | No-change semantics test (T009, `ingest-no-change.test.ts`); failure-path outcome-recording assertions (T008); C-SNAP-8; quickstart audit trace in verify-provenance step (T026) |
| FR-021 | Authentication distinct from authorization; explicit user-access policy (eligibility, allowlist/role, revocation) enforced before non-public data — or live data beyond the public-class snapshot fields cleared under Q-004/FR-027 — is exposed | T013 (access-policy tables), T021 [EXT] | Security-controls verification per `test-strategy.md`; acceptance evidence in T026 (see GAP-1) |
| FR-022 | Tool-level access control enforceable per MCP tool | T021 [EXT] | Security-controls verification per `test-strategy.md`; acceptance evidence (T026) (see GAP-1) |
| FR-023 | Token audience validation: wrong-audience tokens rejected even if otherwise valid | T021 [EXT] | Security-controls verification per `test-strategy.md`; acceptance evidence (T026) (see GAP-1) |
| FR-024 | Credentials server-side only, read-only, minimal scope; never in client code, storage, URLs, logs, errors, config, or results | T015, T022 [EXT] | Secret-scan verification over client-reachable/committed surfaces (T022) plus inspection of the Edge Function's environment/secret handling (required server-side secrets excluded from the zero count — quickstart Step 14.1); SC-007 inspection + automated scan at acceptance (T026) |
| FR-025 | Rate limits on MCP invocation; ingestion respects source limits with backoff; exhaustion degrades per FR-018 | T023 [EXT] | Failure-path degradation behavior (T008 covers the FR-018 degradation path); rate-limit verification per `test-strategy.md`; C-SNAP-5; acceptance evidence (T026) |
| FR-026 | Auditable invocation log (who, which tool, when) without secrets or token contents | T025 [EXT] | Audit-log inspection in quickstart walkthrough (T026); secret-scan verification confirms no secret material in logs (T022) |
| FR-027 | Data classification declared per collection before migration; serving posture decided | T017, T021 [EXT] (enforcement); posture **decided** by Agent Zero 2026-07-23 (spec Q-004: public-class snapshot fields only on the public dashboard; MCP OAuth-protected; non-public collections gated on operational, validated authorization/revocation controls); classification recorded in `contracts/snapshot-collection.md` §2 | Readiness-to-request-Gate-2 check (`gate-2-entry-criteria.md`); classification record reviewed at T026 |
| FR-028 | Monitoring of ingestion health (last successful run / `last_verified_at`, failure streak, staleness) and serving health; incident procedure for source compromise, credential leak, mislabeled data — each with FR-019 rollback path | T024 (runbook); T025 [EXT] (monitoring) | Runbook review + register row (T024); monitoring-signal verification in quickstart walkthrough (T026) |
| FR-029 | P2-PRE-2 CI gate COMPLETED AND OPERATIONAL (2026-07-23), incl. deny/allow control-effectiveness test; evidence incorporated, not awaited; Stage C implementation merges through that gate; never absorbed | T003 (`records/p2-pre-2-evidence.md`) | Recorded completed evidence (workflows, required status, ruleset, PR #14 deny/allow legs, PRs #3/#14) verified against `gate-2-entry-criteria.md`; SC-008; Stage C merge-path check (T026) |
| FR-030 | Planning artifacts are not implementation authority; three-stage model — Stage A planning approval, Stage B Gate 2 implementation directive (Gate 2 IS the authorization), Stage C validation/acceptance | T001 (`records/implementation-authorization.md`) | Artifact review per spec.md User Story 5 independent test; `implementation-authorization-boundary.md`; readiness-to-request-Gate-2 criteria contain only pre-implementation items (`gate-2-entry-criteria.md`) |

**Coverage assertion**: all 30 functional requirements are mapped to at least one task and at least one proving scenario or evidence procedure. Partial or process-only proofs are declared in Table 6, not hidden.

---

## Table 3 — SC-to-Evidence Matrix

Every success criterion and the quickstart step or test suite that produces its acceptance evidence. All evidence is assembled by T026 (Stage C) into `records/acceptance-evidence.md` as safe references.

| SC | Criterion (abbreviated) | Evidence producer |
|---|---|---|
| SC-001 | Served live SHA matches the governed repository's actual head at observation time — 100% of live results, retroactively verifiable | Quickstart verify-provenance and change-detection steps (T026): follow envelope → ingestion run record in PostgreSQL → resolve SHA in `hanax-ai/sdd-core`; C-SNAP-2, C-SNAP-3 (T005) |
| SC-002 | 100% envelope coverage across all seven tools; 0 mislabeled or warning-omitting results during the first slice | Contract test T004 (C-ENV scenarios, envelope v1.2.0) run against all seven tools; mode-confusion suite (T006); C-SNAP-1, C-SNAP-7, C-SNAP-9 |
| SC-003 | Dashboard and MCP outputs identical for same collection at same snapshot version — 0 divergence | Consumer-consistency suite (T020, `consumer-consistency.test.ts`); quickstart serve-and-compare step (T026) |
| SC-004 | Under simulated source/validation failure: 100% well-formed, correctly labeled results; 0 blanks, crashes, unlabeled fallbacks | Failure-path suite (T008, incl. the PostgreSQL-unavailable case); C-SNAP-4..6, C-SNAP-10; quickstart simulate-failure step (T026) |
| SC-005 | Rollback to fixture-only completes as a single governed action; all surfaces correctly labeled | Rollback suite (T010) plus the mode-confusion suite (T006) passing in fixture-only configuration; C-SNAP-7; quickstart rollback step (T026) |
| SC-006 | Re-running normalization on the same recorded revision under the same contract version reproduces the **normalized snapshot content** byte-identically — 100% of sampled versions; observation metadata excluded; determinism inputs = source content @ pinned revision + contract version + normalization rules | Determinism suite (T007, `ingest-determinism.test.ts`); no-change semantics test (T009) confirms metadata advances without content change |
| SC-007 | 0 credentials/tokens/secret material in client bundles, MCP results, logs, or committed configuration | Secret-scan verification (T022) + manual inspection at acceptance (T026) |
| SC-008 | P2-PRE-2's `Dashboard CI / required` status and deny/allow control-effectiveness evidence recorded (COMPLETED, 2026-07-23 — a readiness-to-request-Gate-2 item); Stage C implementation not accepted unless it merged through that operational gate | T003 evidence record (`records/p2-pre-2-evidence.md`) checked as a readiness-to-request-Gate-2 criterion (`gate-2-entry-criteria.md`); the merge-path verification is a Stage C acceptance check at T026 — process evidence, not a test suite |
| SC-009 | An agent given only a tool result classifies mode and authority correctly in 100% of trials — all seven tools, live/fixture/stale/mixed | Mode-confusion suite (T006): classification-from-result-alone trials across all four conditions |

---

## Table 4 — Reverse Index (Task → Requirements)

Confirms every task serves at least one requirement or governance obligation; no orphan tasks exist. Task numbering per `tasks.md` (R1 revision).

| Task | Serves |
|---|---|
| T001 | FR-030; Stage B record of the Gate 2 implementation directive (verbatim); directive §9 (stop condition); D-R1-3 |
| T002 | Root Article IV Mirror-Check Mandate (pinned mirror of `github/rest-api-description`; plan.md Constitution Check); grounds FR-005/FR-012 implementation; D-R1-6 |
| T003 | FR-029; SC-008; directive §5; D-R1-9 (records the completed P2-PRE-2 evidence) |
| T004 [EXT] | FR-008, FR-009, FR-010, FR-016 (envelope v1.2.0 contract proof via C-ENV scenarios, incl. constituent `contractVersion` and the scoped serving-time freshness rule) |
| T005 [EXT] | FR-004, FR-005, FR-013, FR-015, FR-016 (snapshot v1.2.0 contract proof via C-SNAP-1..8 and C-SNAP-10) |
| T006 [EXT] | FR-007, FR-010, FR-011; SC-002, SC-009 |
| T007 [EXT] | FR-014; SC-006 |
| T008 [EXT] | FR-003, FR-016, FR-017, FR-018, FR-020; SC-004 |
| T009 [EXT] | FR-014, FR-015, FR-020 (no-change semantics: outcome `no-change`, no new version, anchor advance — C-SNAP-8; data-model E-02/E-03/S-01); D-R1-7 |
| T010 [EXT] | FR-019; SC-005 |
| T011 [EXT] | FR-013; SC-002 (schema-compilation validation: `$id` URN registration, cross-reference resolution, zero `.md`-path `$ref`s — C-SNAP-9); D-R1-8 |
| T012 [EXT] | FR-003, FR-008, FR-013 (contract schemas v1.2.0 in the shared validation seam, `$id` URNs) |
| T013 [EXT] | FR-015, FR-017, FR-020 (PostgreSQL `centcom` schema: snapshot versions, monotonic ingestion runs, provenance, audit); FR-021 (access-policy state); least-privilege roles; D-R1-1 |
| T014 [EXT] | FR-001, FR-002, FR-008, FR-009, FR-010, FR-016, FR-018 (shared server-side data service; serving-time staleness classification; transient versioned response); D-R1-5 |
| T015 [EXT] | FR-003, FR-005, FR-012, FR-014, FR-015, FR-017, FR-018, FR-020, FR-024 (ingestion operation + reconciliation Edge Function + Supabase Cron; publish-iff-content-changed; one operation for scheduled and on-demand runs) |
| T016 [EXT] | FR-004, FR-010, FR-018, FR-019 (adapter hydration from the transient response; fixture pinning for the six) |
| T017 [EXT] | FR-008, FR-010, FR-027 (dashboard surfaces; public-class-fields-only posture per Agent Zero decision 2026-07-23) |
| T018 [EXT] | FR-001, FR-002, FR-004 (MCP endpoint route + live `get_snapshot` from the shared service); D-R1-4 |
| T019 [EXT] | FR-004, FR-007, FR-009 |
| T020 [EXT] | FR-001, FR-002; SC-003 |
| T021 [EXT] | FR-021, FR-022, FR-023; FR-027 (enforcement; non-public collections gated on operational, validated controls) |
| T022 [EXT] | FR-024; SC-007 |
| T023 [EXT] | FR-025 |
| T024 | FR-019, FR-028 (runbook + register row; workspace-side) |
| T025 [EXT] | FR-020, FR-026, FR-028 |
| T026 | FR-006, FR-029, FR-030 checks (Stage C); assembles evidence for SC-001..SC-009 |

---

## Table 5 — Deliverables Checklist (Directive §6, items 1–8)

| # | Directive §6 deliverable | Artifact file |
|---|---|---|
| 1 | Phase 2 operational-capability specification | `spec.md` |
| 2 | Phase 2 implementation plan | `plan.md` (with Phase 0/1 supporting outputs: `research.md`, `data-model.md`, `contracts/provenance-envelope.md` v1.2.0, `contracts/snapshot-collection.md` v1.2.0, `quickstart.md`) |
| 3 | Phase 2 task breakdown with dependencies and acceptance criteria | `tasks.md` |
| 4 | Requirements-to-tasks traceability mapping | `traceability.md` (this document) |
| 5 | Risk register covering provenance, mixed fixture/live results, authentication versus authorization, data drift, CI dependency, and rollback | `risk-register.md` |
| 6 | Test and validation strategy | `test-strategy.md` |
| 7 | Explicit Gate 2 entry criteria | `gate-2-entry-criteria.md` (restated under R1 as **readiness-to-request-Gate-2** criteria — pre-implementation items only; Gate 2 itself is Agent Zero's implementation directive, Stage B) |
| 8 | Implementation-authorization boundary statement | `implementation-authorization-boundary.md` |

All eight deliverables were revised under WO-P2-AUTHOR-001-R1 (2026-07-23). In addition, `r1-finding-disposition.md` is an in-folder R1 artifact (R1 deliverable 2 — see D-R1-12 and GAP-4) beyond the eight §6 deliverables mapped above. Completeness of the full artifact set is confirmed in the work-order handoff (directive §10; R1 deliverable 3), which lists the files actually authored and revised; this checklist records the required mapping.

---

## Table 6 — Gaps and Partial Coverage (declared honestly)

Status column added under R1: **Open**, **Open (by design)**, or **Closed** with the closing decision cited. Closed rows are retained for the record, not deleted.

| ID | Gap / partial coverage | Disposition | Status |
|---|---|---|---|
| GAP-1 | **FR-021/FR-022/FR-023 (security controls) have no dedicated automated test task in tasks.md Phase 3.2.** They are implemented by T021 (backed by T013's access-policy tables) and verified through the security-controls verification defined in `test-strategy.md` plus acceptance-time evidence assembled by T026 — not by a pre-written failing test suite like the data-path requirements. | Acceptable for planning: the controls are environment- and deployment-dependent, and their concrete verification procedure is specified in `test-strategy.md`. If Agent Zero requires an automated pre-implementation suite for these controls, a task should be added ahead of T021 at the Gate 2 directive (Stage B). | Open |
| GAP-2 | **FR-027's public/anonymous serving-posture decision was escalated at R0.** | **Closed** by Agent Zero's serving-posture decision (2026-07-23; spec Q-004): public dashboard access limited to explicitly public-class snapshot fields; MCP access remains OAuth-protected; no non-public collection migrates until authorization and revocation controls are operational and validated. Bound in FR-021/FR-022/FR-027 and enforced by T017/T021. | Closed (2026-07-23) |
| GAP-3 | **FR-016's cadence and staleness numbers were proposed, not fixed, at R0.** | **Closed** by Agent Zero's freshness decision (2026-07-23; spec Q-005): hourly scheduled reconciliation plus on-demand refresh; stale 2 hours after the stored `last_verified_at` anchor. Bound at requirement level in FR-016 and at contract level in `contracts/snapshot-collection.md` §6; carried by T014/T015. | Closed (2026-07-23) |
| GAP-4 | **Directive §10 (handoff) and R1 deliverable 3 (revised handoff) are satisfied by process, not by an artifact in this folder.** The handoff is returned at work-order completion. R1 deliverable 2 (the finding-by-finding disposition) is satisfied **in-folder** by `r1-finding-disposition.md`; this document supplies the coverage summary and updated traceability. | By design for the handoff — the directive requires it as a return to the coordinator, not a feature-folder deliverable. The disposition is an in-folder R1 artifact. | Open (by design; disposition portion satisfied in-folder) |
| GAP-5 | **The R0 package cited the MCP locus by placeholder; R1 binds it to exact dashboard-repo paths** (`[EXT] src/routes/mcp.ts`, `[EXT] src/server/mcp/tools.ts`, `[EXT] src/server/mcp/auth.ts`, shared service `[EXT] src/server/centcom-data/`, migrations `[EXT] supabase/migrations/*_centcom_*.sql`, Edge Function `[EXT] supabase/functions/centcom-reconcile/index.ts`), evidenced by the repo-visible server-handler route already deployed through the same Lovable lineage (`src/routes/sitemap[.]xml.ts`). **Residual open item**: the recorded assumption that the Lovable platform can route the hosted `/mcp` path to repository-visible source is not yet validated. | Placeholder gap closed by the plan.md/tasks.md source binding (D-R1-4). Validating platform deployability is an explicit readiness-to-request-Gate-2 item (`gate-2-entry-criteria.md`; tasks.md Notes); if the platform cannot deploy the MCP from repository-visible source, a separate service repository is proposed and escalated to Agent Zero BEFORE planning approval. | Open (deployability validation) |
| GAP-6 | **T002 (Article IV grounding) blocks T015 and every GitHub-API-dependent design decision; the mirror source is selected but not yet ratified or registered.** R1 narrows grounding to the mirror-only route (Agent Zero decision, 2026-07-23): the former alternatives (installed dependencies; REST response-shape tests) are struck as insufficient. Proposed source: a pinned mirror of `github/rest-api-description` (GitHub's official REST API OpenAPI description) under `projects/governance-ops/reference/`, with a Section 4 registry row and the pinned revision recorded. | Selection requires Agent Zero ratification; T002 then creates and registers the mirror. Grounding completes BEFORE dependent implementation is proposed or authorized; carried as a readiness-to-request-Gate-2 item. | Open (mirror-source ratification) |

---

*Traceability authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23). This mapping demonstrates coverage of planned work only; it does not certify execution, and no cited task is authorized to run. The three-stage boundary holds throughout: Stage A planning approval is pending; Stage B — Agent Zero's explicit Gate 2 implementation directive, which IS the implementation authorization — has been neither requested nor granted; Stage C validation and acceptance evidence (including T026) follows the Gate 2 directive and is never a prerequisite to it. Readiness to request Gate 2 is defined by `gate-2-entry-criteria.md`; the full sequence is stated in `implementation-authorization-boundary.md`. Recorded P2-PRE-2 evidence (FR-029, SC-008) is COMPLETED AND OPERATIONAL and is incorporated, not awaited.*
