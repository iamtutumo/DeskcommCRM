/**
 * Typed domain definitions for DeskcommCRM Authoritative Double-Entry Accounting.
 *
 * Implements a fully functional double-entry accounting engine in DeskcommCRM,
 * decoupling General Ledger (GL) accounting from Mifos X sub-ledgers.
 */

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface AccountingAccount {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  is_active: boolean;
  created_at?: string;
}

export interface JournalLineRequest {
  account_code: string;
  account_name: string;
  debit_cents: number;
  credit_cents: number;
  memo?: string;
}

export interface JournalLine extends JournalLineRequest {
  id: string;
  organization_id: string;
  journal_entry_id: string;
  created_at: string;
}

export interface JournalEntryRequest {
  organization_id: string;
  entry_date: string; // ISO string (YYYY-MM-DD)
  description: string;
  reference_id?: string;
  reference_type?:
    | "loan_disbursement"
    | "loan_repayment"
    | "fee_collection"
    | "savings_deposit"
    | "savings_withdrawal"
    | "share_purchase"
    | "manual";
  lines: JournalLineRequest[];
}

export interface JournalEntry {
  id: string;
  organization_id: string;
  entry_date: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
  status: "posted" | "voided";
  lines: JournalLine[];
  created_at: string;
}

export interface TrialBalanceAccountSummary {
  account_code: string;
  account_name: string;
  total_debit_cents: number;
  total_credit_cents: number;
  net_balance_cents: number;
}

export interface TrialBalanceReport {
  organization_id: string;
  total_debits_cents: number;
  total_credits_cents: number;
  is_balanced: boolean;
  accounts: TrialBalanceAccountSummary[];
}
