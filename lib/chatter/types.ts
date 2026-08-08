/**
 * Typed domain definitions for Odoo-Inspired Business Record Collaboration & Audit Suite.
 *
 * Encompasses 13 distinct but connected concepts:
 *   1. Audit Trail (system history of record field changes)
 *   2. Chatter (record-attached communication area)
 *   3. Followers (users subscribed to record notifications)
 *   4. Mentions (@username alerts inside Chatter)
 *   5. Discuss (direct user-to-user and group chat)
 *   6. Document Followers & Attachments
 *   7. Sending Email from Record
 *   8. Email Replies associated to record Chatter
 *   9. Activities (action items assigned to users with due dates)
 *  10. Complete Lifecycle Unified Timeline
 */

export type RecordEntityType = "claim" | "loan" | "customer" | "opportunity" | "invoice" | "ticket";

export interface AuditTrailEntry {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  changed_by_user_id: string;
  changed_by_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string; // ISO timestamp
}

export interface ChatterMessage {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  author_id: string;
  author_name: string;
  message_type: "note" | "email" | "comment";
  content: string;
  mentions: string[]; // List of mentioned usernames e.g. ["Sarah", "David"]
  attachment_ids: string[];
  created_at: string;
}

export interface RecordFollower {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subscribed_events: string[]; // e.g. ["status_change", "new_message", "document_upload"]
  created_at: string;
}

export interface RecordMention {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  chatter_message_id: string;
  mentioned_user_id: string;
  mentioned_user_name: string;
  is_read: boolean;
  created_at: string;
}

export interface DiscussChannel {
  id: string;
  organization_id: string;
  name: string;
  member_user_ids: string[];
  created_at: string;
}

export interface DiscussMessage {
  id: string;
  organization_id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  content: string;
  mentions: string[];
  attachment_ids: string[];
  created_at: string;
}

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "todo"
  | "follow_up"
  | "review_document";

export type ActivityStatus = "pending" | "completed" | "overdue";

export interface RecordActivity {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  activity_type: ActivityType;
  summary: string;
  assigned_to_user_id: string;
  assigned_to_name: string;
  due_date: string; // YYYY-MM-DD
  status: ActivityStatus;
  completed_at?: string;
  completed_by_user_id?: string;
  created_at: string;
}

export interface RecordEmail {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  direction: "outbound" | "inbound";
  from_address: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string;
  body_html: string;
  body_text: string;
  attachment_ids: string[];
  message_id: string;
  created_at: string;
}

export interface RecordAttachment {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by_user_id: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

export type UnifiedEntryType = "audit" | "chatter" | "activity" | "email" | "attachment";

export interface UnifiedRecordHistoryEntry {
  id: string;
  entry_type: UnifiedEntryType;
  timestamp: string; // ISO timestamp
  author_name: string;
  title: string;
  details: string;
  payload: Record<string, unknown>;
}
