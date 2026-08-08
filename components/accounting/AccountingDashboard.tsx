"use client";

/**
 * AccountingDashboard — Frontend UI Component.
 *
 * Authoritative double-entry accounting in UGX for DeskcommCRM. Includes
 * the unified Operational Transaction Entry Form, Financial Statements
 * (Trial Balance, Balance Sheet, Income Statement), and General Ledger Cards.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import * as React from "react";
import { AccountingReportService } from "@/lib/accounting/reports";
import { TransactionService, type MicrofinanceTransactionType } from "@/lib/accounting/transactions";
import type { JournalLine } from "@/lib/accounting/types";

export interface AccountingDashboardProps {
  organizationId: string;
}

type ActiveTab = "transactions" | "reports" | "ledger";

export function AccountingDashboard({
  organizationId,
}: AccountingDashboardProps): React.JSX.Element {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("transactions");
  const [txType, setTxType] = React.useState<MicrofinanceTransactionType>("loan_repayment");
  const [amount, setAmount] = React.useState("150000"); // 150,000 UGX
  const [currency, setCurrency] = React.useState("UGX");
  const [clientId, setClientId] = React.useState("client-501");
  const [loanId, setLoanId] = React.useState("loan-1001");
  const [notes, setNotes] = React.useState("Regular repayment installment");
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // We maintain in-memory journal lines to demonstrate real-time financial reporting
  const [journalLines, setJournalLines] = React.useState<JournalLine[]>(() => {
    // Seed initial transactions
    const d = TransactionService.recordTransaction({
      organization_id: organizationId,
      transaction_date: "2026-08-01",
      transaction_type: "share_purchase",
      client_id: "client-501",
      amount: 500000,
    });
    const l = TransactionService.recordTransaction({
      organization_id: organizationId,
      transaction_date: "2026-08-03",
      transaction_type: "loan_disbursement",
      client_id: "client-501",
      loan_id: "loan-1001",
      amount: 300000,
    });
    return [...d.journalEntry.lines, ...l.journalEntry.lines];
  });

  const [selectedAccountCode, setSelectedAccountCode] = React.useState("1000");

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      const res = TransactionService.recordTransaction({
        organization_id: organizationId,
        transaction_date: new Date().toISOString().split("T")[0] ?? "2026-08-08",
        transaction_type: txType,
        client_id: clientId,
        loan_id: txType.includes("loan") ? loanId : undefined,
        currency,
        amount: parsedAmount,
        notes,
      });

      setJournalLines((prev) => [...prev, ...res.journalEntry.lines]);
      setSuccessMsg(
        `✔ Recorded ${txType} #${res.transaction.id} (${res.transaction.base_amount} UGX) and posted balanced Journal Entry #${res.journalEntry.id}.`,
      );
    } catch (err) {
      setSuccessMsg(`✖ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const trialBalance = React.useMemo(() => {
    return AccountingReportService.getTrialBalanceReport(
      organizationId,
      journalLines,
    );
  }, [organizationId, journalLines]);

  const balanceSheet = React.useMemo(() => {
    return AccountingReportService.getBalanceSheetReport(
      organizationId,
      journalLines,
      "UGX",
    );
  }, [organizationId, journalLines]);

  const incomeStatement = React.useMemo(() => {
    return AccountingReportService.getIncomeStatementReport(
      organizationId,
      journalLines,
      "UGX",
    );
  }, [organizationId, journalLines]);

  const ledgerCard = React.useMemo(() => {
    return AccountingReportService.getAccountLedgerCard(
      organizationId,
      selectedAccountCode,
      journalLines,
    );
  }, [organizationId, selectedAccountCode, journalLines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Authoritative Double-Entry Accounting
          </h2>
          <p className="text-sm text-muted-foreground">
            Default Base Currency: UGX (Uganda Shillings) • Decoupled from Mifos
            Sub-Ledger
          </p>
        </div>
        <div className="flex space-x-2 text-sm">
          {(
            [
              ["transactions", "Record Transaction"],
              ["reports", "Financial Statements"],
              ["ledger", "General Ledger Cards"],
            ] as const
          ).map(([tabKey, tabLabel]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === tabKey
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div
          className={`rounded-md p-3 text-sm border ${
            successMsg.startsWith("✔")
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {successMsg}
        </div>
      )}

      {/* Tab 1: Transaction Entry Form */}
      {activeTab === "transactions" && (
        <form
          onSubmit={handleRecordTransaction}
          className="border rounded-lg p-6 bg-card space-y-4 shadow-sm"
        >
          <h3 className="font-semibold text-lg text-card-foreground">
            Record Operational Financial Transaction
          </h3>
          <p className="text-xs text-muted-foreground">
            Submitting a transaction automatically converts foreign currencies to
            UGX and posts a balanced double-entry General Ledger record.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Transaction Type
              </label>
              <select
                value={txType}
                onChange={(e) =>
                  setTxType(e.target.value as MicrofinanceTransactionType)
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="loan_repayment">
                  Loan Repayment (Installment)
                </option>
                <option value="loan_disbursement">Loan Disbursement</option>
                <option value="savings_deposit">Savings Account Deposit</option>
                <option value="savings_withdrawal">
                  Savings Account Withdrawal
                </option>
                <option value="share_purchase">
                  Member Share Capital Purchase (3100)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="UGX">UGX (Uganda Shillings - Base)</option>
                <option value="USD">USD (US Dollar &rarr; 1 USD = 3750 UGX)</option>
                <option value="KES">KES (Kenyan Shilling &rarr; 1 KES = 29 UGX)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            {txType.includes("loan") && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Loan ID
                </label>
                <input
                  type="text"
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Notes / Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Record & Post Balanced GL Entry →
          </button>
        </form>
      )}

      {/* Tab 2: Financial Statements */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Trial Balance */}
          <div className="border rounded-lg p-5 bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Trial Balance Report</h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  trialBalance.is_balanced
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {trialBalance.is_balanced
                  ? "● Balanced (Debits == Credits)"
                  : "● Unbalanced"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2">Code</th>
                    <th className="py-2">Account Name</th>
                    <th className="py-2 text-right">Debit (UGX)</th>
                    <th className="py-2 text-right">Credit (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trialBalance.accounts.map((acc) => (
                    <tr key={acc.account_code}>
                      <td className="py-2 font-mono">{acc.account_code}</td>
                      <td className="py-2">{acc.account_name}</td>
                      <td className="py-2 text-right font-mono">
                        {acc.total_debit_cents.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {acc.total_credit_cents.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t">
                    <td colSpan={2} className="py-2">
                      Total
                    </td>
                    <td className="py-2 text-right font-mono">
                      {trialBalance.total_debits_cents.toLocaleString()}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {trialBalance.total_credits_cents.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="border rounded-lg p-5 bg-card shadow-sm space-y-3">
            <h3 className="font-semibold text-lg">
              Statement of Financial Position (Balance Sheet)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 border-r pr-4">
                <h4 className="font-semibold text-primary">
                  Assets (Total:{" "}
                  {balanceSheet.total_assets_cents.toLocaleString()} UGX)
                </h4>
                {balanceSheet.assets.accounts.map((acc) => (
                  <div
                    key={acc.account_code}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>
                      {acc.account_code} {acc.account_name}
                    </span>
                    <span className="font-mono">
                      {acc.net_balance_cents.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">
                    Liabilities (Total:{" "}
                    {balanceSheet.liabilities.total_cents.toLocaleString()} UGX)
                  </h4>
                  {balanceSheet.liabilities.accounts.map((acc) => (
                    <div
                      key={acc.account_code}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span>
                        {acc.account_code} {acc.account_name}
                      </span>
                      <span className="font-mono">
                        {acc.net_balance_cents.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold text-primary">
                    Equity & Net Income (Total:{" "}
                    {(
                      balanceSheet.equity.total_cents +
                      balanceSheet.net_income_cents
                    ).toLocaleString()}{" "}
                    UGX)
                  </h4>
                  {balanceSheet.equity.accounts.map((acc) => (
                    <div
                      key={acc.account_code}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span>
                        {acc.account_code} {acc.account_name}
                      </span>
                      <span className="font-mono">
                        {acc.net_balance_cents.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Current Year Net Income</span>
                    <span className="font-mono">
                      {balanceSheet.net_income_cents.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ledger Cards */}
      {activeTab === "ledger" && (
        <div className="border rounded-lg p-5 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">General Ledger Cards</h3>
            <select
              value={selectedAccountCode}
              onChange={(e) => setSelectedAccountCode(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="1000">1000 - Cash & Bank Checking</option>
              <option value="1200">
                1200 - Microfinance Loan Receivables (Principal)
              </option>
              <option value="2100">
                2100 - Customer Savings & Deposit Accounts
              </option>
              <option value="3100">3100 - Member Share Capital</option>
              <option value="4200">4200 - Loan Interest Income</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2">Date / Time</th>
                  <th className="py-2">Memo</th>
                  <th className="py-2 text-right">Debit (UGX)</th>
                  <th className="py-2 text-right">Credit (UGX)</th>
                  <th className="py-2 text-right font-semibold">
                    Running Balance (UGX)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledgerCard.movements.map((mov) => (
                  <tr key={mov.id}>
                    <td className="py-2 text-xs">
                      {new Date(mov.created_at).toLocaleString()}
                    </td>
                    <td className="py-2">{mov.memo}</td>
                    <td className="py-2 text-right font-mono">
                      {mov.debit_cents > 0
                        ? mov.debit_cents.toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {mov.credit_cents > 0
                        ? mov.credit_cents.toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold">
                      {mov.running_balance_cents.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
