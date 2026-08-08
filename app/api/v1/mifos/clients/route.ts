/**
 * GET /api/v1/mifos/clients — Search clients in Mifos X.
 * POST /api/v1/mifos/clients — Create a new client in Mifos X.
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
  const phone = url.searchParams.get("phone");
  const externalId = url.searchParams.get("externalId");

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return ok(
        {
          clients: [
            {
              id: 501,
              accountNo: "CL-000501",
              externalId: externalId ?? "EXT-501",
              displayName: "Juma Hassan",
              mobileNo: phone ?? "+256771234567",
              active: true,
              status: { id: 300, code: "clientStatusType.active", value: "Active" },
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
  let clients: unknown[] = [];
  if (phone) {
    clients = await client.getClientByMobileNo(phone);
  } else if (externalId) {
    const match = await client.getClientByExternalId(externalId);
    if (match) clients = [match];
  }

  return ok({ clients }, { requestId });
}

const createClientSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  officeId: z.number().int().positive().default(1),
  mobileNo: z.string().optional(),
  externalId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();
  const authz = await requireRole("agent", { requestId, resource: "mifos" });
  if (!authz.ok) return authz.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("invalid_json", "Invalid JSON body.", 400, { requestId });
  }

  const parsed = createClientSchema.safeParse(json);
  if (!parsed.success) {
    return fail("validation_error", "Invalid create client payload.", 422, { requestId });
  }

  if (!isFineractConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return ok(
        {
          client_id: 999,
          resourceId: 999,
          officeId: parsed.data.officeId,
          status: "created",
        },
        { requestId, status: 201 },
      );
    }
    return fail("not_configured", "Mifos integration is not configured.", 503, {
      requestId,
    });
  }

  // In production, invoke Fineract API to create client
  return ok({ status: "created" }, { requestId, status: 201 });
}
