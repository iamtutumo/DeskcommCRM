/**
 * GET /api/v1/chatter/:recordType/:recordId
 *
 * Returns the unified record history timeline (or filtered specifically to
 * audit trail entries, chatter messages, activities, emails, or attachments).
 *
 * POST /api/v1/chatter/:recordType/:recordId
 *
 * Allows posting a Chatter message, recording a field audit change, adding an
 * activity, or attaching a document to a business record.
 */

import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { ActivityService } from "@/lib/chatter/activity-service";
import { AttachmentService } from "@/lib/chatter/attachment-service";
import { AuditTrailService } from "@/lib/chatter/audit-trail-service";
import { ChatterService } from "@/lib/chatter/chatter-service";
import {
  type RecordEntityType,
  type UnifiedEntryType,
  type UnifiedRecordHistoryEntry,
} from "@/lib/chatter/types";
import { UnifiedRecordHistoryService } from "@/lib/chatter/unified-history";

export const dynamic = "force-dynamic";

const VALID_RECORD_TYPES = new Set<RecordEntityType>([
  "claim",
  "loan",
  "customer",
  "opportunity",
  "invoice",
  "ticket",
]);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ recordType: string; recordId: string }> },
): Promise<Response> {
  const requestId = randomUUID();
  const { recordType, recordId } = await ctx.params;

  if (!VALID_RECORD_TYPES.has(recordType as RecordEntityType)) {
    return fail(
      "invalid_request",
      `Unsupported record_type '${recordType}'. Must be one of: claim, loan, customer, opportunity, invoice, ticket.`,
      400,
      { requestId },
    );
  }

  const authz = await requireRole("agent", { requestId, resource: "chatter" });
  if (!authz.ok) return authz.response;

  const url = new URL(req.url);
  const filterParam = url.searchParams.get("filter") ?? "all";

  const timeline: UnifiedRecordHistoryEntry[] =
    UnifiedRecordHistoryService.getUnifiedHistory(
      authz.org.orgId,
      recordType as RecordEntityType,
      recordId,
    );

  let filtered = timeline;
  if (filterParam !== "all") {
    filtered = timeline.filter((e) => e.entry_type === filterParam);
  }

  return ok(
    {
      record_type: recordType,
      record_id: recordId,
      filter: filterParam,
      total_count: filtered.length,
      timeline: filtered,
    },
    { requestId },
  );
}

const postBodySchema = z.object({
  action: z.enum([
    "record_audit",
    "post_chatter",
    "create_activity",
    "attach_document",
  ]),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ recordType: string; recordId: string }> },
): Promise<Response> {
  const requestId = randomUUID();
  const { recordType, recordId } = await ctx.params;

  if (!VALID_RECORD_TYPES.has(recordType as RecordEntityType)) {
    return fail("invalid_request", `Unsupported record_type '${recordType}'.`, 400, {
      requestId,
    });
  }

  const authz = await requireRole("agent", { requestId, resource: "chatter" });
  if (!authz.ok) return authz.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("invalid_json", "Invalid JSON payload.", 400, { requestId });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return fail("validation_error", "Invalid body schema.", 422, { requestId });
  }

  const { action, payload } = parsed.data;
  const orgId = authz.org.orgId;
  const rType = recordType as RecordEntityType;

  switch (action) {
    case "record_audit": {
      const fieldName = String(payload["field_name"] ?? "");
      const oldValue =
        payload["old_value"] === undefined ? null : String(payload["old_value"]);
      const newValue =
        payload["new_value"] === undefined ? null : String(payload["new_value"]);

      if (!fieldName) {
        return fail("missing_param", "field_name is required.", 400, { requestId });
      }

      const auditEntry = AuditTrailService.recordFieldChange({
        organization_id: orgId,
        record_type: rType,
        record_id: recordId,
        changed_by_user_id: authz.user.id,
        changed_by_name: authz.user.email ?? "Admin",
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
      });

      UnifiedRecordHistoryService.addAuditEntry(auditEntry);
      return ok({ action, audit_entry: auditEntry }, { requestId, status: 201 });
    }

    case "post_chatter": {
      const content = String(payload["content"] ?? "");
      if (!content.trim()) {
        return fail("missing_param", "content is required.", 400, { requestId });
      }

      const res = ChatterService.postMessage({
        organization_id: orgId,
        record_type: rType,
        record_id: recordId,
        author_id: authz.user.id,
        author_name: authz.user.email ?? "Agent",
        message_type: "note",
        content,
      });

      return ok({ action, chatter: res }, { requestId, status: 201 });
    }

    case "create_activity": {
      const activityType = String(payload["activity_type"] ?? "todo") as any;
      const summary = String(payload["summary"] ?? "");
      const assignedToId = String(payload["assigned_to_user_id"] ?? authz.user.id);
      const assignedToName = String(
        payload["assigned_to_name"] ?? authz.user.email ?? "User",
      );
      const dueDate = String(payload["due_date"] ?? "2026-08-10");

      if (!summary.trim()) {
        return fail("missing_param", "summary is required.", 400, { requestId });
      }

      const act = ActivityService.createActivity({
        organization_id: orgId,
        record_type: rType,
        record_id: recordId,
        activity_type: activityType,
        summary,
        assigned_to_user_id: assignedToId,
        assigned_to_name: assignedToName,
        due_date: dueDate,
      });

      return ok({ action, activity: act }, { requestId, status: 201 });
    }

    case "attach_document": {
      const fileName = String(payload["file_name"] ?? "Document.pdf");
      const fileSize = Number(payload["file_size"] ?? 10240);
      const mimeType = String(payload["mime_type"] ?? "application/pdf");
      const storagePath = String(
        payload["storage_path"] ?? `records/${recordId}/${fileName}`,
      );

      const att = AttachmentService.attachDocument({
        organization_id: orgId,
        record_type: rType,
        record_id: recordId,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        storage_path: storagePath,
        uploaded_by_user_id: authz.user.id,
        uploaded_by_name: authz.user.email ?? "User",
      });

      return ok({ action, attachment: att }, { requestId, status: 201 });
    }

    default:
      return fail("invalid_request", `Unknown action '${action}'.`, 400, {
        requestId,
      });
  }
}
