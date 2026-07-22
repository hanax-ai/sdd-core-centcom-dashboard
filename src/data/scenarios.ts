/**
 * CP-5 — Deterministic scenario engine.
 *
 * A scenario is a pure function `(base) -> view` that transforms the
 * validated fixture output of the adapter into an alternate but
 * self-consistent projection. Scenarios never introduce randomness,
 * never touch the network, and never mutate the base collections —
 * every value returned is a fresh object. Given the same fixture
 * input and the same scenario id, the resulting view is byte-stable
 * across reloads, machines, and turns.
 *
 * Scenarios exist to let reviewers stress-test the dashboard's
 * answer-first framing (gate blocked? decision debt? defect surge?)
 * without ever pretending to represent live SDD-Core state. The
 * top-bar "Fixture snapshot · read-only" pill remains authoritative:
 * all views are demo projections.
 */
import type { DataView } from "./view";
import type {
  Decision,
  Defect,
  GateEvent,
  Provenance,
  VerificationRun,
  WorkPackage,
} from "./types";

export type ScenarioId =
  "baseline" | "gate-blocked" | "decision-heavy" | "defect-heavy" | "all-clear";

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  short: string;
  description: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "baseline",
    label: "Baseline",
    short: "Fixture as-authored",
    description:
      "The committed fixture snapshot exactly as parsed at the adapter boundary. No transforms applied.",
  },
  {
    id: "gate-blocked",
    label: "Gate blocked",
    short: "Gate 2 approvals withheld",
    description:
      "All Gate-2 events revert to pending and every gate-requiring work package returns to awaiting-gate-2. Stresses the governance answer.",
  },
  {
    id: "decision-heavy",
    label: "Decision heavy",
    short: "Decisions stack up",
    description:
      "Every non-terminal work package flips to awaiting-decision and decision ages double. Stresses the decision-debt KPI.",
  },
  {
    id: "defect-heavy",
    label: "Defect heavy",
    short: "Open defects escalate",
    description:
      "Resolved defects re-open at elevated severity. Stresses the quality answer and unknown-≠-pass rule.",
  },
  {
    id: "all-clear",
    label: "All clear",
    short: "Pending approved, defects resolved",
    description:
      "Pending gates approve, awaiting work packages advance to in-progress, and open defects resolve. Sanity check for the happy path.",
  },
];

export const DEFAULT_SCENARIO: ScenarioId = "baseline";

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === "string" && SCENARIOS.some((s) => s.id === value);
}

export function getScenarioMeta(id: ScenarioId): ScenarioMeta {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

// --- transforms ------------------------------------------------------------

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function annotate<T extends { provenance: Provenance }>(item: T, note: string): T {
  const warnings = [...(item.provenance.parsingWarnings ?? []), note];
  return { ...item, provenance: { ...item.provenance, parsingWarnings: warnings } };
}

function gateBlocked(view: DataView): DataView {
  const gates: GateEvent[] = view.gates.map((g) => {
    if (g.gate !== "gate-2") return g;
    return annotate(
      { ...g, status: "pending", approvedAt: undefined, approvedArtifactRevision: undefined },
      "scenario:gate-blocked",
    );
  });
  const wps: WorkPackage[] = view.workPackages.map((w) => {
    if (w.gateRequirement === "gate-2" || w.gateRequirement === "both") {
      if (w.status === "completed" || w.status === "in-progress") {
        return annotate({ ...w, status: "awaiting-gate-2" }, "scenario:gate-blocked");
      }
    }
    return w;
  });
  return { ...view, gates, workPackages: wps };
}

function decisionHeavy(view: DataView): DataView {
  const wps: WorkPackage[] = view.workPackages.map((w) => {
    if (w.status === "in-progress" || w.status === "not-started" || w.status === "blocked") {
      return annotate({ ...w, status: "awaiting-decision" }, "scenario:decision-heavy");
    }
    return w;
  });
  const decisions: Decision[] = view.decisions.map((d) =>
    annotate({ ...d, ageDays: d.ageDays * 2 }, "scenario:decision-heavy"),
  );
  return { ...view, workPackages: wps, decisions };
}

const SEVERITY_BUMP: Record<Defect["severity"], Defect["severity"]> = {
  low: "medium",
  medium: "high",
  high: "critical",
  critical: "critical",
};

function defectHeavy(view: DataView): DataView {
  const defects: Defect[] = view.defects.map((d) => {
    if (d.state === "resolved" || d.state === "false-positive") {
      return annotate(
        {
          ...d,
          state: "open",
          resolvedAt: undefined,
          resolutionEvidenceUrl: undefined,
          severity: SEVERITY_BUMP[d.severity],
        },
        "scenario:defect-heavy",
      );
    }
    return annotate({ ...d, severity: SEVERITY_BUMP[d.severity] }, "scenario:defect-heavy");
  });
  // Verification runs surface the pressure too: any "unknown" stays unknown
  // (Product Truth Rule), but observed failures multiply.
  const verificationRuns: VerificationRun[] = view.verificationRuns.map((r) => {
    if (r.status === "passed") {
      return annotate({ ...r, status: "failed" }, "scenario:defect-heavy");
    }
    return r;
  });
  return { ...view, defects, verificationRuns };
}

function allClear(view: DataView): DataView {
  const gates: GateEvent[] = view.gates.map((g) => {
    if (g.status !== "pending") return g;
    return annotate(
      {
        ...g,
        status: "approved",
        approvedAt: view.snapshot.lastSyncedAt,
        approvedArtifactRevision: view.snapshot.headSha,
      },
      "scenario:all-clear",
    );
  });
  const wps: WorkPackage[] = view.workPackages.map((w) => {
    if (
      w.status === "awaiting-decision" ||
      w.status === "awaiting-gate-1" ||
      w.status === "awaiting-gate-2" ||
      w.status === "blocked"
    ) {
      return annotate({ ...w, status: "in-progress" }, "scenario:all-clear");
    }
    return w;
  });
  const defects: Defect[] = view.defects.map((d) => {
    if (
      d.state === "open" ||
      d.state === "investigating" ||
      d.state === "planned" ||
      d.state === "blocked"
    ) {
      return annotate(
        { ...d, state: "resolved", resolvedAt: view.snapshot.lastSyncedAt },
        "scenario:all-clear",
      );
    }
    return d;
  });
  return { ...view, gates, workPackages: wps, defects };
}

const TRANSFORMS: Record<ScenarioId, (v: DataView) => DataView> = {
  baseline: (v) => v,
  "gate-blocked": gateBlocked,
  "decision-heavy": decisionHeavy,
  "defect-heavy": defectHeavy,
  "all-clear": allClear,
};

export function applyScenario(base: DataView, id: ScenarioId): DataView {
  const transform = TRANSFORMS[id] ?? TRANSFORMS.baseline;
  // Clone first so no scenario can ever mutate the base fixture.
  return transform(clone(base));
}
