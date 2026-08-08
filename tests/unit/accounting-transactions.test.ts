import { describe, expect, it } from "vitest";

import { TransactionService } from "@/lib/accounting/transactions";

describe("Unified Microfinance Financial Transactions Service", () => {
  const testOrgId = "org-mfi-tx-100";

  it("records a loan_disbursement in UGX and posts balanced double-entry journal entry", () => {
    const res = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-08",
      transaction_type: "loan_disbursement",
      client_id: "client-11",
      loan_id: "loan-501",
      currency: "UGX",
      amount: 1000000, // 1,000,000 UGX
      payment_method: "mobile_money",
    });

    expect(res.transaction.id).toContain("mfi-tx-");
    expect(res.transaction.base_currency).toBe("UGX");
    expect(res.transaction.base_amount).toBe(1000000);
    expect(res.transaction.journal_entry_id).toBe(res.journalEntry.id);

    // Verify journal entry lines
    const drLine = res.journalEntry.lines.find((l) => l.account_code === "1200");
    const crLine = res.journalEntry.lines.find((l) => l.account_code === "1000");

    expect(drLine?.debit_cents).toBe(1000000);
    expect(crLine?.credit_cents).toBe(1000000);
  });

  it("records a loan_repayment in foreign currency (USD) and automatically maps to UGX", () => {
    const res = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-08",
      transaction_type: "loan_repayment",
      client_id: "client-11",
      loan_id: "loan-501",
      currency: "USD",
      amount: 100, // $100 USD -> 375,000 UGX
      principal_amount: 80, // $80 -> 300,000 UGX
      interest_amount: 15,  // $15 -> 56,250 UGX
      penalty_amount: 5,    // $5 -> 18,750 UGX
      payment_method: "cash",
    });

    expect(res.transaction.original_currency).toBe("USD");
    expect(res.transaction.original_amount).toBe(100);
    expect(res.transaction.exchange_rate_to_base).toBe(3750);
    expect(res.transaction.base_currency).toBe("UGX");
    expect(res.transaction.base_amount).toBe(375000);

    const cashLine = res.journalEntry.lines.find((l) => l.account_code === "1000");
    const recLine = res.journalEntry.lines.find((l) => l.account_code === "1200");
    const intLine = res.journalEntry.lines.find((l) => l.account_code === "4200");
    const penLine = res.journalEntry.lines.find((l) => l.account_code === "4300");

    expect(cashLine?.debit_cents).toBe(375000);
    expect(recLine?.credit_cents).toBe(300000); // 80 * 3750
    expect(intLine?.credit_cents).toBe(56250);  // 15 * 3750
    expect(penLine?.credit_cents).toBe(18750);  // 5 * 3750
  });

  it("records savings_deposit and savings_withdrawal with automatic accounting postings", () => {
    const deposit = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-08",
      transaction_type: "savings_deposit",
      client_id: "client-12",
      savings_id: "sav-01",
      amount: 50000, // 50,000 UGX
    });
    expect(deposit.journalEntry.lines[0]?.account_code).toBe("1000");
    expect(deposit.journalEntry.lines[1]?.account_code).toBe("2100");

    const withdrawal = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-08",
      transaction_type: "savings_withdrawal",
      client_id: "client-12",
      savings_id: "sav-01",
      amount: 20000, // 20,000 UGX
    });
    expect(withdrawal.journalEntry.lines[0]?.account_code).toBe("2100");
    expect(withdrawal.journalEntry.lines[1]?.account_code).toBe("1000");
  });

  it("records a share_purchase transaction and credits Member Share Capital (3100)", () => {
    const share = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-08",
      transaction_type: "share_purchase",
      client_id: "client-13",
      share_id: "sh-01",
      amount: 100000, // 100,000 UGX
    });

    const drLine = share.journalEntry.lines.find((l) => l.account_code === "1000");
    const crLine = share.journalEntry.lines.find((l) => l.account_code === "3100");
    expect(drLine?.debit_cents).toBe(100000);
    expect(crLine?.credit_cents).toBe(100000);
  });
});
