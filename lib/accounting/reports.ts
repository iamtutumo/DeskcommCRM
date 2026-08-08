/**
 * Standard Accounting Reports Service for DeskcommCRM (lib/accounting/reports.ts).
 *
 * Generates authoritative financial reports from double-entry journal lines:
 *   1. Trial Balance Report (Debits == Credits)
 *   2. Balance Sheet (Assets == Liabilities + Equity)
 *   3. Income Statement / Profit & Loss (Revenue - Expense = Net Income)
 *   4. Account Ledger Card / General Ledger Statement (running balances)
 */

import { JournalService } from "./journal-service";
import type {
  JournalLine,
  TrialBalanceAccountSummary,
  TrialBalanceReport,
} from "./types";

export interface BalanceSheetSection {
  code_prefix: string;
  name: string;
  accounts: TrialBalanceAccountSummary[];
  total_cents: number;
}

export interface BalanceSheetReport {
  organization_id: string;
  report_currency: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  net_income_cents: number;
  total_assets_cents: number;
  total_liabilities_and_equity_cents: number;
  is_balanced: boolean;
}

export interface IncomeStatementSection {
  name: string;
  accounts: TrialBalanceAccountSummary[];
  total_cents: number;
}

export interface IncomeStatementReport {
  organization_id: string;
  report_currency: string;
  revenue: IncomeStatementSection;
  expenses: IncomeStatementSection;
  net_income_cents: number;
}

export interface LedgerCardMovement {
  id: string;
  entry_id: string;
  created_at: string;
  debit_cents: number;
  credit_cents: number;
  net_movement_cents: number;
  running_balance_cents: number;
  memo?: string;
}

export interface AccountLedgerCardReport {
  organization_id: string;
  account_code: string;
  account_name: string;
  total_debits_cents: number;
  total_credits_cents: number;
  ending_balance_cents: number;
  movements: LedgerCardMovement[];
}

export class AccountingReportService {
  /**
   * Generates a Trial Balance Report.
   */
  static getTrialBalanceReport(
    organizationId: string,
    lines: JournalLine[],
  ): TrialBalanceReport {
    return JournalService.getTrialBalanceReport(organizationId, lines);
  }

  /**
   * Generates an Income Statement (Profit & Loss) Report:
   *   Net Income = Total Revenue (4xxx) - Total Expenses (5xxx).
   */
  static getIncomeStatementReport(
    organizationId: string,
    lines: JournalLine[],
    reportCurrency = "UGX",
  ): IncomeStatementReport {
    const trial = this.getTrialBalanceReport(organizationId, lines);

    const revAccounts = trial.accounts.filter((a) => a.account_code.startsWith("4"));
    const expAccounts = trial.accounts.filter((a) => a.account_code.startsWith("5"));

    // Revenue accounts have a credit normal balance (credits - debits)
    let totalRev = 0;
    for (const acc of revAccounts) {
      const netCredit = acc.total_credit_cents - acc.total_debit_cents;
      totalRev += netCredit;
    }

    // Expense accounts have a debit normal balance (debits - credits)
    let totalExp = 0;
    for (const acc of expAccounts) {
      const netDebit = acc.total_debit_cents - acc.total_credit_cents;
      totalExp += netDebit;
    }

    const netIncome = totalRev - totalExp;

    return {
      organization_id: organizationId,
      report_currency: reportCurrency,
      revenue: {
        name: "Operating Revenue",
        accounts: revAccounts,
        total_cents: totalRev,
      },
      expenses: {
        name: "Operating Expenses",
        accounts: expAccounts,
        total_cents: totalExp,
      },
      net_income_cents: netIncome,
    };
  }

  /**
   * Generates a Statement of Financial Position (Balance Sheet):
   *   Assets (1xxx) = Liabilities (2xxx) + Equity (3xxx) + Net Income.
   */
  static getBalanceSheetReport(
    organizationId: string,
    lines: JournalLine[],
    reportCurrency = "UGX",
  ): BalanceSheetReport {
    const trial = this.getTrialBalanceReport(organizationId, lines);
    const incomeStatement = this.getIncomeStatementReport(
      organizationId,
      lines,
      reportCurrency,
    );

    const assetAccounts = trial.accounts.filter((a) => a.account_code.startsWith("1"));
    const liabAccounts = trial.accounts.filter((a) => a.account_code.startsWith("2"));
    const equityAccounts = trial.accounts.filter((a) => a.account_code.startsWith("3"));

    // Asset accounts normal balance = debits - credits
    let totalAssets = 0;
    for (const acc of assetAccounts) {
      const netDebit = acc.total_debit_cents - acc.total_credit_cents;
      totalAssets += netDebit;
    }

    // Liability accounts normal balance = credits - debits
    let totalLiab = 0;
    for (const acc of liabAccounts) {
      const netCredit = acc.total_credit_cents - acc.total_debit_cents;
      totalLiab += netCredit;
    }

    // Equity accounts normal balance = credits - debits
    let totalEquity = 0;
    for (const acc of equityAccounts) {
      const netCredit = acc.total_credit_cents - acc.total_debit_cents;
      totalEquity += netCredit;
    }

    const totalLiabAndEquity =
      totalLiab + totalEquity + incomeStatement.net_income_cents;

    return {
      organization_id: organizationId,
      report_currency: reportCurrency,
      assets: {
        code_prefix: "1",
        name: "Assets",
        accounts: assetAccounts,
        total_cents: totalAssets,
      },
      liabilities: {
        code_prefix: "2",
        name: "Liabilities",
        accounts: liabAccounts,
        total_cents: totalLiab,
      },
      equity: {
        code_prefix: "3",
        name: "Equity",
        accounts: equityAccounts,
        total_cents: totalEquity,
      },
      net_income_cents: incomeStatement.net_income_cents,
      total_assets_cents: totalAssets,
      total_liabilities_and_equity_cents: totalLiabAndEquity,
      is_balanced: totalAssets === totalLiabAndEquity,
    };
  }

  /**
   * Generates a General Ledger Card / Statement for a specific account code.
   */
  static getAccountLedgerCard(
    organizationId: string,
    accountCode: string,
    lines: JournalLine[],
  ): AccountLedgerCardReport {
    const matching = lines.filter((l) => l.account_code === accountCode);
    const sorted = [...matching].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );

    const isCreditNormal =
      accountCode.startsWith("2") ||
      accountCode.startsWith("3") ||
      accountCode.startsWith("4");

    let runningBalance = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    const movements: LedgerCardMovement[] = sorted.map((line) => {
      totalDebits += line.debit_cents;
      totalCredits += line.credit_cents;

      const netMovement = isCreditNormal
        ? line.credit_cents - line.debit_cents
        : line.debit_cents - line.credit_cents;

      runningBalance += netMovement;

      return {
        id: line.id,
        entry_id: line.journal_entry_id,
        created_at: line.created_at,
        debit_cents: line.debit_cents,
        credit_cents: line.credit_cents,
        net_movement_cents: netMovement,
        running_balance_cents: runningBalance,
        memo: line.memo,
      };
    });

    const accountName = matching[0]?.account_name ?? `Account ${accountCode}`;

    return {
      organization_id: organizationId,
      account_code: accountCode,
      account_name: accountName,
      total_debits_cents: totalDebits,
      total_credits_cents: totalCredits,
      ending_balance_cents: runningBalance,
      movements,
    };
  }
}
