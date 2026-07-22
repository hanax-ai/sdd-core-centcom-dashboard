import type {
  ActivityEvent,
  Decision,
  Defect,
  Deliverable,
  EvidenceLink,
  GateEvent,
  Goal,
  PlanPhase,
  Provenance,
  Snapshot,
  SourceRecord,
  SyncRun,
  VerificationRun,
  WorkPackage,
} from "./types";

const REPO = "hanax-ai/sdd-core";
const HEAD = "6994bf626389be172e9bae8568a91b04d5174970";
const OBSERVED = "2026-07-21T14:22:00Z";

const p = (partial: Partial<Provenance> & { sourceType: Provenance["sourceType"] }): Provenance => ({
  sourceLocation: `github:${REPO}@${HEAD.slice(0, 7)}`,
  sourceRevision: HEAD,
  observedAt: OBSERVED,
  confidence: "derived",
  ...partial,
});

export const snapshot: Snapshot = {
  repo: REPO,
  branch: "main",
  headSha: HEAD,
  snapshotDate: "2026-07-21",
  latestCommitTitle:
    "Align wip/README and governance skills to the v2.1.0 Maintenance Changes route (WP-R1)",
  openIssues: 0,
  openPullRequests: 0,
  ciPolicy: "advisory",
  currentStatusEvidence: "no-current-evidence",
  freshness: "fresh",
  lastSyncedAt: OBSERVED,
};

export const phases: PlanPhase[] = [
  { id: "ph-pre", key: "pre-framework", name: "Pre-Framework", order: 0, status: "completed", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
  { id: "ph-fw", key: "framework", name: "Framework", order: 1, status: "current", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
  { id: "ph-ops", key: "ops", name: "Ops", order: 2, status: "next", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
  { id: "ph-post", key: "post-ops", name: "Post-Ops", order: 3, status: "later", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
];

export const goals: Goal[] = [
  { id: "G-R", phaseId: "ph-fw", title: "Route framework governance to v2.1.0 Maintenance Changes", provenance: p({ sourceType: "implementation-goals", confidence: "declared" }) },
  { id: "G-L", phaseId: "ph-fw", title: "Establish evidence-based skill lifecycle", provenance: p({ sourceType: "implementation-goals", confidence: "declared" }) },
  { id: "G-M", phaseId: "ph-fw", title: "Complete framework maturity backlog", provenance: p({ sourceType: "implementation-goals", confidence: "declared" }) },
  { id: "G-O", phaseId: "ph-ops", title: "Deliverables register hygiene", provenance: p({ sourceType: "implementation-goals", confidence: "declared" }) },
];

export const workPackages: WorkPackage[] = [
  {
    id: "WP-R1", goalId: "G-R", phaseId: "ph-fw",
    title: "Align wip/README and governance skills to v2.1.0 Maintenance Changes",
    description: "Route WIP governance & README references to the v2.1.0 Maintenance Changes flow so promotion vs implementation are unambiguous.",
    status: "completed", priority: "p0",
    owner: "framework-maintainer", operatingAgent: "agent-framework",
    gateRequirement: "gate-1", dependencyIds: [],
    defectIds: ["DEF-DR1"],
    acceptancePassed: 4, acceptanceTotal: 4,
    evidenceCount: 3, evidenceConfidence: "verified",
    lastActivityAt: "2026-07-21T09:12:00Z",
    nextAction: "Close out — verify register version drift against snapshot",
    provenance: p({ sourceType: "github-repo-commits", confidence: "verified" }),
  },
  {
    id: "WP-L1", goalId: "G-L", phaseId: "ph-fw",
    title: "Skill lifecycle specification authoring",
    description: "Author the evidence-based skill lifecycle specification. Gate 1 promoted; Gate 2 implementation approval pending Agent Zero decision.",
    status: "awaiting-gate-2", priority: "p0",
    owner: "framework-maintainer", operatingAgent: "agent-zero",
    gateRequirement: "gate-2", dependencyIds: [],
    defectIds: [],
    acceptancePassed: 0, acceptanceTotal: 6,
    evidenceCount: 1, evidenceConfidence: "verified",
    lastActivityAt: "2026-07-18T16:44:00Z",
    nextAction: "Agent Zero: approve Gate 2 implementation scope for lifecycle pilot",
    provenance: p({ sourceType: "promoted-proposal", confidence: "verified" }),
  },
  {
    id: "WP-L2", goalId: "G-L", phaseId: "ph-fw",
    title: "Lifecycle pilot: session-capture (root) + mirror-sync (project)",
    description: "Pilot the promoted lifecycle at root tier (session-capture) and project tier (mirror-sync). Machine-tier conversation-sync backfill deferred.",
    status: "awaiting-decision", priority: "p1",
    owner: "framework-maintainer", operatingAgent: "agent-zero",
    gateRequirement: "gate-2", dependencyIds: ["WP-L1"],
    defectIds: [],
    acceptancePassed: 0, acceptanceTotal: 5,
    evidenceCount: 0, evidenceConfidence: "unknown",
    lastActivityAt: "2026-07-15T10:00:00Z",
    nextAction: "Blocked on WP-L1 Gate 2",
    provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }),
  },
  {
    id: "WP-L3", goalId: "G-L", phaseId: "ph-fw",
    title: "Machine-tier conversation-sync backfill",
    description: "Backfill machine-tier conversation-sync — deferred until after the lifecycle pilot ships.",
    status: "deferred", priority: "p2",
    owner: "framework-maintainer", operatingAgent: "agent-machine",
    gateRequirement: "gate-2", dependencyIds: ["WP-L2"],
    defectIds: [],
    acceptancePassed: 0, acceptanceTotal: 3,
    evidenceCount: 0, evidenceConfidence: "unknown",
    lastActivityAt: "2026-07-10T09:00:00Z",
    nextAction: "Revisit after pilot",
    provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }),
  },
  ...[1, 2, 4, 5, 6, 7, 8].map<WorkPackage>((n) => ({
    id: `WP-M${n}`, goalId: "G-M", phaseId: "ph-fw",
    title: `Maturity backlog item ${n}`,
    description: `Framework maturity backlog item ${n} — completed prior to snapshot.`,
    status: "completed", priority: "p1",
    owner: "framework-maintainer", operatingAgent: "agent-framework",
    gateRequirement: "gate-1", dependencyIds: [],
    defectIds: [],
    acceptancePassed: 3, acceptanceTotal: 3,
    evidenceCount: 2, evidenceConfidence: "verified",
    lastActivityAt: `2026-07-${(10 + n).toString().padStart(2, "0")}T12:00:00Z`,
    nextAction: "Complete",
    provenance: p({ sourceType: "github-repo-commits", confidence: "verified" }),
  })),
  {
    id: "WP-M3", goalId: "G-M", phaseId: "ph-fw",
    title: "Maturity backlog item 3 — lifecycle spec authoring authorization",
    description: "Item 3 remains untouched pending intentional authorization of lifecycle specification authoring. Not started by design.",
    status: "awaiting-decision", priority: "p1",
    owner: "framework-maintainer", operatingAgent: "agent-zero",
    gateRequirement: "gate-2", dependencyIds: [],
    defectIds: [],
    acceptancePassed: 0, acceptanceTotal: 3,
    evidenceCount: 0, evidenceConfidence: "unknown",
    lastActivityAt: "2026-06-30T00:00:00Z",
    nextAction: "Agent Zero: authorize lifecycle authoring or defer explicitly",
    provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }),
  },
  {
    id: "WP-O1", goalId: "G-O", phaseId: "ph-ops",
    title: "Deliverables register version reconciliation",
    description: "Reconcile observed register versions (root v2.0.1, fw v3.1.0, ops v1.1.0) against commit history advanced by WP-R1 (v2.1.0 / v3.1.1 / v1.1.1).",
    status: "blocked", priority: "p0",
    owner: "ops-maintainer", operatingAgent: "agent-ops",
    gateRequirement: "none", dependencyIds: ["WP-R1"],
    defectIds: ["DEF-DR1"],
    acceptancePassed: 0, acceptanceTotal: 2,
    evidenceCount: 1, evidenceConfidence: "derived",
    lastActivityAt: "2026-07-21T14:22:00Z",
    nextAction: "Confirm which value is authoritative; update register or annotate exception",
    provenance: p({ sourceType: "deliverables-register", confidence: "derived", parsingWarnings: ["Register cites versions older than head commit"] }),
  },
  {
    id: "WP-O2", goalId: "G-O", phaseId: "ph-ops",
    title: "DEL-011 placement-revisit exception review",
    description: "Active placement-revisit exception on DEL-011 — schedule review or resolve.",
    status: "in-progress", priority: "p2",
    owner: "ops-maintainer", operatingAgent: "agent-ops",
    gateRequirement: "none", dependencyIds: [],
    defectIds: [],
    acceptancePassed: 1, acceptanceTotal: 2,
    evidenceCount: 1, evidenceConfidence: "verified",
    lastActivityAt: "2026-07-19T11:30:00Z",
    nextAction: "Schedule exception review meeting",
    provenance: p({ sourceType: "deliverables-register", confidence: "verified" }),
  },
];

export const decisions: Decision[] = [
  {
    id: "DEC-01", title: "Approve Gate 2 implementation for skill lifecycle pilot",
    authority: "agent-zero",
    options: ["Approve pilot as scoped", "Approve with reduced scope", "Defer 30 days", "Reject"],
    impact: "Unblocks WP-L1, WP-L2, WP-M3 and enables root/project tier lifecycle rollout.",
    blockingScope: "3 work packages",
    ageDays: 6, workPackageId: "WP-L1",
    provenance: p({ sourceType: "promoted-proposal", confidence: "verified" }),
  },
  {
    id: "DEC-02", title: "Authorize maturity backlog item 3 lifecycle authoring",
    authority: "agent-zero",
    options: ["Authorize authoring", "Defer explicitly with target date", "Merge into WP-L1"],
    impact: "Removes ambiguity on maturity backlog completion.",
    blockingScope: "1 work package",
    ageDays: 21, workPackageId: "WP-M3",
    provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }),
  },
  {
    id: "DEC-03", title: "Resolve deliverables register version drift",
    authority: "maintainer",
    options: ["Update register to head versions", "Roll back commits", "Annotate exception on affected rows"],
    impact: "Establishes single source of truth on deliverable versions.",
    blockingScope: "WP-O1 + 3 register rows",
    ageDays: 0, workPackageId: "WP-O1",
    provenance: p({ sourceType: "data-integrity" as never, confidence: "derived" }),
  },
];

export const gates: GateEvent[] = [
  { id: "GT-R1-1", gate: "gate-1", workPackageId: "WP-R1", status: "approved", requiredDirective: "Maintenance Changes route directive", approvingAuthority: "framework-maintainer", approvalEvidenceUrl: "https://github.com/hanax-ai/sdd-core/commit/6994bf6", approvedArtifactRevision: "v2.1.0", approvedAt: "2026-07-20T09:00:00Z", provenance: p({ sourceType: "promoted-proposal", confidence: "verified" }) },
  { id: "GT-L1-1", gate: "gate-1", workPackageId: "WP-L1", status: "approved", requiredDirective: "Evidence-based lifecycle promotion", approvingAuthority: "framework-maintainer", approvalEvidenceUrl: "https://github.com/hanax-ai/sdd-core/tree/main/proposals", approvedArtifactRevision: "lifecycle-proposal-v1", approvedAt: "2026-07-14T15:20:00Z", provenance: p({ sourceType: "promoted-proposal", confidence: "verified" }) },
  { id: "GT-L1-2", gate: "gate-2", workPackageId: "WP-L1", status: "pending", requiredDirective: "Agent Zero implementation approval", approvingAuthority: "agent-zero", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
  { id: "GT-L2-2", gate: "gate-2", workPackageId: "WP-L2", status: "pending", requiredDirective: "Pilot scope approval", approvingAuthority: "agent-zero", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
  { id: "GT-M3-2", gate: "gate-2", workPackageId: "WP-M3", status: "pending", requiredDirective: "Authorize lifecycle authoring", approvingAuthority: "agent-zero", provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }) },
  { id: "GT-R1-M", gate: "maintenance-changes", workPackageId: "WP-R1", status: "approved", requiredDirective: "Maintenance Changes route", approvingAuthority: "framework-maintainer", approvedArtifactRevision: "v2.1.0", approvedAt: "2026-07-20T09:00:00Z", provenance: p({ sourceType: "promoted-proposal", confidence: "verified" }) },
];

export const defects: Defect[] = [
  {
    id: "DEF-DR1",
    title: "Deliverables register version drift vs. head commit",
    severity: "high", state: "open", source: "data-integrity",
    sourceRef: "register vs commit history at HEAD",
    workPackageId: "WP-O1", artifact: "deliverables/register.yaml",
    owner: "ops-maintainer",
    discoveredAt: "2026-07-21T14:22:00Z",
    hasGithubIssue: false,
    provenance: p({ sourceType: "deliverables-register", confidence: "derived", parsingWarnings: ["Register cites root v2.0.1, framework v3.1.0, ops v1.1.0; head commit advanced to v2.1.0 / v3.1.1 / v1.1.1 via WP-R1"] }),
  },
  {
    id: "DEF-EG1",
    title: "No current CI status evidence observed",
    severity: "medium", state: "investigating", source: "review-finding",
    sourceRef: "commit-status endpoint returned empty",
    workPackageId: "WP-R1",
    owner: "framework-maintainer",
    discoveredAt: "2026-07-21T14:22:00Z",
    hasGithubIssue: false,
    provenance: p({ sourceType: "verify-run", confidence: "unknown" }),
  },
  {
    id: "DEF-EG2",
    title: "Machine-tier conversation-sync coverage gap",
    severity: "low", state: "accepted-risk", source: "plan-defined",
    workPackageId: "WP-L3",
    discoveredAt: "2026-07-10T09:00:00Z",
    hasGithubIssue: false,
    provenance: p({ sourceType: "consolidated-plan-v4", confidence: "declared" }),
  },
  {
    id: "DEF-RSK1",
    title: "Gate 2 decision queue aging risks pilot timeline",
    severity: "medium", state: "open", source: "risk",
    workPackageId: "WP-L1",
    discoveredAt: "2026-07-16T09:00:00Z",
    hasGithubIssue: false,
    provenance: p({ sourceType: "manual-annotation", confidence: "declared" }),
  },
  {
    id: "DEF-UNK1",
    title: "Verification history predates content-check hardening — freshness unknown",
    severity: "low", state: "investigating", source: "unknown",
    artifact: ".github/workflows/verify-layout.yml",
    discoveredAt: "2026-07-21T14:22:00Z",
    hasGithubIssue: false,
    provenance: p({ sourceType: "verify-run", confidence: "unknown" }),
  },
];

export const evidenceLinks: EvidenceLink[] = [
  { id: "EV-1", label: `HEAD commit ${HEAD.slice(0, 7)}`, url: `https://github.com/${REPO}/commit/${HEAD}`, kind: "commit", observedAt: OBSERVED, confidence: "verified" },
  { id: "EV-2", label: "wip/README.md", url: `https://github.com/${REPO}/blob/${HEAD}/wip/README.md`, kind: "doc", observedAt: OBSERVED, confidence: "verified" },
  { id: "EV-3", label: "governance skills directory", url: `https://github.com/${REPO}/tree/${HEAD}/skills`, kind: "doc", observedAt: OBSERVED, confidence: "verified" },
  { id: "EV-4", label: "Lifecycle proposal (Gate 1 promoted)", url: `https://github.com/${REPO}/tree/${HEAD}/proposals`, kind: "doc", observedAt: OBSERVED, confidence: "verified" },
];

export const verificationRuns: VerificationRun[] = [
  { id: "VR-1", name: "verify-layout (historical)", status: "passed", observedAt: "2026-07-14T10:00:00Z", passedChecks: 98, totalChecks: 98, evidenceUrl: `https://github.com/${REPO}/actions`, provenance: p({ sourceType: "verify-run", confidence: "verified", parsingWarnings: ["Historical run at time of content-check hardening; not proof of latest state"] }) },
  { id: "VR-2", name: "verify-layout (current)", status: "unknown", observedAt: OBSERVED, evidenceUrl: `https://github.com/${REPO}/actions`, provenance: p({ sourceType: "verify-run", confidence: "unknown" }) },
  { id: "VR-3", name: "commit-status @ HEAD", status: "unknown", observedAt: OBSERVED, provenance: p({ sourceType: "verify-run", confidence: "unknown", parsingWarnings: ["No status entries returned by API"] }) },
];

const registerRows = [
  { id: "DEL-001", layer: "root-global" as const, set: "root constitution", observed: "v2.1.0", registered: "v2.0.1" },
  { id: "DEL-002", layer: "framework" as const, set: "framework constitution", observed: "v3.1.1", registered: "v3.1.0" },
  { id: "DEL-003", layer: "ops" as const, set: "ops constitution", observed: "v1.1.1", registered: "v1.1.0" },
  { id: "DEL-004", layer: "framework" as const, set: "governance skills bundle", observed: "v1.4.0", registered: "v1.4.0" },
  { id: "DEL-005", layer: "framework" as const, set: "wip governance directives", observed: "v2.1.0", registered: "v2.1.0" },
  { id: "DEL-006", layer: "ops" as const, set: "deliverables register schema", observed: "v0.9.2", registered: "v0.9.2" },
  { id: "DEL-007", layer: "root-global" as const, set: "root operating principles", observed: "v1.6.0", registered: "v1.6.0" },
  { id: "DEL-008", layer: "framework" as const, set: "feature spec template", observed: "v1.2.0", registered: "v1.2.0" },
  { id: "DEL-009", layer: "framework" as const, set: "feature plan template", observed: "v1.2.0", registered: "v1.2.0" },
  { id: "DEL-010", layer: "framework" as const, set: "feature tasks template", observed: "v1.2.0", registered: "v1.2.0" },
  { id: "DEL-011", layer: "ops" as const, set: "operating-agent registry", observed: "v0.7.1", registered: "v0.7.1", exception: "placement-revisit — pending tier rationalization" },
  { id: "DEL-012", layer: "ops" as const, set: "sync-run schema", observed: "v0.4.0", registered: "v0.4.0" },
  { id: "DEL-013", layer: "framework" as const, set: "promoted proposals index", observed: "v1.0.0", registered: "v1.0.0" },
  { id: "DEL-014", layer: "root-global" as const, set: "authority model", observed: "v2.1.0", registered: "v2.1.0" },
];

export const deliverables: Deliverable[] = registerRows.map((r, i) => ({
  id: r.id,
  layer: r.layer,
  artifactSet: r.set,
  owner: r.layer === "root-global" ? "constitutional-council" : r.layer === "framework" ? "framework-maintainer" : "ops-maintainer",
  operatingAgent: r.layer === "ops" ? "agent-ops" : "agent-framework",
  status: "active",
  lastReview: `2026-0${5 + (i % 3)}-${(10 + i).toString().padStart(2, "0")}`,
  nextReviewDue: `2026-${(8 + (i % 4)).toString().padStart(2, "0")}-${(10 + i).toString().padStart(2, "0")}`,
  exception: r.exception,
  staleness: r.observed !== r.registered ? "stale" : i > 10 ? "aging" : "fresh",
  observedVersion: r.observed,
  registerVersion: r.registered,
  provenance: p({ sourceType: "deliverables-register", confidence: r.observed !== r.registered ? "derived" : "verified", parsingWarnings: r.observed !== r.registered ? ["Version drift vs head commit"] : undefined }),
}));

export const activityEvents: ActivityEvent[] = [
  { id: "A-1", at: "2026-07-21T09:12:00Z", kind: "commit", scope: "framework", sourceRef: HEAD.slice(0, 7), description: "Align wip/README and governance skills to v2.1.0 Maintenance Changes route (WP-R1)", relatedWorkPackageId: "WP-R1", evidenceUrl: `https://github.com/${REPO}/commit/${HEAD}`, confidence: "verified" },
  { id: "A-2", at: "2026-07-20T09:00:00Z", kind: "approval", scope: "framework", sourceRef: "GT-R1-1", description: "Gate 1 approval for WP-R1 (v2.1.0 route)", relatedGateId: "GT-R1-1", confidence: "verified" },
  { id: "A-3", at: "2026-07-19T11:30:00Z", kind: "review", scope: "ops", sourceRef: "DEL-011", description: "DEL-011 placement-revisit exception acknowledged", relatedWorkPackageId: "WP-O2", confidence: "verified" },
  { id: "A-4", at: "2026-07-18T16:44:00Z", kind: "commit", scope: "framework", sourceRef: "b2c9f01", description: "Draft lifecycle proposal revisions (WP-L1)", relatedWorkPackageId: "WP-L1", confidence: "verified" },
  { id: "A-5", at: "2026-07-14T15:20:00Z", kind: "approval", scope: "framework", sourceRef: "GT-L1-1", description: "Gate 1 promotion approved for lifecycle proposal", relatedGateId: "GT-L1-1", confidence: "verified" },
  { id: "A-6", at: "2026-07-14T10:00:00Z", kind: "verify-run", scope: "cross-cutting", sourceRef: "VR-1", description: "verify-layout: 98/98 checks passed (historical evidence)", confidence: "verified" },
  { id: "A-7", at: "2026-07-12T08:00:00Z", kind: "commit", scope: "framework", sourceRef: "a41d0e2", description: "Maturity backlog item 8 completion", relatedWorkPackageId: "WP-M8", confidence: "verified" },
  { id: "A-8", at: "2026-07-10T09:00:00Z", kind: "plan-change", scope: "framework", sourceRef: "plan-v4", description: "WP-L3 machine-tier backfill deferred until after pilot", relatedWorkPackageId: "WP-L3", confidence: "declared" },
];

export const sources: SourceRecord[] = [
  { id: "SRC-1", name: "Consolidated plan v4", type: "consolidated-plan-v4", location: "sdd-core-consolidated-analysis-v4.md", authority: "planning", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 168, freshness: "fresh", itemsContributed: 18 },
  { id: "SRC-2", name: "Implementation goals", type: "implementation-goals", location: "implementation-goals.md (draft)", authority: "planning", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 168, freshness: "aging", parseErrors: ["Not loaded — Phase 1 fallback to snapshot"], itemsContributed: 0 },
  { id: "SRC-3", name: "GitHub repo commits", type: "github-repo-commits", location: `github.com/${REPO}`, authority: "observational", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 24, freshness: "fresh", itemsContributed: 42 },
  { id: "SRC-4", name: "WIP index & items", type: "wip-index", location: `${REPO}/wip/`, authority: "ratified", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 48, freshness: "fresh", itemsContributed: 8 },
  { id: "SRC-5", name: "Promoted proposals", type: "promoted-proposal", location: `${REPO}/proposals/`, authority: "ratified", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 72, freshness: "fresh", itemsContributed: 2 },
  { id: "SRC-6", name: "Feature spec/plan/tasks", type: "feature-spec", location: `${REPO}/features/`, authority: "ratified", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 72, freshness: "fresh", itemsContributed: 5 },
  { id: "SRC-7", name: "GitHub issues & PRs", type: "github-issue", location: `github.com/${REPO}/issues`, authority: "tracker", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 12, freshness: "fresh", itemsContributed: 0 },
  { id: "SRC-8", name: "Verification workflow results", type: "verify-run", location: `${REPO}/actions`, authority: "observational", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 24, freshness: "stale", parseErrors: ["No current status entries returned"], itemsContributed: 3 },
  { id: "SRC-9", name: "Deliverables & standards registers", type: "deliverables-register", location: `${REPO}/registers/deliverables.yaml`, authority: "ratified", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 168, freshness: "aging", parseErrors: ["Version drift detected"], itemsContributed: 14 },
  { id: "SRC-10", name: "Manual decision annotations", type: "manual-annotation", location: "dashboard-local", authority: "manual", lastFetched: OBSERVED, lastSuccessfulParse: OBSERVED, freshnessPolicyHours: 720, freshness: "fresh", itemsContributed: 3 },
];

export const syncRuns: SyncRun[] = [
  { id: "SYN-1", startedAt: OBSERVED, finishedAt: OBSERVED, status: "partial", sourceRevision: HEAD, itemCounts: { commits: 42, workPackages: 15, defects: 5, deliverables: 14 }, warnings: ["Implementation-goals doc not loaded", "verify-layout current run has no evidence"], failures: [] },
];
