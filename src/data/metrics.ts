import type {
  Defect,
  Deliverable,
  GateEvent,
  PlanPhase,
  VerificationRun,
  WorkPackage,
  WorkStatus,
} from "./types";

/**
 * CP-3 — One Version of the Truth.
 *
 * Every KPI, ratio, bucket count, and human-readable formula string that the
 * UI shows lives in this module. Routes and components MUST NOT recompute
 * these values or re-author the formula copy — import the helper instead.
 * Adding a new metric? Add it here alongside its FORMULAS entry so the
 * label/formula pair stays in one place.
 */

export interface MetricResult {
  label: string;
  numerator?: number;
  denominator?: number;
  value: number | string;
  formula: string;
  scope: string;
  observedAt: string;
}

// ---------- Formula copy (single source for labels + formulas) ----------

export const FORMULAS = {
  planCompletion: {
    label: "Plan completion",
    formula: "completed in-scope items ÷ in-scope items (excludes deferred & invalidated)",
  },
  acceptanceCoverage: {
    label: "Acceptance coverage",
    formula: "passed acceptance criteria ÷ defined acceptance criteria",
  },
  evidenceCoverage: {
    label: "Evidence coverage",
    formula: "items with ≥1 evidence link ÷ in-scope items",
  },
  decisionDebt: {
    label: "Decision debt",
    formula: "(work packages awaiting decision/gate) + (pending gate events)",
  },
  defectLoad: {
    label: "Open defects",
    formula:
      "unresolved defects (all sources: github-issues + plan + review + data-integrity + risk)",
  },
  verificationHealth: {
    label: "Verification health",
    formula: "passed observed checks ÷ observed checks (unknown ≠ pass)",
  },
  deliverableReviewHealth: {
    label: "Deliverable review health",
    formula: "active register rows current ÷ all active register rows",
  },
  staleSources: {
    label: "Stale sources",
    formula: "sources older than configured freshness threshold",
  },
  workPackageAcceptance: {
    label: "Work package acceptance",
    formula: "passed acceptance criteria ÷ defined acceptance criteria (per work package)",
  },
  phaseCompletion: {
    label: "Phase completion",
    formula: "completed items in phase ÷ in-scope items in phase (excludes deferred & invalidated)",
  },
  deliverableDrift: {
    label: "Deliverable drift",
    formula: "register rows where observedVersion ≠ registerVersion",
  },
} as const;

// ---------- Shared math ----------

/** Ratio → 1-decimal percent. Returns 0 when the denominator is 0 (never NaN). */
const asPct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

/** Ratio → integer percent (0..100). Returns 0 on empty denominator. */
export const ratioToPct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

// ---------- Top-line KPI metrics ----------

/** Plan completion — completed in-scope / all in-scope. Excludes deferred & invalidated by default. */
export function planCompletion(
  pkgs: WorkPackage[],
  includeDeferred = false,
  observedAt: string,
): MetricResult {
  const inScope = pkgs.filter(
    (w) => includeDeferred || (w.status !== "deferred" && w.status !== "invalidated"),
  );
  const completed = inScope.filter((w) => w.status === "completed").length;
  return {
    ...FORMULAS.planCompletion,
    numerator: completed,
    denominator: inScope.length,
    value: `${asPct(completed, inScope.length)}%`,
    scope: `${inScope.length} work packages`,
    observedAt,
  };
}

export function acceptanceCoverage(pkgs: WorkPackage[], observedAt: string): MetricResult {
  const passed = pkgs.reduce((s, w) => s + w.acceptancePassed, 0);
  const total = pkgs.reduce((s, w) => s + w.acceptanceTotal, 0);
  return {
    ...FORMULAS.acceptanceCoverage,
    numerator: passed,
    denominator: total,
    value: `${asPct(passed, total)}%`,
    scope: `${pkgs.length} work packages`,
    observedAt,
  };
}

export function evidenceCoverage(pkgs: WorkPackage[], observedAt: string): MetricResult {
  const withEvidence = pkgs.filter((w) => w.evidenceCount > 0).length;
  return {
    ...FORMULAS.evidenceCoverage,
    numerator: withEvidence,
    denominator: pkgs.length,
    value: `${asPct(withEvidence, pkgs.length)}%`,
    scope: `${pkgs.length} work packages`,
    observedAt,
  };
}

export function decisionDebt(
  pkgs: WorkPackage[],
  gates: GateEvent[],
  observedAt: string,
): MetricResult {
  const awaitingPkgs = pkgs.filter(
    (w) =>
      w.status === "awaiting-decision" ||
      w.status === "awaiting-gate-1" ||
      w.status === "awaiting-gate-2",
  );
  const pendingGates = gates.filter((g) => g.status === "pending");
  const total = awaitingPkgs.length + pendingGates.length;
  return {
    ...FORMULAS.decisionDebt,
    value: total,
    numerator: total,
    denominator: pkgs.length + gates.length,
    scope: `${awaitingPkgs.length} awaiting work packages + ${pendingGates.length} pending gates`,
    observedAt,
  };
}

export function defectLoad(defects: Defect[], observedAt: string): MetricResult {
  const open = defects.filter((d) => d.state !== "resolved" && d.state !== "false-positive");
  return {
    ...FORMULAS.defectLoad,
    value: open.length,
    numerator: open.length,
    denominator: defects.length,
    scope: `${open.length} open of ${defects.length} tracked`,
    observedAt,
  };
}

export function verificationHealth(runs: VerificationRun[], observedAt: string): MetricResult {
  const observed = runs.filter((r) => r.status === "passed" || r.status === "failed");
  const passed = observed.filter((r) => r.status === "passed").length;
  return {
    ...FORMULAS.verificationHealth,
    numerator: passed,
    denominator: observed.length,
    value: observed.length === 0 ? "Unknown" : `${asPct(passed, observed.length)}%`,
    scope: `${observed.length} observed of ${runs.length} runs`,
    observedAt,
  };
}

export function deliverableReviewHealth(dels: Deliverable[], observedAt: string): MetricResult {
  const active = dels.filter((d) => d.status === "active");
  const current = active.filter((d) => d.staleness === "fresh");
  return {
    ...FORMULAS.deliverableReviewHealth,
    numerator: current.length,
    denominator: active.length,
    value: `${asPct(current.length, active.length)}%`,
    scope: `${active.length} active rows`,
    observedAt,
  };
}

export function staleSources(
  sourcesFresh: { freshness: string }[],
  observedAt: string,
): MetricResult {
  const stale = sourcesFresh.filter(
    (s) => s.freshness === "stale" || s.freshness === "aging",
  ).length;
  return {
    ...FORMULAS.staleSources,
    numerator: stale,
    denominator: sourcesFresh.length,
    value: stale,
    scope: `${sourcesFresh.length} sources`,
    observedAt,
  };
}

// ---------- Sub-view helpers (used by tables/cards; same formulas as KPIs) ----------

/** Per-work-package acceptance percent (integer 0..100). Consistent with acceptanceCoverage. */
export function workPackageAcceptancePct(w: WorkPackage): number {
  return ratioToPct(w.acceptancePassed, w.acceptanceTotal);
}

/** Phase completion — same rule as planCompletion, scoped to one phase. */
export function phaseCompletion(phase: PlanPhase, pkgs: WorkPackage[]) {
  const phasePkgs = pkgs.filter((w) => w.phaseId === phase.id);
  const inScope = phasePkgs.filter((w) => w.status !== "deferred" && w.status !== "invalidated");
  const done = phasePkgs.filter((w) => w.status === "completed").length;
  return {
    phaseId: phase.id,
    total: inScope.length,
    done,
    pct: ratioToPct(done, inScope.length),
    packages: phasePkgs,
  };
}

/** Canonical work-package status buckets rendered in the Overview strip. */
export type StatusBuckets = Record<
  "completed" | "progress" | "awaiting" | "blocked" | "deferred" | "notStarted",
  number
>;

export function statusBuckets(pkgs: WorkPackage[]): StatusBuckets {
  const is = (s: WorkStatus) => (w: WorkPackage) => w.status === s;
  return {
    completed: pkgs.filter(is("completed")).length,
    progress: pkgs.filter(is("in-progress")).length,
    awaiting: pkgs.filter((w) => w.status.startsWith("awaiting")).length,
    blocked: pkgs.filter(is("blocked")).length,
    deferred: pkgs.filter(is("deferred")).length,
    notStarted: pkgs.filter(is("not-started")).length,
  };
}

/** Gate events split by gate track. */
export function gateSplit(gates: GateEvent[]) {
  return {
    gate1: gates.filter((g) => g.gate === "gate-1"),
    gate2: gates.filter((g) => g.gate === "gate-2"),
    maintenanceChanges: gates.filter((g) => g.gate === "maintenance-changes"),
    pending: gates.filter((g) => g.status === "pending"),
  };
}

/** Deliverables with observedVersion ≠ registerVersion. */
export function deliverableDrift(dels: Deliverable[]): Deliverable[] {
  return dels.filter((d) => d.observedVersion !== d.registerVersion);
}

/** Deliverables with an active exception recorded. */
export function deliverableExceptions(dels: Deliverable[]): Deliverable[] {
  return dels.filter((d) => !!d.exception);
}
