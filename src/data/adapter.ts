/**
 * Data adapter — Phase 1 returns typed fixtures. In Phase 2, swap
 * implementations to read-only GitHub ingestion behind the same
 * interface without touching the UI.
 *
 * CP-2 — every collection is parsed once at module load through the
 * Zod schemas in ./schemas. The UI only ever receives values that
 * satisfy the declared shape; any drift fails loudly at this seam
 * with the offending collection + index, instead of silently
 * rendering "unknown" cells downstream.
 */
import {
  activityEvents,
  decisions,
  defects,
  deliverables,
  evidenceLinks,
  gates,
  goals,
  phases,
  snapshot,
  sources,
  syncRuns,
  verificationRuns,
  workPackages,
} from "./fixtures";
import {
  ActivityEventSchema,
  DecisionSchema,
  DefectSchema,
  DeliverableSchema,
  EvidenceLinkSchema,
  GateEventSchema,
  GoalSchema,
  PlanPhaseSchema,
  SnapshotSchema,
  SourceRecordSchema,
  SyncRunSchema,
  VerificationRunSchema,
  WorkPackageSchema,
  parseCollection,
  parseOne,
} from "./schemas";

const validated = {
  snapshot: parseOne("snapshot", SnapshotSchema, snapshot),
  phases: parseCollection("phases", PlanPhaseSchema, phases),
  goals: parseCollection("goals", GoalSchema, goals),
  workPackages: parseCollection("workPackages", WorkPackageSchema, workPackages),
  decisions: parseCollection("decisions", DecisionSchema, decisions),
  gates: parseCollection("gates", GateEventSchema, gates),
  defects: parseCollection("defects", DefectSchema, defects),
  evidenceLinks: parseCollection("evidenceLinks", EvidenceLinkSchema, evidenceLinks),
  verificationRuns: parseCollection("verificationRuns", VerificationRunSchema, verificationRuns),
  deliverables: parseCollection("deliverables", DeliverableSchema, deliverables),
  activityEvents: parseCollection("activityEvents", ActivityEventSchema, activityEvents),
  sources: parseCollection("sources", SourceRecordSchema, sources),
  syncRuns: parseCollection("syncRuns", SyncRunSchema, syncRuns),
} as const;

export const dataSource = {
  mode: "fixture" as "fixture" | "github-ro",
  snapshot: () => validated.snapshot,
  phases: () => validated.phases,
  goals: () => validated.goals,
  workPackages: () => validated.workPackages,
  decisions: () => validated.decisions,
  gates: () => validated.gates,
  defects: () => validated.defects,
  evidenceLinks: () => validated.evidenceLinks,
  verificationRuns: () => validated.verificationRuns,
  deliverables: () => validated.deliverables,
  activityEvents: () => validated.activityEvents,
  sources: () => validated.sources,
  syncRuns: () => validated.syncRuns,
};

export type DataSource = typeof dataSource;
