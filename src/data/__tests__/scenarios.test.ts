import { describe, it, expect } from "vitest";
import { applyScenario, SCENARIOS, type ScenarioId } from "@/data/scenarios";
import { baseDataView } from "@/data/view";

const base = baseDataView();

describe("CP-5 scenario engine — determinism", () => {
  it.each(SCENARIOS.map((s) => s.id))(
    "'%s' is deterministic: same input yields byte-identical output",
    (id) => {
      const a = applyScenario(base, id);
      const b = applyScenario(base, id);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    },
  );

  it.each(SCENARIOS.map((s) => s.id))("'%s' does not mutate the base fixture", (id) => {
    const snapshotBefore = JSON.stringify(base);
    applyScenario(base, id);
    expect(JSON.stringify(base)).toBe(snapshotBefore);
  });

  it("baseline is a structural clone of the base view (not a reference)", () => {
    const b = applyScenario(base, "baseline");
    expect(b).toEqual(base);
    expect(b).not.toBe(base);
    expect(b.workPackages).not.toBe(base.workPackages);
  });
});

describe("CP-5 scenario engine — semantic effects", () => {
  it("gate-blocked: every gate-2 event is pending", () => {
    const v = applyScenario(base, "gate-blocked");
    for (const g of v.gates.filter((x) => x.gate === "gate-2")) {
      expect(g.status).toBe("pending");
    }
  });

  it("gate-blocked: no fewer awaiting-gate-2 work packages than baseline", () => {
    const baseline = applyScenario(base, "baseline");
    const blocked = applyScenario(base, "gate-blocked");
    const count = (id: ScenarioId, v = applyScenario(base, id)) =>
      v.workPackages.filter((w) => w.status === "awaiting-gate-2").length;
    expect(count("gate-blocked", blocked)).toBeGreaterThanOrEqual(count("baseline", baseline));
  });

  it("decision-heavy: doubles decision age and increases awaiting-decision WPs", () => {
    const baseline = applyScenario(base, "baseline");
    const heavy = applyScenario(base, "decision-heavy");
    for (let i = 0; i < baseline.decisions.length; i++) {
      expect(heavy.decisions[i].ageDays).toBe(baseline.decisions[i].ageDays * 2);
    }
    const awaiting = (v = heavy) =>
      v.workPackages.filter((w) => w.status === "awaiting-decision").length;
    expect(awaiting(heavy)).toBeGreaterThanOrEqual(awaiting(baseline));
  });

  it("defect-heavy: no defects remain in resolved/false-positive state", () => {
    const v = applyScenario(base, "defect-heavy");
    for (const d of v.defects) {
      expect(d.state).not.toBe("resolved");
      expect(d.state).not.toBe("false-positive");
    }
  });

  it("all-clear: no pending gates and no open defects", () => {
    const v = applyScenario(base, "all-clear");
    expect(v.gates.some((g) => g.status === "pending")).toBe(false);
    const openStates = ["open", "investigating", "planned", "blocked"] as const;
    for (const d of v.defects) {
      expect(openStates.includes(d.state as (typeof openStates)[number])).toBe(false);
    }
  });

  it("Product Truth Rule: no scenario ever manufactures a 'passed' verification from 'unknown'", () => {
    const baselineUnknownIds = new Set(
      base.verificationRuns.filter((r) => r.status === "unknown").map((r) => r.id),
    );
    for (const s of SCENARIOS) {
      const v = applyScenario(base, s.id);
      for (const r of v.verificationRuns) {
        if (baselineUnknownIds.has(r.id)) {
          expect(r.status).toBe("unknown");
        }
      }
    }
  });
});
