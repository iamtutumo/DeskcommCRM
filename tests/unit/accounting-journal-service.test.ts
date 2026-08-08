import { describe, expect, it } from "vitest";

import {
  JournalService,
  UnbalancedJournalEntryError,
} from "@/lib/accounting/journal-service";
import { getDefaultChartOfAccounts } from "@/lib/accounting/chart-of-accounts";

describe("DeskcommCRM Authoritative Double-Entry Accounting Engine", () => {
  const testOrgId = "org-test-accounting-001";

  it("produces standard microfinance chart of accounts for an organization", () => {
    const chart = getDefaultChartOfAccounts(testOrgId, "USD");
    expect(chart.length).toBeGreaterThan(10);
    const cashAcc = chart.find((a) => a.code === "1000");
    const loanReceivableAcc = chart.find((a) => a.code === "1200");
    const savingsDepositAcc = chart.find((a) => a.code === "2100");

    expect(cashAcc?.type).toBe("asset");
    expect(loanReceivableAcc?.type).toBe("asset");
    expect(savingsDepositAcc?.type).toBe("liability");
  });

  it("creates a balanced Loan Disbursement journal entry (Debit 1200 / Credit 1000)", () => {
    const entry = JournalService.postLoanDisbursement({
      organizationId: testOrgId,
      loanId: "loan-1001",
      principalCents: 500000, // $5,000.00
      description: "Disbursement to Borrower A",
    });

    expect(entry.lines).toHaveLength(2);
    expect(entry.lines[0]?.account_code).toBe("1200");
    expect(entry.lines[0]?.debit_cents).toBe(500000);
    expect(entry.lines[0]?.credit_cents).toBe(0);

    expect(entry.lines[1]?.account_code).toBe("1000");
    expect(entry.lines[1]?.debit_cents).toBe(0);
    expect(entry.lines[1]?.credit_cents).toBe(500000);
    expect(entry.status).toBe("posted");
  });

  it("creates a balanced Loan Repayment entry with principal, interest, and late penalty", () => {
    const entry = JournalService.postLoanRepayment({
      organizationId: testOrgId,
      loanId: "loan-1001",
      principalCents: 40000, // $400.00 principal
      interestCents: 1500,   // $15.00 interest
      penaltyCents: 500,     // $5.00 penalty
    });

    // Total cash debit = 42000
    const cashLine = entry.lines.find((l) => l.account_code === "1000");
    const receivableLine = entry.lines.find((l) => l.account_code === "1200");
    const interestLine = entry.lines.find((l) => l.account_code === "4200");
    const penaltyLine = entry.lines.find((l) => l.account_code === "4300");

    expect(cashLine?.debit_cents).toBe(42000);
    expect(receivableLine?.credit_cents).toBe(40000);
    expect(interestLine?.credit_cents).toBe(1500);
    expect(penaltyLine?.credit_cents).toBe(500);
  });

  it("creates a balanced Savings Deposit entry (Debit Cash 1000 / Credit Customer Savings Liability 2100)", () => {
    const entry = JournalService.postSavingsDeposit({
      organizationId: testOrgId,
      clientId: "client-2002",
      amountCents: 10000, // $100.00 deposit
    });

    expect(entry.lines).toHaveLength(2);
    expect(entry.lines[0]?.account_code).toBe("1000");
    expect(entry.lines[0]?.debit_cents).toBe(10000);
    expect(entry.lines[1]?.account_code).toBe("2100");
    expect(entry.lines[1]?.credit_cents).toBe(10000);
  });

  it("throws UnbalancedJournalEntryError when debits do not equal credits", () => {
    expect(() =>
      JournalService.createJournalEntry({
        organization_id: testOrgId,
        entry_date: "2026-08-08",
        description: "Unbalanced test entry",
        lines: [
          {
            account_code: "1000",
            account_name: "Cash & Bank Checking",
            debit_cents: 10000,
            credit_cents: 0,
          },
          {
            account_code: "4100",
            account_name: "Processing Fee Revenue",
            debit_cents: 0,
            credit_cents: 9000, // $90 vs $100 -> Unbalanced!
          },
        ],
      }),
    ).toThrow(UnbalancedJournalEntryError);
  });

  it("generates a balanced Trial Balance Report verifying total debits == total credits", () => {
    const disbursement = JournalService.postLoanDisbursement({
      organizationId: testOrgId,
      loanId: "loan-555",
      principalCents: 100000,
    });

    const repayment = JournalService.postLoanRepayment({
      organizationId: testOrgId,
      loanId: "loan-555",
      principalCents: 10000,
      interestCents: 2000,
      penaltyCents: 500,
    });

    const allLines = [...disbursement.lines, ...repayment.lines];
    const report = JournalService.getTrialBalanceReport(testOrgId, allLines);

    expect(report.total_debits_cents).toBe(112500); // 100,000 + 12,500
    expect(report.total_credits_cents).toBe(112500);
    expect(report.is_balanced).toBe(true);
  });
});
