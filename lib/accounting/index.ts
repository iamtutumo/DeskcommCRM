/**
 * Authoritative Double-Entry Accounting Engine for DeskcommCRM.
 *
 * Implements standard microfinance accounting (chart of accounts, balanced
 * double-entry journal postings, multi-currency conversion to default UGX,
 * unified operational transactions, and standard financial reports) within
 * DeskcommCRM, decoupling ledger accounting from Mifos X sub-ledgers.
 */

export * from "./chart-of-accounts";
export * from "./currency";
export * from "./journal-service";
export * from "./reports";
export * from "./transactions";
export * from "./types";
