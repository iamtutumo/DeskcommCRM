/**
 * GET /api/v1/mifos/products/:type — Lists loan, savings, or share products from Mifos X.
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
  ctx: { params: Promise<{ type: string }> },
): Promise<Response> {
  const requestId = randomUUID();
  const { type } = await ctx.params;

  if (!["loans", "savings", "shares"].includes(type)) {
    return fail(
      "invalid_request",
      "Product type must be one of: loans, savings, shares.",
      400,
      { requestId },
    );
  }

  const authz = await requireRole("agent", { requestId, resource: "mifos" });
  if (!authz.ok) return authz.response;

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      const mockProducts =
        type === "loans"
          ? [
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
            ]
          : type === "savings"
            ? [
                {
                  id: 10,
                  name: "Regular Savings Deposit Account (UGX)",
                  shortName: "RSA",
                  currency: { code: "UGX", name: "Uganda Shilling", decimalPlaces: 0 },
                  nominalAnnualInterestRate: 5,
                },
              ]
            : [
                {
                  id: 20,
                  name: "Member Equity Share Capital (3100)",
                  shortName: "MSC",
                  currency: { code: "UGX", name: "Uganda Shilling", decimalPlaces: 0 },
                  unitPrice: 100000,
                },
              ];
      return ok({ product_type: type, products: mockProducts }, { requestId });
    }
    return fail("not_configured", "Mifos integration is not configured.", 503, {
      requestId,
    });
  }

  const client = new FineractApiClient();
  let products: unknown[] = [];
  if (type === "loans") products = await client.getLoanProducts();
  else if (type === "savings") products = await client.getSavingsProducts();
  else if (type === "shares") products = await client.getShareProducts();

  return ok({ product_type: type, products }, { requestId });
}
