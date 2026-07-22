import { describe, it, expect } from "vitest";
import {
  acceptanceCoverage,
  decisionDebt,
  defectLoad,
  evidenceCoverage,
  planCompletion,
  verificationHealth,
} from "@/data/metrics";
import type { Defect, GateEvent, Provenance, VerificationRun, WorkPackage } from "@/data/types";

const OBSERVED = "2026-07-21T14:22:00Z";

const provenance: Provenance = {
  sourceType: "wip-item",
  sourceLocation: "test",
  observedAt: OBSERVED,
  confidence: "derived",
};

function wp(overrides: Partial<WorkPackage>): WorkPackage {
  return {
    id: "WP-T",
    goalId: "G",
    phaseId: "P",
    title: "t",
    description: "",
    status: "in-progress",
    priority: "p2",
    owner: "o",
    operatingAgent: "a",
    gateRequirement: "none",
    dependencyIds: [],
    defectIds: [],
    acceptancePassed: 0,
    acceptanceTotal: 0,
    evidenceCount: 0,
    evidenceConfidence: "derived",
    lastActivityAt: OBSERVED,
    nextAction: "",
    provenance,
    ...overrides,
  };
}

describe("planCompletion", () => {
  it("excludes deferred + invalidated from denominator by default", () => {
    const pkgs = [
      wp({ id: "a", status: "completed" }),
      wp({ id: "b", status: "in-progress" }),
      wp({ id: "c", status: "deferred" }),
      wp({ id: "d", status: "invalidated" }),
    ];
    const m = planCompletion(pkgs, false, OBSERVED);
    expect(m.numerator).toBe(1);
    expect(m.denominator).toBe(2);
    expect(m.value).toBe("50%");
  });

  it("returns 0% when denominator is zero (no division-by-zero)", () => {
    const m = planCompletion([], false, OBSERVED);
    expect(m.numerator).toBe(0);
    expect(m.denominator).toBe(0);
    expect(m.value).toBe("0%");
  });
});

describe("acceptanceCoverage", () => {
  it("sums passed/total across work packages", () => {
    const pkgs = [
      wp({ acceptancePassed: 2, acceptanceTotal: 4 }),
      wp({ acceptancePassed: 3, acceptanceTotal: 6 }),
    ];
    const m = acceptanceCoverage(pkgs, OBSERVED);
    expect(m.numerator).toBe(5);
    expect(m.denominator).toBe(10);
    expect(m.value).toBe("50%");
  });
});

describe("evidenceCoverage", () => {
  it("counts items with ≥1 evidence link", () => {
    const pkgs = [wp({ evidenceCount: 0 }), wp({ evidenceCount: 3 }), wp({ evidenceCount: 1 })];
    const m = evidenceCoverage(pkgs, OBSERVED);
    expect(m.numerator).toBe(2);
    expect(m.denominator).toBe(3);
  });
});

describe("decisionDebt (CP-4 invariant)", () => {
  it("numerator and denominator share a consistent population", () => {
    const pkgs: WorkPackage[] = [
      wp({ id: "1", status: "awaiting-decision" }),
      wp({ id: "2", status: "awaiting-gate-1" }),
      wp({ id: "3", status: "awaiting-gate-2" }),
      wp({ id: "4", status: "in-progress" }),
      wp({ id: "5", status: "completed" }),
    ];
    const gates: GateEvent[] = [
      {
        id: "g1",
        gate: "gate-2",
        workPackageId: "1",
        status: "pending",
        requiredDirective: "d",
        approvingAuthority: "maintainer",
        provenance,
      },
      {
        id: "g2",
        gate: "gate-1",
        workPackageId: "2",
        status: "approved",
        requiredDirective: "d",
        approvingAuthority: "maintainer",
        provenance,
      },
    ];
    const m = decisionDebt(pkgs, gates, OBSERVED);
    // Numerator = 3 awaiting WPs + 1 pending gate = 4
    expect(m.numerator).toBe(4);
    // Denominator must include both populations counted in the numerator.
    expect(m.denominator).toBe(pkgs.length + gates.length);
    expect(m.numerator).toBeLessThanOrEqual(m.denominator!);
  });
});

describe("defectLoad", () => {
  it("treats resolved and false-positive as closed", () => {
    const defects: Defect[] = [
      {
        id: "1",
        title: "",
        severity: "high",
        state: "open",
        source: "github-issue",
        discoveredAt: OBSERVED,
        hasGithubIssue: true,
        provenance,
      },
      {
        id: "2",
        title: "",
        severity: "low",
        state: "resolved",
        source: "github-issue",
        discoveredAt: OBSERVED,
        hasGithubIssue: true,
        provenance,
      },
      {
        id: "3",
        title: "",
        severity: "low",
        state: "false-positive",
        source: "github-issue",
        discoveredAt: OBSERVED,
        hasGithubIssue: true,
        provenance,
      },
      {
        id: "4",
        title: "",
        severity: "medium",
        state: "investigating",
        source: "review-finding",
        discoveredAt: OBSERVED,
        hasGithubIssue: false,
        provenance,
      },
    ];
    const m = defectLoad(defects, OBSERVED);
    expect(m.value).toBe(2);
    expect(m.numerator).toBe(2);
    expect(m.denominator).toBe(4);
  });
});

describe("verificationHealth — unknown must not count as passing (Product Truth Rule)", () => {
  const base = (overrides: Partial<VerificationRun>): VerificationRun => ({
    id: "v",
    name: "n",
    status: "unknown",
    observedAt: OBSERVED,
    provenance,
    ...overrides,
  });

  it("excludes unknown / flaky / missing from both numerator and denominator", () => {
    const runs = [
      base({ id: "1", status: "passed" }),
      base({ id: "2", status: "failed" }),
      base({ id: "3", status: "unknown" }),
      base({ id: "4", status: "flaky" }),
      base({ id: "5", status: "missing" }),
    ];
    const m = verificationHealth(runs, OBSERVED);
    expect(m.numerator).toBe(1);
    expect(m.denominator).toBe(2);
    expect(m.value).toBe("50%");
  });

  it("returns 'Unknown' string (not 0%) when zero checks were observed", () => {
    const runs = [base({ id: "1", status: "unknown" }), base({ id: "2", status: "missing" })];
    const m = verificationHealth(runs, OBSERVED);
    expect(m.value).toBe("Unknown");
    expect(m.numerator).toBe(0);
    expect(m.denominator).toBe(0);
  });
});
