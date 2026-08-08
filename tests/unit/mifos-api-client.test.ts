import { describe, expect, it } from "vitest";

import { FineractApiClient } from "@/lib/mifos/api-client";
import { isFineractConfigured } from "@/lib/mifos/config";

describe("FineractApiClient — Client and Local Simulation", () => {
  it("correctly reports unconfigured state when environment variables are missing", () => {
    expect(isFineractConfigured()).toBe(false);
  });

  it("correctly calculates amortized loan schedules (Price table)", () => {
    const client = new FineractApiClient({
      baseUrl: "https://simulation.local",
      tenantId: "default",
    });

    const sim = client.simulateLoanSchedule({
      principal: 1000,
      numberOfRepayments: 10,
      interestRatePerPeriod: 2, // 2% per month
    });

    expect(sim.principal).toBe(1000);
    expect(sim.numberOfRepayments).toBe(10);
    expect(sim.estimatedInstallmentAmount).toBeGreaterThan(100);
    expect(sim.totalInterest).toBeGreaterThan(0);
    expect(sim.totalRepaymentExpected).toBe(
      Number((sim.estimatedInstallmentAmount * 10).toFixed(2)),
    );
  });

  it("correctly calculates zero-interest loan schedules (0% rate)", () => {
    const client = new FineractApiClient({
      baseUrl: "https://simulation.local",
      tenantId: "default",
    });

    const sim = client.simulateLoanSchedule({
      principal: 1200,
      numberOfRepayments: 12,
      interestRatePerPeriod: 0,
    });

    expect(sim.principal).toBe(1200);
    expect(sim.estimatedInstallmentAmount).toBe(100);
    expect(sim.totalInterest).toBe(0);
    expect(sim.totalRepaymentExpected).toBe(1200);
  });
});
