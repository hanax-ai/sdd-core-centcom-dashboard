/**
 * SDD-Core SITREP — Situation Report — typed entities.
 * Every source-derived entity carries provenance so the UI can never
 * silently promote assumptions to facts.
 */

export type Confidence = "verified" | "derived" | "declared" | "unknown";

export type Freshness = "fresh" | "aging" | "stale" | "partial";

export type SourceType =
  | "consolidated-plan-v4"
  | "implementation-goals"
  | "github-repo-commits"
  | "wip-index"
  | "wip-item"
  | "promoted-proposal"
  | "feature-spec"
  | "feature-plan"
  | "feature-tasks"
  | "github-issue"
  | "github-pr"
  | "verify-run"
  | "deliverables-register"
  | "standards-register"
  | "manual-annotation"
  | "data-integrity";

export interface Provenance {
  sourceType: SourceType;
  sourceLocation: string; // path or URL
  sourceRevision?: string; // commit SHA or version
  observedAt: string; // ISO
  confidence: Confidence;
  parsingWarnings?: string[];
}

export interface SourceRecord {
  id: string;
  name: string;
  type: SourceType;
  location: string;
  authority: "constitutional" | "ratified" | "planning" | "tracker" | "manual" | "observational";
  lastFetched?: string;
  lastSuccessfulParse?: string;
  freshnessPolicyHours: number;
  freshness: Freshness;
  parseErrors?: string[];
  itemsContributed: number;
}

export type WorkStatus =
  | "not-started"
  | "in-progress"
  | "awaiting-decision"
  | "awaiting-gate-1"
  | "awaiting-gate-2"
  | "blocked"
  | "completed"
  | "deferred"
  | "invalidated";

export type Severity = "critical" | "high" | "medium" | "low";
export type DefectState =
  | "open"
  | "investigating"
  | "planned"
  | "blocked"
  | "resolved"
  | "accepted-risk"
  | "false-positive";

export type Phase = "pre-framework" | "framework" | "ops" | "post-ops";

export interface PlanPhase {
  id: string;
  key: Phase;
  name: string;
  order: number;
  status: "completed" | "current" | "next" | "later";
  provenance: Provenance;
}

export interface Goal {
  id: string;
  phaseId: string;
  title: string;
  provenance: Provenance;
}

export interface AcceptanceCriterion {
  id: string;
  workPackageId: string;
  text: string;
  passed: boolean;
  evidenceLinkIds: string[];
  provenance: Provenance;
}

export interface WorkPackage {
  id: string; // e.g. WP-R1
  goalId: string;
  phaseId: string;
  title: string;
  description: string;
  status: WorkStatus;
  priority: "p0" | "p1" | "p2" | "p3";
  owner: string;
  operatingAgent: string;
  gateRequirement: "none" | "gate-1" | "gate-2" | "both";
  dependencyIds: string[];
  defectIds: string[];
  acceptancePassed: number;
  acceptanceTotal: number;
  evidenceCount: number;
  evidenceConfidence: Confidence;
  lastActivityAt: string;
  nextAction: string;
  provenance: Provenance;
}

export interface Decision {
  id: string;
  title: string;
  authority: "agent-zero" | "maintainer" | "constitutional-council";
  options: string[];
  impact: string;
  blockingScope: string;
  ageDays: number;
  workPackageId?: string;
  provenance: Provenance;
}

export interface GateEvent {
  id: string;
  gate: "gate-1" | "gate-2" | "maintenance-changes";
  workPackageId: string;
  status: "pending" | "approved" | "rejected" | "not-applicable";
  requiredDirective: string;
  approvingAuthority: string;
  approvalEvidenceUrl?: string;
  approvedArtifactRevision?: string;
  approvedAt?: string;
  provenance: Provenance;
}

export interface Defect {
  id: string;
  title: string;
  severity: Severity;
  state: DefectState;
  source:
    "github-issue" | "plan-defined" | "review-finding" | "data-integrity" | "risk" | "unknown";
  sourceRef?: string;
  workPackageId?: string;
  artifact?: string;
  owner?: string;
  discoveredAt: string;
  resolvedAt?: string;
  resolutionEvidenceUrl?: string;
  hasGithubIssue: boolean;
  provenance: Provenance;
}

export interface EvidenceLink {
  id: string;
  label: string;
  url: string;
  kind: "commit" | "pr" | "issue" | "workflow-run" | "doc" | "annotation";
  observedAt: string;
  confidence: Confidence;
}

export interface VerificationRun {
  id: string;
  name: string; // verify-layout, etc.
  status: "passed" | "failed" | "flaky" | "unknown" | "missing";
  observedAt: string;
  workPackageId?: string;
  passedChecks?: number;
  totalChecks?: number;
  evidenceUrl?: string;
  provenance: Provenance;
}

export interface Deliverable {
  id: string;
  layer: "root-global" | "framework" | "ops";
  artifactSet: string;
  owner: string;
  operatingAgent: string;
  status: "active" | "deprecated" | "draft";
  lastReview?: string;
  nextReviewDue?: string;
  exception?: string;
  staleness: Freshness;
  observedVersion?: string;
  registerVersion?: string; // may drift
  provenance: Provenance;
}

export interface ActivityEvent {
  id: string;
  at: string;
  kind: "commit" | "review" | "approval" | "verify-run" | "plan-change" | "annotation";
  scope: "root-global" | "framework" | "ops" | "cross-cutting";
  sourceRef: string; // e.g. commit SHA or PR#
  description: string;
  relatedWorkPackageId?: string;
  relatedDefectId?: string;
  relatedGateId?: string;
  evidenceUrl?: string;
  confidence: Confidence;
}

export interface SyncRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "ok" | "partial" | "failed";
  sourceRevision?: string;
  itemCounts: Record<string, number>;
  warnings: string[];
  failures: string[];
}

export interface Snapshot {
  repo: string;
  branch: string;
  headSha: string;
  snapshotDate: string;
  latestCommitTitle: string;
  openIssues: number;
  openPullRequests: number;
  ciPolicy: "advisory" | "required";
  currentStatusEvidence: "observed-passing" | "observed-failing" | "no-current-evidence";
  freshness: Freshness;
  lastSyncedAt: string;
}
