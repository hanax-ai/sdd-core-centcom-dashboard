# Finding-by-Finding Disposition — WO-P2-AUTHOR-001-R1

**Feature**: `002-centcom-phase-2-live-github-ingestion`
**Review dispositioned**: `claude-phase-2-independent-review-verdict-2026-07-23.md` (ChatGPT/Codex, 2026-07-23)
**Remediation authority**: WO-P2-AUTHOR-001-R1 (planning-artifact remediation only)
**Date**: 2026-07-23
**Status of this record**: work-order return for independent re-review. It grants and claims no approval; planning approval is pending and Gate 2 has been neither requested nor granted.

Each disposition states: status (Accepted / Accepted-with-modification / Disputed), the artifact and section changed, the resolution, and residual risk or open decisions.

---

## Blocking Finding 1 — Root Article II Violation

**Status**: Accepted.

**Changes**:
- `spec.md` — Q-002 rewritten (design-avoidance answer superseded; PostgreSQL named per Agent Zero decision); FR-001, FR-015, FR-020, Key Entities (Validated Snapshot, Ingestion Record) re-homed to the PostgreSQL system of record; Assumptions updated (existing Supabase project; dedicated non-public `centcom` schema).
- `plan.md` — Summary, Technical Context (Storage), Constitution Check Article II ("PASS because PostgreSQL is the mandated relational store"; design-avoidance argument retired), Project Structure (migrations under `[EXT] supabase/migrations/`).
- `data-model.md` — persistence rule in Modeling Conventions; E-03 (snapshots relation), E-08 (`ingestion_runs`, append-only), access-policy and audit records per REM-1.
- `contracts/snapshot-collection.md` §1; `research.md` R-1 (former artifact stance recorded as superseded alternative); `tasks.md` T013 (source-controlled migrations) and replacement of all artifact-writer tasks; `risk-register.md` R-07 (RESOLVED by decision; replaced by schema/migration-discipline monitoring).

**Resolution**: PostgreSQL (existing Supabase project, dedicated non-public `centcom` schema, source-controlled migrations, least-privilege roles, auditability) is the operational system of record for snapshots, ingestion runs, provenance, access-policy state, and audit records. JSON is confined to fixtures, tests, and transient exports; no file-shaped durable store remains anywhere as current design. Qdrant not introduced.

**Residual**: Supabase single-project coupling (OAuth + data + scheduling) recorded as a risk with the pre-approved separate-instance escalation path (`risk-register.md`).

## Blocking Finding 2 — Gate 2 Sequence Is Circular

**Status**: Accepted.

**Changes**:
- `gate-2-entry-criteria.md` — fully restructured as readiness-to-REQUEST-Gate-2 criteria containing only pre-implementation items; the circular G-03 removed; the rollback-drill criterion split (definition = planning; drill = Stage C acceptance); a Criterion Mapping table records every old criterion's fate.
- `implementation-authorization-boundary.md` — restated on the canonical three-stage model: Stage A planning approval → Stage B Gate 2 (Agent Zero's explicit "Approved for implementation: <exact spec/plan>" directive, which IS the implementation authorization, recorded verbatim by T001) → Stage C implementation → validation → acceptance.
- `tasks.md` — T001 restated (records the Gate 2 directive); banner and stage-sequencing note.
- `quickstart.md` — re-homed to Stage C (post-Gate-2 acceptance walkthrough).
- `test-strategy.md`, `traceability.md`, `spec.md` (US5, FR-030, SC-008) — sequencing language aligned.

**Resolution**: no implementation evidence is, or may be, a prerequisite to the Gate 2 directive. Planning approval, Gate 2 authorization, and post-implementation acceptance are three distinct governed acts throughout the package.

**Residual**: none.

## Blocking Finding 3 — MCP Implementation Surface Is Unresolved

**Status**: Accepted.

**Changes**:
- `plan.md` — new MCP source-binding section: home = dashboard repository (same CENTCOM product and deployment lineage); runtime = TanStack server-handler route; exact governed path-creation targets `[EXT] src/routes/mcp.ts`, `[EXT] src/server/mcp/` (tools.ts, auth.ts), shared PostgreSQL data-access module `[EXT] src/server/centcom-data/` (service.ts, queries.ts, envelope.ts); write scopes per repository; testing/rollback/operational ownership by role; relationship between GitHub source and the Lovable-hosted endpoint; evidence cited (repo-visible server handler `src/routes/sitemap[.]xml.ts` deploys through the same lineage).
- `research.md` — new R-8 (binding rationale, assumption, escalation); `tasks.md` T018/T019/T021 carry the exact paths; `risk-register.md` new Lovable-deployability risk; `gate-2-entry-criteria.md` G-06 (binding validated or escalation resolved before Gate 2 request).

**Resolution**: the phrase "MCP serving surface" no longer appears anywhere in the package. Both consumers read one PostgreSQL-backed normalized source through the same server-side data service (transient versioned response; dashboard adapter hydration; MCP tool modules).

**Residual / open decision**: the Lovable-deployability assumption (platform routes `/mcp` to repo-visible server code) requires validation before planning approval; if it fails, the pre-approved escalation proposes a separate service repository to Agent Zero (`plan.md`; `research.md` R-8; G-06).

## Blocking Finding 4 — Article IV Grounding Is Insufficient

**Status**: Accepted.

**Changes**: `research.md` R-3 rewritten (former routes — installed dependencies; response-shape tests — struck as insufficient); `plan.md` Constitution Check Article IV (mirror-only); `tasks.md` T002 (create + register pinned mirror of `github/rest-api-description` under `projects/governance-ops/reference/` with playbook Section 4 row; blocks every GitHub-API-dependent design and implementation step); `gate-2-entry-criteria.md` G-05; `spec.md` Assumptions.

**Resolution**: a registered, pinned local mirror is the sole accepted grounding route, completed before dependent implementation is proposed or authorized.

**Residual / open decision**: Agent Zero ratification of the proposed mirror source (`github/rest-api-description` — GitHub's official OpenAPI description) recorded as pending in R-3 and G-05.

## Blocking Finding 5 — Contract and State-Model Contradictions

**5.1 No-change semantics — Accepted.** One authoritative rule (`contracts/snapshot-collection.md` §5; the contradicting "distinct artifact versions" rule deleted): a no-change run records an ingestion run, advances the freshness anchor, and creates NO new snapshot version; a new version exists iff normalized content changes. Propagated: `data-model.md` E-02/E-03/S-01, `spec.md` FR-015 + Edge Cases, `quickstart.md` Step 8, `tasks.md` T009/T015, `test-strategy.md` §2.5, C-SNAP scenarios.

**5.2 Freshness/serving-time determinism — Accepted.** `contracts/provenance-envelope.md` §5 explicitly replaces the v1.0.0 blanket serving-time-clock prohibition with the scoped rule: anchor = stored `last_verified_at` (observedAt of the latest `published` or `no-change` run, PostgreSQL); classification computed at serving time by the shared data service — the only permitted serving-time clock use; `stale` + `thresholdExceededBy` are the exhaustive serving-time-varying fields; `observedAt` always equals the stored anchor; byte-identical determinism applies to stored normalized content at rest. New scenario C-ENV-7 proves anchor + 2-hour-threshold computation. Propagated: `spec.md` FR-016, `data-model.md` S-02/E-08, `research.md` R-4, `test-strategy.md` §2.6, `quickstart.md` freshness drill.

**5.3 Reproducibility claim — Accepted.** `spec.md` SC-006 narrowed to deterministic normalized snapshot content with determinism inputs enumerated (source content @ pinned revision + contract version + normalization rules); observation metadata excluded. Propagated: FR-014, both contracts §5, `test-strategy.md` §2.4, T007.

**5.4 Contract versioning — Accepted.** `contracts/provenance-envelope.md` bumped to v1.1.0 with change log; `definitions.constituentEnvelope` now REQUIRES `contractVersion` (schema + §3 + C-ENV-5 omit-fails clause + mixed examples); `contracts/snapshot-collection.md` declares its own version (v1.1.0) in header and schema.

**5.5 Invalid JSON Schema reference — Accepted.** Both schemas carry URN `$id`s (`urn:centcom:contract:provenance-envelope:1.1.0`, `urn:centcom:contract:snapshot-collection:1.1.0`); the snapshot schema's `$ref` targets the envelope URN — no `.md` path remains; machine verification performed during remediation (Ajv: compilation, example validation, constituent-missing-`contractVersion` rejection, URN cross-ref resolution with both schemas loaded — 13/13 checks). A standing schema-compilation validation step exists as task T011, test-strategy layer §2.2, scenario C-ENV-8/C-SNAP-9, and readiness criterion G-09.

**Residual (all of F5)**: none.

## Additional Required Reconciliation — all Accepted

| Item | Disposition |
|---|---|
| Preserve `95c8e9c` historical authoring pin | Preserved and labeled in every baseline statement (spec, plan, tasks, research, quickstart, contracts, test-strategy, traceability, gate-2). |
| Add `49f05bb` review baseline | Added everywhere baselines are stated, dated 2026-07-23. |
| P2-PRE-2 completed and operational | Restated throughout; evidence incorporated (canonical `npm run verify` chain with warning budget 8; workflows `dashboard-ci.yml`/`dependency-audit.yml`/`dependency-review.yml`; required status "Dashboard CI / required" bound to job `required`, GitHub Actions source; Active `main` ruleset; deny/allow control-effectiveness proof on dashboard PR #14, commits `7d92f7d`/`658e4b3`/`9352c4c`; merged PRs #3/#14; Dependabot PRs #6/#7/#8) — `spec.md` baseline, `tasks.md` T003, `test-strategy.md` §4.2, `gate-2-entry-criteria.md` G-04. |
| Q-004/Q-005 status honesty | Both now genuinely Resolved with Agent Zero's 2026-07-23 decisions quoted and dated (`spec.md` Clarifications; `research.md` R-4/R-5). |
| Specification status accuracy | `spec.md` Status = "Remediated under WO-P2-AUTHOR-001-R1 — awaiting independent review (planning approval pending; Gate 2 not requested)". |
| Handoff overclaim correction | The R0 handoff's "findings resolved" claim is scoped precisely in the revised handoff and `spec.md` checklist note: the R0 statement referred to internal authoring-time critics; the independent review's findings are addressed by this R1 revision and await re-review. |
| Finding-by-finding disposition | This document. |

## Remediation Quality Process

Thirteen artifacts revised under a single authoritative remediation brief encoding the verdict, the R1 directive, and Agent Zero's clarifications; independent verification critics then re-checked verdict coverage, cross-document consistency, and schema resolvability (scripted). All verification residuals (stale task numbers, a scenario-range citation, five collection-count slips) were corrected; final folder-wide checks confirm zero retired-concept occurrences and identical statements of the persistence, serving, freshness, no-change, and determinism models across all thirteen artifacts.

## Open Decisions for Agent Zero (complete list)

1. Planning approval of the revised `spec.md` and `plan.md` (Stage A).
2. Ratification of the Article IV mirror source selection (`github/rest-api-description`) — R-3/G-05.
3. Outcome of the Lovable-deployability validation for the MCP source binding (or the separate-service-repo escalation) — R-8/G-06.
4. (Later, after Stage A and readiness) the Gate 2 implementation directive itself — Stage B, recorded verbatim by T001.

No other decisions are open; persistence, freshness numbers, serving posture, and grounding policy are decided and recorded.
