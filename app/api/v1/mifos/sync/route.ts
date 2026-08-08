/**
 * POST /api/v1/mifos/sync — Triggers a comprehensive bidirectional synchronization
 * of reference catalogs and active accounts between Mifos X and DeskcommCRM.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { MifosSyncService } from "@/lib/mifos/sync-service";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  const requestId = randomUUID();
  const authz = await requireRole("manager", { requestId, resource: "mifos_sync" });
  if (!authz.ok) return authz.response;

  try {
    const res = await MifosSyncService.runFullSync(authz.org.orgId);
    return ok({ sync_report: res }, { requestId, status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail("sync_error", msg, 500, { requestId });
  }
}
