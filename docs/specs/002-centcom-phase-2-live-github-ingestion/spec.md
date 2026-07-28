# Feature Specification: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion`

**Created**: 2026-07-22

**Revised**: 2026-07-23 under WO-P2-AUTHOR-001-R1 (planning-artifact remediation responding to the independent review verdict of 2026-07-23)

**Status**: Remediated under WO-P2-AUTHOR-001-R1 — awaiting independent review (planning approval pending; Gate 2 not requested) *(authored under WO-P2-AUTHOR-001; Agent Zero approval of this specification, and of every downstream artifact, remains pending — see `implementation-authorization-boundary.md`)*

**Input**: Feature description: "Define the governed transition from fixture-backed CENTCOM data to validated, provenance-backed live GitHub data shared by the dashboard and the CENTCOM MCP, beginning with `get_snapshot` as the first live vertical slice."

**Work order**: WO-P2-AUTHOR-001 (authoring) and WO-P2-AUTHOR-001-R1 (remediation revision) — planning and authoring only; implementation authority not granted

## Governing Context (read before changing this specification)

- Root constitution: `../../../../../.specify/memory/constitution.md` (v2.1.0)
- Project constitution: `../../../.specify/memory/constitution.md` (v1.1.1)
- Project playbook: `../../../knowledge/instructions.md`
- Sibling capability: `001-three-agent-coordination-harness` (coordination harness; this feature is executed under its temporary manual work orders)
- External prerequisite: work package **P2-PRE-2 — Dashboard CI and Merge Protection** (owned by VS Code/Codex under WO-P2-PRE-2-CI-001; explicitly **not** part of this feature) — **COMPLETED AND OPERATIONAL** as of the 2026-07-23 review baseline; this feature incorporates its recorded evidence (see Accepted Baseline State and FR-029)

## Accepted Baseline State

Recorded once per the repository-status check economy (WO-P2-AUTHOR-001 §8); reused throughout this feature folder. Baselines re-verified 2026-07-23 under WO-P2-AUTHOR-001-R1: the dashboard's historical authoring pin is preserved as provenance, and the post-P2-PRE-2 review baseline is recorded alongside it.

| Item | Value |
|---|---|
| SDD-Core `main` | `6994bf6` (verified via remote head check, 2026-07-22; re-verified 2026-07-23) |
| Dashboard `main` — historical authoring pin | `95c8e9c` (verified via remote head check, 2026-07-22; preserved as authoring provenance) |
| Dashboard `main` — review baseline | `49f05bb` (verified 2026-07-23; state after P2-PRE-2 completion and subsequent merges) |
| Dashboard baseline repair PR #2 | Merged (`42e94eb`) |
| Dashboard quality gates (at authoring pin) | Lint: 0 errors, 8 accepted Fast Refresh warnings · Tests: 51/51 · Typecheck: pass · Build: pass · `npm audit`: 0 vulnerabilities |
| P2-PRE-2 — Dashboard CI and merge protection | **COMPLETED AND OPERATIONAL** (2026-07-23). Evidence: canonical command `npm run verify` = `format:check` → `lint --max-warnings 8` (warning budget 8 enforced) → `typecheck` → `test:ci` → `build` → `verify:generated` (routeTree cleanliness); workflows `.github/workflows/dashboard-ci.yml`, `dependency-audit.yml`, `dependency-review.yml` (actions pinned; checkouts hardened with `persist-credentials: false`); required status **"Dashboard CI / required"** bound to job name `required`, source GitHub Actions; `main` ruleset **Active**; deny/allow control-effectiveness proof executed on dashboard PR #14 (deliberate failure isolated → blocked; corrected → passed; commits `7d92f7d`, `658e4b3`, `9352c4c`); delivered via merged PRs #3 and #14; Dependabot operational (actions bumps merged via PRs #6/#7/#8) |
| CENTCOM MCP | Registered and OAuth-authenticated; all 7 tools passed fixture-backed tests |
| MCP data authority | Fixture-backed and non-authoritative |

The seven MCP tools: `get_snapshot`, `list_work_packages`, `get_work_package`, `list_defects`, `list_gates`, `list_decisions`, `get_metrics`. **Seven tools total; one (`get_snapshot`) migrates to live data first; six remain explicitly fixture-backed during that slice.**

---

## Quick Guidelines

- This specification defines **WHAT** the capability must accomplish and **WHY**; technology selection and code structure belong to `plan.md`.
- The dashboard and the MCP MUST consume one normalized source of truth. Competing implementations or divergent data sources are a specification violation, not an implementation detail.
- No result may ever misrepresent its provenance or authority. Honest uncertainty is a product requirement, not a degradation.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executive Reads a Live, Trustworthy Snapshot (Priority: P1)

As an executive consumer of the CENTCOM dashboard or MCP, when I request the repository snapshot I receive the actual current state of the governed repository — its branch head, latest commit, and freshness — and the result itself tells me it is live, what repository and commit it came from, when it was observed, and whether it is authoritative.

**Why this priority**: The snapshot is the smallest complete answer to "what is the current state?" and is the designated first vertical slice. If the snapshot cannot be made live, validated, and honestly labeled, no other collection should migrate.

**Independent Test**: Call `get_snapshot` (MCP) and open the dashboard overview backed by the same normalized source. Both surfaces present the same repository head, and each result carries `dataMode: live`, the source repository, the source commit SHA, and an observation timestamp that matches the ingestion record.

**Acceptance Scenarios**:

1. **Given** the ingestion pipeline has successfully observed the governed repository, **When** a consumer requests the snapshot, **Then** the result reflects the observed repository head and carries `dataMode: live`, the source repository identifier, the source commit SHA, the observation timestamp, and the contract version.
2. **Given** the governed repository's head has changed and a new ingestion has completed, **When** a consumer requests the snapshot, **Then** the result reflects the new head and a newer observation timestamp — never a silently cached older state presented as current.
3. **Given** the snapshot result is displayed alongside fixture-backed collections, **When** any aggregate or page-level status is presented, **Then** the aggregate is labeled as mixed and is never presented as wholly live.

---

### User Story 2 - A Model or Agent Cannot Mistake Fixture for Live (Priority: P1)

As an AI agent (or a human) consuming any of the seven MCP tools, every result I receive declares its data mode (`fixture`, `live`, or `mixed`) and its authority status in the result itself, so I cannot silently treat demonstration data as operational truth.

**Why this priority**: The single most dangerous failure of this transition is an agent ingesting fixture data as if it were live governance state and acting on it. Provenance must be unavoidable — in-band, per result — not documented off to the side.

**Independent Test**: Call each of the seven tools during the first-slice period. `get_snapshot` returns `dataMode: live`; the other six return `dataMode: fixture` with `authoritative: false` and an explicit non-authority warning. No result omits the envelope.

**Acceptance Scenarios**:

1. **Given** the first slice is deployed, **When** any of the six non-migrated tools is called, **Then** its result declares `dataMode: fixture`, `authoritative: false`, the fixture dataset version, and a warning that the result does not establish governance approval or project status.
2. **Given** a result combines live and fixture-derived content, **When** it is returned, **Then** it declares `dataMode: mixed` and identifies the mode of each constituent collection — a mixed state is never presented as wholly live.
3. **Given** a consumer inspects any result, **When** it reads the provenance envelope, **Then** the envelope alone is sufficient to determine data mode, authority, source, revision, observation time, and contract version without consulting external documentation.

---

### User Story 3 - Operator Survives Source Failure Honestly (Priority: P1)

As the operator of the CENTCOM surfaces, when the governed repository cannot be reached or its content fails validation, consumers continue to receive a well-formed, honestly labeled result — the last known-good snapshot marked stale, or an explicit fixture fallback — and never a silent failure, a blank surface, or stale data presented as fresh.

**Why this priority**: Live sources fail. The failure behavior is part of the capability's contract, and the Phase 1 principle "missing or uncertain evidence must be represented honestly" must survive the transition.

**Independent Test**: Simulate source retrieval failure and validation failure. In both cases the served result is well-formed, carries an accurate `dataMode` and staleness disclosure, and the failure is recorded in the ingestion record. Restore the source; the next successful ingestion resumes live service.

**Acceptance Scenarios**:

1. **Given** the live source is unreachable, **When** a consumer requests the snapshot, **Then** the last validated snapshot is served with an explicit staleness disclosure (observation timestamp unchanged, staleness state declared) — never presented as fresh.
2. **Given** no validated live snapshot has ever been produced, **When** a consumer requests the snapshot, **Then** the fixture-backed result is served declaring `dataMode: fixture` and `authoritative: false` — never an unlabeled or empty result.
3. **Given** retrieved source content fails validation, **When** ingestion completes, **Then** the invalid content is rejected at the validation boundary, the failure is recorded with enough context to identify the offending source and rule, and the previously validated snapshot remains in service.
4. **Given** a rollback is directed, **When** the capability is reverted to fixture-only operation, **Then** all seven tools serve fixture data with correct fixture labeling, and the reversion requires no data repair.

---

### User Story 4 - Auditor Traces Every Claim to Its Source (Priority: P2)

As an auditor (human or agent), for any value shown by the dashboard or returned by the MCP I can determine which repository and commit it came from, when it was observed, which contract version shaped it, and whether the pipeline that produced it validated successfully.

**Why this priority**: The workspace's brand is evidence-backed claims. Phase 1 established provenance discipline over fixtures; Phase 2 must extend it — not weaken it — when the data becomes live.

**Independent Test**: Select any served value; follow its provenance envelope to the ingestion record; confirm the recorded source revision exists in the governed repository and the observation timestamp matches the ingestion record.

**Acceptance Scenarios**:

1. **Given** a served live result, **When** its provenance is followed, **Then** the source commit SHA resolves to a real commit in the named repository and the observation timestamp matches the ingestion record that produced it.
2. **Given** two consumers (dashboard and MCP) present the same collection, **When** their outputs are compared for the same snapshot version, **Then** the values are identical — one truth path, no divergent computation.

---

### User Story 5 - Agent Zero Governs the Transition (Priority: P1)

As Agent Zero, the transition from fixture to live data proceeds only through my explicit approvals, in three distinct stages: **Stage A** — I approve the planning artifacts (`spec.md` and `plan.md`); **Stage B** — I issue the explicit Gate 2 implementation directive ("Approved for implementation: \<exact spec/plan\>"), and **Gate 2 IS the implementation authorization**; **Stage C** — implementation executes, followed by validation and acceptance review. No agent, green test, merged PR, or working demo substitutes for those approvals, and no implementation evidence is ever a prerequisite to the Gate 2 directive itself.

**Why this priority**: WO-P2-AUTHOR-001 grants authoring authority only. The capability's own definition must encode that boundary so a future session cannot infer implementation authority from the existence of approved planning artifacts.

**Independent Test**: Present the completed planning artifacts. Confirm they contain an explicit statement that they do not grant implementation authority, that Gate 2 is defined as Agent Zero's explicit implementation directive (not an evidence checkpoint after implementation), and that the readiness-to-request-Gate-2 criteria (`gate-2-entry-criteria.md`) contain only pre-implementation items.

**Acceptance Scenarios**:

1. **Given** all planning artifacts in this folder are complete and reviewed, **When** any agent evaluates whether implementation may begin, **Then** the artifacts themselves state that planning approval (Stage A) alone does not authorize implementation, that implementation requires Agent Zero's explicit Gate 2 directive (Stage B), and that validation and acceptance evidence belong to Stage C — after Gate 2, never before it.
2. **Given** the completed P2-PRE-2 CI gate evidence (required status "Dashboard CI / required"; deny/allow control-effectiveness proof) is incorporated in the planning record, **When** Phase 2 implementation output is later offered for acceptance (Stage C), **Then** acceptance verifies both that a recorded Gate 2 directive preceded the implementation and that the implementation merged through that operational CI gate.

### Edge Cases

- The governed repository's default branch is force-pushed, rewritten, or its head SHA becomes unresolvable between ingestions.
- Retrieved content is well-formed but semantically contradictory (e.g., a status vocabulary value outside the allowed set, or records that contradict each other).
- The live source rate-limits or throttles ingestion mid-run.
- An ingestion produces content identical to the prior snapshot (no-change run) — the run is recorded with outcome `no-change`, the freshness anchor advances via that run record, and no new snapshot version is created (a new snapshot version exists if and only if normalized content changes).
- Clock skew makes an observation timestamp appear earlier than its predecessor.
- A consumer requests data while an ingestion is mid-run (partially written snapshot must never be observable).
- The fixture dataset and live data disagree materially during the mixed period (expected — the labeling, not the reconciliation, is the requirement).
- Credentials for the live source expire, are revoked, or lack required scope.
- A future seventh-to-first migration of the remaining six tools is attempted without a governed decision (out of scope here; the per-collection migration pattern must make the boundary explicit).
- The MCP OAuth layer authenticates a user who is not authorized to read governance data (authentication without authorization).

## Requirements *(mandatory)*

### Functional Requirements

**One truth path**

- **FR-001**: The capability MUST establish a single normalized data path — GitHub sources → validation and normalization → PostgreSQL system of record → shared data model → dashboard and MCP — such that both consumers read the same validated, versioned snapshot from the same store for every migrated collection.
- **FR-002**: The dashboard and the MCP MUST NOT maintain competing ingestion implementations, divergent normalization rules, or separate sources of truth for the same collection.
- **FR-003**: Every migrated collection MUST cross a validation boundary that rejects malformed, out-of-vocabulary, or contract-violating source content before it can reach any consumer; validation failure MUST be recorded with enough context to identify the collection, the source location, the rule violated, and the offending content's revision.

**First vertical slice**

- **FR-004**: `get_snapshot` MUST be the first and only collection migrated to live data in the first slice; the remaining six tools MUST remain explicitly fixture-backed, and the count MUST be stated unambiguously wherever the migration state is described: seven tools total, one migrated first, six remaining.
- **FR-005**: The live snapshot MUST be sourced from the governed repository's observable state (repository identity, default-branch head commit SHA, latest commit title, observation freshness) retrieved from the live source — never authored by hand and never derived from fixtures.
- **FR-006**: Acceptance of the first slice MUST include evidence proving the served snapshot derives from validated live source content and not from fixtures, including at minimum: a served result whose source commit SHA matches the governed repository's actual head at observation time, and a demonstration that changing the live source changes the served result after the next ingestion.
- **FR-007**: The six non-migrated tools MUST be verifiably unchanged in data source during the first slice: their results MUST continue to declare fixture provenance, and tests MUST prove live and fixture modes cannot be confused (see FR-011).

**Provenance and authority contract**

- **FR-008**: Every result returned by any of the seven MCP tools, and every collection consumed by the dashboard, MUST carry a provenance envelope declaring at minimum: `dataMode` (`fixture` | `live` | `mixed`); `authoritative` (boolean); source repository; source commit SHA (or dataset/fixture version when `dataMode` is `fixture`); observation timestamp; and schema/contract version.
- **FR-009**: Any result that cannot establish governance approval or project status MUST carry an explicit warning stating so; fixture-backed results MUST declare `authoritative: false` for as long as the fixture is non-authoritative.
- **FR-010**: A result combining live and fixture content MUST declare `dataMode: mixed` and MUST declare authority per constituent collection; a mixed state MUST NEVER be presented as wholly live, at any surface (tool result, dashboard page, aggregate metric, or status summary).
- **FR-011**: Test fixtures MUST exist that prove live and fixture modes cannot be confused: a consumer or test harness presented with a result MUST be able to determine its mode from the result alone, and the test suite MUST fail if any surface serves fixture-derived content without fixture labeling or live content without live labeling.

**Validation, normalization, determinism**

- **FR-012**: Authoritative source paths within the governed repository MUST be explicitly enumerated for every migrated collection; content outside the enumerated paths MUST NOT influence served results.
- **FR-013**: Allowed status vocabularies and record shapes MUST be defined per collection; values outside the vocabulary MUST fail validation rather than being coerced, defaulted, or silently dropped.
- **FR-014**: Normalization MUST be deterministic: the same source content at the same revision, under the same contract version and normalization rules, MUST always produce byte-identical normalized snapshot content, and that content MUST be reproducible from the recorded source revision. Observation metadata (run identifiers, timestamps, snapshot version assignment) is outside the byte-identical guarantee (see SC-006).
- **FR-015**: Each validated snapshot MUST be pinned to the source commit SHA(s) it was derived from and MUST carry its own snapshot version; validated snapshots persist in the PostgreSQL system of record (Agent Zero decision, 2026-07-23), and consumers MUST be able to identify which snapshot version they are reading. A new snapshot version is created if and only if normalized content changes; a no-change ingestion run advances freshness via the ingestion record (FR-020) without creating a new version.
- **FR-016**: Caching and freshness rules MUST be explicit and are bound to the ratified numbers (Agent Zero decision, 2026-07-23): refresh runs hourly on schedule plus on-demand; a served result is stale when its freshness anchor is more than 2 hours old; and every served result past that threshold MUST carry a staleness disclosure. A consumer MUST never receive stale data presented as fresh.
- **FR-017**: Behavior for missing, malformed, stale, or contradictory source records MUST be defined per collection before that collection migrates, choosing for each an explicit policy (reject-collection, quarantine-record with disclosed incompleteness, or serve-last-known-good with staleness disclosure) — silence is not a permitted behavior.

**Failure and rollback**

- **FR-018**: When live retrieval or validation fails, the capability MUST serve the last validated snapshot with an explicit staleness disclosure; when no validated snapshot exists, it MUST serve fixture data with fixture labeling; it MUST NEVER serve unvalidated live content, a blank surface, or an unlabeled fallback.
- **FR-019**: A directed rollback to fixture-only operation MUST be possible without data repair: one governed reversion returns all seven tools and the dashboard to correctly labeled fixture service.
- **FR-020**: Ingestion outcomes (success, validation failure, retrieval failure, no-change) MUST be recorded in an append-oriented operational record persisted in the PostgreSQL system of record (Agent Zero decision, 2026-07-23), sufficient to reconstruct when each snapshot version was produced, from which source revision, and with what result.

**Security and operations**

- **FR-021**: Authentication and authorization MUST be distinct controls: authenticating as an app user MUST NOT by itself grant access to governance data; an explicit user-access policy (eligibility, allowlist or role model, revocation) MUST be defined and enforced before non-public data — or live operational data beyond the explicitly public-class snapshot fields cleared for public dashboard exposure under the ratified serving posture (Q-004; FR-027) — is exposed.
- **FR-022**: Access control MUST be enforceable at tool level: it MUST be possible to restrict individual MCP tools (or the live data they serve) to authorized principals.
- **FR-023**: Tokens presented to the MCP MUST be validated for audience: a token issued for a different resource MUST be rejected even if otherwise valid.
- **FR-024**: Live-source credentials MUST be held server-side only, scoped read-only and minimally, and MUST never appear in client-delivered code, browser storage, URLs, logs, error messages, committed configuration, or MCP results.
- **FR-025**: Rate limits MUST exist for MCP invocation, and ingestion MUST respect the live source's rate limits with defined backoff; rate-limit exhaustion MUST degrade per FR-018, never crash or silently skip.
- **FR-026**: Tool invocations and consent events MUST be auditable: an invocation log MUST record who called which tool when, sufficient for incident reconstruction, without recording secrets or token contents.
- **FR-027**: Data classification MUST be declared for each collection before it migrates; only collections cleared for the deployment's exposure level may be served live, and the public/anonymous serving posture MUST be explicitly decided (and closed if required) before live governance data is exposed.
- **FR-028**: Operational monitoring MUST cover ingestion health (last success, failure streak, staleness) and MCP serving health; a defined incident procedure MUST cover source compromise, credential leak, and serving of mislabeled data, each with a rollback path per FR-019.

**Governance and dependencies**

- **FR-029**: The dashboard's GitHub CI gate (work package P2-PRE-2, externally owned) is **COMPLETED AND OPERATIONAL** (2026-07-23), including its deliberate deny/allow control-effectiveness test; this feature MUST incorporate that recorded evidence (summarized in Accepted Baseline State) into its planning record rather than await it. Phase 2 implementation (Stage C) MUST merge through that operational gate, and no artifact in this feature may absorb or re-perform P2-PRE-2 work.
- **FR-030**: The planning artifacts in this feature folder MUST NOT be construed as implementation authority. The transition follows the three-stage model: **Stage A** — Agent Zero approves `spec.md` and `plan.md` (planning approval); **Stage B** — Agent Zero issues the explicit Gate 2 implementation directive ("Approved for implementation: \<exact spec/plan\>") — **Gate 2 IS the implementation authorization**; **Stage C** — implementation, then validation and acceptance review. `gate-2-entry-criteria.md` defines readiness-to-request-Gate-2 and contains only pre-implementation items; no implementation evidence may be a prerequisite to the Gate 2 directive.

### Key Entities

- **Governed Repository**: The live source of truth (the SDD-Core repository); identified by repository identity and commit SHAs; read-only to this capability.
- **Ingestion Run**: One observation of the governed repository: trigger, source revision(s) read, validation outcome, produced snapshot version (or failure record), timestamps.
- **Validated Snapshot**: The versioned, deterministic, contract-conformant normalized dataset produced by a successful ingestion run; the single shared source both consumers read; pinned to source revision(s); persisted in the PostgreSQL system of record (FR-015).
- **Provenance Envelope**: The per-result (and per-collection) declaration of `dataMode`, `authoritative`, source repository, source commit SHA or fixture version, observation timestamp, contract version, and any governance warning.
- **Collection**: One of the six data families served by the seven tools/dashboard (snapshot, work packages, defects, gates, decisions, metrics inputs — a closed set; the work-packages collection serves two tools); the unit of migration, validation policy, and authority declaration.
- **Contract Version**: The versioned schema and vocabulary agreement a snapshot conforms to; changes to it are governed changes.
- **Fixture Dataset**: The Phase 1 deterministic dataset; retains its role as the labeled non-authoritative fallback and the source for the six non-migrated tools during the first slice.
- **Ingestion Record**: The append-oriented operational record of ingestion runs (FR-020), persisted in the PostgreSQL system of record; the audit trail linking served snapshots to source revisions.
- **Access Policy**: The declared authorization model — who may authenticate, who may read which tools/collections, and how access is revoked (FR-021/FR-022).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any served live snapshot, the source commit SHA in its provenance envelope matches the governed repository's actual default-branch head at the recorded observation time, verifiable retroactively from the ingestion record — 100% of served live results.
- **SC-002**: 100% of results from all seven tools carry a complete provenance envelope; 0 results during the first slice present a non-migrated collection as live or omit the non-authority warning on fixture data.
- **SC-003**: Dashboard and MCP outputs for the same collection at the same snapshot version are identical — 0 divergence in any comparison test.
- **SC-004**: Under simulated source failure and validation failure, 100% of served results remain well-formed and correctly labeled (stale or fixture); 0 blank surfaces, crashes, or unlabeled fallbacks.
- **SC-005**: A directed rollback to fixture-only operation completes as a single governed action, after which all surfaces serve correctly labeled fixture data — verified by the mode-confusion test suite (FR-011) passing in fixture-only configuration.
- **SC-006**: Re-running normalization on the same recorded source revision under the same contract version reproduces the **normalized snapshot content** byte-identically — 100% of sampled snapshot versions. Determinism inputs are exactly: source content at the pinned revision, contract version, and normalization rules. Observation metadata (run identifiers, timestamps, snapshot version assignment) is excluded from the guarantee.
- **SC-007**: 0 credentials, tokens, or secret material present in client bundles, MCP results, logs, or committed configuration, verified by inspection and automated scan at acceptance.
- **SC-008**: P2-PRE-2's `Dashboard CI / required` status and its deny/allow control-effectiveness evidence are recorded in the planning record (COMPLETED, 2026-07-23 — a readiness-to-request-Gate-2 item), and Phase 2 implementation (Stage C) is not accepted unless it merged through that operational gate — the merge-path verification is a Stage C acceptance check.
- **SC-009**: An agent given only a tool result (no other context) correctly classifies its data mode and authority in 100% of trials across all seven tools in live, fixture, stale, and mixed conditions.

## Assumptions

- The governed repository for the first slice is the SDD-Core repository (`hanax-ai/sdd-core`), and its default branch head is the authoritative "current state" for the snapshot collection.
- The dashboard repository remains the Phase 1 deployment lineage (the dashboard repo's adapter seam and the CENTCOM MCP's OAuth registration), and the accepted baseline state above is the implementation starting point. The MCP's source-controlled home is proposed as the dashboard repository itself, with the dashboard and the MCP consuming the same PostgreSQL-backed normalized source through one shared server-side data service — this source binding is a `plan.md` design proposal **pending planning approval**, not a settled fact.
- Per Agent Zero's decision (2026-07-23), PostgreSQL — the existing Supabase project's managed PostgreSQL, already providing MCP OAuth — is the operational system of record for normalized snapshots, ingestion runs, provenance, access-policy state, and audit records; JSON is limited to fixtures, tests, and transient exports.
- The Phase 1 fixture dataset remains available, deterministic, and clearly versioned throughout Phase 2 to serve as fallback and as the source for non-migrated tools.
- P2-PRE-2 (dashboard CI and merge protection) was delivered by VS Code/Codex under its own work order and is **COMPLETED AND OPERATIONAL** (2026-07-23); this feature only consumes its recorded evidence (FR-029, Accepted Baseline State).
- Agent Zero remains the sole approval authority for planning acceptance, Gate 2, merges, publication, and scope changes.
- The MCP's existing OAuth 2.1 authentication layer (app-user sign-in) continues to operate; this feature adds authorization requirements on top of it rather than replacing it.
- The mixed fixture/live period is an intended, disclosed operating state, expected to persist until the remaining six tools migrate under future governed slices.
- Implementation-technology choices (languages, libraries, schedulers, hosting) are deferred to `plan.md` and are constrained there by the root constitution's articles, including the mirror-check mandate (satisfied only by a registered, pinned local mirror of the selected GitHub API source — Agent Zero decision, 2026-07-23) and the standardized data layer (PostgreSQL).

## Ambiguities & Clarifications (Clarify Phase) *(mandatory)*

| ID    | Question / [NEEDS CLARIFICATION: ...] marker | Answer | Status (Open/Resolved) | Date |
|-------|----------------------------------------------|--------|------------------------|------|
| Q-001 | Which repository is the live source for the first slice — SDD-Core, the dashboard repo, or both? | SDD-Core (`hanax-ai/sdd-core`) is the governed repository whose state `get_snapshot` reports; the dashboard repo is the serving implementation, not the observed source. Derived from WO-P2-AUTHOR-001 §2/§3 (accepted state pins SDD-Core `main` as the observed head; Phase 1 fixture snapshot already models `github:hanax-ai/sdd-core@6994bf6`). | Resolved | 2026-07-22 |
| Q-002 | Does new snapshot storage violate root Article II (PostgreSQL/Qdrant only, no ad-hoc datastores)? | No — because storage IS the mandated relational store. Agent Zero decision (2026-07-23): "PostgreSQL is the operational system of record. JSON is limited to fixtures, tests, and transient exports." Normalized snapshots, ingestion runs, provenance, access-policy state, and audit records persist in PostgreSQL (the existing Supabase managed PostgreSQL); no durable JSON/CSV persistence layer exists. The original 2026-07-22 answer (file-shaped snapshot artifact; "design avoidance") is retired per independent review Finding 1 and superseded by this decision. | Resolved | 2026-07-23 (supersedes 2026-07-22 answer) |
| Q-003 | Is the mixed fixture/live period bounded in time? | No fixed end date is specified. The mixed period ends collection-by-collection through future governed slices; FR-010's labeling discipline is the control that makes an unbounded mixed period safe. Migration of the remaining six tools requires new governed authorization (WO-P2-AUTHOR-001 authorizes planning for the transition; the first slice is `get_snapshot` only). | Resolved | 2026-07-22 |
| Q-004 | Must the public/anonymous dashboard-serving posture close before the first slice ships? | Resolved by Agent Zero decision (2026-07-23): "Permit public dashboard access only to explicitly public-class snapshot fields; keep MCP access OAuth-protected," and "No non-public collection may migrate until authorization and revocation controls are operational and validated." The first slice's snapshot fields (public repository identity, head SHA, commit title) are public-class and eligible for public dashboard serving; all MCP access remains OAuth-protected (FR-021/FR-022/FR-027 bind the controls). | Resolved | 2026-07-23 |
| Q-005 | What refresh cadence does the first slice require? | Resolved by Agent Zero decision (2026-07-23): "Run hourly scheduled reconciliation plus on-demand refresh; declare data stale after two hours." Bound at requirement level in FR-016. | Resolved | 2026-07-23 |

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs, code structure)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain in the spec body
- [x] Every row in the Ambiguities & Clarifications table has Status = Resolved
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable and technology-agnostic
- [x] Scope is clearly bounded
- [x] Assumptions and dependencies identified

### Consistency

- [x] Spec conforms to the project constitution (`../../../.specify/memory/constitution.md`) — operational-capability spec correctly homed in governance-ops (Article II routing); write surface confined to this feature folder (Article I)
- [x] Spec conforms to the global constitution (`../../../../../.specify/memory/constitution.md`) — see Q-002 (Article II — PostgreSQL system of record per Agent Zero decision 2026-07-23), plan.md Constitution Check (Articles I–V)
- [x] Project instructions were consulted (`../../../knowledge/instructions.md`) — context loaded in the prescribed order; summarize-then-cite applied to source documents

*Checklist scope note (R1)*: the checks above assert internal completeness and consistency of this specification only. They do not assert planning approval (Stage A, pending), Gate 2 (Stage B, not requested), or implementation authority (not granted). The internal authoring-time critic findings were resolved pre-handoff; the independent review's five blocking findings are addressed by this R1 revision and await re-review.

---

*Next step: independent re-review of the remediated package (WO-P2-AUTHOR-001-R1), then Agent Zero's Stage A planning approval decision. Implementation authority is expressly NOT requested and NOT granted by this document; Gate 2 — Agent Zero's explicit implementation directive — has not been requested — see `implementation-authorization-boundary.md`.*
