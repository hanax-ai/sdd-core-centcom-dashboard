# Phase 0 Research: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Directory**: `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/` | **Date**: 2026-07-23 (originally authored 2026-07-22) | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Work order**: WO-P2-AUTHOR-001 — planning and authoring only. **Revised under WO-P2-AUTHOR-001-R1 (2026-07-23)** per the independent review verdict of 2026-07-23 and the Agent Zero decisions it records. **This research record does not grant, imply, or request implementation authority** (see `implementation-authorization-boundary.md`).

## Purpose

This file is the Phase 0 output required by `plan.md` (Outline & Research). It resolves the unknowns extracted from the plan's Technical Context — R-1 through R-6, plus R-7 and R-8 added under WO-P2-AUTHOR-001-R1 — each as a Decision, its Rationale, and the Alternatives considered. Where the independent review of 2026-07-23 superseded an original decision (R-1, R-3) or Agent Zero ratified a previously open number or posture (R-4, R-5), this revision records the new decision, its date, and the superseded alternative — the original reasoning is preserved as a rejected alternative, not erased.

**Identifier note**: research items in this file are numbered `R-1`–`R-8` (single digit, per plan.md Phase 0). Risk-register entries use the zero-padded form `R-0N` (e.g., risk R-07) and live in `risk-register.md`; the two namespaces are distinct.

Accepted baseline state (recorded once per WO-P2-AUTHOR-001 §8, reconciled under R1): SDD-Core `main` `6994bf6` (re-verified 2026-07-23); dashboard **historical authoring pin `95c8e9c`** (preserved as provenance) and **review baseline `49f05bb`** (verified 2026-07-23, after P2-PRE-2 and subsequent merges); baseline repair commit `42e94eb` (PR #2 merged); 51/51 tests, lint 0 errors with 8 accepted Fast Refresh warnings at the authoring pin. **P2-PRE-2 is completed and operational** (evidence recorded per FR-029; see tasks.md T003). Seven MCP tools total; `get_snapshot` migrates first; six remain explicitly fixture-backed during the first slice (FR-004).

---

## R-1 — Operational Persistence and the Serving Seam (superseded and re-resolved)

**Decision** (Agent Zero, 2026-07-23, superseding the original authoring-time decision): **PostgreSQL is the operational system of record.** The instance is the **existing Supabase project already providing MCP OAuth** — Supabase is managed PostgreSQL, i.e., Root Article II's standardized relational store, not a new datastore kind. CENTCOM operational data lives in a **dedicated non-public application schema** (working name `centcom`) with source-controlled migrations, least-privilege roles (a reconciliation writer role; a serving read-only role), authorization controls, and auditability. PostgreSQL holds the normalized snapshots, ingestion runs, provenance, access-policy state, and audit records. **JSON is limited to fixtures, tests, and transient exports** — never durable application state, never a second datastore.

The serving seam is: **PostgreSQL → shared server-side data service → transient versioned response → dashboard and MCP.** Consumers never call GitHub directly; per-request live fetching remains rejected for the first slice. The dashboard MAY hydrate the existing Phase 1 synchronous adapter from the transient versioned response — the Phase 1 adapter contract is preserved through this hydration path, not through a durable file. The MCP MUST consume the same normalized service/repository layer (`[EXT] src/server/centcom-data/` — see R-8), so there is no second normalization path that could silently diverge (FR-001/FR-002; SC-003).

**Rationale**:

- **Root Article II compliance by conformance, not avoidance.** The independent review (Finding 1) established that the originally proposed versioned snapshot files, whatever they were called, would function as durable structured application state — exactly the bespoke JSON persistence layer Article II prohibits. PostgreSQL through the existing Supabase project is the mandated relational store; adopting it resolves the violation at the root rather than relabeling it.
- **The Phase 1 adapter contract survives intact.** The transient versioned response produced by the shared data service is shaped so the dashboard's synchronous `DataSource` seam hydrates from it without an asynchronous rework of verified Phase 1 code. Determinism holds at the store: normalized snapshot content is byte-identical at rest per snapshot version in PostgreSQL (FR-014; SC-006 as narrowed under R1), and transient responses are deterministic given (snapshot version, freshness anchor, serving-instant classification) — see R-4.
- **One truth path is enforced, not hoped for.** Both consumers read the same snapshot version through the same shared data service (FR-001/FR-002; SC-003); write access is confined to the reconciliation runtime (R-7) under its own role.
- **Rollback stays trivial.** Source selection remains per-collection configuration; directed rollback (FR-019) is a single governed reversion to fixture-only service with correct labeling and no data repair (SC-005; US3 acceptance scenario 4).
- **Failure honesty is simpler.** Retrieval or validation failure leaves the last validated snapshot version in service with a staleness disclosure (FR-018); publication of a new snapshot version is transactional in PostgreSQL, so a mid-run request can never observe a partially written snapshot (spec edge case).

**Prohibited by this decision**: browser or client access to PostgreSQL credentials in any form (FR-024); durable JSON/CSV snapshot files or object-store exports acting as a second datastore; independent dashboard and MCP normalization paths. No separate PostgreSQL instance is introduced unless a concrete isolation, capacity, compliance, or deployment blocker is escalated to Agent Zero. Qdrant is not introduced in this slice.

**Alternatives considered**:

1. **Versioned, file-shaped snapshot artifacts as the durable store** (the original WO-P2-AUTHOR-001 decision) — **superseded and rejected by the independent review (Finding 1) and Agent Zero's decision of 2026-07-23**. The files would perform the role of durable structured application state; in the review's words, calling them artifacts does not change their operational function — they are functionally the bespoke JSON persistence layer Root Article II expressly prohibits. The properties the artifact was chosen for (determinism, provenance pinning, atomic publication, one truth path) are all preserved by PostgreSQL-backed snapshot versions plus the transient-response hydration path, without the constitutional violation.
2. **Per-request live fetch with an asynchronous seam rework** — rejected, unchanged from R0. Breaks the Phase 1 synchronous adapter contract; couples serving availability to GitHub availability and rate limits (FR-025); moves credential handling closer to request paths (FR-024); makes reproducibility contingent on remote state at request time; turns rollback from a configuration reversion into a code change.
3. **Build-time-only snapshot (bake the observation into the deployment)** — rejected, unchanged from R0. Freshness would be bound to deployment cadence, making the ratified hourly cadence and on-demand trigger (R-4) unsatisfiable without redeploys; the ingestion record (FR-020) would degenerate into deployment history.

**Consequences carried forward**: PostgreSQL schema migrations (`[EXT] supabase/migrations/*_centcom_*.sql`), the shared data service (`[EXT] src/server/centcom-data/`), and the reconciliation runtime (R-7) are tasked in `tasks.md`; the snapshot's shape and versioning are specified in `data-model.md` and `contracts/snapshot-collection.md` (v1.2.0).

---

## R-2 — Authoritative Source Enumeration for the Snapshot Collection

**Decision**: Unchanged in substance from R0; persistence target updated per R-1. For the first slice, the snapshot collection observes exactly four facts about the governed repository (SDD-Core, `hanax-ai/sdd-core`, per spec Q-001): **repository identity**, **default-branch head commit SHA**, **latest commit title**, and the **observation timestamp** recorded by the ingestion run. The normative enumeration of these authoritative sources lives in the snapshot-collection contract (`contracts/snapshot-collection.md`, v1.2.0), not in code, prose documentation, or convention. The normalized observation is persisted as a snapshot version in the PostgreSQL `centcom` schema (R-1), not as a file.

**Rationale**:

- FR-005 defines the live snapshot as the governed repository's observable state; these four facts are the smallest complete answer to "what is the current state?" (US1) and match what the Phase 1 fixture snapshot already models (`github:hanax-ai/sdd-core@6994bf6`), so the live contract is a labeled continuation, not a shape change.
- FR-012 requires authoritative source paths to be explicitly enumerated per migrated collection, with content outside the enumeration forbidden from influencing served results. Placing the enumeration in the contract file makes it versioned (Contract Version entity, spec Key Entities), governed (changes to it are governed changes), and directly testable (the snapshot contract test in `tasks.md` fails on any field the enumeration does not authorize).
- The observation timestamp is deliberately part of the enumeration: it is produced by the ingestion run, recorded once in the ingestion-run record (FR-020), and surfaced in the envelope as the stored freshness anchor (`observedAt` = stored `last_verified_at`; see R-4) — never fabricated. A **no-change run** (observed head SHA and normalized content identical to the current published snapshot) records an ingestion run with outcome `no-change` and does **not** create a new snapshot version; a new snapshot version is created **iff normalized content changes**, and freshness advances via the run record (R-4). This is the single authoritative no-change rule, propagated to `data-model.md`, both contracts, `quickstart.md`, tests, and tasks.

**Alternatives considered**:

1. **Broader first-slice enumeration** (branch lists, tags, file trees, work-package or defect source files) — rejected. Those belong to the remaining five collections, each of which migrates only under a future governed slice with its own per-collection enumeration, vocabulary, and failure policy (FR-013, FR-017; spec Q-003). Widening the first slice would dilute its purpose as the smallest provable vertical.
2. **Enumeration held in implementation code or a README** — rejected. Code is not a governed contract surface; FR-012's "content outside the enumerated paths MUST NOT influence served results" needs a normative document that tests and auditors (US4) can cite, and that the contract-version discipline covers.

---

## R-3 — GitHub API Grounding Under Root Article IV (superseded and re-resolved)

**Decision** (per the independent review Finding 4 and Agent Zero's decision of 2026-07-23, superseding the original deferral-with-options): **Only a registered, pinned local mirror of the selected GitHub API/client source satisfies the Mirror-Check Mandate.** The two grounding routes previously offered as alternatives to a mirror are **struck as insufficient** (see Alternatives below). The **proposed source selection — requiring Agent Zero ratification — is GitHub's official REST API description, `github/rest-api-description`** (the OpenAPI source of truth for endpoint signatures and behaviors), pinned to a recorded revision and registered under `projects/governance-ops/reference/` with the corresponding playbook Section 4 row in `projects/governance-ops/knowledge/instructions.md`, following the workspace's established mirror-registration pattern. **T002 creates and registers that mirror and records the pinned revision plus the design decisions that depend on it.** Grounding completes **before dependent implementation is proposed or authorized** — it is a readiness item for requesting Gate 2 (`gate-2-entry-criteria.md`), and no implementation code that calls the GitHub API may be authored until the mirror is registered.

**Rationale**:

- Root Article IV (Mirror-Check Mandate) prohibits proceeding on recalled API shapes. The independent review established that only a registered mirror provides the required *source* grounding: installed dependencies may supply executable code, and response-shape tests may validate observed outputs, but neither establishes registered source grounding for API signatures and behavior. The mirror is therefore the sole route, not the preferred one among three.
- `github/rest-api-description` is proposed because it is GitHub's own normative description of the REST API — grounding endpoint signatures and behaviors at their source rather than through any particular client library, and leaving the client-library choice (or plain-REST choice) free at implementation time without re-grounding.
- Registering the mirror requires writing to `projects/governance-ops/reference/` and `knowledge/instructions.md`, which is outside this feature folder; T002 is the workspace-side task that carries that scoped authority. Recording the obligation as a blocking task keeps it machine-checkable in the task graph rather than advisory prose.
- The selection itself is recorded here as a **proposal awaiting Agent Zero ratification**; ratification (or an amended selection) is tracked in `gate-2-entry-criteria.md` as a readiness-to-request-Gate-2 item and in the R1 handoff's open-decision list.

**Alternatives considered**:

1. **Proceed on recalled GitHub API shapes** — prohibited outright by Root Article IV; not a candidate.
2. **Ground in the dashboard repository's installed dependencies alone** — **struck by the independent review (Finding 4)**: dependencies provide executable code, not registered source grounding for API signatures and behavior. (Offered as an acceptable option in the R0 version of this entry; no longer acceptable.)
3. **Plain REST with response-shape contract tests as the grounding evidence** — **struck by the independent review (Finding 4)**: response-shape tests validate observed outputs at the boundary and remain valuable as validation discipline (FR-003), but they do not establish registered source grounding. (Offered as an acceptable option in the R0 version of this entry; no longer acceptable.)
4. **Mirror a specific GitHub client library instead of the API description** — not selected: it would bind the grounding to a client-library choice that implementation may not make, and the API description grounds the signatures and behaviors themselves. Remains available as an amendment if Agent Zero ratifies a different selection.

---

## R-4 — Freshness Cadence, Staleness Threshold, and the Serving-Time Model (ratified)

**Decision** (Agent Zero, **ratified 2026-07-23**, resolving spec Q-005; supersedes the R0 proposal): **hourly scheduled reconciliation plus an on-demand refresh trigger; staleness threshold of 2 hours.** Both the scheduled run and the on-demand trigger invoke the same ingestion operation (R-7). The freshness model is:

- **Anchor**: `last_verified_at` — the `observed_at` of the latest successful ingestion run (outcome `published` or `no-change`), stored in PostgreSQL. A no-change run advances the anchor via the run record without creating a snapshot version (R-2).
- **Classification**: staleness is **computed at serving time** by the shared data service, comparing the stored anchor against the serving clock. This comparison is the **only permitted serving-time clock use** in the serving path.
- **Permitted varying response fields** (the exhaustive list): `stale` (boolean) and `thresholdExceededBy` (present when stale). Every other envelope and content field derives from stored state — `observedAt` in the envelope is the stored `last_verified_at`, never the serving clock.
- **Byte-identical boundary**: the determinism guarantee applies to **stored normalized snapshot content at rest, per snapshot version, in PostgreSQL**. Transient responses are deterministic given (snapshot version, anchor, serving-instant classification); their freshness fields legitimately vary.
- **Monotonicity**: ingestion-run anchors are strictly increasing, enforced at ingestion validation. `aging` remains internal-only and never appears in the envelope.

Every served result older than the threshold carries an explicit staleness disclosure per FR-016; a stale result is never presented as fresh.

**Rationale**:

- The numbers are Agent Zero's ratified decision (2026-07-23), recorded here with the model that makes them testable. Hourly cadence keeps the dashboard's live snapshot within one hour of the governed repository's observable state in normal operation; the on-demand trigger covers the moments that matter most (a gate review, a merge, a directed refresh) without waiting for the schedule.
- A 2-hour threshold — two missed hourly runs — cleanly distinguishes "one missed run" (a normal operational hiccup, disclosed as staleness only after the second miss) from a failure streak (an FR-028 monitoring condition with an incident path). A threshold equal to the cadence would mark results stale on any single delay, training consumers to ignore the disclosure — the opposite of FR-016's intent.
- Hourly observation of a single repository plus occasional on-demand runs remains negligible load against the live source's rate limits (FR-025), leaving the backoff rules as genuine safety margin rather than routine behavior.
- The anchor/serving-time split resolves the review's Finding 5.2 contradiction: freshness cannot be persisted at ingestion time (it decays continuously), so classification must read the serving clock — but scoping that read to the single anchor comparison, and fixing the exhaustive list of varying fields, preserves determinism everywhere else. The former blanket prohibition on serving-time clock reads in the envelope contract is replaced by this scoped rule (contracts v1.1.0).

**Alternatives considered**:

1. **≤ 24 h scheduled cadence with staleness at 2× cadence** (the R0 proposal) — superseded by Agent Zero's ratified numbers. The cadence is data, not architecture: the ratified values slot into the same design without structural change, which is exactly why the R0 entry recorded the numbers as ratifiable data.
2. **Webhook-driven push ingestion** — rejected for the first slice, unchanged: it introduces an inbound endpoint, webhook secret handling (enlarging the FR-024 surface), and hosting decisions beyond this feature's authority; scheduled-plus-on-demand achieves the required freshness without new infrastructure.
3. **On-demand only, no schedule** — rejected, unchanged: staleness would be unbounded whenever no one asks, and the FR-028 monitoring signals (last success, staleness) would lose their meaning as health indicators.
4. **Persisting freshness classification at ingestion time** — rejected: a stored `stale` flag is false the moment it is written or becomes false as time passes; classification is inherently a function of the serving instant and belongs in the shared data service under the scoped clock rule above.

---

## R-5 — Authentication vs Authorization Layering (posture resolved)

**Decision**: A **layered model with allowlist-first authorization**, unchanged in structure from R0; the serving-posture escalation is now **resolved**. The existing Supabase OAuth 2.1 surface remains **authentication only**: it establishes who the caller is and nothing more. Authorization is a distinct, explicit control layered above it: (a) an **allowlist of authorized principals** as the first-slice access policy (eligibility, grant, and revocation are edits to an explicit list — FR-021), with access-policy state held in the PostgreSQL `centcom` schema (R-1); (b) **tool-level policy enforcement**, so individual MCP tools or the live data they serve can be restricted per principal (FR-022); (c) **token audience validation**, so a token issued for a different resource is rejected even if otherwise valid (FR-023).

**Serving posture — RESOLVED by Agent Zero decision, 2026-07-23** (closing the escalation recorded in the WO-P2-AUTHOR-001 handoff and spec Q-004): *"Permit public dashboard access only to explicitly public-class snapshot fields; keep MCP access OAuth-protected."* Additionally: *"No non-public collection may migrate until authorization and revocation controls are operational and validated."* The first slice's live content (public repository identity, head SHA, commit title) is public-class data per FR-027, so the public dashboard may serve it; the MCP surface stays OAuth-protected regardless.

**Rationale**:

- FR-021 states the boundary exactly: authenticating as an app user MUST NOT by itself grant access to governance data. Phase 1's OAuth verification (baseline accepted state) proved authentication works; it proved nothing about authorization, and the spec's edge-case list names the gap explicitly (an authenticated but unauthorized reader).
- Allowlist-first is the smallest auditable model for the current principal population: every grant is an explicit, dated record; revocation is row removal (FR-021's revocation requirement); the invocation log (FR-026) can join cleanly against it for incident reconstruction. A role model can be layered on later without discarding the allowlist — the reverse migration is harder.
- Tool-level enforcement matches the migration unit: collections migrate one at a time (FR-004; spec Q-003), and FR-022 requires the access boundary to be expressible at exactly that granularity, so a future collection whose classification exceeds the deployment's exposure level (FR-027) can be gated without redesign.
- Audience validation closes the confused-deputy path: an otherwise-valid token minted for a different resource must not open the MCP (FR-023). This is a distinct check from authentication success and is tasked separately for that reason.
- Recording the first slice's data classification (public-class) is itself an FR-027 obligation; Agent Zero's decision now fixes the exposure rule (public dashboard = explicitly public-class fields only) and the migration precondition (operational, validated authorization and revocation controls before any non-public collection moves).

**Alternatives considered**:

1. **Treat OAuth authentication as sufficient** — rejected: directly violates FR-021 and reproduces the exact authenticated-but-unauthorized edge case the spec names.
2. **Role-based authorization from the start** — rejected as premature: the principal count does not justify role machinery, and an unpopulated role model invites permissive defaults; the allowlist is the stricter posture and evolves forward cleanly.
3. **Network-level restriction only** (IP allowlisting, private deployment) — rejected as the sole control: it is not per-principal, cannot express tool-level policy (FR-022), and produces no principal-attributable audit trail (FR-026). It may still be applied as defense in depth, but never as the authorization model.

---

## R-6 — Mode-Confusion Test Design (schema-compilation step added)

**Decision**: The mode-confusion suite is built on two complementary mechanisms, unchanged from R0, plus a third validation step added under R1: (1) **classification-from-result-alone tests** — the test harness is handed a result with no other context and must correctly determine its data mode and authority from the provenance envelope alone, across all seven tools and all four conditions (live, fixture, stale, mixed), operationalizing SC-009; (2) a **fixture-poisoning canary** — a distinctive marker value embedded exclusively in the fixture datasets that MUST never appear in any result labeled `dataMode: live`; its presence in a live-labeled result is content-level proof of mislabeling; and (3) a **schema-compilation validation step** — Ajv (or an equivalent JSON Schema compiler) compiles every contract schema with all cross-references resolved, CI-runnable, as its own task in `tasks.md` and its own layer in `test-strategy.md`. Cross-contract references resolve via stable `$id` URNs (`urn:centcom:contract:<name>:<version>`, e.g., `urn:centcom:contract:provenance-envelope:1.2.0`) — never via file paths — and the snapshot schema references the envelope schema by URN, with both schemas loaded for compilation. The suite **fails on any mislabeled surface**: fixture-derived content without fixture labeling, or live content without live labeling, on any tool result, dashboard collection, aggregate, or status summary (FR-011, FR-010).

**Rationale**:

- FR-011 and SC-009 both demand that mode be determinable from the result alone; only a test that consumes nothing but the result can prove that. Any test that peeks at configuration or code paths verifies the wrong property.
- Envelope checks alone have a blind spot: a surface can emit a perfectly well-formed envelope claiming `live` while its content came from fixtures — wrong labeling rather than missing labeling, which is precisely the "most dangerous failure" User Story 2 names. The canary closes this gap: because the marker exists only in fixture data, its appearance under a live label is unfalsifiable evidence of leakage across the adapter's source selection, independent of what the envelope claims.
- The schema-compilation step exists because the envelope-validation mechanism is only as trustworthy as the schemas it validates against: the independent review (Finding 5.5) demonstrated that an unresolvable schema reference silently voids the entire contract-test layer — independent Ajv compilation failed on a reference that pointed at a Markdown document instead of a schema resource. Compiling all contract schemas with cross-references resolved, in CI, makes "the schemas are loadable and internally consistent" a checked precondition of every downstream contract and mode-confusion test rather than an assumption.
- The suite must run in every operating configuration the capability defines: first-slice mixed operation (one live, six fixture — FR-004/FR-007), simulated staleness and fallback (FR-018), and fixture-only rollback configuration — where its passing is the designated verification of SC-005 (rollback correctness).
- The canary imposes one design obligation recorded for `data-model.md` and the fixture dataset: the marker must be a value that can never legitimately occur in live data (e.g., a reserved sentinel in a free-text field of the fixture dataset, versioned with the dataset), so a canary hit is always a true positive.

**Alternatives considered**:

1. **Envelope-schema validation alone** — necessary but insufficient. It is retained as its own contract suite because it catches omission and malformation (SC-002), but it cannot catch a truthfully-shaped envelope telling a lie about its content; only the canary does.
2. **Source-code review / static analysis of data paths** — rejected as the control: review evidence decays with every change and does not fail CI on regression. The governing lesson applies: local validation is evidence; enforcement must be a test that fails — and, with P2-PRE-2 now completed and operational (FR-029, SC-008), a CI gate that blocks.
3. **Comparing served values against live GitHub inside the test suite** — rejected: it makes the suite network-dependent and nondeterministic, contradicting the determinism discipline (FR-014) and the stored-snapshot seam (R-1). Live-vs-source verification belongs to the acceptance walkthrough (`quickstart.md`, FR-006 evidence; T026) in Stage C — post-implementation validation — not to the repeatable test suite.

---

## R-7 — Reconciliation Runtime Selection (new under R1)

**Decision** (per Agent Zero's clarification recorded in the R1 remediation): Reconciliation — the scheduled WRITE path (fetch → validate → normalize → publish to PostgreSQL) — is a **separate server-side runtime component** from MCP and dashboard serving, which are READ paths. It runs as a **source-controlled Supabase Edge Function** (`[EXT] supabase/functions/centcom-reconcile/index.ts`) **invoked by Supabase Cron**, with the cron registration carried in a source-controlled migration. The hourly scheduled job and the on-demand refresh trigger (R-4) invoke the **same ingestion operation** — one code path, two invocation modes. The job MUST NOT run in the browser and MUST NOT run inside an MCP request.

**Rationale**:

- Separating the write runtime from the read paths enforces the least-privilege split from R-1 (reconciliation writer role vs serving read-only role) at the architecture level, not just the credential level: no serving component holds write credentials, and no ingestion failure can take down serving (FR-018 keeps the last validated snapshot in service).
- Supabase officially supports scheduled Edge Function invocation via its Postgres scheduling facilities, so the scheduler, the function, and the datastore live in the same already-adopted managed platform — no new infrastructure kind, consistent with R-1's single-instance decision.
- The Edge Function is source-controlled in the dashboard repository (R-8 write scopes), so the reconciliation code is reviewable, versioned, and deployed through the same governed lineage as the rest of the `[EXT]` surface — not a dashboard-invisible script.
- One ingestion operation for both invocation modes means the on-demand trigger cannot drift from the scheduled behavior: same validation, same no-change rule (R-2), same run record (FR-020), same anchor advancement (R-4).

**Alternatives considered**:

1. **GitHub Actions as the production scheduler** — rejected (Agent Zero clarification): GitHub Actions is NOT the production scheduler. CI belongs to verification (P2-PRE-2's domain), not to production data operations; a production write path scheduled from CI would couple data freshness to CI availability and blur the repository-governance boundary.
2. **Browser-hosted or client-triggered ingestion** — rejected: puts write credentials on the client side (violates FR-024 and R-1's prohibition), makes freshness contingent on someone having the dashboard open, and provides no reliable schedule.
3. **Per-request ingestion inside an MCP request** — rejected: re-introduces the per-request live fetch already rejected in R-1 (couples serving latency and availability to GitHub; multiplies rate-limit exposure per FR-025) and would place write-path work inside a read-path request, breaking the runtime separation above.

---

## R-8 — MCP Source-Controlled Home (new under R1)

**Decision** (bound proposal per the independent review Finding 3 and Agent Zero's clarification; requires planning approval): No repo-visible MCP implementation currently exists in SDD-Core or the dashboard repository; the Lovable-hosted MCP endpoint is an externally hosted surface whose canonical source was unresolved at review time. This entry **binds the future source-controlled home**. **Preferred home: the dashboard repository** (`hanax-ai/sdd-core-centcom-dashboard`) — same CENTCOM product and deployment lineage. The bound design:

- **MCP endpoint handler**: `[EXT] src/routes/mcp.ts` — a TanStack server-handler route implementing the MCP Streamable HTTP endpoint — with tool modules under `[EXT] src/server/mcp/` (`tools.ts`, `auth.ts`).
- **Shared PostgreSQL data-access module** (the single normalization/service layer for BOTH consumers, per R-1): `[EXT] src/server/centcom-data/` (`service.ts`, `queries.ts`, `envelope.ts`).
- **Migrations**: `[EXT] supabase/migrations/*_centcom_*.sql`.
- **Reconciliation Edge Function**: `[EXT] supabase/functions/centcom-reconcile/index.ts` plus its cron registration migration (R-7).

**Supporting evidence**: the dashboard repository already ships a repo-visible server handler deployed through the same Lovable lineage — `src/routes/sitemap.xml.ts` — demonstrating that repo-visible server routes reach the hosted deployment.

**Recorded assumption and escalation path**: this binding assumes (a) Lovable deploys repo-visible server routes to the hosted endpoint (evidenced by the sitemap route) AND (b) the platform's `/mcp` path can be routed to repository code. **Validating this assumption is an explicit readiness item for requesting Gate 2** (`gate-2-entry-criteria.md`). If Lovable cannot deploy the MCP from repository-visible source, the fallback is to propose a separate service repository — escalated to Agent Zero **before planning approval**, not silently substituted.

**Write scopes**: the dashboard repository holds the MCP endpoint, the shared data service, the migrations, and the Edge Functions — all `[EXT]`, executed only by a dashboard-scoped agent under future explicit authorization. The governance-ops project holds planning artifacts, records, and runbooks only. Testing, rollback, and operational ownership for the MCP surface are stated by owner role (dashboard-scoped implementing agent for code and deployment; governance-ops for records and acceptance evidence; Agent Zero for authorization decisions), not by named persons.

**Rationale**:

- The review (Finding 3) held that MCP ownership and deployment architecture cannot be deferred until after implementation authorization; every task that touches the MCP must name exact paths. This entry, with `plan.md` and `tasks.md`, replaces every former placeholder with the exact paths above.
- Housing the MCP beside the dashboard is what makes R-1's "same normalized service layer" enforceable in-process: both consumers import `[EXT] src/server/centcom-data/` directly, so divergence (FR-002) is structurally prevented rather than policed.
- The sitemap server handler is concrete, repo-visible evidence that this deployment lineage already carries server routes — the binding extrapolates from an observed mechanism, not a recalled one; the residual routing question is exactly what the recorded assumption isolates for validation.

**Alternatives considered**:

1. **Separate MCP service repository** — not preferred, retained as the escalation fallback: it would split the CENTCOM product across repositories, require duplicating or packaging the shared data service (re-opening the FR-002 divergence risk), and add a second deployment lineage — justified only if the Lovable routing assumption fails validation.
2. **Housing the MCP in SDD-Core (governance-ops)** — rejected: SDD-Core is the governed *observed* repository and planning home, not a serving runtime; placing operational serving code there would invert the observer/observed relationship and violate the write-scope split above.
3. **Continuing with an unresolved externally hosted surface** — rejected: that is precisely the state the review found blocking; an MCP whose source cannot be located in a governed repository cannot satisfy auditability (US4), testing, or rollback obligations.

---

## Resolution Status

| Item | Subject | Status |
|---|---|---|
| R-1 | Operational persistence and the serving seam | **Re-resolved 2026-07-23** — PostgreSQL (existing Supabase project, dedicated `centcom` schema) is the operational system of record per Agent Zero; file-shaped durable artifact superseded (review Finding 1); adapter preserved via transient-response hydration |
| R-2 | Authoritative source enumeration (snapshot) | **Resolved** — four observed facts; enumeration normative in `contracts/snapshot-collection.md` (v1.2.0); persisted in PostgreSQL; single no-change rule (new version iff content changes) |
| R-3 | GitHub API grounding (root Article IV) | **Re-resolved 2026-07-23** — mirror-only (review Finding 4); proposed source `github/rest-api-description`, pinned + registered via T002; **selection awaits Agent Zero ratification** |
| R-4 | Freshness cadence and staleness threshold | **Ratified 2026-07-23** (Agent Zero; resolves spec Q-005) — hourly + on-demand; stale after 2 h; `last_verified_at` anchor; serving-time classification scoped to the anchor comparison |
| R-5 | AuthN vs authZ layering | **Resolved** — allowlist-first authorization over OAuth authentication; serving posture decided by Agent Zero 2026-07-23 (public dashboard: explicitly public-class fields only; MCP stays OAuth-protected) |
| R-6 | Mode-confusion test design | **Resolved** — classification-from-result-alone + fixture-poisoning canary + schema-compilation validation (URN-resolved `$id` references); suite fails on any mislabeled surface |
| R-7 | Reconciliation runtime | **Resolved** — source-controlled Supabase Edge Function invoked by Supabase Cron; one ingestion operation for scheduled and on-demand; never in-browser or in-MCP-request |
| R-8 | MCP source-controlled home | **Resolved as bound proposal** — dashboard repository (`[EXT] src/routes/mcp.ts` + `[EXT] src/server/mcp/`); Lovable deployment assumption recorded, validation is a readiness-to-request-Gate-2 item; escalation path: separate service repo, before planning approval |

No NEEDS CLARIFICATION items from the plan's Technical Context remain open. Two items await Agent Zero action and are tracked in `gate-2-entry-criteria.md` (readiness-to-request-Gate-2) and the WO-P2-AUTHOR-001-R1 handoff: ratification of the R-3 mirror-source selection, and validation (or escalation) of the R-8 Lovable deployment assumption. They are governed follow-ups, not unresolved research.

---

*Authored under WO-P2-AUTHOR-001; revised under WO-P2-AUTHOR-001-R1 (2026-07-23) to apply the independent review verdict of 2026-07-23 and the Agent Zero decisions recorded there. This document records research decisions for planning purposes only; per `implementation-authorization-boundary.md`, neither this file nor its approval authorizes implementation. Planning approval has not been granted and Gate 2 — Agent Zero's explicit implementation directive — has been neither requested nor issued. Every `[EXT]` consequence cited here executes only under a future dashboard-scoped authorization; P2-PRE-2 evidence is recorded as completed and operational (FR-029, SC-008).*
