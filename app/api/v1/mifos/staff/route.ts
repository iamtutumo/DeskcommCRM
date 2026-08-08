/**
 * GET /api/v1/mifos/staff?officeId=1 — Lists staff/loan officers from Mifos X.
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

  const url = new URL(req.url);
  const officeIdParam = url.searchParams.get("officeId");
  const officeId = officeIdParam ? parseInt(officeIdParam, 10) : undefined;

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return ok(
        {
          staff: [
            {
              id: 101,
              firstname: "Tutu",
              lastname: "Moses",
              displayName: "Tutu Moses",
              officeId: officeId ?? 1,
              officeName: "Head Office (Kampala)",
              isLoanOfficer: true,
              mobileNo: "+256770000001",
            },
            {
              id: 102,
              firstname: "Sarah",
              lastname: "Namatovu",
              displayName: "Sarah Namatovu",
              officeId: officeId ?? 1,
              officeName: "Head Office (Kampala)",
              isLoanOfficer: true,
              mobileNo: "+256770000002",
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
  const staff = await client.getStaff(officeId);
  return ok({ staff }, { requestId });
}
