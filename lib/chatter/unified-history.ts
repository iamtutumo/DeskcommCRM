/**
 * Unified Record History Service (lib/chatter/unified-history.ts).
 *
 * Combines Audit Trail entries, Chatter notes, Activities, Emails, and
 * Attachments into a single, chronologically sorted lifecycle timeline.
 *
 * Establishes the business record as the single source of truth answering:
 * "who did what, when, why, what documents were added, who was notified,
 * and what communication happened."
 */

import { ActivityService } from "./activity-service";
import { AttachmentService } from "./attachment-service";
import { ChatterService } from "./chatter-service";
import { RecordEmailService } from "./email-service";
import type {
  AuditTrailEntry,
  RecordEntityType,
  UnifiedRecordHistoryEntry,
} from "./types";

export class UnifiedRecordHistoryService {
  private static readonly auditTrails: Map<string, AuditTrailEntry[]> = new Map();

  private static key(orgId: string, type: RecordEntityType, id: string): string {
    return `${orgId}:${type}:${id}`;
  }

  static addAuditEntry(entry: AuditTrailEntry): void {
    const k = this.key(entry.organization_id, entry.record_type, entry.record_id);
    const existing = this.auditTrails.get(k) ?? [];
    this.auditTrails.set(k, [...existing, entry]);
  }

  static getAuditEntries(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
  ): AuditTrailEntry[] {
    const k = this.key(organizationId, recordType, recordId);
    return this.auditTrails.get(k) ?? [];
  }

  /**
   * Generates a unified chronological history timeline combining all 5 event
   * streams for a business record.
   */
  static getUnifiedHistory(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
  ): UnifiedRecordHistoryEntry[] {
    const entries: UnifiedRecordHistoryEntry[] = [];

    // 1. Audit Trail entries
    const audits = this.getAuditEntries(organizationId, recordType, recordId);
    for (const a of audits) {
      entries.push({
        id: a.id,
        entry_type: "audit",
        timestamp: a.changed_at,
        author_name: a.changed_by_name,
        title: `Field Changed: ${a.field_name}`,
        details: `old: ${a.old_value ?? "(none)"} → new: ${a.new_value ?? "(none)"}`,
        payload: { old_value: a.old_value, new_value: a.new_value, field: a.field_name },
      });
    }

    // 2. Activities
    const activities = ActivityService.getRecordActivities(
      organizationId,
      recordType,
      recordId,
    );
    for (const act of activities) {
      entries.push({
        id: act.id,
        entry_type: "activity",
        timestamp: act.completed_at ?? act.created_at,
        author_name: act.assigned_to_name,
        title: `Activity (${act.activity_type}): ${act.summary}`,
        details: `Status: ${act.status.toUpperCase()}, Due: ${act.due_date}`,
        payload: { activity_type: act.activity_type, status: act.status },
      });
    }

    // 3. Emails
    const emails = RecordEmailService.getRecordEmails(
      organizationId,
      recordType,
      recordId,
    );
    for (const em of emails) {
      entries.push({
        id: em.id,
        entry_type: "email",
        timestamp: em.created_at,
        author_name: em.direction === "outbound" ? em.from_address : `Customer (${em.from_address})`,
        title: `${em.direction.toUpperCase()} Email: ${em.subject}`,
        details: em.body_text,
        payload: { direction: em.direction, message_id: em.message_id },
      });
    }

    // 4. Attachments
    const attachments = AttachmentService.getRecordAttachments(
      organizationId,
      recordType,
      recordId,
    );
    for (const att of attachments) {
      entries.push({
        id: att.id,
        entry_type: "attachment",
        timestamp: att.uploaded_at,
        author_name: att.uploaded_by_name,
        title: `Attachment Uploaded: ${att.file_name}`,
        details: `MIME: ${att.mime_type}, Size: ${Math.round(att.file_size / 1024)} KB`,
        payload: { file_name: att.file_name, storage_path: att.storage_path },
      });
    }

    // 5. Chatter Messages
    const chatterMessages = ChatterService.getMessages(
      organizationId,
      recordType,
      recordId,
    );
    for (const msg of chatterMessages) {
      entries.push({
        id: msg.id,
        entry_type: "chatter",
        timestamp: msg.created_at,
        author_name: msg.author_name,
        title: `Chatter (${msg.message_type}): Note by ${msg.author_name}`,
        details: msg.content,
        payload: { message_type: msg.message_type, mentions: msg.mentions },
      });
    }

    // Sort chronologically (oldest first)
    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return entries;
  }
}
