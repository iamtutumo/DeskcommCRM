---
title: Technical Specification 18 — Apache Fineract / Mifos X (Microfinance Integration v0.5)
parent: 07-prd-mifos-microfinance.md
depends_on: 01-spec-platform-base.md, 03-spec-whatsapp-waha.md, 06-spec-nuvemshop-lgpd.md, 11-spec-mcp-server-internal.md
version: 0.5
status: in review
date: 2026-08-08
owner: Tutu Moses (iamtutumo) & Open Source Community
referencia_arquitetural: VISION.md
business_rules: M-01, M-02, M-03, M-04, M-05, M-06, M-07, M-08, M-09, M-10, M-11, M-12, M-13, M-14, M-15, M-16, M-17
---

# Technical Specification 18 — Apache Fineract / Mifos X (Microfinance Integration v0.5)

> Technical specification for Sub-PRD 07 (v0.5). Defines the 11 reference catalog and account cache tables (`mifos_branches`, `mifos_staff`, `mifos_loan_products`, `mifos_savings_products`, `mifos_share_products`, `mifos_clients`, `mifos_loan_accounts`, `mifos_savings_accounts`, `mifos_share_accounts`, `mifos_loan_charges`, `mifos_repayment_schedules`), 10 REST API endpoints in `app/api/v1/mifos/`, authoritative double-entry accounting in UGX (`lib/accounting/`), Evolution API WhatsApp engine (`lib/evolution/`), Standard SMTP transactional email (`lib/email/smtp.ts`), multi-lingual event communication templates (`lib/mifos/templates/communication-templates.ts`), and 12 internal MCP tools in `lib/mcp/tools/mifos.ts`.
>
> Architectural Owner: **Tutu Moses (iamtutumo)**

---

## 1. Overview & Architecture

### 1.1 Component Diagram

```
┌─────────────────────────┐          ┌───────────────────────────────────┐
│ Apache Fineract / Mifos │◄────────►│ MifosApiClient & SyncService        │
│ (Loan & Savings Sub-    │ REST/JSON│ (headers: tenantid + basic/token) │
│  Ledger Engine Only)    │          └─────────────────┬─────────────────┘
└─────────────────────────┘                            │
                                                       ▼
┌─────────────────────────┐          ┌───────────────────────────────────┐
│ DeskcommCRM General     │◄────────►│ 11 Caching Tables & REST API      │
│ Ledger (GL) Accounting  │ Balanced │ (/api/v1/mifos/offices, staff,    │
│ Authoritative Engine    │ Entries  │  products, loans, savings, sync)  │
└─────────────────────────┘          └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────┐          ┌───────────────────────────────────┐
│ Evolution API WhatsApp  │          │ Standard SMTP Email Engine        │
│ Transport Engine        │          │ (lib/email/smtp.ts)               │
│ (lib/evolution/)        │          └───────────────────────────────────┘
└─────────────────────────┘
```

---

## 2. Business Rules & Invariants

* **M-01 (Mandatory Tenant Header Isolation):** Every HTTP request to the Apache Fineract API **must** include the mandatory `fineract-platform-tenantid` header configured for the tenant.
* **M-02 (Origination Permission Guard):** Creating loan applications (`mifos_create_loan_application`) via MCP is only permitted if the organization explicitly enables autonomous origination; otherwise, the AI agent prepares a draft application and requests human approval.
* **M-03 (Multi-Niche Vocabulary):** Pipelines linked to the microfinance integration operate with canonical vocabulary where `deal` = `"Loan"` and `lead` = `"Borrower"`.
* **M-04 (PII Sanitization):** National identification numbers (CPF/ID) collected in chat must be masked in application logs and adhere to organization retention policies.
* **M-05 (Redundancy and Timeout Guard):** MCP queries for balances and schedules that exceed the timeout (8000ms) must return a typed error and instruct the AI agent to inform the borrower that the banking system is processing.
* **M-06 (Arrears State Sync):** When a `LOAN_REPAYMENT_OVERDUE` webhook is received, the corresponding card in `crm_leads` is promoted to the matching risk state (`risk_state`).
* **M-07 (E.164 Phone Normalization):** Client search `mifos_get_client` prioritizes clean numeric matching to correlate WhatsApp contacts with `mobileNo` records in Fineract.
* **M-08 (Simulation Audit):** Loan simulations executed by `mifos_simulate_loan_schedule` generate an activity event (`simulation_performed`) in the lead timeline (`crm_lead_activities`).
* **M-09 (Authoritative Double-Entry Accounting in DeskcommCRM):** DeskcommCRM is the authoritative General Ledger (GL) and Financial Accounting System. Every financial event posts a balanced double-entry journal entry (`accounting_journal_entries` and `accounting_journal_lines`), validating that `sum(debit_cents) === sum(credit_cents)`. Mifos X is used purely as the sub-ledger for loan tracking and savings tracking.
* **M-10 (Document Generation & Storage):** PDF loan agreements, promissory notes, and amortization schedules generated via `@react-pdf/renderer` are stored in Supabase Storage (`mifos-documents`) and delivered via signed URLs over WhatsApp or Email.
* **M-11 (Evolution API WhatsApp Transport):** The WhatsApp communication channel is powered by `EvolutionApiClient` (`lib/evolution/`), supporting text messages and PDF attachment deliveries over Evolution API v2+ instances.
* **M-12 (Standard SMTP Transactional Email):** Email communication is delivered via standard SMTP (`lib/email/smtp.ts`), supporting custom mail servers via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_SECURE`.
* **M-13 (Multi-Lingual Communication Templates):** Event communications across 7 lending events use localized templates (`en`, `es`, `pt`, `sw`) formatted for both WhatsApp and Email.
* **M-14 (UGX Default Base Currency & Exchange Conversion):** The system base currency defaults to **UGX (Uganda Shillings)**. All foreign currency transactions (USD, KES, EUR, GBP) are automatically converted into UGX base units using `CurrencyService` (`lib/accounting/currency.ts`).
* **M-15 (Unified Operational Transactions Table):** Operational financial transactions (repayments, savings deposits, withdrawals, share purchases, disbursements) are recorded in `microfinance_transactions`. Recording a transaction automatically triggers a balanced double-entry journal entry linked via `journal_entry_id`.
* **M-16 (Standard Accounting Reporting Equation):** `AccountingReportService` (`lib/accounting/reports.ts`) generates authoritative Trial Balance, Balance Sheet (`Assets === Liabilities + Equity + Net Income`), Income Statement (`Net Income = Revenue - Expenses`), and General Ledger Cards.
* **M-17 (Bidirectional Sync & Reference Catalog Integrity):** `MifosSyncService` periodically synchronizes branches (`mifos_branches`), staff (`mifos_staff`), financial products (`mifos_loan_products`, `mifos_savings_products`, `mifos_share_products`), active accounts (`mifos_clients`, `mifos_loan_accounts`, `mifos_savings_accounts`, `mifos_share_accounts`), fee charges (`mifos_loan_charges`), and repayment schedules (`mifos_repayment_schedules`) between Mifos X and DeskcommCRM. Creating a loan in DeskcommCRM automatically triggers a sync of repayment details back into local cache.

---

## 3. Data Model (`supabase/migrations/`)

1. **Reference Catalog Cache Tables (Migration 0136):**
   * `mifos_branches`: Stores branch/office details from Mifos X (`fineract_office_id`, `name`, `external_id`).
   * `mifos_staff`: Stores loan officer and staff details (`fineract_staff_id`, `display_name`, `office_id`).
   * `mifos_loan_products`: Stores loan product terms (`min_principal`, `max_principal`, `interest_rate_per_period`).
   * `mifos_savings_products`: Stores savings product interest rates and opening balance requirements.
   * `mifos_share_products`: Stores share equity product unit prices (`3100 - Member Share Capital`).
2. **Client & Account Cache Tables (Migrations 0131 & 0136):**
   * `mifos_clients`: Stores Fineract client profiles (`fineract_client_id`, `display_name`, `mobile_no`).
   * `mifos_loan_accounts`: Stores active/pending loan balances and arrears flags.
   * `mifos_savings_accounts`: Stores customer savings deposit balances.
   * `mifos_share_accounts`: Stores member approved equity share capital.
   * `mifos_loan_charges`: Stores processing fees, late penalties, and billing breakdown.
   * `mifos_repayment_schedules`: Stores amortized repayment schedule due dates and installment breakdowns.
* All 11 tables enforce organization-level Row Level Security (`organization_id = ANY (fn_user_org_ids())`).

---

## 4. REST API Endpoints (`app/api/v1/mifos/`)

1. `GET /api/v1/mifos/offices` — List synced branches/offices.
2. `GET /api/v1/mifos/staff?officeId=1` — List staff members/loan officers.
3. `GET /api/v1/mifos/products/:type` — List products by type (`loans`, `savings`, `shares`).
4. `GET /api/v1/mifos/clients` & `POST /api/v1/mifos/clients` — Search or create clients.
5. `GET /api/v1/mifos/loans` & `POST /api/v1/mifos/loans` — List or originate loans (auto-syncs repayment schedule).
6. `GET /api/v1/mifos/savings` & `POST /api/v1/mifos/savings` — List or open savings accounts.
7. `GET /api/v1/mifos/shares` & `POST /api/v1/mifos/shares` — List or purchase share accounts.
8. `GET /api/v1/mifos/loans/:id/schedule` — Retrieve repayment schedules.
9. `GET /api/v1/mifos/loans/:id/charges` — Retrieve loan fee charges.
10. `POST /api/v1/mifos/sync` — Trigger immediate bidirectional synchronization.
