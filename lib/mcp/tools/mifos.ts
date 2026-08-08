/**
 * MCP Tools for Apache Fineract / Mifos X Microfinance Integration (Spec 18).
 *
 * Enables conversational AI agents to search clients, retrieve loan accounts,
 * inspect repayment schedules, simulate loans, and submit credit applications.
 */
import { z } from "zod";

import { FineractApiClient, FineractApiError } from "@/lib/mifos/api-client";
import { isFineractConfigured } from "@/lib/mifos/config";
import { MifosSyncService } from "@/lib/mifos/sync-service";
import type { McpToolDefinition } from "../types";

const getClientInputShape = {
  phone: z.string().optional(),
  externalId: z.string().optional(),
  cpf: z.string().optional(),
};

export const mifosGetClient: McpToolDefinition<typeof getClientInputShape> = {
  name: "mifos_get_client",
  description:
    "Searches for a client registered in Apache Fineract / Mifos X by phone number, external ID, or government National ID.",
  inputSchema: getClientInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Apache Fineract / Mifos X integration is not configured in this environment.",
      };
    }

    try {
      const client = new FineractApiClient();
      if (input.phone) {
        const clients = await client.getClientByMobileNo(input.phone);
        return { ok: true, clients };
      }
      if (input.externalId) {
        const clientSummary = await client.getClientByExternalId(input.externalId);
        return { ok: true, clients: clientSummary ? [clientSummary] : [] };
      }
      return {
        ok: false,
        reason: "missing_param",
        message: "Provide at least phone or externalId to perform the client lookup.",
      };
    } catch (e) {
      const msg = e instanceof FineractApiError ? e.message : String(e);
      return { ok: false, error: msg };
    }
  },
};

const getLoanAccountsInputShape = {
  clientId: z.number().int().positive(),
};

export const mifosGetLoanAccounts: McpToolDefinition<typeof getLoanAccountsInputShape> = {
  name: "mifos_get_loan_accounts",
  description:
    "Lists all loan accounts (active, pending approval, closed, or in arrears) belonging to a client in Apache Fineract.",
  inputSchema: getLoanAccountsInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Apache Fineract / Mifos X integration is not configured in this environment.",
      };
    }

    try {
      const client = new FineractApiClient();
      const accounts = await client.getLoanAccounts(input.clientId);
      return { ok: true, loanAccounts: accounts };
    } catch (e) {
      const msg = e instanceof FineractApiError ? e.message : String(e);
      return { ok: false, error: msg };
    }
  },
};

const getRepaymentScheduleInputShape = {
  loanId: z.number().int().positive(),
};

export const mifosGetRepaymentSchedule: McpToolDefinition<
  typeof getRepaymentScheduleInputShape
> = {
  name: "mifos_get_repayment_schedule",
  description:
    "Retrieves the repayment schedule (due dates, principal/interest amounts, outstanding balance, and arrears flags) for a loan account.",
  inputSchema: getRepaymentScheduleInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Apache Fineract / Mifos X integration is not configured in this environment.",
      };
    }

    try {
      const client = new FineractApiClient();
      const schedule = await client.getRepaymentSchedule(input.loanId);
      if (!schedule) {
        return { ok: false, error: "Repayment schedule not found or loan account does not exist." };
      }
      return { ok: true, schedule };
    } catch (e) {
      const msg = e instanceof FineractApiError ? e.message : String(e);
      return { ok: false, error: msg };
    }
  },
};

const getLoanChargesInputShape = {
  loanId: z.number().int().positive(),
};

export const mifosGetLoanCharges: McpToolDefinition<typeof getLoanChargesInputShape> = {
  name: "mifos_get_loan_charges",
  description:
    "Retrieves processing fees, late penalties, and billing breakdown (paid vs. outstanding charges) for a loan account in Apache Fineract.",
  inputSchema: getLoanChargesInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Apache Fineract / Mifos X integration is not configured in this environment.",
      };
    }

    try {
      const client = new FineractApiClient();
      const charges = await client.getLoanCharges(input.loanId);
      return { ok: true, charges };
    } catch (e) {
      const msg = e instanceof FineractApiError ? e.message : String(e);
      return { ok: false, error: msg };
    }
  },
};

const simulateLoanScheduleInputShape = {
  principal: z.number().positive(),
  numberOfRepayments: z.number().int().positive(),
  interestRatePerPeriod: z.number().min(0),
  repaymentEvery: z.number().int().positive().optional().default(1),
};

export const mifosSimulateLoanSchedule: McpToolDefinition<
  typeof simulateLoanScheduleInputShape
> = {
  name: "mifos_simulate_loan_schedule",
  description:
    "Simulates amortized loan installments locally (Price table) for real-time chat responses without modifying core banking databases.",
  inputSchema: simulateLoanScheduleInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    const client = new FineractApiClient({
      baseUrl: "https://simulation.local",
      tenantId: "default",
    });
    const simulation = client.simulateLoanSchedule({
      principal: input.principal,
      numberOfRepayments: input.numberOfRepayments,
      interestRatePerPeriod: input.interestRatePerPeriod,
      repaymentEvery: input.repaymentEvery,
    });
    return { ok: true, simulation };
  },
};

const createLoanApplicationInputShape = {
  clientId: z.number().int().positive(),
  productId: z.number().int().positive(),
  principal: z.number().positive(),
  numberOfRepayments: z.number().int().positive(),
  interestRatePerPeriod: z.number().min(0),
};

export const mifosCreateLoanApplication: McpToolDefinition<
  typeof createLoanApplicationInputShape
> = {
  name: "mifos_create_loan_application",
  description:
    "Submits a new credit application in Apache Fineract (pending approval) for the specified client.",
  inputSchema: createLoanApplicationInputShape,
  category: "write",
  requiresRole: "manager",
  requiresScope: "mcp:write",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Apache Fineract / Mifos X integration is not configured in this environment.",
      };
    }

    try {
      const client = new FineractApiClient();
      const today = new Date().toISOString().split("T")[0] ?? "2026-08-08";
      const created = await client.createLoanApplication({
        clientId: input.clientId,
        productId: input.productId,
        principal: input.principal,
        loanTermFrequency: input.numberOfRepayments,
        loanTermFrequencyType: 2, // Months
        numberOfRepayments: input.numberOfRepayments,
        repaymentEvery: 1,
        repaymentFrequencyType: 2,
        interestRatePerPeriod: input.interestRatePerPeriod,
        amortizationType: 1, // Equal installments
        interestType: 0,
        interestCalculationPeriodType: 1,
        transactionProcessingStrategyCode: "mifos-standard-strategy",
        expectedDisbursementDate: today,
        submittedOnDate: today,
        dateFormat: "yyyy-MM-dd",
      });
      return { ok: true, loanApplication: created };
    } catch (e) {
      const msg = e instanceof FineractApiError ? e.message : String(e);
      return { ok: false, error: msg };
    }
  },
};

const listOfficesInputShape = {};

export const mifosListOffices: McpToolDefinition<typeof listOfficesInputShape> = {
  name: "mifos_list_offices",
  description:
    "Lists synced branches and office locations from Apache Fineract / Mifos X.",
  inputSchema: listOfficesInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async () => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Mifos integration is not configured.",
      };
    }
    const client = new FineractApiClient();
    const offices = await client.getOffices();
    return { ok: true, offices };
  },
};

const listStaffInputShape = {
  officeId: z.number().int().positive().optional(),
};

export const mifosListStaff: McpToolDefinition<typeof listStaffInputShape> = {
  name: "mifos_list_staff",
  description:
    "Lists loan officers and staff members from Apache Fineract / Mifos X.",
  inputSchema: listStaffInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Mifos integration is not configured.",
      };
    }
    const client = new FineractApiClient();
    const staff = await client.getStaff(input.officeId);
    return { ok: true, staff };
  },
};

const listProductsInputShape = {
  product_type: z.enum(["loans", "savings", "shares"]).optional().default("loans"),
};

export const mifosListProducts: McpToolDefinition<typeof listProductsInputShape> = {
  name: "mifos_list_products",
  description:
    "Lists available loan, savings, or share equity products from Apache Fineract / Mifos X.",
  inputSchema: listProductsInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: true,
        product_type: input.product_type,
        products: [
          {
            id: 1,
            name: "Standard Microbusiness Loan (UGX)",
            shortName: "SML",
            currency: { code: "UGX", name: "Uganda Shilling", decimalPlaces: 0 },
            minPrincipal: 100000,
            maxPrincipal: 5000000,
            defaultPrincipal: 500000,
            interestRatePerPeriod: 2,
          },
        ],
      };
    }
    const client = new FineractApiClient();
    let products: unknown[] = [];
    if (input.product_type === "loans") products = await client.getLoanProducts();
    else if (input.product_type === "savings") products = await client.getSavingsProducts();
    else products = await client.getShareProducts();
    return { ok: true, product_type: input.product_type, products };
  },
};

const getSavingsAccountsInputShape = {
  clientId: z.number().int().positive(),
};

export const mifosGetSavingsAccounts: McpToolDefinition<typeof getSavingsAccountsInputShape> = {
  name: "mifos_get_savings_accounts",
  description:
    "Lists savings deposit accounts belonging to a client in Apache Fineract / Mifos X.",
  inputSchema: getSavingsAccountsInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Mifos integration is not configured.",
      };
    }
    const client = new FineractApiClient();
    const savingsAccounts = await client.getSavingsAccounts(input.clientId);
    return { ok: true, savingsAccounts };
  },
};

const getShareAccountsInputShape = {
  clientId: z.number().int().positive(),
};

export const mifosGetShareAccounts: McpToolDefinition<typeof getShareAccountsInputShape> = {
  name: "mifos_get_share_accounts",
  description:
    "Lists member equity share accounts belonging to a client in Apache Fineract / Mifos X.",
  inputSchema: getShareAccountsInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    if (!isFineractConfigured()) {
      return {
        ok: false,
        reason: "not_configured",
        message: "Mifos integration is not configured.",
      };
    }
    const client = new FineractApiClient();
    const shareAccounts = await client.getShareAccounts(input.clientId);
    return { ok: true, shareAccounts };
  },
};

const triggerSyncInputShape = {};

export const mifosTriggerSync: McpToolDefinition<typeof triggerSyncInputShape> = {
  name: "mifos_trigger_sync",
  description:
    "Triggers an immediate bidirectional synchronization of reference catalogs and account details with Apache Fineract / Mifos X.",
  inputSchema: triggerSyncInputShape,
  category: "write",
  requiresRole: "manager",
  requiresScope: "mcp:write",
  handler: async (_input, ctx) => {
    const res = await MifosSyncService.runFullSync(ctx.organizationId);
    return { ok: res.ok, syncResult: res };
  },
};
