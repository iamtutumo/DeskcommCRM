/**
 * GET /api/v1/mifos/loans/:id/schedule — Retrieves repayment schedule from Mifos X.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { FineractApiClient } from "@/lib/mifos/api-client";
import { isFineractConfigured } from "@/lib/mifos/config";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const requestId = randomUUID();
  const { id } = await ctx.params;
  const loanId = parseInt(id, 10);

  if (Number.isNaN(loanId) || loanId <= 0) {
    return fail("invalid_request", "Loan ID must be a positive integer.", 400, {
      requestId,
    });
  }

  const authz = await requireRole("agent", { requestId, resource: "mifos" });
  if (!authz.ok) return authz.response;

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return ok(
        {
          loan_id: loanId,
          schedule: {
            loanId,
            currency: { code: "UGX", name: "Uganda Shilling", decimalPlaces: 0 },
            totalPrincipalDisbursed: 500000,
            totalInterestCharged: 50000,
            totalRepaymentExpected: 550000,
            totalOutstanding: 550000,
            periods: [
              {
                period: 1,
                dueDate: [2026, 9, 8],
                principalDue: 100000,
                interestDue: 10000,
                totalDueForPeriod: 110000,
                totalPaidForPeriod: 0,
                totalOutstandingForPeriod: 110000,
                complete: false,
              },
            ],
          },
        },
        { requestId },
      );
    }
    return fail("not_configured", "Mifos integration is not configured.", 503, {
      requestId,
    });
  }

  const client = new FineractApiClient();
  const schedule = await client.getRepaymentSchedule(loanId);
  if (!schedule) {
    return fail("not_found", `Repayment schedule for loan #${loanId} not found.`, 404, {
      requestId,
    });
  }

  return ok({ loan_id: loanId, schedule }, { requestId });
}
