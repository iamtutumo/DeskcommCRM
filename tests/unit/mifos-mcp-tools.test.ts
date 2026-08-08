import { describe, expect, it } from "vitest";

import { catalogEntry, TOOL_CATALOG } from "@/lib/mcp/tools/catalog";
import { getToolByName, allTools } from "@/lib/mcp/tools";
import {
  mifosGetClient,
  mifosGetLoanAccounts,
  mifosGetRepaymentSchedule,
  mifosSimulateLoanSchedule,
  mifosCreateLoanApplication,
} from "@/lib/mcp/tools/mifos";

describe("Microfinance MCP Tools (Mifos / Apache Fineract)", () => {
  const toolNames = [
    "mifos_get_client",
    "mifos_get_loan_accounts",
    "mifos_get_repayment_schedule",
    "mifos_get_loan_charges",
    "mifos_simulate_loan_schedule",
    "mifos_create_loan_application",
  ];

  it("all 5 tools are declared in the catalog (catalog.ts)", () => {
    for (const name of toolNames) {
      const entry = catalogEntry(name);
      expect(entry, `catalog must contain ${name}`).toBeDefined();
      expect(entry?.oQueToca).toBeDefined();
      expect(entry?.explicacao.length).toBeGreaterThanOrEqual(40);
    }
  });

  it("all 5 tools are registered in allTools and getToolByName", () => {
    for (const name of toolNames) {
      const tool = getToolByName(name);
      expect(tool, `allTools must contain ${name}`).toBeDefined();
      expect(tool?.name).toBe(name);
    }
  });

  it("mifosSimulateLoanSchedule executes simulation correctly without a backend configured", async () => {
    const result = (await mifosSimulateLoanSchedule.handler(
      {
        principal: 5000,
        numberOfRepayments: 12,
        interestRatePerPeriod: 1.5,
        repaymentEvery: 1,
      },
      {} as unknown as any,
    )) as any;

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.simulation.principal).toBe(5000);
      expect(result.simulation.numberOfRepayments).toBe(12);
      expect(result.simulation.estimatedInstallmentAmount).toBeGreaterThan(400);
    }
  });

  it("mifosGetClient reports not_configured when environment variables are missing", async () => {
    const result = (await mifosGetClient.handler(
      { phone: "11999999999", externalId: undefined, cpf: undefined },
      {} as unknown as any,
    )) as any;

    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) {
      expect(result.reason).toBe("not_configured");
    }
  });
});
