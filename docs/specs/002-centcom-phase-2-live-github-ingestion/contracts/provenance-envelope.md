# Contract: Provenance Envelope

**Feature Folder**: `002-centcom-phase-2-live-github-ingestion` | **Date**: 2026-07-22 | **Revised**: 2026-07-23 (WO-P2-AUTHOR-001-R1) | **Spec**: [../spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)

**Work order**: WO-P2-AUTHOR-001, revised under WO-P2-AUTHOR-001-R1 (planning and authoring only). This contract is a normative planning artifact; it does not grant, imply, or request implementation authority (see `../implementation-authorization-boundary.md`).

**Contract version**: `1.2.0`. Any change to the schema, field semantics, or composition rules in this file is a governed change to the **Contract Version** entity (`../data-model.md`, E-06) and requires a version bump under Agent Zero's approval.

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-07-22 | Initial authoring (WO-P2-AUTHOR-001). |
| 1.1.0 | 2026-07-23 | R1 remediation (WO-P2-AUTHOR-001-R1): every mixed-mode constituent envelope gains the required `contractVersion` field (review Finding 5.4); the former blanket prohibition on serving-time clock reads is replaced by the scoped freshness rule — the shared data service computes `stale`/`thresholdExceededBy` at serving time from the stored `last_verified_at` anchor, the only permitted serving-time clock use (Finding 5.2); the schema `$id` moves to the URN scheme (`urn:centcom:contract:provenance-envelope:1.1.0`) so cross-contract `$ref`s resolve by `$id`, proven by the schema-compilation validation task (Finding 5.5). |

| 1.2.0 | 2026-07-23 | CodeRabbit remediation round (Agent Zero-approved coordinated bump; `coderabbit-finding-disposition.md`): `observedAt` gains the `format: date-time` calendar-validity assertion with a mandatory validator format-assertion requirement, covered by C-ENV-2 (finding 3); the first-slice authority policy is defined on `authoritative` — live results declare `authoritative: false` with `governanceWarning` until a recorded Agent Zero authority decision exists — asserted by C-ENV-4 and enforced by the T014 module (finding 4); both example instances and the mixed worked example corrected accordingly; schema `$id` advanced to `urn:centcom:contract:provenance-envelope:1.2.0`. |

**Status**: Authored; revised under WO-P2-AUTHOR-001-R1; **fail-until-implemented** — every scenario in §6 MUST fail against the accepted baselines (dashboard historical authoring pin `95c8e9c`, preserved; dashboard review baseline `49f05bb`, verified 2026-07-23) and remains failing until an implementation authorized by Agent Zero's explicit Gate 2 implementation directive satisfies it (sole exception: the schema-compilation scenario C-ENV-8, which validates the contract schemas themselves — see §6).

**Normative language**: MUST / MUST NOT / SHOULD are used per their customary specification meaning. Requirements here bind the future implementation; they are executed only under Agent Zero's Stage B Gate 2 implementation directive, recorded verbatim by tasks.md T001 (see `../implementation-authorization-boundary.md`).

---

## 1. Purpose

The provenance envelope is the per-result (and, in mixed results, per-collection) declaration that makes data mode and authority **unavoidable** to every consumer — human or model. It is the load-bearing control for FR-008 (envelope contents), FR-009 (non-authority warning), and FR-010 (mixed-mode discipline), and the direct instrument of SC-002 (100% envelope coverage) and SC-009 (an agent given only a result classifies its mode and authority correctly).

Scope of application:

- **Every result of all seven MCP tools** (`get_snapshot`, `list_work_packages`, `get_work_package`, `list_defects`, `list_gates`, `list_decisions`, `get_metrics`) MUST carry an envelope. Seven tools total; one (`get_snapshot`) migrates to live data first; six remain explicitly fixture-backed during the first slice (FR-004, FR-007).
- **Every collection consumed by the dashboard** through the shared data model MUST carry the same envelope, produced by the same shared server-side data service (`[EXT] src/server/centcom-data/envelope.ts`; tasks.md T014) — one truth path (`PostgreSQL → shared data service → transient versioned response → dashboard/MCP`), no consumer-local re-derivation (FR-001/FR-002).

Attachment rule: the envelope is a mandatory top-level member named `provenance` of every tool result, and the per-collection envelope exposed by the shared data model for every dashboard collection. **A result without an envelope is an invalid result**; consumers MUST fail closed (treat it as unusable) rather than infer a mode (FR-008, FR-018 — an unlabeled fallback is never permitted).

The envelope alone MUST be sufficient to determine data mode, authority, source, revision, observation time, and contract version without consulting external documentation (spec.md, User Story 2, Acceptance Scenario 3).

The collection payload the envelope describes is defined per collection; for the first live slice see `./snapshot-collection.md`. Entity relationships (Validated Snapshot, Ingestion Run, Ingestion Record, Fixture Dataset) are defined in `../data-model.md`.

## 2. Envelope Schema (normative)

JSON Schema, draft-07. `additionalProperties: false` at every level: an envelope carrying an undeclared field is invalid — unknown fields are a contract violation, not an extension point.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "urn:centcom:contract:provenance-envelope:1.2.0",
  "title": "CENTCOM Provenance Envelope",
  "description": "Per-result (and per-collection) provenance and authority declaration carried by every CENTCOM MCP tool result and every dashboard collection (FR-008/FR-009/FR-010).",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "dataMode",
    "authoritative",
    "sourceRepository",
    "observedAt",
    "contractVersion",
    "stale"
  ],
  "properties": {
    "dataMode": {
      "description": "Provenance class of the result as a whole.",
      "enum": ["fixture", "live", "mixed"]
    },
    "authoritative": {
      "description": "Whether the result may be relied on as governance or project truth.",
      "type": "boolean"
    },
    "sourceRepository": {
      "description": "owner/name identity of the governed repository this result concerns (for fixture results: the repository the fixture models).",
      "type": "string",
      "pattern": "^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?/[A-Za-z0-9._-]+$"
    },
    "sourceCommitSha": {
      "description": "Full 40-hex-character commit SHA the served content derives from. Required when dataMode is live; prohibited when fixture or mixed.",
      "type": "string",
      "pattern": "^[0-9a-f]{40}$"
    },
    "observedAt": {
      "description": "ISO 8601 timestamp with an explicit timezone (Z or offset) at which the source or fixture dataset was observed. Calendar validity is enforced by the date-time format assertion; the pattern constrains shape only.",
      "type": "string",
      "format": "date-time",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,9})?(?:Z|[+-]\\d{2}:\\d{2})$"
    },
    "contractVersion": {
      "description": "Semantic version of the envelope/collection contract the result conforms to.",
      "type": "string",
      "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$"
    },
    "datasetVersion": {
      "description": "Version identifier of the fixture dataset. Required when dataMode is fixture; optional otherwise.",
      "type": "string",
      "minLength": 1
    },
    "governanceWarning": {
      "description": "Explicit warning that the result does not establish governance approval or project status. Required whenever authoritative is false.",
      "type": "string",
      "minLength": 1
    },
    "stale": {
      "description": "Whether the result exceeds the declared staleness threshold. Always present — freshness is never inferred from absence.",
      "type": "boolean"
    },
    "thresholdExceededBy": {
      "description": "ISO 8601 duration by which the staleness threshold is exceeded. Required when stale is true; prohibited when stale is false.",
      "type": "string",
      "pattern": "^P(?=.)(\\d+D)?(T(?=\\d)(\\d+H)?(\\d+M)?(\\d+(?:\\.\\d+)?S)?)?$"
    },
    "collections": {
      "description": "Per-collection constituent declarations. Required when dataMode is mixed; prohibited otherwise.",
      "type": "object",
      "minProperties": 2,
      "propertyNames": { "pattern": "^[a-z][a-zA-Z0-9_-]*$" },
      "additionalProperties": { "$ref": "#/definitions/constituentEnvelope" }
    }
  },
  "allOf": [
    {
      "if": { "properties": { "dataMode": { "const": "live" } } },
      "then": {
        "required": ["sourceCommitSha"],
        "not": { "required": ["collections"] }
      }
    },
    {
      "if": { "properties": { "dataMode": { "const": "fixture" } } },
      "then": {
        "required": ["datasetVersion", "governanceWarning"],
        "properties": { "authoritative": { "const": false } },
        "allOf": [
          { "not": { "required": ["sourceCommitSha"] } },
          { "not": { "required": ["collections"] } }
        ]
      }
    },
    {
      "if": { "properties": { "dataMode": { "const": "mixed" } } },
      "then": {
        "required": ["collections", "governanceWarning"],
        "not": { "required": ["sourceCommitSha"] }
      }
    },
    {
      "if": {
        "properties": { "authoritative": { "const": false } },
        "required": ["authoritative"]
      },
      "then": { "required": ["governanceWarning"] }
    },
    {
      "if": {
        "properties": { "stale": { "const": true } },
        "required": ["stale"]
      },
      "then": { "required": ["thresholdExceededBy"] }
    },
    {
      "if": {
        "properties": { "stale": { "const": false } },
        "required": ["stale"]
      },
      "then": { "not": { "required": ["thresholdExceededBy"] } }
    }
  ],
  "definitions": {
    "constituentEnvelope": {
      "description": "Per-collection declaration inside a mixed result. dataMode is fixture or live only — mixed never nests. Every constituent carries its own required contractVersion (v1.1.0, review Finding 5.4).",
      "type": "object",
      "additionalProperties": false,
      "required": ["dataMode", "authoritative", "sourceRepository", "observedAt", "contractVersion", "stale"],
      "properties": {
        "dataMode": { "enum": ["fixture", "live"] },
        "authoritative": { "type": "boolean" },
        "sourceRepository": { "$ref": "#/properties/sourceRepository" },
        "sourceCommitSha": { "$ref": "#/properties/sourceCommitSha" },
        "observedAt": { "$ref": "#/properties/observedAt" },
        "contractVersion": { "$ref": "#/properties/contractVersion" },
        "datasetVersion": { "$ref": "#/properties/datasetVersion" },
        "governanceWarning": { "$ref": "#/properties/governanceWarning" },
        "stale": { "type": "boolean" },
        "thresholdExceededBy": { "$ref": "#/properties/thresholdExceededBy" }
      },
      "allOf": [
        {
          "if": { "properties": { "dataMode": { "const": "live" } } },
          "then": { "required": ["sourceCommitSha"] }
        },
        {
          "if": { "properties": { "dataMode": { "const": "fixture" } } },
          "then": {
            "required": ["datasetVersion", "governanceWarning"],
            "properties": { "authoritative": { "const": false } },
            "not": { "required": ["sourceCommitSha"] }
          }
        },
        {
          "if": {
            "properties": { "authoritative": { "const": false } },
            "required": ["authoritative"]
          },
          "then": { "required": ["governanceWarning"] }
        },
        {
          "if": {
            "properties": { "stale": { "const": true } },
            "required": ["stale"]
          },
          "then": { "required": ["thresholdExceededBy"] }
        },
        {
          "if": {
            "properties": { "stale": { "const": false } },
            "required": ["stale"]
          },
          "then": { "not": { "required": ["thresholdExceededBy"] } }
        }
      ]
    }
  }
}
```

Note on `"not": { "required": ["x"] }`: this is the draft-07 idiom for "property `x` MUST be absent."

**Format assertion (calendar validity)**: the `observedAt` `pattern` constrains shape only — it accepts calendar-impossible strings such as `2026-99-99T00:00:00Z`. The schema therefore also declares `format: date-time`, and the contract validator MUST enable format validation **as an assertion**, not an annotation (draft-07: Ajv with `ajv-formats` registered so `date-time` validates calendar correctness). The schema-compilation validation (C-ENV-8, tasks.md T011) MUST run with format assertion enabled, and the envelope suite MUST cover calendar-invalid timestamp values (C-ENV-2). The constituent envelope inherits this via its `$ref` to the top-level `observedAt`.

**Schema resolvability (review Finding 5.5)**: this schema's stable identifier is its `$id` URN — `urn:centcom:contract:provenance-envelope:1.2.0`, scheme `urn:centcom:contract:<name>:<version>`. Sibling schemas reference it by that URN, never by a document file path: the snapshot collection schema's `provenance` property is `"$ref": "urn:centcom:contract:provenance-envelope:1.2.0"` (`./snapshot-collection.md` §3). Both schemas MUST be loaded into the validator together for cross-references to resolve; compilation with every cross-reference resolved is verified by the CI-runnable schema-compilation validation task (tasks.md T011; `../test-strategy.md`, schema-compilation layer) — scenario C-ENV-8.

## 3. Field Semantics and Validation Rules (field by field)

| Field | Type | Presence | Semantics | Validation rules |
|---|---|---|---|---|
| `dataMode` | enum `fixture` \| `live` \| `mixed` | Required, all modes | The provenance class of the result as a whole. `fixture`: derived entirely from the versioned Fixture Dataset. `live`: derived entirely from a Validated Snapshot produced by ingestion of the governed repository. `mixed`: combines constituents of both classes. | Exactly one of the three values. No other value, casing, or alias is valid. A result whose constituents are homogeneous MUST use that uniform mode, never `mixed` (rule V-M2 below). |
| `authoritative` | boolean | Required, all modes | Whether the result may be relied on as governance or project truth. Authority is a governance fact, not a technical one: live data is not automatically authoritative. **First-slice authority policy (explicit)**: authority for the live `get_snapshot` collection exists only when an explicit Agent Zero authority decision is recorded (a dated record naming the collection and the authority granted); no such decision exists at authoring — it is an open item for Stage A / Stage C. Until that record exists, live results MUST declare `authoritative: false` with a `governanceWarning`. Public-class exposure (spec Q-004) is an access decision, not an authority grant. | When `false`, `governanceWarning` is required. A live result declaring `authoritative: true` without a recorded Agent Zero authority decision to cite is a contract violation under the first-slice policy. Under contract version 1.2.0 (unchanged since 1.0.0), `dataMode: fixture` forces `authoritative: false` (FR-009; the baseline records the fixture dataset as non-authoritative). Relaxing either coupling is a contract-version change requiring Agent Zero approval. |
| `sourceRepository` | string, `owner/name` | Required, all modes | Identity of the governed repository the result concerns. For the first slice this is `hanax-ai/sdd-core` (spec.md Q-001). Fixture results name the repository the fixture *models*, which the mandatory `dataMode: fixture` labeling prevents from being read as an observation claim. | Must match the `owner/name` pattern. Public repository identity only — never a private hostname, URL with credentials, or tenant identifier. |
| `sourceCommitSha` | string, 40 lowercase hex | Required when `live`; **prohibited** when `fixture` or `mixed` (top level) | The commit the served content was derived from — the pin required by FR-015. | Must be a full 40-character SHA (no abbreviation). Rule V-L1: must resolve to a real commit in `sourceRepository` at observation time, verifiable retroactively via the Ingestion Record (FR-005, SC-001) — enforced by ingestion and audit, not by schema. Prohibited on fixture results so a fixture can never dress itself in a live-looking pin (FR-011); the fixture's revision identity is `datasetVersion`. Prohibited at the top level of mixed results so a mixed result can never present a single live pin (FR-010); pins live per constituent. |
| `observedAt` | string, ISO 8601 with timezone | Required, all modes | For live results: the stored freshness anchor `last_verified_at` — the `observedAt` of the latest successful ingestion run (`published` or `no-change`), read from PostgreSQL (`../data-model.md` E-08, S-02) — **never the serving clock**. For fixture results: the dataset's declared reference time. Serving time is never substituted: a cached or repeatedly served result keeps the stored anchor value (spec.md User Story 3, Scenario 1). | Must carry an explicit timezone (`Z` or `±hh:mm`). Must be a valid calendar instant: the `date-time` format assertion rejects timestamp-shaped but calendar-invalid values (e.g. `2026-99-99T00:00:00Z`) that the shape-only regex accepts (§2 format-assertion note). Rule V-T1: ingestion-run anchors are **strictly increasing**, enforced at ingestion validation against the PostgreSQL ingestion-run record (`ingestion_runs`, `../data-model.md` E-08; aligned with contracts/snapshot-collection.md V-6); a run whose `observedAt` is not strictly later than the latest recorded successful run's fails ingestion validation (clock skew, spec.md Edge Cases), handled per `./snapshot-collection.md`. A `no-change` run advances the anchor without creating a new snapshot version and without fabricating a content change (FR-015, FR-020). |
| `contractVersion` | string, semver | Required, all modes — on the top-level envelope **and on every mixed-mode constituent** (v1.1.0, review Finding 5.4) | The version of this contract (and the collection contract) the result conforms to — currently `1.2.0`. | Valid semantic version. Consumers MUST reject an envelope whose major version they do not understand. A constituent envelope omitting `contractVersion` fails validation and the result is rejected (C-ENV-5). Changes are governed (Contract Version entity, `../data-model.md` E-06). |
| `datasetVersion` | string | Required when `fixture` (top level and constituents); optional otherwise | The Fixture Dataset version — the fixture's counterpart of `sourceCommitSha` (FR-008: "source commit SHA or dataset/fixture version"). | Non-empty; must identify a real, deterministic, versioned fixture dataset (spec.md Assumptions). When present on a non-fixture result it is informational only and never substitutes for `sourceCommitSha`. |
| `governanceWarning` | string | Required when `authoritative: false`, when `dataMode` is `fixture` or `mixed`, and whenever governance approval or project status cannot be established (FR-009) | The explicit, in-band warning. Normative minimum content: it MUST state that the result does not establish governance approval or project status, and SHOULD state why (fixture data; mixed provenance; staleness; authority not established). | Non-empty. Reference wording for the first slice's six fixture-backed tools: `"Fixture data — this result does not establish governance approval or project status and is not authoritative."` Absence on any non-authoritative result is a contract violation (C-ENV-3). |
| `stale` | boolean | Required, all modes | Whether the stored anchor's age exceeds the ratified **2-hour** staleness threshold (FR-016; Agent Zero decision 2026-07-23, spec.md Q-005). Always explicit so freshness is never inferred from a missing field. Together with `thresholdExceededBy`, one of the only two response fields that may legitimately vary between servings of the same snapshot version (§5). | Computed **at serving time** by the shared data service (tasks.md T014), comparing the stored `last_verified_at` anchor (PostgreSQL, `../data-model.md` E-08) against the serving clock — the only permitted serving-time clock use (§5). A result served past the threshold with `stale: false` is a mislabeling incident (FR-028). |
| `thresholdExceededBy` | string, ISO 8601 duration | Required when `stale: true`; **prohibited** when `stale: false` | How far past the staleness threshold the anchor is at the serving instant — the disclosure magnitude required by FR-016/FR-018: `(serving instant − last_verified_at) − 2h` (C-ENV-7). | Valid ISO 8601 duration (e.g. `PT26H30M`, `P2DT4H`). Prohibited when fresh so its mere presence signals staleness. |
| `collections` | object of constituent envelopes | Required when `mixed`; **prohibited** when `fixture` or `live` | The per-collection mode and authority declarations that make a mixed result inspectable (FR-010). Keys are collection identifiers (e.g. `snapshot`, `workPackages`, `defects`, `gates`, `decisions`, `metrics`). | Minimum two constituents. Each constituent is a full envelope restricted to `dataMode: fixture` or `live` — mixed never nests. Constituents obey all conditional rules of the top level (live requires `sourceCommitSha`; fixture requires `datasetVersion` + `governanceWarning` + `authoritative: false`), and every constituent carries its own **required** `contractVersion` (v1.1.0, review Finding 5.4). |

## 4. Mixed-Mode Composition Rules (normative)

A `mixed` envelope exists so that the mixed fixture/live operating period (spec.md Q-003 — intended, disclosed, unbounded) is safe. The rules:

- **V-M1 (authority conjunction)**: top-level `authoritative` MUST be `false` if any constituent declares `authoritative: false`. Authority of an aggregate is the logical AND of its constituents. During the first slice every mixed result therefore carries `authoritative: false` and a `governanceWarning`, because the five fixture-backed collections (serving the six fixture-backed tools) are non-authoritative (FR-004, FR-009).
- **V-M2 (genuine mixture)**: `collections` MUST contain at least one `live` and at least one `fixture` constituent. A homogeneous set is not mixed — it MUST be labeled with its uniform mode. (The schema enforces `minProperties: 2`; heterogeneity is enforced by the contract tests and the construction module.)
- **V-M3 (conservative freshness)**: top-level `observedAt` MUST equal the **earliest** constituent `observedAt`, and top-level `stale` MUST be the logical OR of constituent `stale` values. An aggregate never claims to be fresher than its stalest part; when top-level `stale` is `true`, `thresholdExceededBy` reflects the worst constituent.
- **V-M4 (never wholly live)**: a mixed result MUST NEVER be presented as wholly live, at any surface — tool result, dashboard page, aggregate metric, or status summary (FR-010; spec.md User Story 1, Scenario 3). Concretely: top-level `dataMode` is `mixed`, never `live`; the top level carries no `sourceCommitSha`; and any consumer-rendered summary derived from a mixed envelope MUST render the mixed label, not a constituent's label. Dashboard aggregate views implement this under tasks.md T016/T017.
- **V-M5 (no nesting)**: constituents declare `fixture` or `live` only. Composition happens exactly once, at the result boundary; nested mixtures would defeat per-collection inspectability.

Rules V-M1–V-M3 — and the first-slice authority policy of §3 (`authoritative: false` on live results absent a recorded Agent Zero authority decision) — are semantic rules the JSON Schema cannot fully express; they are normative here and MUST be enforced by the shared data service's envelope construction/verification module (tasks.md T014, with the contract schemas of T012) and proven by scenarios C-ENV-4/C-ENV-5 plus the mode-confusion suite (tasks T006, FR-011).

## 5. Determinism and Serving-Time Freshness (scoped rule)

*Revised under R1: this section REPLACES the former v1.0.0 blanket prohibition on serving-time clock reads (review Finding 5.2).*

- **Byte-identical boundary**: FR-014/SC-006 determinism applies to **stored normalized snapshot content at rest, per snapshot version, in PostgreSQL** (SC-006 as narrowed under R1; `./snapshot-collection.md` §5; `../data-model.md` S-02). Determinism inputs are exactly: source content at the pinned revision + contract version + normalization rules; observation metadata (run identifiers, timestamps, snapshot version assignment) is outside the guarantee. Verified by the determinism suite (tasks.md T007).
- **Deterministic envelope construction**: a served envelope is deterministic given (snapshot version or fixture dataset version, stored `last_verified_at` anchor, serving-instant freshness classification) — stable key order, no locale- or environment-dependent formatting, no random values. All timestamps originate from the Ingestion Run and are read from the PostgreSQL-persisted Ingestion Record (`../data-model.md` E-08).
- **Scoped serving-time clock rule (replaces the blanket prohibition)**: the shared server-side data service (`[EXT] src/server/centcom-data/`; tasks.md T014) computes `stale` and `thresholdExceededBy` **at serving time**, comparing the stored `last_verified_at` anchor (PostgreSQL) against the serving clock. **This comparison is the ONLY permitted serving-time clock use.** No other envelope or payload field may derive from the serving clock.
- **Exhaustive serving-time-varying field set**: `stale` (boolean) and `thresholdExceededBy` (present when stale). Every other envelope field derives from stored state — in particular, `observedAt` always equals the stored anchor, never the serving clock.
- The internal `aging` state never appears in any envelope (`../data-model.md` S-02); the envelope's freshness vocabulary is exactly `stale` plus `thresholdExceededBy`.

## 6. Contract Test Scenarios (C-ENV-1 .. C-ENV-8)

These scenarios are the executable form of this contract. They are authored under task T004 (`[EXT] src/data/__tests__/provenance-envelope.contract.test.ts`) and, per the TDD discipline of tasks.md Phase 3.2, **each scenario MUST be written first and MUST FAIL against the review baseline (dashboard `49f05bb`; historical authoring pin `95c8e9c` preserved)** — the baseline has no envelope implementation — passing only when the implementation tasks (T012, T014, T016–T019) are complete under Agent Zero's explicit Gate 2 implementation directive (recorded verbatim by T001). A scenario that passes before implementation exists indicates a defective test, not early success. Sole exception: C-ENV-8 validates the contract schemas themselves under the schema-compilation validation task (T011) and passes as soon as both schemas compile with cross-references resolved — it still precedes implementation.

| ID | Scenario (Given / When / Then) | Proves | Supports |
|---|---|---|---|
| **C-ENV-1** | **Envelope everywhere.** Given the serving surfaces are running in any configuration (fixture-only, first slice, or simulated mixed), when each of the seven MCP tools is invoked and each dashboard collection is read through the shared data model, then every result carries a `provenance` member that validates against the schema in §2 — zero exceptions, including error and fallback paths. | FR-008 | SC-002 |
| **C-ENV-2** | **Missing, unknown, or calendar-invalid field rejected.** Given a candidate envelope with any single required field removed (each field in turn: `dataMode`, `authoritative`, `sourceRepository`, `observedAt`, `contractVersion`, `stale`, and the conditionally required `sourceCommitSha`/`datasetVersion`/`governanceWarning`/`thresholdExceededBy`/`collections`), or with one undeclared extra field added, or with a timestamp-shaped but calendar-invalid `observedAt` (e.g. `2026-99-99T00:00:00Z`, rejected by the `date-time` format assertion — §2), when the envelope is validated, then validation fails and the verification module rejects the result — it is never served as-is. | FR-008, FR-003 (validation boundary rejects contract-violating content) | SC-002, SC-004 |
| **C-ENV-3** | **Fixture is honest.** Given the six non-migrated tools during the first slice (and all seven under rollback per FR-019), when any fixture-backed result is returned, then its envelope declares `dataMode: fixture`, `authoritative: false`, a non-empty `datasetVersion` identifying the versioned fixture dataset, a `governanceWarning` stating the result does not establish governance approval or project status, and **no** `sourceCommitSha`. | FR-007, FR-009 | SC-002, SC-005, SC-009 |
| **C-ENV-4** | **Live is pinned and timed.** Given a served live `get_snapshot` result produced from a Validated Snapshot, when its envelope is inspected, then `dataMode` is `live`, `sourceCommitSha` is a full 40-hex SHA that matches the source revision recorded by the producing Ingestion Run in the Ingestion Record (PostgreSQL `ingestion_runs`), `observedAt` equals the stored `last_verified_at` anchor — the recorded observation timestamp (ISO 8601 with timezone) of the latest successful run (the publishing run, or a later `no-change` run that re-verified the same version) — not the serving time, and not a fixture-modeled value, and, under the first-slice authority policy (§3), `authoritative` is `false` with a `governanceWarning` unless a recorded Agent Zero authority decision is cited. | FR-005, FR-008, FR-015 | SC-001, SC-009 |
| **C-ENV-5** | **Mixed is never wholly live — and every constituent is versioned.** Given a result composed of at least one live constituent and at least one fixture constituent, when it is returned, then `dataMode` is `mixed`; `collections` enumerates every constituent with its own conformant envelope (`fixture` or `live` only), **each carrying its own required `contractVersion` — a constituent envelope omitting `contractVersion` fails schema validation and the result is rejected, never served (review Finding 5.4)**; top-level `authoritative` obeys V-M1; top-level `observedAt`/`stale` obey V-M3; no top-level `sourceCommitSha` is present; and no surface, summary, or label derived from the result presents it as `live` (V-M4). | FR-008, FR-010 | SC-002, SC-009 |
| **C-ENV-6** | **Stale is disclosed.** Given the stored `last_verified_at` anchor is more than 2 hours in the past (e.g., under simulated retrieval failure per FR-018), when the result is served, then its envelope declares `stale: true` with a valid `thresholdExceededBy` duration while `observedAt` remains the unchanged stored anchor — and conversely, a fresh result declares `stale: false` and carries no `thresholdExceededBy`. Stale data is never presented as fresh. | FR-016, FR-018 | SC-004, SC-009 |
| **C-ENV-7** | **Stale computation is anchor-correct.** Given a stored snapshot whose `last_verified_at` anchor is `T`, when the result is served at instant `S` by the shared data service (tasks.md T014), then: if `S − T` ≤ 2 h the envelope declares `stale: false` with no `thresholdExceededBy`; if `S − T` > 2 h it declares `stale: true` with `thresholdExceededBy` equal to `(S − T) − 2h`; in both cases `observedAt` equals `T` — never `S` — and across repeated servings of the same snapshot version only `stale`/`thresholdExceededBy` differ (the exhaustive serving-time-varying set, §5). | FR-016, FR-014 (§5 scoped boundary) | SC-004 (review Finding 5.2) |
| **C-ENV-8** | **Schema compilation.** Given this contract's schema (§2, `$id` `urn:centcom:contract:provenance-envelope:1.2.0`) and the snapshot collection schema (`urn:centcom:contract:snapshot-collection:1.2.0`) loaded into one validator, when compilation runs (Ajv or equivalent, CI-runnable), then compilation succeeds with every cross-reference resolved by `$id` URN — zero `.md`-path `$ref`s. (Executed by the schema-compilation validation task, tasks.md T011; `../test-strategy.md` schema-compilation layer; counterpart of `./snapshot-collection.md` C-SNAP-9.) | FR-008, FR-013 | SC-002 (review Finding 5.5) |

Relationship to sibling suites: C-ENV-1..8 verify the envelope contract itself; the mode-confusion suite (tasks T006, FR-011, SC-009) additionally proves classification-from-result-alone and the fixture-poisoning canary; the failure-path suite (tasks T008) exercises the operational transitions that produce the stale and fallback envelopes; the no-change semantics test (tasks T009, FR-020) proves anchor advance without version churn; the rollback test (tasks T010, FR-019, SC-005) proves fixture-only reversion re-labels all seven tools correctly with no data repair. Coverage is mapped in `../traceability.md`; the overall test approach is defined in `../test-strategy.md`.

## 7. Example Instances (informative)

Live, fresh (first-slice `get_snapshot`):

```json
{
  "dataMode": "live",
  "authoritative": false,
  "sourceRepository": "hanax-ai/sdd-core",
  "sourceCommitSha": "6994bf6000000000000000000000000000000000",
  "observedAt": "2026-07-22T14:05:00Z",
  "contractVersion": "1.2.0",
  "governanceWarning": "Live data — the Agent Zero authority decision for this collection is not yet recorded; this result does not establish governance approval or project status.",
  "stale": false
}
```

*(The SHA above is a placeholder shaped like a real pin; a served envelope carries the actual observed head commit — verified against the Ingestion Record per C-ENV-4. `observedAt` is the stored `last_verified_at` anchor, and `stale: false` is the serving-time classification of an anchor no more than 2 hours old. `authoritative: false` reflects the first-slice authority policy (§3): it becomes `true` — and the `governanceWarning` is dropped — only when a recorded Agent Zero authority decision for the live collection exists to cite.)*

Fixture (any of the six non-migrated tools during the first slice):

```json
{
  "dataMode": "fixture",
  "authoritative": false,
  "sourceRepository": "hanax-ai/sdd-core",
  "observedAt": "2026-07-22T00:00:00Z",
  "contractVersion": "1.2.0",
  "datasetVersion": "fixture-2026.07-phase1",
  "governanceWarning": "Fixture data — this result does not establish governance approval or project status and is not authoritative.",
  "stale": false
}
```

Mixed (aggregate over the live snapshot and a fixture collection, live constituent stale):

```json
{
  "dataMode": "mixed",
  "authoritative": false,
  "sourceRepository": "hanax-ai/sdd-core",
  "observedAt": "2026-07-20T09:00:00Z",
  "contractVersion": "1.2.0",
  "governanceWarning": "Mixed fixture/live result — not wholly live; fixture constituents do not establish governance approval or project status.",
  "stale": true,
  "thresholdExceededBy": "PT26H",
  "collections": {
    "snapshot": {
      "dataMode": "live",
      "authoritative": false,
      "sourceRepository": "hanax-ai/sdd-core",
      "sourceCommitSha": "6994bf6000000000000000000000000000000000",
      "observedAt": "2026-07-20T09:00:00Z",
      "contractVersion": "1.2.0",
      "governanceWarning": "Live data — the Agent Zero authority decision for this collection is not yet recorded; this result does not establish governance approval or project status.",
      "stale": true,
      "thresholdExceededBy": "PT26H"
    },
    "workPackages": {
      "dataMode": "fixture",
      "authoritative": false,
      "sourceRepository": "hanax-ai/sdd-core",
      "observedAt": "2026-07-21T00:00:00Z",
      "contractVersion": "1.2.0",
      "datasetVersion": "fixture-2026.07-phase1",
      "governanceWarning": "Fixture data — this result does not establish governance approval or project status and is not authoritative.",
      "stale": false
    }
  }
}
```

*(Stale-computation worked example, per §5 and C-ENV-7: the live constituent's stored `last_verified_at` anchor is `2026-07-20T09:00:00Z`; at a serving instant of `2026-07-21T13:00:00Z` its age is 28 h, exceeding the 2-hour threshold by 26 h — hence `stale: true` with `thresholdExceededBy: "PT26H"`, while `observedAt` remains the unchanged anchor. Every constituent carries its own required `contractVersion` per v1.1.0. The live constituent declares `authoritative: false` with a `governanceWarning` per the first-slice authority policy (§3) — no Agent Zero authority decision is recorded at authoring.)*

## 8. Requirement Mapping Summary

| Requirement | Where satisfied in this contract |
|---|---|
| FR-008 (envelope minimum fields; contract version on every envelope, including mixed-mode constituents) | §2 schema (constituent `contractVersion` required, v1.1.0); §3 field rules; C-ENV-1, C-ENV-2, C-ENV-4, C-ENV-5 |
| FR-009 (non-authority warning; fixture `authoritative: false`) | §3 (`authoritative`, `governanceWarning`); schema fixture conditional; C-ENV-3 |
| FR-010 (mixed never wholly live; per-collection authority) | §4 V-M1..V-M5; schema mixed conditional; C-ENV-5 |
| FR-003 (validation boundary) | §2 `additionalProperties: false`; C-ENV-2 |
| FR-005 / FR-015 (real source pin; snapshot pinning; no-change rule) | §3 (`sourceCommitSha`, V-L1; `observedAt` anchor rules); C-ENV-4 |
| FR-016 / FR-018 (freshness anchor; 2 h threshold; staleness disclosure; honest fallback) | §3 (`stale`, `thresholdExceededBy`, `observedAt`); §5 scoped serving-time rule; C-ENV-6, C-ENV-7 |
| FR-007 / FR-011 (six tools verifiably fixture; modes cannot be confused) | §3 sourceCommitSha prohibition on fixture; C-ENV-3; delegation to tasks T006 |
| FR-013 (schema resolvability — review Finding 5.5) | §2 `$id` URN + resolvability note; C-ENV-8; delegation to tasks.md T011 |
| FR-014 (determinism, scoped to stored normalized content) | §5; delegation to tasks.md T007; C-ENV-7 (serving-time-varying set) |
| SC-001, SC-002, SC-004, SC-005, SC-009 | Scenario table, §6 |
| SC-006 (narrowed: stored normalized content; metadata excluded) | §5 byte-identical boundary; tasks.md T007 |

---

*This contract is a planning artifact authored under WO-P2-AUTHOR-001 and revised under WO-P2-AUTHOR-001-R1 (2026-07-23). It binds implementation that has not been authorized: execution of C-ENV-1..C-ENV-8 and of the modules they verify occurs only after Agent Zero's explicit Gate 2 implementation directive (Stage B, recorded verbatim by tasks.md T001), preceded by planning approval and the readiness-to-request-Gate-2 criteria (`../gate-2-entry-criteria.md`), with the Article IV mirror registered per tasks.md T002 and the completed P2-PRE-2 evidence recorded per tasks.md T003 (FR-029/SC-008). Approval of this file is a planning approval only — it claims no Gate 2 status and grants no implementation authority — see `../implementation-authorization-boundary.md`.*
