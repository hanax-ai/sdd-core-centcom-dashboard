# Data Model: CENTCOM Phase 2 — Live GitHub Data Truth Path

**Feature Directory**: `projects/governance-ops/docs/specs/002-centcom-phase-2-live-github-ingestion/` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 (WO-P2-AUTHOR-001-R1) | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Work order**: WO-P2-AUTHOR-001 — planning and authoring only; revised under **WO-P2-AUTHOR-001-R1** (planning-artifact remediation only, 2026-07-23). This data model is a Phase 1 design artifact (plan.md, Phase 1: Design & Contracts). **It does not grant, imply, or request implementation authority** (see `implementation-authorization-boundary.md`); planning approval (Stage A) is pending and Gate 2 (Stage B) has not been requested or granted.

## Purpose and Modeling Conventions

This document defines the conceptual data model for the nine key entities named in spec.md (Key Entities). It is deliberately type-agnostic: field types are described by role (identifier, timestamp, enumerated value, boolean, text, reference) rather than by any implementation type system. The model is, however, precise enough that the contract schemas (`contracts/provenance-envelope.md` v1.2.0, `contracts/snapshot-collection.md` v1.2.0) and their eventual Zod realizations (tasks.md T012, `[EXT]`; Stage C work, executable only after Agent Zero's Stage B Gate 2 directive) can be derived from it without reinterpretation.

Field requirement levels:

- **Required** — must be present on every instance.
- **Conditional** — must be present when the stated condition holds; must be absent (not defaulted, not null-padded) otherwise.
- **Optional** — may be present; absence carries no meaning beyond absence.

Schema-derivation rules that apply to every entity below:

1. **Closed shapes**: contract schemas derived from this model reject unknown fields; malformed or extra content fails validation rather than passing through (FR-003).
2. **Closed vocabularies**: every enumerated value set in this model is exhaustive; values outside the set fail validation and are never coerced, defaulted, or silently dropped (FR-013).
3. **Determinism**: no field's value may depend on wall-clock reads or randomness at normalization time; the observation timestamp is injected exactly once per ingestion run and recorded in the ingestion record (FR-014, tasks.md T015). The sole permitted serving-time clock use in the entire design is freshness classification by the shared data service (state model S-02).
4. **Honesty over completeness**: when a value cannot be established, the model requires an explicit disclosure field (staleness, governance warning), never a fabricated or defaulted value (FR-009, FR-016, FR-018).

**Persistence rule (root Article II; Agent Zero decision, 2026-07-23)**: every durable entity below is persisted in **PostgreSQL** — a dedicated non-public application schema (working name `centcom`) in the existing managed-PostgreSQL (Supabase) instance, with source-controlled migrations and least-privilege roles (reconciliation writer; serving read-only) — see plan.md Technical Context and Constitution Check Article II. PostgreSQL holds the normalized snapshots, ingestion runs, provenance, access-policy state, and audit records. JSON is limited to **fixtures, tests, and transient exports**; no JSON file, object-store export, or other file-shaped artifact is ever durable application state. Conceptual fields below use camelCase; where the relation shape is design-binding, the PostgreSQL realization (snake_case columns) is noted on the entity.

## Entity Relationship Overview

```text
Governed Repository ──(observed by)──▶ Ingestion Run
   (read-only source)                  (reconciliation runtime — the scheduled/on-demand WRITE path)
                                            │
                                            │ every run appends one row (E-08)
                                            ▼
              ┌── PostgreSQL system of record — dedicated `centcom` schema ──────────┐
              │  ingestion_runs (E-08) ──(derives)──▶ last_verified_at anchor        │
              │  snapshots (E-03; on outcome: published) ──(conforms to)──▶ E-06     │
              │  access-policy state (E-09) · audit records (FR-026)                 │
              └──────────────────────────────┬───────────────────────────────────────┘
                                             │ (READ path)
                                             ▼
                          shared server-side data service
                  (single normalization + envelope path, FR-001/FR-002)
                                             │
                          transient versioned response (per request;
                          JSON here is a transient export, never a store)
                                   ┌─────────┴─────────┐
                                   ▼                   ▼
                           dashboard adapter        MCP tools
                                   │                   │
                                   └── Provenance Envelope on every served result
                                             ▲
                                             │ (access to tools/collections gated by)
                                       Access Policy (E-09)

Fixture Dataset ──(fixture-backed source for the five non-migrated collections;
                   terminal fallback of the FR-018 ladder)──▶ shared data service
```

One truth path (FR-001): the Governed Repository is observed by an Ingestion Run executed by the reconciliation runtime — a server-side component separate from all serving, running hourly on schedule plus on-demand, never in a browser and never inside an MCP request (plan.md). Every run appends one row to the Ingestion Record in the PostgreSQL system of record; a run whose normalized content differs from the currently published snapshot publishes a new Validated Snapshot row (state model S-01). Both consumers read through the same shared server-side data service (`[EXT] src/server/centcom-data/`, plan.md Structure Decision): the service selects the newest published snapshot (or the fixture source, per collection), classifies freshness against the stored `last_verified_at` anchor (state model S-02), and returns a **transient versioned response** — the dashboard hydrates its Phase 1 adapter from that response, and the MCP tools serve it directly; every served result carries a Provenance Envelope. No browser or client context ever holds PostgreSQL credentials, and neither consumer maintains its own ingestion or normalization path (FR-002). The Fixture Dataset remains the labeled, non-authoritative source for the six non-migrated tools during the first slice and the fallback of last resort (FR-004, FR-018).

---

## Entities

### E-01 Governed Repository

**Purpose**: The live source of truth this capability observes — for the first slice, the SDD-Core repository (`hanax-ai/sdd-core`, spec.md Q-001). The capability holds no write path to it; it is read-only in every mode of operation (FR-024, plan.md Constraints).

| Field | Requirement | Description |
|---|---|---|
| `repositoryIdentity` | Required | Stable identifier of the repository (owner and name). First slice value: `hanax-ai/sdd-core`. |
| `defaultBranch` | Required | Name of the branch whose head constitutes the authoritative "current state" for the snapshot collection (spec.md Assumptions). |
| `headCommitSha` | Required at observation | Full commit identifier of the default-branch head as observed by an ingestion run. Must resolve to a real commit in the named repository (SC-001, User Story 4). |
| `headCommitTitle` | Required at observation | Title line of the head commit as observed (FR-005; research.md R-2). |
| `authoritativeSourcePaths` | Required per migrated collection | The explicit enumeration of paths within the repository that may influence served results for each migrated collection (FR-012). For the snapshot collection, the observed surface is repository identity, default-branch head commit, and head commit title — no file-content paths are read in the first slice (research.md R-2; `contracts/snapshot-collection.md`). |
| `accessMode` | Required | Always `read-only`. The capability never writes to the governed repository. |

**Relationships**: observed by **Ingestion Run** (one repository, many runs); named as `sourceRepository` in every live **Provenance Envelope**; its enumerated paths scope each live **Collection**.

**Validation rules**:

- Content outside `authoritativeSourcePaths` must not influence any served result (FR-012).
- An unresolvable or malformed head commit identifier is a retrieval-stage failure, not a servable value (FR-018; spec.md Edge Cases — force-push/rewritten head).
- The repository identity in served results must match this entity exactly; no aliasing (SC-001).

---

### E-02 Ingestion Run

**Purpose**: One observation of the governed repository: its trigger, what was read, whether it validated, and what it produced (spec.md Key Entities). The unit of operational accountability — every run leaves exactly one row in the **Ingestion Record** (FR-020). Runs execute in the reconciliation runtime, a server-side component distinct from MCP and dashboard serving (write path vs. read paths, plan.md); the hourly scheduled job and the on-demand refresh invoke the **same** ingestion operation.

| Field | Requirement | Description |
|---|---|---|
| `runId` | Required | Unique, orderable identifier of the run. |
| `trigger` | Required | Enumerated: `scheduled` \| `on-demand`. Cadence and trigger set are ratified: hourly scheduled runs plus on-demand refresh (FR-016; Agent Zero decision 2026-07-23, spec.md Q-005). |
| `state` | Required | Current lifecycle state per state model S-01 below. |
| `startedAt` | Required | Timestamp at which the run began. |
| `completedAt` | Conditional — terminal states only | Timestamp at which the run reached a terminal state. |
| `observedAt` | Conditional — assigned once upon successful observation | The single observation timestamp for this run, injected exactly once and reused everywhere the run's output is stamped (FR-014; tasks.md T015). On every successful outcome — `published` or `no-change` — it becomes the new value of the derived freshness anchor `last_verified_at` (E-08; state model S-02). |
| `sourceRevisions` | Conditional — from successful fetch onward | The repository identity and commit identifier(s) actually read (FR-015 pinning input; SC-001). |
| `outcome` | Conditional — terminal states only | Enumerated: `published` \| `failed-retrieval` \| `failed-validation` \| `no-change` (FR-020). |
| `producedSnapshotVersion` | Conditional — outcome `published` only | Reference to the **Validated Snapshot** this run produced. |
| `failureContext` | Conditional — outcomes `failed-retrieval` / `failed-validation` only | Enough context to identify the collection, the source location, the rule violated, and the offending content's revision (FR-003). Never contains secret material (FR-024, FR-026). |
| `rateLimitEvents` | Optional | Operational annotations of throttling and backoff encountered during the run (FR-025; spec.md Edge Cases — mid-run rate limiting). |

**Relationships**: observes one **Governed Repository**; appends exactly one row to the **Ingestion Record** (its durable PostgreSQL realization — see E-08); on `published`, produces exactly one **Validated Snapshot**.

**Validation rules**:

- Every terminal state is recorded — success, validation failure, retrieval failure, and no-change alike; silence is not a permitted behavior (FR-020, FR-017).
- A `no-change` outcome records the run (with its own `observedAt`, advancing `last_verified_at`) and creates **no** new snapshot version; a new snapshot version is created **if and only if** normalized content changes (FR-015, FR-020; state model S-01; spec.md Edge Cases; tasks.md T009).
- Observation timestamps must be monotonic per run sequence, enforced at ingestion validation; a run whose `observedAt` is not strictly later than its predecessor's fails validation per `contracts/snapshot-collection.md` V-6, and the prior snapshot is retained (fallback P-2) (spec.md Edge Cases).
- **Runs are serialized — single-flight per collection**: the reconciliation runtime holds a PostgreSQL transactional advisory lock (`pg_advisory_xact_lock`, keyed per collection) — or an equivalent serializable-transaction strategy bound at T015 — for the entire observe → validate → normalize → publish sequence. The observation timestamp is injected only **after** the lock is acquired, so an overlapping scheduled and on-demand run can never both validate against the same predecessor and commit out of order: the later run waits, then observes current state. Application-level V-6 validation and the E-08 database-side monotonic guard remain in force beneath the lock as defense in depth.
- No partially produced output of an in-flight run is ever observable by a consumer (atomic transactional publish; spec.md Edge Cases; tasks.md T015).

---

### E-03 Validated Snapshot

**Purpose**: The versioned, deterministic, contract-conformant normalized dataset produced by a `published` ingestion run — the single shared dataset both consumers read (FR-001; plan.md Summary). Persisted in the PostgreSQL system of record: conceptually the **`snapshots` relation** of the dedicated `centcom` schema, one row per snapshot version, **append-only** — published versions are never rewritten or deleted (FR-015; Agent Zero decision 2026-07-23; plan.md Constitution Check Article II). A new version exists if and only if normalized content changed (state model S-01). JSON representations of a snapshot exist only as fixtures, test data, or transient serving exports — never as a durable store.

| Field | Requirement | Description |
|---|---|---|
| `snapshotVersion` | Required | Unique, orderable version identifier of this snapshot, assigned at publication. Consumers must be able to identify which snapshot version they are reading (FR-015). A new version is assigned if and only if normalized content changed. |
| `contractVersion` | Required | Reference to the **Contract Version** this snapshot conforms to (FR-008; FR-015). |
| `sourcePins` | Required | The source commit identifier(s), per governed repository, from which this snapshot was derived (FR-015). For the first slice: the observed default-branch head of `hanax-ai/sdd-core`. |
| `observedAt` | Required | The producing run's single observation timestamp (FR-014). Note: on served results the envelope's `observedAt` is the freshness anchor `last_verified_at` (E-08; state model S-02), which may be later than this value after subsequent `no-change` runs. |
| `producedByRunId` | Required | Reference to the producing **Ingestion Run**, linking the snapshot into the audit trail (FR-020; User Story 4). |
| `collections` | Required | The normalized collection payloads this snapshot carries, each conformant to the contract's shape and vocabulary (FR-013). First slice: the snapshot collection only. |
| `contentDigest` | Optional | An integrity digest over the stored normalized content, supporting byte-identical reproduction checks (FR-014; SC-006). |

**PostgreSQL realization (conceptual columns)**: `snapshot_version`, normalized content (the collection payloads), `source_commit_sha`, `contract_version`, `created_by_run`, the recorded observation instant, and the optional content digest.

**Relationships**: produced by exactly one **Ingestion Run**; conforms to exactly one **Contract Version**; serves as the live source for migrated **Collections**, read exclusively through the shared data service; described to consumers through the **Provenance Envelope**.

**Validation rules**:

- Determinism (SC-006, narrowed): re-running normalization on the same recorded source revision under the same contract version reproduces the stored **normalized snapshot content** byte-identically. Determinism inputs are exactly: source content at the pinned revision, contract version, and normalization rules. Observation metadata — run identifiers, timestamps, snapshot version assignment — is outside the guarantee (FR-014; tasks.md T007). The byte-identical boundary is the stored normalized content at rest, per snapshot version, in PostgreSQL (state model S-02).
- Publication is atomic — a single transaction: the previously published snapshot remains the served snapshot until the new row is committed; no partial write is ever observable (FR-018; spec.md Edge Cases).
- Supersession is strictly by publication order: the newest published snapshot is served; superseded rows are retained (append-only) as last-known-good for failure fallback (FR-018; state model S-02).
- Content that fails shape or vocabulary validation never enters a snapshot (FR-003, FR-013).

---

### E-04 Provenance Envelope

**Purpose**: The per-result (and, for mixed results, per-collection) declaration that makes provenance and authority unavoidable to humans and models (User Story 2). Every result returned by any of the seven MCP tools, and every collection consumed by the dashboard, carries one (FR-008; SC-002). The envelope alone must suffice to determine data mode, authority, source, revision, observation time, and contract version without external documentation (User Story 2, scenario 3; SC-009). Full field semantics and composition rules: `contracts/provenance-envelope.md` v1.2.0.

| Field | Requirement | Description |
|---|---|---|
| `dataMode` | Required | Enumerated: `fixture` \| `live` \| `mixed` (FR-008). A mixed state is never presented as wholly live, at any surface (FR-010). |
| `authoritative` | Required | Boolean. Fixture-backed results declare `false` for as long as the fixture is non-authoritative (FR-009). |
| `sourceRepository` | Required | Identity of the repository the content derives from (`live`) or models (`fixture`) — first slice: `hanax-ai/sdd-core`. |
| `sourceCommitSha` | Conditional — required when `dataMode` is `live`; required per live constituent when `mixed` | The pinned source commit identifier the content derives from (FR-008, FR-015; SC-001). When `dataMode` is `fixture`, the dataset version (below) is the revision reference instead. |
| `observedAt` | Required | For `live` results: the stored freshness anchor `last_verified_at` — the `observedAt` of the latest successful ingestion run (`published` or `no-change`), read from PostgreSQL, never the serving clock (E-08; state model S-02); it matches the ingestion record (SC-001; User Story 4). For `fixture` results: the dataset's declared reference time. |
| `contractVersion` | Required — on the top-level envelope **and on every mixed-mode constituent** | The **Contract Version** the result conforms to (FR-008; `contracts/provenance-envelope.md` v1.2.0). |
| `datasetVersion` | Conditional — required when `dataMode` is `fixture`; required per fixture constituent when `mixed` | The **Fixture Dataset** version the content derives from (FR-008; FR-009). |
| `governanceWarning` | Conditional — required whenever the result cannot establish governance approval or project status; always present on non-authoritative fixture results | Explicit human- and model-readable warning text (FR-009; User Story 2, scenario 1). |
| `stale` | Required | Boolean. Whether the freshness anchor's age exceeds the ratified 2-hour staleness threshold, computed at serving time by the shared data service from `last_verified_at` (FR-016; state model S-02). Required on every envelope — freshness is never inferred from a missing field. Together with `thresholdExceededBy`, one of the only two response fields that may legitimately vary between servings of the same snapshot version. |
| `thresholdExceededBy` | Conditional — required when `stale` is `true`; absent when `stale` is `false` | ISO 8601 duration by which the staleness threshold is exceeded — the explicit disclosure of FR-016/FR-018, served with the unchanged `observedAt` (User Story 3, scenario 1). |
| `collections` | Conditional — required when `dataMode` is `mixed` | Per-constituent declaration for each constituent collection: `dataMode`, `authoritative`, and the constituent's own **required** `contractVersion`, plus the constituent source, observation, and staleness fields defined in `contracts/provenance-envelope.md` v1.2.0 (FR-008, FR-010; User Story 2, scenario 2). |

Note: the envelope carries no `snapshotVersion` field. FR-015's consumer-visible snapshot version is carried in the collection payload — `snapshotVersion` is a sibling of `provenance` in the validated snapshot shape (`contracts/snapshot-collection.md` §3, §7) — not in the envelope.

**Relationships**: wraps every result served from a **Validated Snapshot** or the **Fixture Dataset**; declares the **Contract Version**; for mixed results, declares authority (and contract version) per **Collection**.

**Validation rules**:

- No result omits the envelope; a missing or incomplete envelope is a contract-test failure, not a degraded success (FR-008; SC-002; tasks.md T004).
- The mode-confusion suite must be able to classify any result from the envelope alone, across live, fixture, stale, and mixed conditions (FR-011; SC-009; tasks.md T006).
- Conditional fields are mutually constrained: `live` requires `sourceCommitSha`; `datasetVersion` is required when `fixture` and permitted as informational-only otherwise (`contracts/provenance-envelope.md`); `fixture` additionally requires `governanceWarning` while the fixture is non-authoritative; `mixed` requires `collections`, and every constituent carries its own required `contractVersion` (FR-008, FR-009, FR-010).
- Envelope construction and verification live in the shared server-side data service used by both consumers — never re-derived independently (FR-002; plan.md Structure Decision; tasks.md T014).

---

### E-05 Collection

**Purpose**: One of the data families served by the tools and the dashboard — the unit of migration, validation policy, and authority declaration (spec.md Key Entities). The migration count is stated unambiguously wherever migration state is described: **seven tools total; one (`get_snapshot`) migrated to live first; six remaining explicitly fixture-backed during the first slice** (FR-004).

| Field | Requirement | Description |
|---|---|---|
| `collectionId` | Required | Stable identifier of the data family (registry below). |
| `servedByTools` | Required | The MCP tool(s) and dashboard surface(s) that serve this collection. Tool-to-collection mapping is fixed in the contracts; each tool result still carries its own envelope. |
| `migrationState` | Required | Enumerated per state model S-03: `fixture-backed` \| `live`. Surfaced from data, never hardcoded copy (tasks.md T016). |
| `authoritativeSourcePaths` | Conditional — required when `migrationState` is `live` | The enumerated governed-repository paths/surfaces this collection may derive from (FR-012). |
| `recordShape` | Required | The contract-defined shape of this collection's records (FR-013). |
| `statusVocabulary` | Required | The closed set of allowed status values; out-of-vocabulary values fail validation (FR-013). |
| `anomalyPolicy` | Required before migration | Enumerated, chosen per collection: `reject-collection` \| `quarantine-record` \| `serve-last-known-good` — the declared behavior for missing, malformed, stale, or contradictory source records (FR-017). |
| `dataClassification` | Required before migration | Declared classification, evaluated under the ratified serving posture (Agent Zero decision 2026-07-23, spec.md Q-004): public dashboard access is limited to explicitly public-class snapshot fields; MCP access remains OAuth-protected; no non-public collection migrates until authorization and revocation controls are operational and validated (FR-027). |
| `authorityDeclaration` | Required | Per-collection authority statement used in mixed-mode composition (FR-010). |

**Collection registry (first slice)**:

| Collection | Served by | Migration state (first slice) |
|---|---|---|
| snapshot | `get_snapshot`; dashboard overview | **live** (the first vertical slice, FR-004/FR-005) |
| work packages | `list_work_packages`, `get_work_package` | fixture-backed (pinned) |
| defects | `list_defects` | fixture-backed (pinned) |
| gates | `list_gates` | fixture-backed (pinned) |
| decisions | `list_decisions` | fixture-backed (pinned) |
| metrics inputs | `get_metrics` | fixture-backed (pinned) |

**Relationships**: sourced from either the **Validated Snapshot** (when `live`, read from PostgreSQL through the shared data service) or the **Fixture Dataset** (when `fixture-backed`) — never both simultaneously for the same collection; scoped by the **Governed Repository**'s enumerated paths; access-gated by the **Access Policy**; its authority declared in the **Provenance Envelope**.

**Validation rules**:

- The five fixture-backed collections (serving the six non-migrated tools) are verifiably unchanged in data source during the first slice; their results continue to declare fixture provenance (FR-007; tasks.md T019).
- A collection may not enter `live` state until its `anomalyPolicy` (FR-017), `dataClassification` (FR-027), `authoritativeSourcePaths` (FR-012), and contract shape/vocabulary (FR-013) are defined and its migration is separately governed (state model S-03; spec.md Q-003).
- Source selection is per-collection configuration data, so rollback is a configuration reversion, not a data repair (FR-019; tasks.md T016).

---

### E-06 Contract Version

**Purpose**: The versioned schema and vocabulary agreement a snapshot — and every served result — conforms to. Changes to it are governed changes (spec.md Key Entities).

| Field | Requirement | Description |
|---|---|---|
| `versionId` | Required | Unique, orderable version identifier, carried verbatim in every envelope — top-level and per mixed-mode constituent (FR-008). Current contract versions: provenance-envelope v1.2.0; snapshot-collection v1.2.0. |
| `schemaRef` | Required | Reference to the governing contract documents (`contracts/provenance-envelope.md` v1.2.0, `contracts/snapshot-collection.md` v1.2.0). Each embedded JSON Schema carries a stable `$id` URN (`urn:centcom:contract:<name>:<version>`, e.g. `urn:centcom:contract:provenance-envelope:1.2.0`); every cross-schema `$ref` resolves to a `$id` URN — never to a document file path — and resolvability is proven by the schema-compilation validation task (tasks.md T011; test-strategy.md). |
| `vocabularies` | Required | The closed status vocabularies and enumerations in force for each collection under this version (FR-013). |
| `effectiveFrom` | Optional | When this version took effect. |
| `supersedes` | Optional | Reference to the prior contract version. |
| `changeRecord` | Required | Reference to the governed decision that authorized the version change (spec.md Key Entities; User Story 5). For the v1.1.0 bumps: the WO-P2-AUTHOR-001-R1 remediation record. For the v1.2.0 bumps: Agent Zero's coordinated-bump approval recorded in `coderabbit-finding-disposition.md` (2026-07-23). |

**Relationships**: referenced by every **Validated Snapshot** and every **Provenance Envelope** (including mixed-mode constituents); defines the `recordShape` and `statusVocabulary` of each **Collection**.

**Validation rules**:

- A snapshot conforms to exactly one contract version; mixed-version snapshots do not exist (FR-015).
- An unrecognized contract version in a served result is a contract-test failure (tasks.md T004/T005).
- Contract changes without a governed change record are a specification violation, not a permitted fast path (User Story 5).

---

### E-07 Fixture Dataset

**Purpose**: The Phase 1 deterministic dataset, retained in two roles: the labeled non-authoritative source for the six non-migrated tools during the first slice, and the fallback of last resort when no validated snapshot exists (spec.md Key Entities; FR-004, FR-018; spec.md Assumptions). Fixtures are a permitted JSON role under the persistence rule — fixtures, tests, and transient exports only.

| Field | Requirement | Description |
|---|---|---|
| `datasetVersion` | Required | Version identifier of the fixture dataset, carried as the revision reference in fixture-mode envelopes (FR-008). |
| `content` | Required | The deterministic, clearly versioned Phase 1 dataset (spec.md Assumptions). |
| `modeledSource` | Required | The repository and revision the fixture models (Phase 1 models `hanax-ai/sdd-core` at a pinned baseline) — labeling context only; never a claim of live derivation. |
| `authorityDefaults` | Required | The fixed provenance posture of fixture service: `authoritative: false` plus the governance warning, for as long as the fixture is non-authoritative (FR-009). |
| `canaryMarker` | Optional (recommended) | A marker value present only in fixture content and never valid in live content, enabling the mode-confusion suite's fixture-poisoning check: the marker must never appear in any result labeled `live` (FR-011; research.md R-6; tasks.md T006). |

**Relationships**: the `fixture-backed` source for five **Collections** (serving the six non-migrated tools) during the first slice; the terminal fallback in the failure ladder of every collection (FR-018); the target state of rollback (FR-019); referenced by `datasetVersion` in **Provenance Envelopes**.

**Validation rules**:

- Fixture-derived content served without fixture labeling is a test-suite failure (FR-011; SC-002).
- The dataset remains available, deterministic, and versioned throughout Phase 2 (spec.md Assumptions); a fixture change is a dataset version change, never a silent edit.
- Rollback to fixture-only service must require no modification of this dataset — it is always ready to serve, correctly labeled (FR-019; SC-005; tasks.md T010).

---

### E-08 Ingestion Record

**Purpose**: The append-only operational record of ingestion runs — the audit trail linking every served snapshot to the source revision and run that produced it (FR-020; spec.md Key Entities). Persisted in the PostgreSQL system of record: conceptually the **`ingestion_runs` relation** of the dedicated `centcom` schema — one row per ingestion run, insert-only under the least-privilege reconciliation writer role; rows are never rewritten or deleted (Agent Zero decision 2026-07-23; plan.md Constitution Check Article II; project constitution record discipline, plan.md Project Constitution Gate Article III).

| Field | Requirement | Description |
|---|---|---|
| `runId` | Required | Unique, orderable identifier of the row — the **Ingestion Run** it records. Row order reconstructs the run sequence. |
| `trigger` | Required | `scheduled` \| `on-demand` — the run's trigger, preserved for operational accountability (E-02; FR-016). |
| `outcome` | Required | `published` \| `failed-retrieval` \| `failed-validation` \| `no-change` (FR-020). |
| `sourceRevisions` | Conditional — when observation succeeded | Repository identity and commit identifier(s) read (SC-001). |
| `snapshotVersion` | Conditional — outcome `published` only | The snapshot version produced (reference into E-03's `snapshots` relation). |
| `startedAt` / `completedAt` / `observedAt` | Required / Required / Conditional | Run timestamps, sufficient to reconstruct when each snapshot version was produced (FR-020). |
| `failureContext` | Conditional — failure outcomes only | The FR-003 failure context (collection, source location, rule violated, offending revision). No secret material, ever (FR-024, FR-026). |

**Derived anchor — `last_verified_at`**: the `observedAt` of the latest successful run (`published` **or** `no-change`), held in PostgreSQL as a derived property of this relation (whether maintained as a column or computed by query is an implementation choice; the definition binds). It is the single freshness anchor of the design: state model S-02 classifies freshness by comparing it against the serving clock; the envelope's `observedAt` equals it on live results; a `no-change` run advances it without creating a snapshot version (FR-015, FR-016, FR-020).

**Relationships**: receives exactly one row per **Ingestion Run**; grounds retroactive verification of every **Provenance Envelope**'s `sourceCommitSha` and `observedAt` (SC-001; User Story 4); supplies `last_verified_at` to the shared data service's serving-time staleness computation (tasks.md T014) and to operational monitoring — last success, failure streak, staleness (FR-028; tasks.md T025).

**Validation rules**:

- Sufficient to reconstruct when each snapshot version was produced, from which source revision, and with what result — for 100% of served live results (FR-020; SC-001).
- Append-only (insert-only) integrity: a rewritten or missing row is an audit finding, not a tolerable gap.
- **Database-side monotonic guard**: the store itself — a trigger or constraint on `ingestion_runs` insert (T013 migration) — rejects any successful row (`published` or `no-change`) whose `observedAt` is not strictly later than the current maximum successful `observedAt`, and each `snapshots` row commits in the same transaction as its producing run row. `last_verified_at` therefore cannot regress and snapshots cannot publish out of order even if application-level validation (V-6) or run serialization (E-02) were bypassed.
- Contains no credentials, tokens, or secret material (FR-024; SC-007).

---

### E-09 Access Policy

**Purpose**: The declared authorization model — who may authenticate, who may read which tools and collections, and how access is revoked (FR-021, FR-022; spec.md Key Entities). Authorization is a distinct control layered on the existing OAuth authentication surface, never replaced by it (spec.md Assumptions; research.md R-5; spec.md Edge Cases — authentication without authorization). Access-policy state, and the FR-026 invocation/consent audit records its enforcement produces, are persisted in the PostgreSQL system of record (`centcom` schema) alongside snapshots and ingestion runs; audit rows are append-only (plan.md Storage).

| Field | Requirement | Description |
|---|---|---|
| `policyVersion` | Required | Version identifier of the policy in force. |
| `eligibilityModel` | Required | The declared model — allowlist or role-based — determining which authenticated principals are eligible for governance data access (FR-021). |
| `grants` | Required | Per-tool and/or per-collection access grants for principals; individual MCP tools (or the live data they serve) must be restrictable to authorized principals (FR-022). |
| `revocation` | Required | The defined revocation procedure and its effect timing (FR-021). |
| `tokenAudience` | Required | The audience a presented token must be issued for; a token issued for a different resource is rejected even if otherwise valid (FR-023). |
| `exposurePosture` | Required | The deployment's ratified exposure posture (Agent Zero decision 2026-07-23, spec.md Q-004): public dashboard access limited to explicitly public-class snapshot fields; MCP access OAuth-protected. Evaluated against each collection's `dataClassification` before that collection may serve live (FR-027). |

**Relationships**: gates access to **Collections** and the tools that serve them; consumes each collection's `dataClassification`; its enforcement events feed the invocation audit log (FR-026; tasks.md T021, T025).

**Validation rules**:

- Authenticating as an app user grants nothing by itself; an explicit grant under this policy is required before non-public data — or live operational data beyond the explicitly public-class snapshot fields cleared under the ratified serving posture (`exposurePosture`; spec Q-004, FR-027) — is exposed (FR-021).
- Audience-mismatched tokens are rejected (FR-023).
- A collection whose classification exceeds `exposurePosture` must not migrate to live until authorization and revocation controls are operational and validated (FR-027; spec.md Q-004).
- Policy enforcement is auditable without recording secrets or token contents (FR-026).

---

## State-Transition Models

### S-01 Ingestion Run Lifecycle

```text
                 ┌────────────┐
   trigger ────▶ │ triggered  │
                 └─────┬──────┘
                       ▼
                 ┌────────────┐   retrieval fails / source unreachable /
                 │  fetching  │──▶ head unresolvable / rate-limit exhaustion ──▶ ● failed-retrieval
                 └─────┬──────┘
                       ▼
                 ┌────────────┐   shape or vocabulary violation
                 │ validating │──▶ (rejected at the boundary)  ──────────────▶ ● failed-validation
                 └─────┬──────┘
                       ▼
                 ┌─────────────┐  normalized output identical
                 │ normalizing │─▶ to current snapshot ───────────────────────▶ ● no-change
                 └─────┬───────┘
                       ▼
                 ● published
```

Terminal states: `published` | `failed-retrieval` | `failed-validation` | `no-change`.

| Transition | Guard | Traceability |
|---|---|---|
| `triggered → fetching` | Run admitted under the ratified cadence/trigger set (hourly scheduled + on-demand) and source rate-limit budget | FR-016, FR-025 |
| `fetching → failed-retrieval` | Source unreachable, credentials invalid/expired/under-scoped, head unresolvable, or rate-limit exhaustion after defined backoff | FR-018, FR-025; spec.md Edge Cases |
| `fetching → validating` | Raw source content retrieved; `sourceRevisions` recorded | FR-015; SC-001 |
| `validating → failed-validation` | Content is malformed, out-of-vocabulary, or contract-violating; rejected at the validation boundary with full FR-003 failure context | FR-003, FR-013; User Story 3, scenario 3 |
| `validating → normalizing` | Content passes shape and vocabulary validation against the current **Contract Version** | FR-013 |
| `normalizing → no-change` | Deterministic normalized output is identical to the currently published snapshot's stored content; the run is recorded with outcome `no-change` and its own `observedAt`, advancing `last_verified_at`; **no new snapshot version is created** | FR-014, FR-015, FR-020; spec.md Edge Cases |
| `normalizing → published` | Normalized content differs from the currently published snapshot; a new **Validated Snapshot** row is inserted and published atomically in one transaction, superseding the prior snapshot | FR-014, FR-015, FR-018 |

**Invariants**:

1. Every terminal state appends exactly one **Ingestion Record** row (FR-020).
2. Both failure states leave the previously published snapshot in service, unchanged (FR-018; SC-004).
3. No intermediate state's partial output is ever observable by any consumer (atomic transactional publish; spec.md Edge Cases; tasks.md T015).
4. A new snapshot version exists **if and only if** normalized content changed; freshness advances via the run record and its derived `last_verified_at` anchor, never via version churn (FR-015, FR-020; state model S-02; tasks.md T009).
5. `failed-retrieval` and `failed-validation` never crash or blank a consumer surface; the serving ladder of FR-018 (last-known-good with staleness disclosure → labeled fixture) absorbs them (SC-004; tasks.md T008).
6. Runs are serialized (single-flight per collection, E-02): concurrent scheduled and on-demand triggers cannot interleave the observe → publish sequence, and the E-08 database-side monotonic guard rejects any anchor regression or out-of-order publication that serialization failed to prevent.

### S-02 Snapshot Freshness States

Freshness is a **derived** property of served results, anchored to a single stored timestamp: **`last_verified_at`** — the `observedAt` of the latest successful ingestion run (`published` or `no-change`), held in PostgreSQL (E-08). Classification is computed **at serving time by the shared server-side data service**, comparing the stored anchor against the serving clock; this comparison is the **only** permitted serving-time clock use in the design (`contracts/provenance-envelope.md` v1.2.0). Nothing about freshness is persisted as snapshot content, so no ingestion is needed for a served result to become stale. `fresh`, `aging`, and `stale` are **internal derived states**, not carried in the envelope: the envelope carries only the boolean `stale` field (plus `thresholdExceededBy` when `true`), and its `observedAt` is the stored `last_verified_at` — never the serving clock.

```text
        age ≤ 1 h               1 h < age ≤ 2 h                 age > 2 h
  ┌───────────┐          ┌───────────┐                    ┌───────────┐
  │   fresh   │ ───────▶ │   aging   │ ─────────────────▶ │   stale   │
  └───────────┘  (time)  └───────────┘       (time)       └───────────┘
        ▲                                                       │
        └── new successful run (published or no-change) ────────┘
                     advances last_verified_at

  age = serving instant − stored last_verified_at
        (computed by the shared data service at serving time)
```

| State | Definition | Serving obligation |
|---|---|---|
| `fresh` | Age (serving instant − `last_verified_at`) is within the hourly cadence | Served normally with full envelope (`stale: false`) |
| `aging` | Age exceeds the cadence but not the 2-hour staleness threshold | Served with `stale: false`; internal state only — no envelope field distinguishes it from `fresh` |
| `stale` | Age exceeds the 2-hour staleness threshold | Served **only** with `stale: true` plus `thresholdExceededBy` in the envelope and the unchanged `observedAt` (= `last_verified_at`) — never presented as fresh (FR-016, FR-018; User Story 3, scenario 1) |

**Ratified numbers**: hourly scheduled refresh plus on-demand runs; staleness threshold **2 hours** after `last_verified_at` (Agent Zero decision 2026-07-23; FR-016; spec.md Q-005; research.md R-4). This model binds both the behavior — no stale-as-fresh, ever — and, as of this revision, the numbers.

**Determinism boundary**: the byte-identical guarantee applies to **stored normalized snapshot content at rest, per snapshot version, in PostgreSQL** (SC-006; E-03). A transient response is deterministic given (snapshot version, `last_verified_at`, serving-instant classification); the exhaustive list of legitimately varying response fields is `stale` and `thresholdExceededBy` — every other envelope and content field derives from stored state.

**Invariants**:

1. Time only moves service toward `stale`; only a successful run (`published` or `no-change`), by advancing `last_verified_at`, returns service to `fresh` (spec.md Edge Cases — no-change runs).
2. Stale results carry `stale: true` plus `thresholdExceededBy` in their **Provenance Envelope**; `aging` is internal only and appears in no envelope (FR-016; tasks.md T014).
3. Staleness never silently downgrades `dataMode`: a stale live snapshot is still `dataMode: live` with a staleness disclosure — the mode-confusion suite covers the stale condition explicitly (FR-011; SC-009).

### S-03 Collection Migration States

```text
                     governed slice authorization +
                     preconditions satisfied
  ┌────────────────┐ ─────────────────────────────▶ ┌────────┐
  │ fixture-backed │                                │  live  │
  └────────────────┘ ◀───────────────────────────── └────────┘
                     directed rollback (FR-019):
                     single governed reversion,
                     correctly labeled, no data repair
```

| Transition | Guard | Traceability |
|---|---|---|
| `fixture-backed → live` | (a) a governed implementation authorization for that collection's slice — for this feature's first slice, Agent Zero's explicit Stage B Gate 2 directive; for later collections, new governed authorization — never inferred from planning approval (FR-030; `implementation-authorization-boundary.md`); (b) `authoritativeSourcePaths` enumerated (FR-012); (c) `recordShape` and `statusVocabulary` defined (FR-013); (d) `anomalyPolicy` chosen (FR-017); (e) `dataClassification` declared and cleared against `exposurePosture` (FR-027); (f) contract and mode-confusion tests in place (FR-011) | FR-004, FR-011–FR-013, FR-017, FR-027; spec.md Q-003 |
| `live → fixture-backed` | A directed rollback: one governed reversion returns the collection (or all collections at once) to correctly labeled fixture service, with no data repair required | FR-019; SC-005; User Story 3, scenario 4; tasks.md T010 |

**First-slice pinning**: seven tools total; one collection (snapshot, served by `get_snapshot`) transitions to `live` in the first slice; the collections behind the remaining six tools (`list_work_packages`, `get_work_package`, `list_defects`, `list_gates`, `list_decisions`, `get_metrics`) are **pinned** `fixture-backed` — their migration requires new governed authorization and is out of scope for this feature (FR-004, FR-007; spec.md Q-003; WO-P2-AUTHOR-001 §4.1).

**Invariants**:

1. Any system state with at least one `live` and at least one `fixture-backed` collection is a **mixed** system state; every aggregate surface over such a state declares `dataMode: mixed` with per-collection authority — never wholly live (FR-010; User Story 1, scenario 3).
2. The mixed period is unbounded in time by design; the labeling discipline of FR-010, not a deadline, is the control that makes it safe (spec.md Q-003).
3. Migration state is configuration data read by the shared data service, identical for both consumers (FR-001, FR-002; tasks.md T016) — the dashboard and the MCP can never disagree about a collection's mode.

---

## Entity-to-Requirement and Entity-to-Task Trace

Task references follow tasks.md as revised under WO-P2-AUTHOR-001-R1; every task is Stage C work, executable only after Agent Zero's Stage B Gate 2 directive (T001 records that directive verbatim).

| Entity | Primary requirements | Realizing tasks |
|---|---|---|
| E-01 Governed Repository | FR-005, FR-012, FR-024 | T015 (ingestion observation; grounded per T002's registered GitHub REST API description mirror) |
| E-02 Ingestion Run | FR-003, FR-014, FR-016, FR-020, FR-025 | T013 (`centcom` PG schema migrations), T015 (reconciliation Edge Function + cron) |
| E-03 Validated Snapshot | FR-001, FR-013, FR-014, FR-015, FR-018 | T012, T013, T015 |
| E-04 Provenance Envelope | FR-008, FR-009, FR-010, FR-011, FR-015, FR-016 | T004, T006, T012, T014 (shared data service envelope construction + serving-time freshness) |
| E-05 Collection | FR-004, FR-007, FR-012, FR-013, FR-017, FR-027 | T016, T019 |
| E-06 Contract Version | FR-008, FR-013, FR-015 | T011 (schema-compilation validation), T012 |
| E-07 Fixture Dataset | FR-004, FR-009, FR-011, FR-018, FR-019 | T006, T010, T016 (dataset itself pre-exists) |
| E-08 Ingestion Record | FR-003, FR-020, FR-026, FR-028 | T013, T015, T025 |
| E-09 Access Policy | FR-021, FR-022, FR-023, FR-026, FR-027 | T013 (access-policy tables), T021 |

Success-criteria coverage is carried at the requirement level in `traceability.md`; the state models above additionally bind SC-001 (S-01 record invariant), SC-004 (S-01 failure invariants), SC-005 (S-03 rollback transition), SC-006 (E-03 determinism rules and the S-02 determinism boundary), and SC-009 (S-02 stale-condition labeling).

---

*This data model is a conceptual planning artifact authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23): persistence re-homed to the PostgreSQL system of record, the no-change and freshness rules bound to the ratified decisions, and contract versioning aligned to v1.1.0. Its approval, and the approval of every schema or contract derived from it, is a planning approval only (Stage A); implementation authority arrives solely as Agent Zero's explicit Stage B Gate 2 directive, as described in `implementation-authorization-boundary.md`. Stage C acceptance incorporates the completed and operational P2-PRE-2 CI evidence (FR-029; SC-008).*
