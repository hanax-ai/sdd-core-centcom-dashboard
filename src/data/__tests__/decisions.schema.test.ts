import { describe, it, expect } from "vitest";
import { decisions } from "@/data/fixtures";
import { DecisionSchema, ProvenanceSchema, SourceTypeSchema } from "@/data/schemas";

describe("decisions fixture — provenance.sourceType boundary (CP-2)", () => {
  it("SourceType enum includes 'data-integrity'", () => {
    expect(SourceTypeSchema.safeParse("data-integrity").success).toBe(true);
  });

  it("ProvenanceSchema accepts a provenance whose sourceType is 'data-integrity'", () => {
    const result = ProvenanceSchema.safeParse({
      sourceType: "data-integrity",
      sourceLocation: "github:hanax-ai/sdd-core@abcdefg",
      observedAt: "2026-07-21T14:22:00Z",
      confidence: "derived",
    });
    expect(result.success).toBe(true);
  });

  it("every decision in the fixture parses against DecisionSchema", () => {
    for (const [index, decision] of decisions.entries()) {
      const result = DecisionSchema.safeParse(decision);
      if (!result.success) {
        throw new Error(
          `decisions[${index}] (${decision.id}) failed: ${result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        );
      }
    }
  });

  it("at least one decision fixture uses provenance.sourceType='data-integrity' (regression guard)", () => {
    const found = decisions.some((d) => d.provenance.sourceType === "data-integrity");
    expect(found).toBe(true);
  });
});
