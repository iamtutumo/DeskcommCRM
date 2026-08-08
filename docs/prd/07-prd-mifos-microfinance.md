---
title: Sub-PRD 07 — Apache Fineract / Mifos X Microfinance Integration (v0.5)
parent: 00-prd-master.md
depends_on: 01-prd-platform-base.md, 02-prd-customer-360.md, 04-prd-pipeline-attendance.md, 05-prd-ai-rag-handoff.md
version: 0.5
status: in review
date: 2026-08-08
owner: Tutu Moses (iamtutumo) & Open Source Community
referencia_arquitetural: VISION.md
---

# Sub-PRD 07 — Apache Fineract / Mifos X Microfinance Integration (v0.5)

> Domain layer connecting DeskcommCRM to microfinance institutions (MFIs), credit cooperatives, and fintechs running on **Apache Fineract / Mifos X**. Explains why monolithic ERPs like Odoo fail when aligning with Mifos: Odoo models sales orders (`sale.order`), inventory quotes, and invoices (`account.move`), which are incompatible with microfinance workflows.
>
> **v0.5 Architectural Highlights:**
> - **Complete Reference Catalogs & Account Cache Tables:** Caching Branches/Offices (`mifos_branches`), Loan Officers/Staff (`mifos_staff`), Loan/Savings/Share Products (`mifos_loan_products`, `mifos_savings_products`, `mifos_share_products`), Savings Accounts (`mifos_savings_accounts`), Share Equity Accounts (`mifos_share_accounts`), Fee Charges (`mifos_loan_charges`), and Amortization Schedules (`mifos_repayment_schedules`).
> - **Exposed REST API Suite (`app/api/v1/mifos/`):** 10 dedicated REST API endpoints for branches, staff, products, clients, loans, savings, shares, schedules, charges, and full synchronization.
> - **Authoritative Bidirectional Sync Engine (`MifosSyncService`):** Periodic and real-time synchronization between DeskcommCRM and Apache Fineract.
> - **Flexible Currency & Exchange Rates (Default: UGX - Uganda Shillings)**.
> - **Unified Operational Transactions Table (`microfinance_transactions`)** with automatic double-entry GL postings (`lib/accounting/`).
> - **WhatsApp via Evolution API (`lib/evolution/`)** & **Transactional Email via Standard SMTP (`lib/email/smtp.ts`)**.
> - **Multi-Lingual Event Communication Templates (`lib/mifos/templates/communication-templates.ts`)** in English (`en`), Spanish (`es`), Portuguese (`pt`), and Swahili (`sw`).

---

## 1. Context & Positioning: Why Odoo Fails and DeskcommCRM Aligns

Many microfinance institutions attempt to adapt generic ERPs (such as Odoo 17) to integrate with Apache Fineract / Mifos X. This approach often fails due to structural alignment mismatches:

1. **Domain Model Incompatibility (ERP vs. Core Banking):**
   * In Odoo, the sales pipeline is rigidly built around Quote → Sales Order → Sales Invoice → Inventory (`ResPartner`, `SaleOrder`, `Invoice`).
   * In Apache Fineract (Mifos), the canonical entities are **Clients / Groups / Centers**, **Loan Accounts (`Loan Accounts`)**, **Repayment Schedules (`Repayment Schedules`)**, **Amortization Tables**, and **Arrears Management (`Arrears`)**. Forcing loan applications into "sales order line items" breaks accounting reconciliation and confuses loan officers.

2. **Non-Conversational Onboarding & Servicing:**
   * In Latin America, Africa (including East Africa and Uganda), and Southeast Asia, microfinance borrowers interact primarily through **WhatsApp**. Borrowers want to simulate loan installments, submit identity documents (KYC photo uploads), check outstanding balances, and renegotiate overdue payments in a continuous conversation.
   * Odoo is not designed for 24/7 WhatsApp-native conversational AI agents.

3. **Native Multi-Niche Architecture via DeskcommCRM (`AI Sales OS`):**
   * DeskcommCRM decouples CRM communication from core banking sub-ledgers. Through **per-pipeline vocabulary (`vocabulary`)**, the kanban board is instantly reconfigured from E-commerce ("Customer", "Order", "Paid") to Microfinance ("Borrower", "Loan", "Disbursed", "Rejected").
   * The AI agent queries credit policies from the tenant's RAG knowledge base (`pgvector`), executes core banking actions via **MCP Tools (`mifos_get_client`, `mifos_get_loan_accounts`, `mifos_create_loan_application`, `mifos_get_loan_charges`)**, and escalates to a human credit officer with an audited history when risk thresholds or policy rules are triggered.

---

## 2. Bidirectional Core Banking Synchronization (`MifosSyncService`)

To operate effectively as an AI Sales OS, DeskcommCRM must have immediate local access to core banking reference catalogs and account statuses without waiting for slow round-trip external API calls during customer chats:

### 2.1 Reference Catalog Sync (Mifos X → DeskcommCRM)
* **Branches / Offices (`mifos_branches`):** Synced from `/fineract-provider/api/v1/offices`. Loan officers select the borrower's branch during CRM onboarding.
* **Staff / Loan Officers (`mifos_staff`):** Synced from `/fineract-provider/api/v1/staff`. Enables mapping CRM team members to official Fineract loan officers.
* **Financial Products (`mifos_loan_products`, `mifos_savings_products`, `mifos_share_products`):** Synced from `/loanproducts`, `/savingsproducts`, and `/shareproducts`. Displays accurate interest rates, currencies, and principal limits in CRM forms and AI agent prompts.

### 2.2 Account & Repayment Schedule Sync (DeskcommCRM ⇄ Mifos X)
* **Outbound Origination:** Creating a client, loan application, savings account, or share account in DeskcommCRM calls `FineractApiClient`, originating the account in Mifos X.
* **Inbound Repayment & Charge Sync:** When a loan is created or an installment is paid, `MifosSyncService.syncClientAccounts()` syncs the loan's **repayment schedule (`mifos_repayment_schedules`)** and **fee charges (`mifos_loan_charges`)** back into DeskcommCRM so the AI agent can answer installment due date inquiries instantly.

---

## 3. Exposed REST API Suite (`app/api/v1/mifos/`)

DeskcommCRM exposes 10 authenticated REST API endpoints under `/api/v1/mifos/` for external integrations and frontend CRM panels:
1. `GET /api/v1/mifos/offices` — Lists synced branches/offices.
2. `GET /api/v1/mifos/staff` — Lists staff members and loan officers.
3. `GET /api/v1/mifos/products/:type` — Lists products by type (`loans`, `savings`, `shares`).
4. `GET /api/v1/mifos/clients` & `POST /api/v1/mifos/clients` — Search or create clients.
5. `GET /api/v1/mifos/loans` & `POST /api/v1/mifos/loans` — List or originate loans.
6. `GET /api/v1/mifos/savings` & `POST /api/v1/mifos/savings` — List or open savings accounts.
7. `GET /api/v1/mifos/shares` & `POST /api/v1/mifos/shares` — List or purchase share accounts.
8. `GET /api/v1/mifos/loans/:id/schedule` — Retrieve repayment schedules.
9. `GET /api/v1/mifos/loans/:id/charges` — Retrieve loan fee charges and penalties.
10. `POST /api/v1/mifos/sync` — Triggers an on-demand full synchronization.

---

## 4. Success Metrics

* <100ms local query latency for branches, staff, products, and loan schedules due to local caching.
* 100% data parity between Mifos X repayment schedules and DeskcommCRM local cache.
* Complete API coverage across all 10 microfinance lending and savings endpoints.
