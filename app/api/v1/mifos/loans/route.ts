/**
 * GET /api/v1/mifos/loans?clientId=... — Lists loans for a client in Mifos X.
 * POST /api/v1/mifos/loans — Creates a loan application in Mifos X and syncs repayment details back.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { FineractApiClient } from "@/lib/mifos/api-client";
import { isFineractConfigured } from "@/lib/mifos/config";
import { MifosSyncService } from "@/lib/mifos/sync-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();
  const authz = await requireRole("agent", { requestId, resource: "mifos" });
  if (!authz.ok) return authz.response;

  const url = new URL(req.url);
  const clientIdParam = url.searchParams.get("clientId");
  const clientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

  if (!clientId || Number.isNaN(clientId)) {
    return fail("missing_param", "clientId query parameter is required.", 400, {
      requestId,
    });
  }

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return ok(
        {
          client_id: clientId,
          loans: [
            {
              id: 1001,
              accountNo: "LN-001001",
              productId: 1,
              productName: "Standard Microbusiness Loan (UGX)",
              principal: 500000,
              status: {
                id: 300,
                code: "loanStatusType.active",
                value: "Active",
                active: true,
              },
            },
          ],
        },
        { requestId },
      );
    }
    return fail("not_configured", "Mifos integration is not configured.", 503, {
      requestId,
    });
  }

  const client = new FineractApiClient();
  const loans = await client.getLoanAccounts(clientId);
  return ok({ client_id: clientId, loans }, { requestId });
}

const createLoanSchema = z.object({
  clientId: z.number().int().positive(),
  productId: z.number().int().positive(),
  principal: z.number().positive(),
  numberOfRepayments: z.number().int().positive(),
  interestRatePerPeriod: z.number().min(0),
});

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();
  const authz = await requireRole("manager", { requestId, resource: "mifos" });
  if (!authz.ok) return authz.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("invalid_json", "Invalid JSON body.", 400, { requestId });
  }

  const parsed = createLoanSchema.safeParse(json);
  if (!parsed.success) {
    return fail("validation_error", "Invalid create loan payload.", 422, { requestId });
  }

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // Simulate loan application creation and trigger local schedule sync
      const mockLoanId = 8888;
      const sim = new FineractApiClient({
        baseUrl: "https://simulation.local",
        tenantId: "default",
      }).simulateLoanSchedule({
        principal: parsed.data.principal,
        numberOfRepayments: parsed.data.numberOfRepayments,
        interestRatePerPeriod: parsed.data.interestRatePerPeriod,
      });

      return ok(
        {
          status: "created",
          loan_id: mockLoanId,
          resourceId: mockLoanId,
          synced_repayment_details: {
            principal: sim.principal,
            total_interest: sim.totalInterest,
            total_repayment_expected: sim.totalRepaymentExpected,
            installment_amount: sim.estimatedInstallmentAmount,
            currency: "UGX",
          },
        },
        { requestId, status: 201 },
      );
    }
    return fail("not_configured", "Mifos integration is not configured.", 503, {
      requestId,
    });
  }

  const client = new FineractApiClient();
  const today = new Date().toISOString().split("T")[0] ?? "2026-08-08";
  const created = await client.createLoanApplication({
    clientId: parsed.data.clientId,
    productId: parsed.data.productId,
    principal: parsed.data.principal,
    loanTermFrequency: parsed.data.numberOfRepayments,
    loanTermFrequencyType: 2,
    numberOfRepayments: parsed.data.numberOfRepayments,
    repaymentEvery: 1,
    repaymentFrequencyType: 2,
    interestRatePerPeriod: parsed.data.interestRatePerPeriod,
    amortizationType: 1,
    interestType: 0,
    interestCalculationPeriodType: 1,
    transactionProcessingStrategyCode: "mifos-standard-strategy",
    expectedDisbursementDate: today,
    submittedOnDate: today,
    dateFormat: "yyyy-MM-dd",
  });

  // Automatically sync repayment schedule back from Mifos X
  await MifosSyncService.syncClientAccounts(authz.org.orgId, parsed.data.clientId);

  return ok({ status: "created", loanApplication: created }, { requestId, status: 201 });
}
