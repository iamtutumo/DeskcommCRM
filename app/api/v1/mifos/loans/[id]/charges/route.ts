/**
 * GET /api/v1/mifos/loans/:id/charges — Retrieves loan fees and penalties from Mifos X.
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
          charges: [
            {
              id: 1,
              chargeId: 10,
              name: "Origination & Processing Fee (UGX)",
              amount: 10000,
              amountPaid: 0,
              amountOutstanding: 10000,
              paid: false,
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
  const charges = await client.getLoanCharges(loanId);
  return ok({ loan_id: loanId, charges }, { requestId });
}
