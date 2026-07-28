# Gate 2 Readiness-to-Request Criteria: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 under **WO-P2-AUTHOR-001-R1**

**Deliverable**: 7 of 8 under work order **WO-P2-AUTHOR-001** (planning and authoring only; implementation authority not granted); revised under **WO-P2-AUTHOR-001-R1** (planning-artifact remediation responding to the independent review verdict of 2026-07-23)

**Governing references**: `spec.md` (FR-001..FR-030, SC-001..SC-009), `plan.md` (Constitution Check; MCP source binding), `tasks.md` (T001..T026), `risk-register.md`, `test-strategy.md`, `traceability.md`, `implementation-authorization-boundary.md`

**R1 revision note**: restructured per independent review Finding 2 (the Gate 2 sequence was circular). The 2026-07-22 revision mixed pre-implementation readiness checks with criteria that demanded implementation, drills, or acceptance evidence before Gate 2 — evidence only authorized implementation can produce. Every such criterion is removed or moved to Stage C (see Criterion Mapping below); every criterion that remains is satisfiable before any implementation exists. This revision changes no authorization state: planning approval is pending and Gate 2 has been neither requested nor granted.

## Purpose

This document defines the explicit, checkable criteria for when Gate 2 may be **requested**. It sits inside the canonical three-stage sequence (`implementation-authorization-boundary.md`):

1. **Stage A — Planning approval**: Agent Zero approves `spec.md` and `plan.md` (planning artifacts only; approval of a plan is not an instruction to execute it).
2. **Stage B — Gate 2**: Agent Zero issues the explicit implementation directive — **"Approved for implementation: <exact spec/plan>"**. **Gate 2 IS the implementation authorization**; task T001 records the directive verbatim in `records/implementation-authorization.md`.
3. **Stage C — Implementation → validation → acceptance review**: authorized `[EXT]` tasks execute; the `quickstart.md` acceptance walkthrough, drills, and acceptance evidence live here (T026).

The criteria below govern the transition from Stage A to the Stage B **request**: when all of them are satisfied, the feature is ready to ask Agent Zero for the Gate 2 directive — nothing more. They contain **only pre-implementation items**. No criterion requires, and none may be read as requiring, implementation, a drill, or acceptance evidence: requiring evidence that only authorized implementation can produce as a prerequisite to the directive that authorizes that implementation is the circularity the independent review struck down. The criteria exist so that the request for the Gate 2 directive is itself an evidence-backed claim, consistent with the workspace principle that local validation is evidence, GitHub CI is enforcement, and a PR description is neither.

## How to Read These Criteria

- Each criterion is a discrete, binary check: **satisfied** or **not satisfied**. There is no partial credit; any unsatisfied criterion blocks the Gate 2 request.
- Every criterion is a **pre-implementation** item: it can be satisfied entirely by planning artifacts, recorded decisions, workspace-side records, or design reviews. If reading a criterion appears to demand executed code, an executed drill, or acceptance evidence, that reading is wrong by construction — those belong to Stage C.
- **Required evidence** MUST be a public-repository-safe reference: a dated record in this feature folder's `records/` directory, a commit SHA, a workflow run URL, or a PR URL. Evidence MUST NOT contain credentials, tokens, private hostnames, or personal data (project constitution Article III; FR-024).
- **Verifier** names the party who confirms the criterion is satisfied at the readiness review. Where the evidence is an Agent Zero decision, Agent Zero is the source of the decision and the named verifier confirms the record exists, is dated, and says what the criterion requires.
- Roles: **Agent Zero** — approving authority; **Coordinator** — ChatGPT/Codex (also the independent reviewer); **Author** — Claude Code (WO-P2-AUTHOR-001 and WO-P2-AUTHOR-001-R1); **External CI owner** — VS Code/Codex (P2-PRE-2, **completed** under its own directive).

## Criteria Summary

| ID | Criterion (short form) | Primary references |
|----|------------------------|--------------------|
| G-01 | `spec.md` approved by Agent Zero (Stage A) | spec.md; implementation-authorization-boundary.md |
| G-02 | `plan.md` approved by Agent Zero (Stage A) | plan.md; implementation-authorization-boundary.md |
| G-03 | Agent Zero decisions recorded with dates | spec Q-002/Q-004/Q-005; FR-016; FR-020; FR-021; FR-027 |
| G-04 | P2-PRE-2 completed evidence recorded | T003; FR-029; SC-008 |
| G-05 | Article IV mirror created, registered, pinned | T002; plan.md Constitution Check; research.md R-3 |
| G-06 | MCP home binding validated or escalation resolved | plan.md (MCP source binding); tasks.md Notes |
| G-07 | PostgreSQL schema design and migration plan reviewed | data-model.md; plan.md; T013 |
| G-08 | Scope confirmation — exclusions untouched | WO-P2-AUTHOR-001 §7; FR-004; FR-029 |
| G-09 | Contract schemas compile with resolved references (workspace-side run — no [EXT] task) | contracts/; FR-008; T011 (Stage C CI counterpart only, never a Gate 2 dependency) |
| G-10 | Independent-review findings dispositioned | review verdict 2026-07-23; WO-P2-AUTHOR-001-R1 directive |

## Readiness Criteria

### G-01 — Specification approved (Stage A)

| Field | Content |
|---|---|
| **Criterion** | Agent Zero has explicitly approved `spec.md`, as remediated under WO-P2-AUTHOR-001-R1, as a planning artifact. This is Stage A planning approval only: per `implementation-authorization-boundary.md`, it grants no implementation authority and is not Gate 2. |
| **Required evidence** | A dated approval record in this feature folder's `records/` directory citing `spec.md` at the reviewed revision, capturing Agent Zero's approval statement as a safe reference. |
| **Verifier** | Coordinator confirms the record; Agent Zero is the source of the approval. |

### G-02 — Implementation plan approved (Stage A)

| Field | Content |
|---|---|
| **Criterion** | Agent Zero has explicitly approved `plan.md`, as remediated under WO-P2-AUTHOR-001-R1, including its Constitution Check outcomes (root Article II: PASS because PostgreSQL — the existing Supabase project's managed PostgreSQL — is the mandated relational store; root Article IV: mirror-only grounding route), its MCP source binding to the dashboard repository, and the recorded escalations (external-repo `[EXT]` task paths under Article III; the Article IV mirror-registration precondition). Stage A planning approval only; not Gate 2. |
| **Required evidence** | A dated approval record in `records/` citing `plan.md` at the reviewed revision and acknowledging the recorded escalations. |
| **Verifier** | Coordinator confirms the record; Agent Zero is the source of the approval. |

### G-03 — Agent Zero decisions recorded with dates

| Field | Content |
|---|---|
| **Criterion** | The four Agent Zero decisions of 2026-07-23 that this remediated package binds are each captured in a dated record: (1) **Persistence** — PostgreSQL is the operational system of record; JSON is limited to fixtures, tests, and transient exports (spec Q-002; FR-020). (2) **Freshness** — hourly scheduled reconciliation plus on-demand refresh; data is stale 2 hours after the freshness anchor (spec Q-005; FR-016). (3) **Serving posture** — public dashboard access only to explicitly public-class snapshot fields; MCP access stays OAuth-protected; no non-public collection migrates until authorization and revocation controls are operational and validated (spec Q-004; FR-021/FR-022). This decision also carries the FR-027 classification determination for the first slice: the snapshot fields (public repository identity, head SHA, latest commit title) are public-class. (4) **Article IV grounding** — a registered, pinned local mirror of the selected GitHub API/client source is required; no other grounding route is acceptable. |
| **Required evidence** | Dated decision records in `records/` (or the spec's Clarifications table entries confirmed as records), each stating the decision, its date (2026-07-23), and the requirement(s) it binds. |
| **Verifier** | Coordinator confirms each record exists, is dated, and matches the decision; Agent Zero is the source of every decision. |

### G-04 — P2-PRE-2 completed evidence recorded

| Field | Content |
|---|---|
| **Criterion** | The externally owned prerequisite **P2-PRE-2 — Dashboard CI and Merge Protection** is **COMPLETED AND OPERATIONAL** (2026-07-23), and its evidence is **recorded** in this feature's planning record per task T003, FR-029, and SC-008. This criterion records completed work — it does not await execution and requires no new implementation. The evidence to record: canonical command `npm run verify` (`format:check` → `lint --max-warnings 8` → `typecheck` → `test:ci` → `build` → `verify:generated`); workflows `.github/workflows/dashboard-ci.yml`, `dependency-audit.yml`, `dependency-review.yml` (actions pinned; checkouts hardened `persist-credentials: false`); required status **"Dashboard CI / required"** bound to job `required`; `main` ruleset Active; the deny/allow control-effectiveness proof on dashboard PR #14 (deliberate failure blocked; corrected change passed; commits `7d92f7d`, `658e4b3`, `9352c4c`); delivery via merged PRs #3 and #14; Dependabot operational (PRs #6/#7/#8). |
| **Required evidence** | `records/p2-pre-2-evidence.md` (T003) citing, as safe references, the workflow files, required-status configuration, and the PR/commit references for both the deny and the allow leg. |
| **Verifier** | Coordinator confirms the references resolve and show both legs; the External CI owner supplied the evidence but does not verify its own work. |

### G-05 — Article IV mirror created, registered, pinned

| Field | Content |
|---|---|
| **Criterion** | The root-constitution Article IV (Mirror-Check Mandate) obligation is discharged the only acceptable way: a **registered, pinned local mirror** of the selected GitHub API source — proposed: `github/rest-api-description`, GitHub's official REST API OpenAPI description — exists under `projects/governance-ops/reference/`, carries a Section 4 playbook registry row, and its pinned revision plus the dependent design decisions are recorded, per task T002. The source selection is ratified by Agent Zero (the G-03 Article IV decision names the mirror requirement; the concrete source ratification is recorded with it). Installed dashboard dependencies and REST response-shape tests are **not** sufficient grounding. This is a pre-implementation item because design grounding precedes authorized implementation: no GitHub-API-dependent implementation may be proposed or authorized before the mirror is registered. |
| **Required evidence** | The mirror at `projects/governance-ops/reference/github-rest-api-description/` with its recorded pinned revision, and the Section 4 registry row in `projects/governance-ops/knowledge/instructions.md`, cited by commit SHA. |
| **Verifier** | Author confirms the mirror and registry row exist and the pinned revision is recorded; Coordinator countersigns at the readiness review; Agent Zero is the source of the source-selection ratification. |

### G-06 — MCP home binding validated or escalation resolved

| Field | Content |
|---|---|
| **Criterion** | The MCP source binding recorded in `plan.md` — MCP endpoint at dashboard-repo `[EXT] src/routes/mcp.ts` with tool modules under `[EXT] src/server/mcp/`, sharing `[EXT] src/server/centcom-data/` with the dashboard — rests on a recorded assumption: the Lovable platform deploys repo-visible server-handler routes to the hosted endpoint (evidenced by the deployed `src/routes/sitemap[.]xml.ts` route in the same lineage) **and** the hosted `/mcp` path can be routed to repository code. This criterion requires that assumption to be resolved before Gate 2 is requested: **either** the deployability validation is confirmed and recorded (Lovable can deploy the MCP endpoint from repository-visible source), **or** — if the platform cannot — the separate-service-repository proposal has been escalated to Agent Zero and Agent Zero's resolution is recorded. Per `tasks.md`, that escalation is raised before planning approval, not after. |
| **Required evidence** | A dated validation record in `records/` stating what was validated and how (safe references only), or the escalation record together with Agent Zero's recorded resolution. |
| **Verifier** | Author records the validation or escalation; Coordinator confirms the record; Agent Zero resolves any escalation. |

### G-07 — PostgreSQL schema design and migration plan reviewed

| Field | Content |
|---|---|
| **Criterion** | The design of the dedicated non-public **`centcom`** application schema in the existing Supabase project's managed PostgreSQL — normalized snapshot content and versions, append-oriented ingestion runs with strictly increasing anchors, provenance, access-policy state, audit records, and the least-privilege roles (reconciliation writer; serving read-only) — and the source-controlled migration plan (`[EXT] supabase/migrations/*_centcom_*.sql`, task T013) have been reviewed as **designs** against `data-model.md` and `plan.md`. This is a design review only: no migration is applied and no database object is created before the Gate 2 directive (applying migrations is Stage C implementation). |
| **Required evidence** | A dated design-review record in `records/` citing `data-model.md` and `plan.md` at the reviewed revisions and stating the review outcome and any conditions. |
| **Verifier** | Coordinator performs and records the review; Agent Zero receives the outcome with the Gate 2 request. |

### G-08 — Scope confirmation: exclusions untouched

| Field | Content |
|---|---|
| **Criterion** | The WO-P2-AUTHOR-001 §7 scope exclusions remain untouched at the time of the Gate 2 request: the six non-migrated tools (`list_work_packages`, `get_work_package`, `list_defects`, `list_gates`, `list_decisions`, `get_metrics`) remain explicitly fixture-backed with unchanged data sources (FR-004/FR-007 — seven tools total, one migrates first, six remain); the eight accepted Fast Refresh warnings are unrefactored; and no P2-PRE-2 workflow, branch-protection, or ruleset work has been absorbed or re-performed within this feature's scope (FR-029 — P2-PRE-2 is completed and externally owned; this feature only records its evidence). |
| **Required evidence** | A dated scope-confirmation statement in the work-order handoff (or `records/`) affirming each exclusion, citing as safe references the SDD-Core head (`6994bf6`, re-verified 2026-07-23) and the dashboard pins (historical authoring pin `95c8e9c`; review baseline `49f05bb`, verified 2026-07-23) or their recorded successors at confirmation time. |
| **Verifier** | Author affirms; Coordinator independently confirms against the repository state; Agent Zero receives the confirmation in the handoff. |

### G-09 — Contract schemas compile with resolved references

| Field | Content |
|---|---|
| **Criterion** | The JSON Schemas embedded in this feature's contract documents compile under Ajv (or an equivalent validator) with every cross-reference resolved: the provenance-envelope schema (`$id` `urn:centcom:contract:provenance-envelope:1.2.0`) and the snapshot-collection schema (`$id` `urn:centcom:contract:snapshot-collection:1.2.0`) are both loaded, the snapshot schema's `$ref` to the envelope resolves **by URN**, and no `$ref` points to a `.md` file path or any other non-schema resource. This validates the planning artifacts themselves and is executable workspace-side without implementation authority. The CI-runnable schema-compilation suite (task T011, `[EXT]`) is this criterion's Stage C counterpart and is **not** required here. |
| **Required evidence** | A dated validation record in `records/` naming the validator and version, both schema `$id` URNs, and the compilation result — produced by a **workspace-side** compilation run against the contract-embedded schemas. No `[EXT]` task is involved: T011 (blocked on the Gate 2 directive like every `[EXT]` task) is the Stage C counterpart that encodes this same check as a persistent CI suite; it is never a prerequisite of this criterion. |
| **Verifier** | Author runs and records the validation; Coordinator confirms the record (the independent reviewer's own compilation check is the natural cross-check). |

### G-10 — Independent-review findings dispositioned

| Field | Content |
|---|---|
| **Criterion** | Every finding in the independent review verdict of 2026-07-23 — the five blocking findings and each additional required reconciliation item — carries a recorded disposition per the WO-P2-AUTHOR-001-R1 directive: accepted, modified, or disputed; the exact artifact and section changed; and any residual risk or open decision. Any finding not fixed is explicitly accepted as-is by Agent Zero with the acceptance recorded. No finding may be silently dropped, and no claim that findings "were all resolved" may exceed its scope: the internal authoring-time critic findings were resolved pre-handoff; the independent review's findings are addressed by the R1 revision and stand or fall at re-review. |
| **Required evidence** | A dated finding-by-finding disposition record in `records/` (or the R1 handoff), listing each finding, its disposition, and the artifact/section reference; plus the re-review outcome or Agent Zero's recorded acceptance for anything remaining. |
| **Verifier** | Coordinator (as independent reviewer) confirms every finding has a disposition; Agent Zero is the source of any acceptance-as-is. |

## Criterion Mapping (2026-07-22 → R1)

Renumbering record for reviewers of the previous revision. Removed criteria are removed **because they required implementation, drills, or acceptance evidence before the directive that would authorize producing it** (independent review Finding 2), or because the design they defended is retired.

| 2026-07-22 ID | R1 disposition |
|---|---|
| G-01, G-02 | Retained as **G-01**, **G-02** (Stage A framing made explicit). |
| G-03 (implementation authorization recorded verbatim) | **Removed as an entry criterion — circular.** The verbatim T001 record IS Gate 2 (Stage B), the outcome the request seeks; it can never be a prerequisite to requesting it. |
| G-04 (P2-PRE-2 evidence) | Retained as **G-04**, restated: P2-PRE-2 is completed and operational (2026-07-23); the criterion records evidence, it does not await delivery. |
| G-05 (Article IV grounding) | Retained as **G-05**, narrowed to the mirror-only route (Finding 4): the former alternatives — installed dependencies; response-shape tests — are struck. |
| G-06 (freshness ratification) | Folded into **G-03**: the decision is made (hourly + on-demand; stale after 2 h; 2026-07-23) and now only needs its dated record. |
| G-07 (access-policy / posture decision) | Folded into **G-03**: the serving-posture decision is made (2026-07-23) and now only needs its dated record. |
| G-08 (Article II — no durable-datastore need) | **Retired** (Finding 1). Article II is satisfied **by** PostgreSQL as the mandated relational store (plan.md Constitution Check; spec Q-002); the file-shaped snapshot-artifact position it defended is struck. |
| G-09 (data classification) | Folded into **G-03**: the Q-004 resolution classifies the first slice's snapshot fields as public-class and binds FR-027's clearance rule. |
| G-10 (rollback path defined and drill-able) | **Split.** The rollback *definition* remains a planning artifact (`contracts/snapshot-collection.md`; `test-strategy.md` rollback suite) approved under G-02. The rollback *drill* and its evidence are **Stage C acceptance** — `quickstart.md` Step 10 and the `test-strategy.md` rollback suite, recorded by T026 — and are no part of Gate 2 readiness. |
| G-11 (review findings resolved) | Retained as **G-10**, rescoped to the 2026-07-23 independent review verdict's finding-by-finding disposition. |
| G-12 (scope confirmation) | Retained as **G-08**. |
| *(new)* | **G-06** (MCP home binding — Finding 3), **G-07** (PostgreSQL schema design and migration plan review — Finding 1), **G-09** (schema compilation — Finding 5.5). |

All implementation, drill, and acceptance evidence formerly implied by this document — the rollback drill, failure drills, live-slice consistency evidence, merge-through-CI verification, and the acceptance walkthrough — lives in Stage C: `quickstart.md` (the acceptance script) and `test-strategy.md` (the suites), recorded by T026 after the Gate 2 directive.

## Satisfaction Means Ready to Request — Not Approved

Satisfying **all** of G-01 through G-10 means exactly one thing: the feature is ready to **request** the Gate 2 implementation directive. It is not Gate 2, and no agent may treat a fully satisfied checklist as implicit permission to begin or accept implementation. **Agent Zero's explicit directive — "Approved for implementation: <exact spec/plan>" — IS Gate 2 and is the only implementation authorization**; it is recorded verbatim per task T001, and until that record exists, implementation authority does not exist. This boundary restates, and is subordinate to, `implementation-authorization-boundary.md` (FR-030) and User Story 5 in `spec.md`: no green test, merged PR, working demo, approved artifact, or completed checklist substitutes for Agent Zero's explicit directive.

---

*Authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (planning-artifact remediation only). This document grants no implementation authority and requests none; it defines the evidence bar for requesting the Gate 2 directive described in the work-order handoff.*
