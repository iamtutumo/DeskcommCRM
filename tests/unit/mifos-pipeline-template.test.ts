import { describe, expect, it } from "vitest";

import {
  MIFOS_ORIGINATION_PIPELINE,
  MIFOS_COLLECTIONS_PIPELINE,
  getMicrofinanceTemplates,
} from "@/lib/mifos/pipeline-template";

describe("Mifos / Apache Fineract — Pipeline & Vocabulary Templates", () => {
  it("includes multi-niche vocabulary mapping Borrower and Loan", () => {
    expect(MIFOS_ORIGINATION_PIPELINE.vocabulary["lead"]).toBe("Borrower");
    expect(MIFOS_ORIGINATION_PIPELINE.vocabulary["deal"]).toBe("Loan");
    expect(MIFOS_ORIGINATION_PIPELINE.vocabulary["won"]).toBe("Disbursed");
    expect(MIFOS_ORIGINATION_PIPELINE.vocabulary["lost"]).toBe("Rejected");
  });

  it("returns both canonical pipelines (Origination and Collections)", () => {
    const templates = getMicrofinanceTemplates();
    expect(templates).toHaveLength(2);
    expect(templates[0]?.slug).toBe("mifos-loan-origination");
    expect(templates[1]?.slug).toBe("mifos-servicing-collections");
  });

  it("ensures sequential positions and valid alphanumeric slugs", () => {
    for (const pipeline of getMicrofinanceTemplates()) {
      expect(pipeline.slug).toMatch(/^[a-z0-9-]+$/);
      for (const stage of pipeline.stages) {
        expect(stage.slug).toMatch(/^[a-z0-9-]+$/);
        expect(stage.position).toBeGreaterThan(0);
      }
    }
  });
});
