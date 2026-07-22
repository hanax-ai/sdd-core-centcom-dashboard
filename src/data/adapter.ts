/**
 * Data adapter — Phase 1 returns typed fixtures. In Phase 2, swap
 * implementations to read-only GitHub ingestion behind the same
 * interface without touching the UI.
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

export const dataSource = {
  mode: "fixture" as "fixture" | "github-ro",
  snapshot: () => snapshot,
  phases: () => phases,
  goals: () => goals,
  workPackages: () => workPackages,
  decisions: () => decisions,
  gates: () => gates,
  defects: () => defects,
  evidenceLinks: () => evidenceLinks,
  verificationRuns: () => verificationRuns,
  deliverables: () => deliverables,
  activityEvents: () => activityEvents,
  sources: () => sources,
  syncRuns: () => syncRuns,
};

export type DataSource = typeof dataSource;
