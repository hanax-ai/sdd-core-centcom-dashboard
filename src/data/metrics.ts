import type { Defect, Deliverable, GateEvent, VerificationRun, WorkPackage } from "./types";

export interface MetricResult {
  label: string;
  numerator?: number;
  denominator?: number;
  value: number | string;
  formula: string;
  scope: string;
  observedAt: string;
}

const asPct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

/** Plan completion — completed in-scope / all in-scope. Excludes deferred & invalidated by default. */
export function planCompletion(pkgs: WorkPackage[], includeDeferred = false, observedAt: string): MetricResult {
  const inScope = pkgs.filter(
    (w) => includeDeferred || (w.status !== "deferred" && w.status !== "invalidated"),
  );
  const completed = inScope.filter((w) => w.status === "completed").length;
  return {
    label: "Plan completion",
    numerator: completed,
    denominator: inScope.length,
    value: `${asPct(completed, inScope.length)}%`,
    formula: "completed in-scope items ÷ in-scope items (excludes deferred & invalidated)",
    scope: `${inScope.length} work packages`,
    observedAt,
  };
}

export function acceptanceCoverage(pkgs: WorkPackage[], observedAt: string): MetricResult {
  const passed = pkgs.reduce((s, w) => s + w.acceptancePassed, 0);
  const total = pkgs.reduce((s, w) => s + w.acceptanceTotal, 0);
  return {
    label: "Acceptance coverage",
    numerator: passed, denominator: total,
    value: `${asPct(passed, total)}%`,
    formula: "passed acceptance criteria ÷ defined acceptance criteria",
    scope: `${pkgs.length} work packages`,
    observedAt,
  };
}

export function evidenceCoverage(pkgs: WorkPackage[], observedAt: string): MetricResult {
  const withEvidence = pkgs.filter((w) => w.evidenceCount > 0).length;
  return {
    label: "Evidence coverage",
    numerator: withEvidence, denominator: pkgs.length,
    value: `${asPct(withEvidence, pkgs.length)}%`,
    formula: "items with ≥1 evidence link ÷ in-scope items",
    scope: `${pkgs.length} work packages`,
    observedAt,
  };
}

export function decisionDebt(pkgs: WorkPackage[], gates: GateEvent[], observedAt: string): MetricResult {
  const awaiting = pkgs.filter((w) =>
    w.status === "awaiting-decision" || w.status === "awaiting-gate-1" || w.status === "awaiting-gate-2",
  );
  const pendingGates = gates.filter((g) => g.status === "pending").length;
  return {
    label: "Decision debt",
    value: awaiting.length,
    numerator: awaiting.length,
    denominator: pkgs.length,
    formula: "items awaiting decision or gate + pending gates",
    scope: `${awaiting.length} items, ${pendingGates} pending gates`,
    observedAt,
  };
}

export function defectLoad(defects: Defect[], observedAt: string): MetricResult {
  const open = defects.filter((d) => d.state !== "resolved" && d.state !== "false-positive");
  return {
    label: "Open defects",
    value: open.length,
    numerator: open.length, denominator: defects.length,
    formula: "unresolved defects (all sources: github-issues + plan + review + data-integrity + risk)",
    scope: `${open.length} open of ${defects.length} tracked`,
    observedAt,
  };
}

export function verificationHealth(runs: VerificationRun[], observedAt: string): MetricResult {
  const observed = runs.filter((r) => r.status === "passed" || r.status === "failed");
  const passed = observed.filter((r) => r.status === "passed").length;
  return {
    label: "Verification health",
    numerator: passed, denominator: observed.length,
    value: observed.length === 0 ? "Unknown" : `${asPct(passed, observed.length)}%`,
    formula: "passed observed checks ÷ observed checks (unknown ≠ pass)",
    scope: `${observed.length} observed of ${runs.length} runs`,
    observedAt,
  };
}

export function deliverableReviewHealth(dels: Deliverable[], observedAt: string): MetricResult {
  const active = dels.filter((d) => d.status === "active");
  const current = active.filter((d) => d.staleness === "fresh");
  return {
    label: "Deliverable review health",
    numerator: current.length, denominator: active.length,
    value: `${asPct(current.length, active.length)}%`,
    formula: "active register rows current ÷ all active register rows",
    scope: `${active.length} active rows`,
    observedAt,
  };
}

export function staleSources(sourcesFresh: { freshness: string }[], observedAt: string): MetricResult {
  const stale = sourcesFresh.filter((s) => s.freshness === "stale" || s.freshness === "aging").length;
  return {
    label: "Stale sources",
    numerator: stale, denominator: sourcesFresh.length,
    value: stale,
    formula: "sources older than configured freshness threshold",
    scope: `${sourcesFresh.length} sources`,
    observedAt,
  };
}
