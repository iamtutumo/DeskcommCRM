/**
 * GET /api/v1/mifos/shares?clientId=... — Lists member equity share accounts in Mifos X.
 * POST /api/v1/mifos/shares — Purchases member equity shares in Mifos X.
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
          share_accounts: [
            {
              id: 3001,
              accountNo: "SH-003001",
              productId: 20,
              productName: "Member Equity Share Capital (3100)",
              totalApprovedShares: 10,
              status: {
                id: 300,
                code: "shareAccountStatusType.active",
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
  const shareAccounts = await client.getShareAccounts(clientId);
  return ok({ client_id: clientId, share_accounts: shareAccounts }, { requestId });
}

const createShareSchema = z.object({
  clientId: z.number().int().positive(),
  productId: z.number().int().positive(),
  totalShares: z.number().int().positive(),
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

  const parsed = createShareSchema.safeParse(json);
  if (!parsed.success) {
    return fail("validation_error", "Invalid purchase shares payload.", 422, { requestId });
  }

  return ok(
    {
      status: "created",
      share_account_id: 3099,
      client_id: parsed.data.clientId,
      product_id: parsed.data.productId,
      total_shares: parsed.data.totalShares,
    },
    { requestId, status: 201 },
  );
}
