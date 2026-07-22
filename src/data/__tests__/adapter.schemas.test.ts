import { describe, it, expect } from "vitest";
import { dataSource } from "@/data/adapter";
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
} from "@/data/schemas";

describe("adapter boundary (CP-2) — every fixture collection parses", () => {
  it("snapshot", () => {
    expect(SnapshotSchema.safeParse(dataSource.snapshot()).success).toBe(true);
  });

  const collections: Array<[string, unknown[], Parameters<typeof parseCollection>[1]]> = [
    ["phases", dataSource.phases(), PlanPhaseSchema],
    ["goals", dataSource.goals(), GoalSchema],
    ["workPackages", dataSource.workPackages(), WorkPackageSchema],
    ["decisions", dataSource.decisions(), DecisionSchema],
    ["gates", dataSource.gates(), GateEventSchema],
    ["defects", dataSource.defects(), DefectSchema],
    ["evidenceLinks", dataSource.evidenceLinks(), EvidenceLinkSchema],
    ["verificationRuns", dataSource.verificationRuns(), VerificationRunSchema],
    ["deliverables", dataSource.deliverables(), DeliverableSchema],
    ["activityEvents", dataSource.activityEvents(), ActivityEventSchema],
    ["sources", dataSource.sources(), SourceRecordSchema],
    ["syncRuns", dataSource.syncRuns(), SyncRunSchema],
  ];

  it.each(collections)("%s", (label, values, schema) => {
    expect(() => parseCollection(label, schema, values)).not.toThrow();
    expect(values.length).toBeGreaterThan(0);
  });
});

describe("adapter boundary — rejects malformed rows with a labeled error", () => {
  it("throws a labeled error naming the collection and index", () => {
    const bad = [
      dataSource.workPackages()[0],
      { ...dataSource.workPackages()[0], acceptancePassed: 999, acceptanceTotal: 1 },
    ];
    expect(() => parseCollection("workPackages", WorkPackageSchema, bad)).toThrow(
      /workPackages\[1\]/,
    );
  });

  it("parseOne rejects an unknown confidence value", () => {
    const badSnap = { ...dataSource.snapshot(), freshness: "sparkling" };
    expect(() => parseOne("snapshot", SnapshotSchema, badSnap)).toThrow(/snapshot/);
  });
});
