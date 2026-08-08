import { describe, expect, it } from "vitest";

import { AccountingReportService } from "@/lib/accounting/reports";
import { TransactionService } from "@/lib/accounting/transactions";

describe("DeskcommCRM Standard Accounting Reports Service", () => {
  const testOrgId = "org-reports-200";

  it("generates balanced Trial Balance, Balance Sheet, and Income Statement reports", () => {
    // 1. Share capital purchase of 500,000 UGX
    const t1 = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-01",
      transaction_type: "share_purchase",
      client_id: "c-01",
      amount: 500000,
    });

    // 2. Loan disbursement of 300,000 UGX
    const t2 = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-02",
      transaction_type: "loan_disbursement",
      client_id: "c-01",
      loan_id: "l-01",
      amount: 300000,
    });

    // 3. Loan repayment of 120,000 UGX (100k principal + 15k interest + 5k penalty)
    const t3 = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-05",
      transaction_type: "loan_repayment",
      client_id: "c-01",
      loan_id: "l-01",
      amount: 120000,
      principal_amount: 100000,
      interest_amount: 15000,
      penalty_amount: 5000,
    });

    const allLines = [
      ...t1.journalEntry.lines,
      ...t2.journalEntry.lines,
      ...t3.journalEntry.lines,
    ];

    // Trial Balance test
    const trial = AccountingReportService.getTrialBalanceReport(testOrgId, allLines);
    expect(trial.is_balanced).toBe(true);
    expect(trial.total_debits_cents).toBe(920000); // 500k + 300k + 120k
    expect(trial.total_credits_cents).toBe(920000);

    // Income Statement test
    const inc = AccountingReportService.getIncomeStatementReport(
      testOrgId,
      allLines,
      "UGX",
    );
    expect(inc.revenue.total_cents).toBe(20000); // 15,000 interest + 5,000 penalty
    expect(inc.expenses.total_cents).toBe(0);
    expect(inc.net_income_cents).toBe(20000);

    // Balance Sheet test
    const bs = AccountingReportService.getBalanceSheetReport(
      testOrgId,
      allLines,
      "UGX",
    );
    // Assets: Cash = 500k - 300k + 120k = 320,000 UGX
    //         Loan Receivables = 300k - 100k = 200,000 UGX
    // Total Assets = 520,000 UGX
    expect(bs.assets.total_cents).toBe(520000);

    // Liabilities = 0
    // Equity: Member Share Capital = 500,000 UGX
    expect(bs.equity.total_cents).toBe(500000);

    // Net income = 20,000 UGX
    expect(bs.net_income_cents).toBe(20000);

    // Total Assets (520,000) === Liabilities (0) + Equity (500,000) + Net Income (20,000)
    expect(bs.total_liabilities_and_equity_cents).toBe(520000);
    expect(bs.is_balanced).toBe(true);
  });

  it("generates an Account Ledger Card showing chronological debit/credit movements and running balance", () => {
    const d1 = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-01",
      transaction_type: "savings_deposit",
      client_id: "c-02",
      amount: 150000,
    });

    const d2 = TransactionService.recordTransaction({
      organization_id: testOrgId,
      transaction_date: "2026-08-03",
      transaction_type: "savings_withdrawal",
      client_id: "c-02",
      amount: 40000,
    });

    const allLines = [...d1.journalEntry.lines, ...d2.journalEntry.lines];
    const card = AccountingReportService.getAccountLedgerCard(
      testOrgId,
      "2100", // Customer Savings & Deposit Accounts
      allLines,
    );

    expect(card.account_code).toBe("2100");
    expect(card.movements).toHaveLength(2);
    expect(card.movements[0]?.running_balance_cents).toBe(150000); // After deposit
    expect(card.movements[1]?.running_balance_cents).toBe(110000); // 150,000 - 40,000 withdrawal
    expect(card.ending_balance_cents).toBe(110000);
  });
});
