/**
 * GET /api/v1/mifos/offices — Lists synced branches/offices from Mifos X.
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

export async function GET(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();
  const authz = await requireRole("agent", { requestId, resource: "mifos" });
  if (!authz.ok) return authz.response;

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return ok(
        {
          offices: [
            { id: 1, name: "Head Office (Kampala)", externalId: "OFF-HQ-01" },
            { id: 2, name: "Central Region Branch", externalId: "OFF-CR-02" },
            { id: 3, name: "Jinja Road Agency", externalId: "OFF-JR-03" },
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
  const offices = await client.getOffices();
  return ok({ offices }, { requestId });
}
