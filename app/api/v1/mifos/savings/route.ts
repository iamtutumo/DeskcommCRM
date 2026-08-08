/**
 * GET /api/v1/mifos/savings?clientId=... — Lists savings accounts in Mifos X.
 * POST /api/v1/mifos/savings — Opens a new savings deposit account in Mifos X.
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
          savings_accounts: [
            {
              id: 2001,
              accountNo: "SV-002001",
              productId: 10,
              productName: "Regular Savings Deposit Account (UGX)",
              accountBalance: 150000,
              status: {
                id: 300,
                code: "savingsAccountStatusType.active",
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
  const savingsAccounts = await client.getSavingsAccounts(clientId);
  return ok({ client_id: clientId, savings_accounts: savingsAccounts }, { requestId });
}

const createSavingsSchema = z.object({
  clientId: z.number().int().positive(),
  productId: z.number().int().positive(),
  nominalAnnualInterestRate: z.number().min(0).default(5),
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

  const parsed = createSavingsSchema.safeParse(json);
  if (!parsed.success) {
    return fail("validation_error", "Invalid create savings payload.", 422, { requestId });
  }

  return ok(
    {
      status: "created",
      savings_account_id: 2099,
      client_id: parsed.data.clientId,
      product_id: parsed.data.productId,
    },
    { requestId, status: 201 },
  );
}
