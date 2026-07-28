# Contract: Live Snapshot Collection (`get_snapshot`)

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 (WO-P2-AUTHOR-001-R1)

**Work order**: WO-P2-AUTHOR-001, revised under WO-P2-AUTHOR-001-R1 (planning and authoring only; implementation authority not granted — see `../implementation-authorization-boundary.md`)

**Contract version**: `1.2.0`. Any change to the schema, field semantics, or enumeration in this file is a governed change to the **Contract Version** entity (`../data-model.md`, E-06) and requires a version bump under Agent Zero's approval.

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-07-22 | Initial authoring (WO-P2-AUTHOR-001). |
| 1.1.0 | 2026-07-23 | R1 remediation (WO-P2-AUTHOR-001-R1): explicit contract-version declaration in header and schema; schema `$id` moved to the URN scheme; envelope `$ref` by `$id` URN instead of a `.md` document path (review Finding 5.5); persistence restated as PostgreSQL for snapshot and ingestion record (Finding 1); no-change rule corrected — a no-change run creates no new snapshot version (Finding 5.1); freshness anchored to `last_verified_at` with the decided 2-hour threshold and serving-time classification (Finding 5.2); determinism guarantee narrowed to stored normalized content (Finding 5.3). |
| 1.2.0 | 2026-07-23 | CodeRabbit remediation round (Agent Zero-approved coordinated bump; `../coderabbit-finding-disposition.md`): new fallback policy P-3a — PostgreSQL unavailable at serving time serves the bundled fixture dataset via the P-3 path with full fixture labeling, outage surfaced to monitoring — with new scenario C-SNAP-10 and coverage-row updates (finding 9); V-6 backed by single-flight run serialization and the database-side monotonic guard (`../data-model.md` E-02/E-08, finding 10); the fail-until-implemented rule gains the explicit C-SNAP-9 schema-compilation exception (finding 13); schema `$id` advanced to `urn:centcom:contract:snapshot-collection:1.2.0` and the envelope `$ref` to `urn:centcom:contract:provenance-envelope:1.2.0`. |

**Status**: Authored; revised under WO-P2-AUTHOR-001-R1; **fail-until-implemented** — every scenario in §9 MUST fail against the accepted baselines (dashboard historical authoring pin `95c8e9c`, preserved; dashboard review baseline `49f05bb`, verified 2026-07-23; SDD-Core `main` `6994bf6`, re-verified 2026-07-23) and remains failing until an implementation authorized by Agent Zero's explicit Gate 2 implementation directive satisfies it (sole exception: the schema-compilation scenario C-SNAP-9, which validates the contract schemas themselves and passes as soon as both schemas compile with cross-references resolved — see §9).

**Governs**: FR-004, FR-005, FR-006, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018 (see `../spec.md`)

**Siblings**: `provenance-envelope.md` (contract version 1.2.0 — the envelope this contract carries by `$id` reference), `../data-model.md` (Validated Snapshot, Ingestion Run, Ingestion Record entities), `../quickstart.md` (acceptance walkthrough), `../test-strategy.md`, `../tasks.md` (T005, T007, T008, the PG-backed persistence/serving tasks, and the schema-compilation validation task), `../risk-register.md`

---

## 1. Purpose and Scope

This contract defines the live `get_snapshot` collection — the **first and only** collection migrated to live data in the first vertical slice. Seven MCP tools exist in total; one (`get_snapshot`) migrates to live data first; the six others (`list_work_packages`, `get_work_package`, `list_defects`, `list_gates`, `list_decisions`, `get_metrics`) remain **explicitly fixture-backed** during this slice (FR-004). Nothing in this contract migrates, alters, or implies migration of any other collection.

**Persistence**: the validated snapshot and the ingestion record live in **PostgreSQL** — the dedicated non-public `centcom` application schema of the existing Supabase project (managed PostgreSQL; root Article II's standardized relational store — plan.md Constitution Check). JSON is limited to fixtures, tests, and transient exports; no durable JSON file or object-store export serves as application state.

**Serving path**: `PostgreSQL → shared server-side data service ([EXT] src/server/centcom-data/) → transient versioned response → dashboard and MCP`. The response a consumer receives is transient — constructed per request from stored state, never persisted as a file. The dashboard MAY hydrate its Phase 1 adapter from that transient response; the MCP (`[EXT] src/routes/mcp.ts`, tools under `[EXT] src/server/mcp/`) MUST use the same service/repository layer. Neither consumer fetches from GitHub directly, holds PostgreSQL credentials in the browser, or maintains an independent normalization path (FR-001/FR-002, plan.md Structure Decision). The only writer is the server-side reconciliation runtime (`[EXT] supabase/functions/centcom-reconcile/index.ts`, invoked hourly by Supabase Cron and on demand), a component separate from the read-only serving paths.

This is a planning artifact. It describes the contract an implementation must satisfy; it does not authorize, contain, or constitute that implementation (FR-030).

## 2. Authoritative Source Enumeration (FR-005, FR-012)

The governed repository for this collection is **`hanax-ai/sdd-core`** (spec.md Q-001). The snapshot is derived exclusively from the following enumerated observables of that repository, retrieved server-side from the live source at ingestion time:

| # | Observable | Description | Origin |
|---|---|---|---|
| E-1 | Repository identity | The governed repository's canonical `owner/name` identifier | Live source |
| E-2 | Default-branch name | The name of the repository's default branch | Live source |
| E-3 | Head commit SHA | The full commit SHA at the default branch's head at observation time | Live source |
| E-4 | Latest commit title | The title (first line of the message) of that head commit | Live source |
| E-5 | Observation timestamp | The instant the ingestion run observed E-1..E-4; injected **once** per run by the reconciliation pipeline and recorded on the ingestion run in PostgreSQL. The `observedAt` a consumer receives is the stored `last_verified_at` anchor (§6) — the recorded observation instant of the latest successful run, never the serving clock | Ingestion run |

**Closure rule**: nothing outside this enumeration influences the served snapshot. No file content, issue state, workflow state, non-default branch, hand-authored value, or fixture-derived value may contribute to a result labeled live (FR-005, FR-012). Extending the enumeration is a contract-version change (see §7 and `../data-model.md`, Contract Version), never a silent addition.

The observed content is public-class data of a public repository (repository identity, branch name, head SHA, commit title). The FR-027 classification for this collection is recorded on that basis, consistent with Agent Zero's serving-posture decision (2026-07-23; spec.md Q-004): public dashboard access is limited to explicitly public-class snapshot fields, MCP access remains OAuth-protected, and no non-public collection migrates until authorization and revocation controls are operational and validated.

## 3. Validated Snapshot Shape

The validated snapshot for this collection is a single JSON object. JSON Schema (normative; the constructs used are valid in both draft-07 and draft 2020-12, so the schema compiles under the same validator dialect as the provenance-envelope schema):

```json
{
  "$id": "urn:centcom:contract:snapshot-collection:1.2.0",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "repo",
    "defaultBranch",
    "headSha",
    "headCommitTitle",
    "observedAt",
    "snapshotVersion",
    "provenance"
  ],
  "properties": {
    "repo": {
      "type": "string",
      "const": "hanax-ai/sdd-core",
      "description": "Governed repository identity (E-1); closed to the enumerated repository"
    },
    "defaultBranch": {
      "type": "string",
      "minLength": 1,
      "description": "Default-branch name at observation time (E-2)"
    },
    "headSha": {
      "type": "string",
      "pattern": "^[0-9a-f]{40}$",
      "description": "Full 40-hex lowercase commit SHA at the default-branch head (E-3)"
    },
    "headCommitTitle": {
      "type": "string",
      "minLength": 1,
      "description": "First line of the head commit's message (E-4)"
    },
    "observedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp with explicit offset (E-5); the stored last_verified_at anchor (§6); Phase 1 isoString strictness — see V-2"
    },
    "snapshotVersion": {
      "type": "string",
      "minLength": 1,
      "description": "Identifier of the stored snapshot version this result was read from — see §7"
    },
    "provenance": {
      "$ref": "urn:centcom:contract:provenance-envelope:1.2.0",
      "description": "The provenance envelope, referenced by its schema $id; carried on every served result per FR-008"
    }
  }
}
```

**Schema resolvability (review Finding 5.5)**: the `provenance` `$ref` resolves to the `$id` of the provenance-envelope schema (`provenance-envelope.md`, contract version 1.2.0) — never to a document path. **Both schemas MUST be loaded into the validator together for this schema to compile**; cross-contract references are by `$id` URN only. Compilation with all cross-references resolved is verified by the CI-runnable schema-compilation validation task (`../tasks.md`; `../test-strategy.md`, schema-compilation layer) — scenario C-SNAP-9.

Field semantics:

| Field | Semantics |
|---|---|
| `repo` | MUST equal the enumerated governed repository. Any other value fails validation — the enumeration in §2 is closed. |
| `defaultBranch` | Reported as observed; not assumed to be `main`. A rename is a legitimate observed change, not an error. |
| `headSha` | Exactly 40 lowercase hexadecimal characters. This deliberately tightens the Phase 1 fixture leniency (`min(7)` in the dashboard's `SnapshotSchema`): a live result pins to a full, unambiguous commit identity. |
| `headCommitTitle` | Verbatim first line; no truncation, no normalization of casing or punctuation (determinism, §5). |
| `observedAt` | The stored `last_verified_at` anchor (§6): the single recorded observation instant of the latest successful ingestion run (`published` or `no-change`), read from PostgreSQL — never the serving clock. Identical in the served payload and its envelope. |
| `snapshotVersion` | Identifies the stored snapshot version, not the source; see §7. Unchanged across `no-change` runs. Consumers MUST be able to state which snapshot version they are reading (FR-015). |
| `provenance` | The full envelope contract lives in `provenance-envelope.md` (contract version 1.2.0; schema `urn:centcom:contract:provenance-envelope:1.2.0`) and is not restated here. For this collection: `dataMode: live`, `sourceRepository` = `repo`, `sourceCommitSha` = `headSha`, `observedAt` matching this object's `observedAt`, `contractVersion` naming the governing contract version (`1.2.0`), and `authoritative` per the envelope contract's authority rules. On fallback paths the envelope changes as §8 requires. |

**Relationship to the Phase 1 fixture shape**: the Phase 1 `SnapshotSchema` (fixture dataset) uses `branch`, `latestCommitTitle`, and `lastSyncedAt`. Mapping the fixture shape to (or re-cutting it against) this contract is an implementation-mapping concern assigned to T012/T015 in `../tasks.md`; this contract is normative for the **live** collection, and the fixture dataset remains the labeled non-authoritative fallback (§8, FR-018).

## 4. Validation Rules (FR-003, FR-013)

Content that fails any rule below is rejected at the validation boundary before it can reach any consumer; the failure is recorded in the ingestion record with the collection, source location, violated rule, and offending revision (FR-003). Coercion, defaulting, and silent dropping are prohibited (FR-013).

| Rule | Requirement |
|---|---|
| V-1 — SHA format | `headSha` MUST match `^[0-9a-f]{40}$`. Short SHAs, uppercase hex, and non-hex content are rejected, never padded or normalized. |
| V-2 — Timestamp discipline | `observedAt` MUST satisfy the Phase 1 `isoString` strictness (dashboard `src/data/schemas.ts`): an ISO 8601 date-time **with explicit UTC offset**, rejected if not parseable as such. Reused, not reinvented (T012). |
| V-3 — Vocabulary closure | The object is closed: `additionalProperties: false`. Unknown fields are a validation failure, not tolerated extras. The enumerated field set in §3 is the complete vocabulary of this collection; there are no open-ended or free-growth fields. |
| V-4 — Repository closure | `repo` MUST equal the enumerated governed repository (§2). Content observed from any other repository MUST NOT produce a snapshot under this contract. |
| V-5 — Non-empty content | `defaultBranch` and `headCommitTitle` MUST be non-empty strings. An empty observation is a failed observation, handled per §8 — never served as content. |
| V-6 — Timestamp monotonicity | Ingestion-run anchors are strictly increasing: a run whose `observedAt` is not strictly later than the latest recorded successful run's `observedAt` (clock skew, spec.md Edge Cases) fails ingestion validation; the stored anchor and the published snapshot are retained (§8, policy P-2). Time never appears to run backwards in served results. Application validation is backed by run serialization and a database-side monotonic guard (`../data-model.md` E-02/E-08): concurrent scheduled and on-demand runs never interleave, and the store itself rejects an anchor regression. |
| V-7 — Envelope conformance | The embedded `provenance` object MUST validate against the provenance envelope contract in full (schema `urn:centcom:contract:provenance-envelope:1.2.0`), including its consistency rules (e.g., `sourceCommitSha` = `headSha`; `observedAt` agreement — payload, envelope, and stored anchor identical). An invalid envelope invalidates the snapshot. |
| V-8 — Version integrity | `snapshotVersion` MUST be unique among stored snapshot versions and MUST resolve to exactly one **publishing** ingestion run in the ingestion record (FR-015, FR-020). Subsequent `no-change` runs re-verify an existing version and reference it without creating a new one (§5, §7). |

## 5. Determinism (FR-014, SC-006)

- **Determinism inputs (enumerated)**: source content at the pinned source revision + this contract's version (`1.2.0`) + the normalization rules. Nothing else influences normalized content.
- **Byte-identical re-normalization**: re-running normalization on the same recorded source revision under the same contract version MUST reproduce the **stored normalized snapshot content** byte-identically. Observation metadata — run identifiers, timestamps, snapshot version assignment — is excluded from the guarantee (SC-006 as narrowed under R1). Verified by T007 and sampled at acceptance (`../quickstart.md`).
- **Byte-identical boundary**: the guarantee applies to stored normalized snapshot content **at rest, per snapshot version, in PostgreSQL**. Transient responses are deterministic given (snapshot version, stored anchor, serving-instant freshness classification); only the freshness fields enumerated in §6 legitimately vary between servings.
- **Stable serialization**: normalized-content serialization is pinned — fixed key order (the `required` order in §3), UTF-8, no locale-, environment-, or platform-dependent formatting.
- **No hidden inputs**: normalization takes no wall-clock reads, random values, environment lookups, or network calls. The observation timestamp is run metadata, injected exactly once by the ingestion run and recorded on the run in PostgreSQL — it is not a normalization input, and re-normalization reuses recorded data rather than re-observing.
- **No-change runs (the one authoritative rule, per R1 Finding 5.1)**: an ingestion run observing a head whose normalized content is identical to the current published snapshot records an ingestion-run entry with outcome `no-change` and an advanced `observedAt` anchor (FR-020) and creates **no new snapshot version**. A new snapshot version is created **iff normalized content changes**. A no-change run MUST NOT fabricate a content change, and MUST NOT leave the anchor in place as if no observation occurred (spec.md Edge Cases; `../data-model.md` E-02/E-03/S-01).

## 6. Freshness and Staleness (FR-016)

- **Anchor**: freshness is anchored to `last_verified_at` — the `observedAt` of the latest successful ingestion run (`published` or `no-change`), stored in PostgreSQL. A no-change run advances the anchor without version churn (§5).
- **Cadence and threshold (decided)**: hourly scheduled reconciliation (Supabase Cron-invoked Edge Function, `[EXT] supabase/functions/centcom-reconcile/`) plus on-demand refresh, both invoking the same ingestion operation; a result is **stale 2 hours** after `last_verified_at`. Resolved by Agent Zero decision, recorded 2026-07-23 (spec.md Q-005).
- **Serving-time classification**: staleness is computed at serving time by the shared data service (`[EXT] src/server/centcom-data/`), comparing the stored anchor against the serving clock. **This comparison is the only permitted serving-time clock use**; no other served field may derive from the serving clock.
- **Permitted varying fields (exhaustive)**: `stale` (boolean) and `thresholdExceededBy` (present when stale). Every other payload and envelope field derives from stored state — in particular, `observedAt` is the stored `last_verified_at`, never the serving instant.
- **Staleness disclosure**: any served snapshot whose anchor is more than 2 hours in the past MUST carry an explicit staleness disclosure in its provenance envelope (per `provenance-envelope.md`); `observedAt` remains the true, unchanged anchor value. A consumer MUST never receive stale data presented as fresh (FR-016, User Story 3). The internal `aging` state never appears in any envelope (`../data-model.md` S-02).
- **Freshness is envelope-borne**: staleness is disclosed in-band, on the result itself — never solely in documentation, logs, or a separate status surface (spec.md User Story 2 rationale).

## 7. Commit Pinning and Versioning (FR-015)

- **Pinning**: every validated snapshot is pinned to the head commit SHA it was derived from — `headSha` (and the envelope's `sourceCommitSha`) is the pin. A served live result is reproducible from that recorded revision plus the ingestion record (FR-014, SC-001).
- **`snapshotVersion` identifies the stored snapshot version**: the source revision identifies what was observed; `snapshotVersion` identifies the stored, published normalized snapshot in PostgreSQL. A no-change re-observation of the same head creates **no** new version (§5); a new version exists iff normalized content changed, so successive versions always differ in content. Freshness advances via ingestion-run anchors (§6), not via version churn. The recommended form is deterministic from recorded run data (e.g., compact UTC observation instant plus abbreviated head SHA); the binding requirements are V-8's uniqueness and single-publishing-run resolvability, not the format.
- **Supersession**: a newly validated snapshot supersedes the prior one atomically — a transactional publication in PostgreSQL (state transitions in `../data-model.md`); a consumer reading during ingestion observes only the prior complete snapshot, never a partial write (spec.md Edge Cases; tested via T008).
- **Contract version**: this contract's version is **`1.2.0`** (declared in the header change log and the §3 schema `$id`), carried in every result's envelope as `contractVersion`. Shape or enumeration changes (§2, §3) are governed contract-version changes, per `../data-model.md` (Contract Version entity).

## 8. Failure Fallbacks (FR-017, FR-018)

The snapshot collection's explicit FR-017 policies — silence is not a permitted behavior:

| Policy | Condition | Behavior |
|---|---|---|
| P-1 — Retrieval failure | The live source is unreachable, rate-limit-exhausted (FR-025), or credentials fail | Serve the **last validated snapshot** unchanged, with staleness disclosure per §6 once the anchor is past threshold; record the failed run in the ingestion record (FR-020). |
| P-2 — Validation failure | Retrieved content fails any §4 rule | **Reject-collection**: the invalid content never becomes a stored snapshot version; the previously validated snapshot remains in service; the failure is recorded with collection, source location, rule, and revision (FR-003). |
| P-3 — No validated snapshot exists | No successful ingestion has ever published a snapshot (or a directed FR-019 rollback is in force) | Serve the **fixture dataset's** snapshot with full fixture labeling: `dataMode: fixture`, `authoritative: false`, fixture dataset version in place of a source commit SHA, and the non-authority governance warning — all per `provenance-envelope.md` (FR-009, FR-018). |
| P-3a — Store unavailable at serving time | PostgreSQL is unreachable from the shared data service when a request arrives | Serve the **bundled fixture dataset's** snapshot via the same path as P-3, with full fixture labeling per P-3 plus a governance warning naming degraded store-outage serving. Never a fabricated or cached result presented as `live`, never a blank surface or crash. The outage is surfaced to operational monitoring (FR-028). If the fixture dataset itself cannot be loaded, the service returns an explicit, well-formed, honestly labeled error result — still never blank, never mislabeled. |
| P-4 — Prohibited outcomes | Always | Never unvalidated live content; never a blank surface; never an unlabeled or mislabeled fallback; never stale-as-fresh (FR-018, SC-004). |

Fallback results remain well-formed and envelope-complete in every state (SC-002, SC-004). Rollback to fixture-only operation is a single governed reversion with correct fixture labeling and **no data repair** (FR-019, SC-005) — the fixture path P-3 is the same path rollback lands on, which is what makes rollback a configuration reversion rather than a migration. A serving-time store outage (P-3a) rides that same fixture path: the bundled fixture dataset is loadable without PostgreSQL, so a database outage degrades to labeled fixture service, never to a blank surface or a falsely live result.

## 9. Contract Test Scenarios (fail-until-implemented)

Executed by T005 (`src/data/__tests__/snapshot-live.contract.test.ts`, `[EXT]`) for C-SNAP-1..8 and C-SNAP-10, with overlap into T007 (determinism) and T008 (failure paths); C-SNAP-9 is executed by the schema-compilation validation task (T011, and pre-Gate-2 by the workspace-side G-09 run — `../gate-2-entry-criteria.md`). Every scenario except C-SNAP-9 MUST fail at the review baseline (`49f05bb`) and MUST NOT be marked passing by any means other than an implementation authorized by Agent Zero's explicit Gate 2 implementation directive, recorded verbatim under T001 (see `../implementation-authorization-boundary.md`); C-SNAP-9 passes as soon as both schemas compile with cross-references resolved, and still precedes implementation. Acceptance additionally cites the completed P2-PRE-2 evidence record (FR-029/SC-008, T003).

| ID | Scenario | Given / When / Then | Verifies |
|---|---|---|---|
| **C-SNAP-1** | Shape validation | **Given** a candidate snapshot object, **When** it is validated against §3/§4, **Then** a conformant object passes, and each single-rule violation (bad SHA format, offset-less timestamp, unknown field, empty title, wrong `repo`) is rejected with the violated rule identified — never coerced or defaulted. | FR-003, FR-013; SC-002 |
| **C-SNAP-2** | SHA resolves to a real commit | **Given** a served live snapshot, **When** its `headSha` is checked against the governed repository, **Then** it resolves to a real commit that was the default-branch head at the recorded observation instant, per the ingestion record. | FR-005, FR-006; SC-001 (User Story 4) |
| **C-SNAP-3** | Source-change propagation | **Given** a served live snapshot at head X, **When** the governed repository's head changes to Y and the next ingestion completes, **Then** the served result reflects Y with a newer `observedAt` and a new `snapshotVersion` — demonstrating the result derives from the live source, not fixtures. Recorded as first-slice acceptance evidence per FR-006 (`../quickstart.md`). | FR-006, FR-004; SC-001 (User Story 1) |
| **C-SNAP-4** | Staleness disclosure past threshold | **Given** a stored snapshot whose `last_verified_at` anchor is more than 2 hours in the past, **When** it is served, **Then** the serving-time classification (§6) yields a result carrying the explicit staleness disclosure with `observedAt` unchanged — never presented as fresh. | FR-016; SC-004 (User Story 3) |
| **C-SNAP-5** | Retrieval-failure fallback | **Given** live retrieval fails (unreachable source, exhausted rate limit, failed credentials), **When** the snapshot is requested, **Then** the last validated snapshot is served per P-1 with accurate labeling and the failure is recorded in the ingestion record — no blank surface, no crash. (Overlaps T008.) | FR-017, FR-018, FR-025; SC-004 |
| **C-SNAP-6** | Validation-failure retention | **Given** retrieved content violating a §4 rule, **When** ingestion completes, **Then** the content is rejected per P-2, the prior validated snapshot remains in service unchanged, and the recorded failure identifies collection, source location, rule, and revision. (Overlaps T008.) | FR-003, FR-017, FR-018; SC-004 |
| **C-SNAP-7** | Fixture-fallback labeling | **Given** no validated snapshot exists (or fixture-only rollback is in force), **When** the snapshot is requested, **Then** the fixture result is served per P-3 declaring `dataMode: fixture`, `authoritative: false`, the fixture dataset version, and the non-authority warning — and the mode-confusion suite (T006, FR-011) classifies it as fixture from the result alone. | FR-009, FR-018, FR-019; SC-002, SC-004, SC-005, SC-009 |
| **C-SNAP-8** | No-change run semantics | **Given** a published snapshot at head X, **When** a subsequent ingestion run observes head X with normalized content identical to the published snapshot, **Then** the run is recorded in the ingestion record with outcome `no-change`, the `last_verified_at` anchor advances, **no new snapshot version is created**, and the served result carries the unchanged `snapshotVersion` with the advanced `observedAt`. | FR-014, FR-015, FR-020 (§5 rule; `../data-model.md` S-01) |
| **C-SNAP-9** | Schema compilation | **Given** the §3 schema and the provenance-envelope schema (`urn:centcom:contract:provenance-envelope:1.2.0`) loaded into one validator, **When** compilation runs (Ajv or equivalent, CI-runnable), **Then** compilation succeeds with every cross-reference resolved by `$id` URN — no document-path references. (Executed by the schema-compilation validation task, `../tasks.md`; `../test-strategy.md` schema-compilation layer.) | FR-013; SC-002 (R1 Finding 5.5) |
| **C-SNAP-10** | Store-outage fallback | **Given** PostgreSQL is unreachable from the shared data service, **When** the snapshot is requested, **Then** the bundled fixture dataset is served per P-3a with full fixture labeling — never a live label, a cached-as-live result, a blank surface, or a crash — the outage is surfaced to monitoring (FR-028), and once the store is reachable again the next request serves the live snapshot normally. (Overlaps T008 store-outage drill.) | FR-017, FR-018, FR-028; SC-004 |

Determinism (byte-identical stored normalized content, §5) is verified by T007 rather than duplicated here; envelope-field completeness is verified by the C-ENV scenarios in `provenance-envelope.md` (T004).

## 10. Requirements Coverage

| Requirement / Criterion | Contract section(s) | Scenario(s) |
|---|---|---|
| FR-004 (first slice; 7 total / 1 live / 6 fixture) | §1 | C-SNAP-3 (live), C-SNAP-7 (fixture boundary) |
| FR-005 (live-sourced, never hand-authored/fixture-derived) | §2 | C-SNAP-2, C-SNAP-3 |
| FR-006 (acceptance evidence: real head + change propagation) | §2, §9 | C-SNAP-2, C-SNAP-3 |
| FR-012 (enumerated source paths; closure) | §2 | C-SNAP-1 (V-4) |
| FR-013 (vocabulary/shape closure; no coercion) | §3, §4 | C-SNAP-1, C-SNAP-9 |
| FR-014 (deterministic normalization; no-change rule) | §5 | C-SNAP-8; T007 (per §9 note) |
| FR-015 (commit pinning; snapshot version) | §7 | C-SNAP-2, C-SNAP-3, C-SNAP-8 |
| FR-016 (freshness anchor; 2 h threshold; staleness disclosure) | §6 | C-SNAP-4, C-SNAP-8 (anchor advance) |
| FR-017 (explicit per-collection failure policy) | §8 (P-1..P-3a) | C-SNAP-5, C-SNAP-6, C-SNAP-10 |
| FR-018 (fallback ladder; never unvalidated/blank/unlabeled) | §8 | C-SNAP-5, C-SNAP-6, C-SNAP-7, C-SNAP-10 |
| SC-001 | §2, §7 | C-SNAP-2, C-SNAP-3 |
| SC-002 | §3, §8 | C-SNAP-1, C-SNAP-7, C-SNAP-9 |
| SC-004 | §6, §8 | C-SNAP-4, C-SNAP-5, C-SNAP-6, C-SNAP-10 |
| SC-005 / FR-019 (rollback lands on P-3) | §8 | C-SNAP-7 |
| SC-006 (narrowed: stored normalized content; metadata excluded) | §5 | C-SNAP-8; T007 |
| SC-009 (mode classification from result alone) | §8, envelope by reference | C-SNAP-7 with T006 |

Constitution note: persistence for this collection is PostgreSQL — the validated snapshot and the ingestion record live in the dedicated non-public `centcom` schema of the existing Supabase project (managed PostgreSQL, the root Article II standardized relational store; plan.md Constitution Check). JSON is limited to fixtures, tests, and transient exports (risk `../risk-register.md` R-07); no durable file-shaped snapshot artifact exists in this design.

---

*This contract is a planning artifact authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23). It grants no implementation authority and claims no planning approval or Gate 2 status. Implementation requires Agent Zero's explicit Gate 2 implementation directive (recorded verbatim by T001), preceded by planning approval and the readiness-to-request-Gate-2 criteria (`../gate-2-entry-criteria.md`); the completed P2-PRE-2 CI evidence is recorded per FR-029 (T003) — see `../implementation-authorization-boundary.md`.*
