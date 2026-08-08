/**
 * Unified Microfinance Financial Transactions Service (lib/accounting/transactions.ts).
 *
 * Records operational transactions (loan repayments, savings deposits,
 * savings withdrawals, membership share purchases, and loan disbursements)
 * with automatic currency conversion to UGX and automatic posting of
 * balanced double-entry journal entries in DeskcommCRM.
 */

import { CurrencyService, DEFAULT_BASE_CURRENCY } from "./currency";
import { JournalService } from "./journal-service";
import type { JournalEntry } from "./types";

export type MicrofinanceTransactionType =
  | "loan_disbursement"
  | "loan_repayment"
  | "savings_deposit"
  | "savings_withdrawal"
  | "share_purchase";

export interface MicrofinanceTransactionRequest {
  organization_id: string;
  transaction_date: string; // YYYY-MM-DD
  transaction_type: MicrofinanceTransactionType;
  client_id: string;
  loan_id?: string;
  savings_id?: string;
  share_id?: string;
  currency?: string; // Defaults to UGX
  amount: number; // Original amount in transaction currency
  principal_amount?: number; // For repayments
  interest_amount?: number;  // For repayments
  penalty_amount?: number;   // For repayments
  payment_method?: "cash" | "mobile_money" | "bank_transfer" | "pix";
  reference_number?: string;
  notes?: string;
}

export interface MicrofinanceTransactionRecord {
  id: string;
  organization_id: string;
  transaction_date: string;
  transaction_type: MicrofinanceTransactionType;
  client_id: string;
  loan_id?: string;
  savings_id?: string;
  share_id?: string;
  original_currency: string;
  original_amount: number;
  exchange_rate_to_base: number;
  base_currency: string;
  base_amount: number; // In UGX
  payment_method?: string;
  reference_number?: string;
  journal_entry_id: string;
  notes?: string;
  created_at: string;
}

export class TransactionService {
  /**
   * Records a microfinance transaction, automatically mapping foreign currency
   * amounts to UGX and generating an authoritative double-entry journal posting.
   */
  static recordTransaction(
    request: MicrofinanceTransactionRequest,
  ): { transaction: MicrofinanceTransactionRecord; journalEntry: JournalEntry } {
    if (request.amount <= 0) {
      throw new Error("Transaction amount must be a positive number greater than zero.");
    }

    const currency = (request.currency ?? DEFAULT_BASE_CURRENCY).toUpperCase();
    const conversion = CurrencyService.convertToBase(request.amount, currency);
    const nowIso = new Date().toISOString();
    const txId = `mfi-tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    let journalEntry: JournalEntry;

    switch (request.transaction_type) {
      case "loan_disbursement": {
        if (!request.loan_id) {
          throw new Error("loan_id is required for loan_disbursement transactions.");
        }
        journalEntry = JournalService.postLoanDisbursement({
          organizationId: request.organization_id,
          loanId: request.loan_id,
          principalCents: conversion.base_amount,
          description: request.notes ?? `Disbursement for loan #${request.loan_id} (${conversion.base_currency})`,
        });
        break;
      }

      case "loan_repayment": {
        if (!request.loan_id) {
          throw new Error("loan_id is required for loan_repayment transactions.");
        }
        const principal = request.principal_amount
          ? CurrencyService.convertToBase(request.principal_amount, currency).base_amount
          : conversion.base_amount;
        const interest = request.interest_amount
          ? CurrencyService.convertToBase(request.interest_amount, currency).base_amount
          : 0;
        const penalty = request.penalty_amount
          ? CurrencyService.convertToBase(request.penalty_amount, currency).base_amount
          : 0;

        journalEntry = JournalService.postLoanRepayment({
          organizationId: request.organization_id,
          loanId: request.loan_id,
          principalCents: principal,
          interestCents: interest,
          penaltyCents: penalty,
          description: request.notes ?? `Repayment for loan #${request.loan_id} (${conversion.base_currency})`,
        });
        break;
      }

      case "savings_deposit": {
        if (!request.client_id) {
          throw new Error("client_id is required for savings_deposit transactions.");
        }
        journalEntry = JournalService.postSavingsDeposit({
          organizationId: request.organization_id,
          clientId: request.client_id,
          amountCents: conversion.base_amount,
          description: request.notes ?? `Savings deposit for client #${request.client_id}`,
        });
        break;
      }

      case "savings_withdrawal": {
        if (!request.client_id) {
          throw new Error("client_id is required for savings_withdrawal transactions.");
        }
        journalEntry = JournalService.postSavingsWithdrawal({
          organizationId: request.organization_id,
          clientId: request.client_id,
          amountCents: conversion.base_amount,
          description: request.notes ?? `Savings withdrawal for client #${request.client_id}`,
        });
        break;
      }

      case "share_purchase": {
        if (!request.client_id) {
          throw new Error("client_id is required for share_purchase transactions.");
        }
        journalEntry = JournalService.postSharePurchase({
          organizationId: request.organization_id,
          clientId: request.client_id,
          amountCents: conversion.base_amount,
          description: request.notes ?? `Member share purchase for client #${request.client_id}`,
        });
        break;
      }

      default:
        throw new Error(`Unsupported transaction type: ${request.transaction_type}`);
    }

    const transaction: MicrofinanceTransactionRecord = {
      id: txId,
      organization_id: request.organization_id,
      transaction_date: request.transaction_date,
      transaction_type: request.transaction_type,
      client_id: request.client_id,
      loan_id: request.loan_id,
      savings_id: request.savings_id,
      share_id: request.share_id,
      original_currency: conversion.original_currency,
      original_amount: conversion.original_amount,
      exchange_rate_to_base: conversion.exchange_rate,
      base_currency: conversion.base_currency,
      base_amount: conversion.base_amount,
      payment_method: request.payment_method ?? "cash",
      reference_number: request.reference_number,
      journal_entry_id: journalEntry.id,
      notes: request.notes,
      created_at: nowIso,
    };

    return { transaction, journalEntry };
  }
}
