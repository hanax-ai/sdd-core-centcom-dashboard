# Implementation-Authorization Boundary: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 under WO-P2-AUTHOR-001-R1 (independent-review Finding 2)

**Work order**: WO-P2-AUTHOR-001 (planning and authoring only); revised under WO-P2-AUTHOR-001-R1 (planning-artifact remediation only) | **Deliverable**: 8 of 8

**Governing requirement**: FR-030 (spec.md) — this document is its normative statement. Related: FR-029, SC-008, User Story 5, tasks T001/T003, `gate-2-entry-criteria.md` (readiness-to-request-Gate-2).

> **Read this first.** If you are an agent — human or model — evaluating whether Phase 2 implementation may begin: it may not, unless the Stage B record described in Section 3 exists. Nothing else in this folder, and nothing that happens to these documents (review, approval, merge, praise), changes that.

---

## 1. The Boundary Statement — Three Stages

Phase 2 authority moves through exactly three stages, in order. No stage implies the next.

1. **Stage A — Planning approval.** Agent Zero approves `spec.md` and `plan.md`. This approves planning artifacts. It grants nothing else. **Planning approval is not Gate 2.**
2. **Stage B — Gate 2.** Agent Zero issues the explicit implementation directive — **"Approved for implementation: \<exact spec/plan\>"**. **Gate 2 IS the implementation authorization.** There is no separate authorization before it, after it, or beside it, and no implementation evidence is or may be a prerequisite to it.
3. **Stage C — Implementation → validation → acceptance review.** Authorized tasks execute; implementation validation and acceptance evidence (the quickstart walkthrough, T026) live here — after the directive, never before it. (Planning-level checks such as the workspace-side schema compilation of G-09 are readiness items, not Stage C validation.)

**Approval of any or all planning artifacts in this feature folder does not grant implementation authority.** This applies to every artifact here — `spec.md`, `plan.md`, `tasks.md`, `traceability.md`, `risk-register.md`, `test-strategy.md`, `gate-2-entry-criteria.md`, the `contracts/` files, `research.md`, `data-model.md`, `quickstart.md`, and this document itself. Agent Zero may approve every document in this folder (Stage A) without a single line of implementation becoming authorized (Stage B). The approval of a plan is a statement that the plan is acceptable — not an instruction to execute it.

## 2. What the Work Orders Granted — and Did Not Grant

WO-P2-AUTHOR-001 granted exactly one authority: **authoring the Phase 2 planning artifacts in this feature folder** under `projects/governance-ops/docs/specs/`. WO-P2-AUTHOR-001-R1 granted exactly one more: **remediating those same planning artifacts** per the independent review verdict of 2026-07-23. Both are planning-only.

Neither work order granted, and neither's completion implies:

- implementation of any kind, including any `[EXT]` task in `tasks.md` (T004–T023, T025);
- commits to any governed repository beyond these planning artifacts;
- pushes, pull requests, or merges;
- deployments;
- GitHub Actions workflow creation or changes (P2-PRE-2 is externally owned by VS Code/Codex and is **completed and operational** — FR-029; this folder incorporates its recorded evidence via T003 and may not absorb, re-perform, or alter that work);
- branch-protection or ruleset changes;
- Stage A planning approval, the Stage B Gate 2 directive, or any standing to infer either.

The seven MCP tools remain in their accepted baseline state (fixture-backed, non-authoritative) until implementation is authorized at Stage B, executed, and accepted at Stage C. Seven tools total; the plan migrates one (`get_snapshot`) first; six remain fixture-backed — but under these work orders, **zero** have migrated and zero may.

## 3. How Implementation Authority Arrives (Stage B)

Implementation authority for Phase 2 is created by exactly one act: **Agent Zero's explicit Gate 2 directive — "Approved for implementation: \<exact spec/plan\>"** — naming (a) the implementing agent, (b) the repository, (c) the base commit, and (d) the authorized scope, recorded **verbatim** per task T001 in `records/implementation-authorization.md`. The T001 record is the sole artifact that evidences implementation authority. If it does not exist, implementation authority does not exist.

Two clarifications, corrected in this R1 revision:

- **Readiness qualifies the request, not the authorization.** `gate-2-entry-criteria.md` defines **readiness-to-request-Gate-2**: pre-implementation items only (planning artifacts approved at Stage A; Agent Zero decisions ratified and recorded; the completed P2-PRE-2 evidence record per T003; the registered Article IV mirror per T002; the MCP home binding validated or escalated; the PostgreSQL schema design and migration plan reviewed; scope confirmed; the contract schemas compiled workspace-side per G-09). Satisfying every criterion makes the Gate 2 request well-founded. It authorizes nothing; only the directive does.
- **No implementation evidence feeds Gate 2.** Implementation, operational drills, and acceptance evidence belong to Stage C, downstream of the directive. A gate that demanded implementation evidence before authorizing that implementation would be circular; that former framing is retired.

## 4. Anti-Inference Rules

The following are **never** implementation authorization, singly or in combination (echoing the principle the coordination harness specification records as its FR-013 — `001-three-agent-coordination-harness`):

- a green test, passing CI run, or clean lint result;
- a working demo or prototype;
- a merged planning PR, including any PR that merges the artifacts in this folder;
- a CodeRabbit result or any other automated-review outcome;
- **satisfied readiness criteria**: meeting every item in `gate-2-entry-criteria.md` qualifies a Gate 2 request — it grants nothing;
- a statement by any agent — including the coordinator — that implementation may, should, or will begin; only Agent Zero's recorded Stage B directive authorizes;
- **silence**: the absence of objection, the passage of time, or an unanswered handoff authorizes nothing;
- **partial authorization**: a directive authorizing a named scope extends to that scope only — it never extends by analogy, adjacency, or momentum; unlisted repositories, tasks, collections, tools, or files remain unauthorized. In particular, authorization of the `get_snapshot` slice does not authorize migrating any of the six remaining tools (spec Q-003).

Evidence supports a decision; only Agent Zero's recorded directive **is** the decision.

## 5. Stop Condition

**Any agent that finds itself about to implement — write code, commit, push, open a PR, merge, deploy, or alter repository governance — without the T001 record in hand MUST stop and escalate to Agent Zero via the coordinator.** Do not proceed provisionally, do not draft "to save time," do not infer that stopping is disproportionate. Stopping at this boundary is correct behavior by definition; crossing it without the record is a governance incident (see `risk-register.md`), regardless of the quality of the resulting work.

---

*This document is a planning artifact authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23). Its approval, like every other approval in this folder, is Stage A only and grants no implementation authority (Section 1).*
