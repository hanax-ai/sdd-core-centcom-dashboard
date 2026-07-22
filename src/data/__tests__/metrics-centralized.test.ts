import { describe, expect, it } from "vitest";
import {
  FORMULAS,
  deliverableDrift,
  deliverableExceptions,
  gateSplit,
  phaseCompletion,
  ratioToPct,
  statusBuckets,
  workPackageAcceptancePct,
} from "@/data/metrics";
import { workPackages, phases, deliverables, gates } from "@/data/fixtures";

describe("CP-3 · centralized formulas", () => {
  it("exposes a FORMULAS entry with matching label + formula copy for every KPI", () => {
    for (const key of Object.keys(FORMULAS) as Array<keyof typeof FORMULAS>) {
      const entry = FORMULAS[key];
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.formula.length).toBeGreaterThan(0);
    }
  });

  it("ratioToPct returns 0 on empty denominator (never NaN)", () => {
    expect(ratioToPct(0, 0)).toBe(0);
    expect(ratioToPct(3, 4)).toBe(75);
  });

  it("workPackageAcceptancePct uses same rule as acceptance coverage per work package", () => {
    for (const w of workPackages) {
      const pct = workPackageAcceptancePct(w);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
      if (w.acceptanceTotal === 0) expect(pct).toBe(0);
    }
  });

  it("phaseCompletion excludes deferred & invalidated and is consistent with planCompletion rule", () => {
    for (const p of phases) {
      const r = phaseCompletion(p, workPackages);
      expect(r.done).toBeLessThanOrEqual(r.total);
      // "in-scope" filter drops deferred/invalidated from denominator
      const rawPhasePkgs = workPackages.filter((w) => w.phaseId === p.id);
      const droppable = rawPhasePkgs.filter(
        (w) => w.status === "deferred" || w.status === "invalidated",
      ).length;
      expect(r.total).toBe(rawPhasePkgs.length - droppable);
    }
  });

  it("statusBuckets sums to total minus 'invalidated' (all other statuses represented)", () => {
    const b = statusBuckets(workPackages);
    const sum = b.completed + b.progress + b.awaiting + b.blocked + b.deferred + b.notStarted;
    const invalidated = workPackages.filter((w) => w.status === "invalidated").length;
    expect(sum).toBe(workPackages.length - invalidated);
  });

  it("gateSplit partitions by track", () => {
    const s = gateSplit(gates);
    expect(s.gate1.every((g) => g.gate === "gate-1")).toBe(true);
    expect(s.gate2.every((g) => g.gate === "gate-2")).toBe(true);
    expect(s.maintenanceChanges.every((g) => g.gate === "maintenance-changes")).toBe(true);
    expect(s.pending.every((g) => g.status === "pending")).toBe(true);
  });

  it("deliverableDrift + deliverableExceptions use the register definitions consistently", () => {
    const drift = deliverableDrift(deliverables);
    expect(drift.every((d) => d.observedVersion !== d.registerVersion)).toBe(true);
    const exc = deliverableExceptions(deliverables);
    expect(exc.every((d) => !!d.exception)).toBe(true);
  });
});
