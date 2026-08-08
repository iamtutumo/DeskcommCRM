/**
 * Typed domain definitions for Apache Fineract / Mifos X core banking.
 *
 * Covers Clients, Loan Accounts, Amortization Schedules, Simulation,
 * Loan Applications, Loan Charges (Fees & Penalties), Document Generation,
 * Branches (Offices), Staff, Loan Products, Savings Products, Share Products,
 * Savings Accounts, Share Accounts, and Bidirectional Synchronization.
 */

export interface FineractOffice {
  id: number;
  name: string;
  nameDecorated?: string;
  externalId?: string;
  openingDate?: number[];
  hierarchy?: string;
}

export interface FineractStaff {
  id: number;
  firstname: string;
  lastname: string;
  displayName: string;
  officeId: number;
  officeName: string;
  isLoanOfficer: boolean;
  mobileNo?: string;
}

export interface FineractLoanProduct {
  id: number;
  name: string;
  shortName: string;
  description?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  minPrincipal?: number;
  maxPrincipal?: number;
  defaultPrincipal?: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  defaultNumberOfRepayments?: number;
  interestRatePerPeriod?: number;
  annualInterestRate?: number;
}

export interface FineractSavingsProduct {
  id: number;
  name: string;
  shortName: string;
  description?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  nominalAnnualInterestRate?: number;
  minRequiredOpeningBalance?: number;
}

export interface FineractShareProduct {
  id: number;
  name: string;
  shortName: string;
  description?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  totalShares?: number;
  totalSharesIssued?: number;
  unitPrice?: number;
}

export interface FineractSavingsAccountSummary {
  id: number;
  accountNo: string;
  externalId?: string;
  productId: number;
  productName: string;
  status: {
    id: number;
    code: string;
    value: string;
    active: boolean;
  };
  accountBalance: number;
  nominalAnnualInterestRate?: number;
}

export interface FineractShareAccountSummary {
  id: number;
  accountNo: string;
  externalId?: string;
  productId: number;
  productName: string;
  status: {
    id: number;
    code: string;
    value: string;
    active: boolean;
  };
  totalApprovedShares: number;
  totalPendingForApprovalShares?: number;
}

export interface FineractClientSummary {
  id: number;
  accountNo: string;
  externalId?: string;
  status: {
    id: number;
    code: string;
    value: string;
  };
  active: boolean;
  activationDate?: number[];
  displayName: string;
  mobileNo?: string;
}

export interface FineractLoanAccountSummary {
  id: number;
  accountNo: string;
  externalId?: string;
  productId: number;
  productName: string;
  status: {
    id: number;
    code: string;
    value: string;
    pendingApproval: boolean;
    waitingForDisbursal: boolean;
    active: boolean;
    closedObligationsMet: boolean;
    closedWrittenOff: boolean;
    closedRescheduled: boolean;
    closed: boolean;
    overpaid: boolean;
  };
  principal: number;
  approvedPrincipal?: number;
  totalRepaymentExpected?: number;
  totalRepayment?: number;
  totalOutstanding?: number;
  totalOverdue?: number;
  inArrears?: boolean;
}

export interface FineractRepaymentPeriod {
  period: number;
  dueDate: number[]; // [YYYY, MM, DD]
  principalDue: number;
  interestDue: number;
  feeChargesDue: number;
  penaltyChargesDue: number;
  totalDueForPeriod: number;
  totalPaidForPeriod: number;
  totalOutstandingForPeriod: number;
  complete: boolean;
}

export interface FineractRepaymentSchedule {
  loanId: number;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
  };
  loanTermInDays: number;
  totalPrincipalDisbursed: number;
  totalInterestCharged: number;
  totalRepaymentExpected: number;
  totalOutstanding: number;
  periods: FineractRepaymentPeriod[];
}

export interface FineractLoanCharge {
  id: number;
  chargeId: number;
  name: string;
  chargeTimeType: {
    id: number;
    code: string;
    value: string; // e.g. "Disbursement", "Overdue Installment", "Specified due date"
  };
  chargeCalculationType: {
    id: number;
    code: string;
    value: string; // e.g. "Flat", "% Principal", "% Interest"
  };
  percentage?: number;
  amount: number;
  amountPaid: number;
  amountWaived: number;
  amountWrittenOff: number;
  amountOutstanding: number;
  paid: boolean;
}

export interface FineractLoanSimulationParams {
  principal: number;
  numberOfRepayments: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: number; // 0=days, 1=weeks, 2=months
  interestRatePerPeriod: number;
  amortizationType?: number; // 1=equal installments
}

export interface FineractLoanSimulationResult {
  principal: number;
  totalInterest: number;
  totalRepaymentExpected: number;
  numberOfRepayments: number;
  estimatedInstallmentAmount: number;
  currency: string;
}

export interface FineractCreateLoanRequest {
  clientId: number;
  productId: number;
  principal: number;
  loanTermFrequency: number;
  loanTermFrequencyType: number; // 2=months
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  interestRatePerPeriod: number;
  amortizationType: number;
  interestType: number;
  interestCalculationPeriodType: number;
  transactionProcessingStrategyCode: string;
  expectedDisbursementDate: string; // "DD MMMM YYYY" or ISO string
  submittedOnDate: string;
  dateFormat?: string;
  locale?: string;
}

export interface FineractDocumentMetadata {
  id: number;
  parentEntityType: "clients" | "loans";
  parentEntityId: number;
  name: string;
  fileName: string;
  size: number;
  type: string; // MIME type e.g. "application/pdf"
  description?: string;
}

export interface MifosSyncResult {
  ok: boolean;
  organization_id: string;
  timestamp: string;
  counts: {
    offices: number;
    staff: number;
    loan_products: number;
    savings_products: number;
    share_products: number;
    clients: number;
    loan_accounts: number;
    savings_accounts: number;
    share_accounts: number;
    repayment_schedules: number;
    loan_charges: number;
  };
  error?: string;
}
