/**
 * Standard Microfinance Chart of Accounts for DeskcommCRM.
 *
 * Designed specifically for microfinance institutions (MFIs) that track loans
 * and savings in Mifos X while keeping authoritative general ledger accounting
 * in DeskcommCRM. Default base currency is UGX (Uganda Shillings).
 */

import { DEFAULT_BASE_CURRENCY } from "./currency";
import type { AccountingAccount, AccountType } from "./types";

export interface AccountTemplate {
  code: string;
  name: string;
  type: AccountType;
  currency: string;
}

export const MICROFINANCE_CHART_OF_ACCOUNTS: ReadonlyArray<AccountTemplate> = [
  // Assets (1xxx)
  {
    code: "1000",
    name: "Cash & Bank Checking",
    type: "asset",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "1200",
    name: "Microfinance Loan Receivables (Principal)",
    type: "asset",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "1250",
    name: "Allowance for Loan Losses (Contra Asset)",
    type: "asset",
    currency: DEFAULT_BASE_CURRENCY,
  },

  // Liabilities (2xxx)
  {
    code: "2100",
    name: "Customer Savings & Deposit Accounts",
    type: "liability",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "2200",
    name: "Borrowings from Commercial Institutions",
    type: "liability",
    currency: DEFAULT_BASE_CURRENCY,
  },

  // Equity (3xxx)
  {
    code: "3000",
    name: "Retained Earnings & Capital Reserves",
    type: "equity",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "3100",
    name: "Member Share Capital",
    type: "equity",
    currency: DEFAULT_BASE_CURRENCY,
  },

  // Revenue (4xxx)
  {
    code: "4100",
    name: "Origination & Processing Fee Revenue",
    type: "revenue",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "4200",
    name: "Loan Interest Income",
    type: "revenue",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "4300",
    name: "Late Payment Penalties & Arrears Fee Income",
    type: "revenue",
    currency: DEFAULT_BASE_CURRENCY,
  },

  // Expenses (5xxx)
  {
    code: "5100",
    name: "Provision for Credit Losses",
    type: "expense",
    currency: DEFAULT_BASE_CURRENCY,
  },
  {
    code: "5200",
    name: "Operating & Administrative Expenses",
    type: "expense",
    currency: DEFAULT_BASE_CURRENCY,
  },
];

export function getDefaultChartOfAccounts(
  organizationId: string,
  currency = DEFAULT_BASE_CURRENCY,
): AccountingAccount[] {
  return MICROFINANCE_CHART_OF_ACCOUNTS.map((tpl) => ({
    id: `acc-${organizationId.slice(0, 8)}-${tpl.code}`,
    organization_id: organizationId,
    code: tpl.code,
    name: tpl.name,
    type: tpl.type,
    currency,
    is_active: true,
  }));
}
