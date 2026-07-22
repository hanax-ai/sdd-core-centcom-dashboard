/**
 * CP-2 — Zod schema boundaries.
 *
 * Every value that crosses the adapter boundary (fixture today,
 * GitHub ingestion tomorrow) is parsed through these schemas. The
 * UI never sees an entity that has not been validated against its
 * declared shape, so a bad shape fails loudly at the seam instead
 * of silently rendering "unknown" cells downstream.
 *
 * Schemas are the source of truth. `src/data/types.ts` retains
 * hand-written types for editor ergonomics, but the runtime shape
 * is whatever these schemas accept.
 */
import { z } from "zod";

export const ConfidenceSchema = z.enum(["verified", "derived", "declared", "unknown"]);

export const FreshnessSchema = z.enum(["fresh", "aging", "stale", "partial"]);

export const SourceTypeSchema = z.enum([
  "consolidated-plan-v4",
  "implementation-goals",
  "github-repo-commits",
  "wip-index",
  "wip-item",
  "promoted-proposal",
  "feature-spec",
  "feature-plan",
  "feature-tasks",
  "github-issue",
  "github-pr",
  "verify-run",
  "deliverables-register",
  "standards-register",
  "manual-annotation",
  "data-integrity",
]);

const isoString = z.string().datetime({ offset: true, message: "ISO timestamp required" });
const isoDate = z.string().date("ISO date required");

export const ProvenanceSchema = z.object({
  sourceType: SourceTypeSchema,
  sourceLocation: z.string().min(1),
  sourceRevision: z.string().optional(),
  observedAt: isoString,
  confidence: ConfidenceSchema,
  parsingWarnings: z.array(z.string()).optional(),
});

export const SourceRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: SourceTypeSchema,
  location: z.string(),
  authority: z.enum([
    "constitutional",
    "ratified",
    "planning",
    "tracker",
    "manual",
    "observational",
  ]),
  lastFetched: isoString.optional(),
  lastSuccessfulParse: isoString.optional(),
  freshnessPolicyHours: z.number().nonnegative(),
  freshness: FreshnessSchema,
  parseErrors: z.array(z.string()).optional(),
  itemsContributed: z.number().int().nonnegative(),
});

export const WorkStatusSchema = z.enum([
  "not-started",
  "in-progress",
  "awaiting-decision",
  "awaiting-gate-1",
  "awaiting-gate-2",
  "blocked",
  "completed",
  "deferred",
  "invalidated",
]);

export const SeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export const DefectStateSchema = z.enum([
  "open",
  "investigating",
  "planned",
  "blocked",
  "resolved",
  "accepted-risk",
  "false-positive",
]);

export const PhaseSchema = z.enum(["pre-framework", "framework", "ops", "post-ops"]);

export const PlanPhaseSchema = z.object({
  id: z.string(),
  key: PhaseSchema,
  name: z.string(),
  order: z.number().int().nonnegative(),
  status: z.enum(["completed", "current", "next", "later"]),
  provenance: ProvenanceSchema,
});

export const GoalSchema = z.object({
  id: z.string(),
  phaseId: z.string(),
  title: z.string(),
  provenance: ProvenanceSchema,
});

export const AcceptanceCriterionSchema = z.object({
  id: z.string(),
  workPackageId: z.string(),
  text: z.string(),
  passed: z.boolean(),
  evidenceLinkIds: z.array(z.string()),
  provenance: ProvenanceSchema,
});

export const WorkPackageSchema = z
  .object({
    id: z.string(),
    goalId: z.string(),
    phaseId: z.string(),
    title: z.string(),
    description: z.string(),
    status: WorkStatusSchema,
    priority: z.enum(["p0", "p1", "p2", "p3"]),
    owner: z.string(),
    operatingAgent: z.string(),
    gateRequirement: z.enum(["none", "gate-1", "gate-2", "both"]),
    dependencyIds: z.array(z.string()),
    defectIds: z.array(z.string()),
    acceptancePassed: z.number().int().nonnegative(),
    acceptanceTotal: z.number().int().nonnegative(),
    evidenceCount: z.number().int().nonnegative(),
    evidenceConfidence: ConfidenceSchema,
    lastActivityAt: isoString,
    nextAction: z.string(),
    provenance: ProvenanceSchema,
  })
  .refine((wp) => wp.acceptancePassed <= wp.acceptanceTotal, {
    message: "acceptancePassed must not exceed acceptanceTotal",
    path: ["acceptancePassed"],
  });

export const DecisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  authority: z.enum(["agent-zero", "maintainer", "constitutional-council"]),
  options: z.array(z.string()),
  impact: z.string(),
  blockingScope: z.string(),
  ageDays: z.number().nonnegative(),
  workPackageId: z.string().optional(),
  provenance: ProvenanceSchema,
});

export const GateEventSchema = z.object({
  id: z.string(),
  gate: z.enum(["gate-1", "gate-2", "maintenance-changes"]),
  workPackageId: z.string(),
  status: z.enum(["pending", "approved", "rejected", "not-applicable"]),
  requiredDirective: z.string(),
  approvingAuthority: z.string(),
  approvalEvidenceUrl: z.string().url().optional(),
  approvedArtifactRevision: z.string().optional(),
  approvedAt: isoString.optional(),
  provenance: ProvenanceSchema,
});

export const DefectSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: SeveritySchema,
  state: DefectStateSchema,
  source: z.enum([
    "github-issue",
    "plan-defined",
    "review-finding",
    "data-integrity",
    "risk",
    "unknown",
  ]),
  sourceRef: z.string().optional(),
  workPackageId: z.string().optional(),
  artifact: z.string().optional(),
  owner: z.string().optional(),
  discoveredAt: isoString,
  resolvedAt: isoString.optional(),
  resolutionEvidenceUrl: z.string().url().optional(),
  hasGithubIssue: z.boolean(),
  provenance: ProvenanceSchema,
});

export const EvidenceLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url(),
  kind: z.enum(["commit", "pr", "issue", "workflow-run", "doc", "annotation"]),
  observedAt: isoString,
  confidence: ConfidenceSchema,
});

export const VerificationRunSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["passed", "failed", "flaky", "unknown", "missing"]),
    observedAt: isoString,
    workPackageId: z.string().optional(),
    passedChecks: z.number().int().nonnegative().optional(),
    totalChecks: z.number().int().nonnegative().optional(),
    evidenceUrl: z.string().url().optional(),
    provenance: ProvenanceSchema,
  })
  .refine(
    (v) =>
      v.passedChecks === undefined ||
      v.totalChecks === undefined ||
      v.passedChecks <= v.totalChecks,
    { message: "passedChecks must not exceed totalChecks", path: ["passedChecks"] },
  );

export const DeliverableSchema = z.object({
  id: z.string(),
  layer: z.enum(["root-global", "framework", "ops"]),
  artifactSet: z.string(),
  owner: z.string(),
  operatingAgent: z.string(),
  status: z.enum(["active", "deprecated", "draft"]),
  lastReview: isoDate.optional(),
  nextReviewDue: isoDate.optional(),
  exception: z.string().optional(),
  staleness: FreshnessSchema,
  observedVersion: z.string().optional(),
  registerVersion: z.string().optional(),
  provenance: ProvenanceSchema,
});

export const ActivityEventSchema = z.object({
  id: z.string(),
  at: isoString,
  kind: z.enum(["commit", "review", "approval", "verify-run", "plan-change", "annotation"]),
  scope: z.enum(["root-global", "framework", "ops", "cross-cutting"]),
  sourceRef: z.string(),
  description: z.string(),
  relatedWorkPackageId: z.string().optional(),
  relatedDefectId: z.string().optional(),
  relatedGateId: z.string().optional(),
  evidenceUrl: z.string().url().optional(),
  confidence: ConfidenceSchema,
});

export const SyncRunSchema = z.object({
  id: z.string(),
  startedAt: isoString,
  finishedAt: isoString.optional(),
  status: z.enum(["ok", "partial", "failed"]),
  sourceRevision: z.string().optional(),
  itemCounts: z.record(z.string(), z.number().int().nonnegative()),
  warnings: z.array(z.string()),
  failures: z.array(z.string()),
});

export const SnapshotSchema = z.object({
  repo: z.string(),
  branch: z.string(),
  headSha: z.string().min(7),
  snapshotDate: z.string().min(1),
  latestCommitTitle: z.string(),
  openIssues: z.number().int().nonnegative(),
  openPullRequests: z.number().int().nonnegative(),
  ciPolicy: z.enum(["advisory", "required"]),
  currentStatusEvidence: z.enum(["observed-passing", "observed-failing", "no-current-evidence"]),
  freshness: FreshnessSchema,
  lastSyncedAt: isoString,
});

/**
 * Parse an array of records with a labeled schema. On failure the
 * thrown error names the collection and the offending index so the
 * fixture (or future GitHub ingestion) can be corrected at the
 * source — never silently coerced.
 */
export function parseCollection<T>(label: string, schema: z.ZodType<T>, values: unknown[]): T[] {
  return values.map((value, index) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
        .join("; ");
      throw new Error(`[data-boundary] ${label}[${index}] failed schema validation — ${issues}`);
    }
    return result.data;
  });
}

export function parseOne<T>(label: string, schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    throw new Error(`[data-boundary] ${label} failed schema validation — ${issues}`);
  }
  return result.data;
}
