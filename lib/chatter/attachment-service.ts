/**
 * Record Attachment Service (lib/chatter/attachment-service.ts).
 *
 * Stores documents attached to business records (e.g. ID.pdf,
 * Police_Report.pdf, Agreement.pdf) and automatically notifies subscribed
 * followers when new evidence or documents are uploaded.
 */

import { FollowerService } from "./follower-service";
import type { RecordAttachment, RecordEntityType } from "./types";

export interface AttachDocumentRequest {
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by_user_id: string;
  uploaded_by_name: string;
}

export class AttachmentService {
  private static readonly attachments: Map<string, RecordAttachment[]> = new Map();

  private static key(orgId: string, type: RecordEntityType, id: string): string {
    return `${orgId}:${type}:${id}`;
  }

  /**
   * Attaches a document to a record and notifies subscribers.
   */
  static attachDocument(request: AttachDocumentRequest): RecordAttachment {
    const k = this.key(request.organization_id, request.record_type, request.record_id);
    const existing = this.attachments.get(k) ?? [];
    const nowIso = new Date().toISOString();
    const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const attachment: RecordAttachment = {
      id: attId,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      file_name: request.file_name,
      file_size: request.file_size,
      mime_type: request.mime_type,
      storage_path: request.storage_path,
      uploaded_by_user_id: request.uploaded_by_user_id,
      uploaded_by_name: request.uploaded_by_name,
      uploaded_at: nowIso,
    };

    this.attachments.set(k, [...existing, attachment]);

    // Notify record followers
    FollowerService.notifyFollowers(
      request.organization_id,
      request.record_type,
      request.record_id,
      "document_upload",
      `Document uploaded: ${request.file_name}`,
      `File size: ${Math.round(request.file_size / 1024)} KB, Uploaded by ${request.uploaded_by_name}`,
    );

    return attachment;
  }

  /**
   * Retrieves all documents attached to a record.
   */
  static getRecordAttachments(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
  ): RecordAttachment[] {
    const k = this.key(organizationId, recordType, recordId);
    return this.attachments.get(k) ?? [];
  }
}
