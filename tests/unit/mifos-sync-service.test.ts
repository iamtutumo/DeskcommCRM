import { describe, expect, it } from "vitest";

import { MifosSyncService } from "@/lib/mifos/sync-service";

describe("MifosSyncService — Bidirectional Core Banking Synchronization", () => {
  const testOrgId = "org-mifos-sync-100";

  it("syncReferenceCatalogs returns counts of offices, staff, and financial products", async () => {
    const counts = await MifosSyncService.syncReferenceCatalogs(testOrgId);
    expect(counts.offices).toBeGreaterThan(0);
    expect(counts.staff).toBeGreaterThan(0);
    expect(counts.loan_products).toBeGreaterThan(0);
    expect(counts.savings_products).toBeGreaterThan(0);
    expect(counts.share_products).toBeGreaterThan(0);
  });

  it("syncClientAccounts returns account counts for loans, savings, and equity shares", async () => {
    const counts = await MifosSyncService.syncClientAccounts(testOrgId, 501);
    expect(counts.loan_accounts).toBeGreaterThan(0);
    expect(counts.savings_accounts).toBeGreaterThan(0);
    expect(counts.share_accounts).toBeGreaterThan(0);
    expect(counts.repayment_schedules).toBeGreaterThan(0);
    expect(counts.loan_charges).toBeGreaterThan(0);
  });

  it("runFullSync aggregates reference catalog and client account sync metrics", async () => {
    const res = await MifosSyncService.runFullSync(testOrgId);
    expect(res.ok).toBe(true);
    expect(res.counts.offices).toBeGreaterThan(0);
    expect(res.counts.loan_accounts).toBeGreaterThan(0);
    expect(res.counts.savings_accounts).toBeGreaterThan(0);
    expect(res.counts.share_accounts).toBeGreaterThan(0);
    expect(res.counts.repayment_schedules).toBeGreaterThan(0);
  });
});
