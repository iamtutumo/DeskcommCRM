/**
 * Chatter Service (lib/chatter/chatter-service.ts).
 *
 * Manages the communication panel attached to a business record (messages,
 * internal notes, emails, mentions, attachments). Automatically parses
 * `@username` mentions and notifies record followers.
 */

import { FollowerService } from "./follower-service";
import type { ChatterMessage, RecordEntityType, RecordMention } from "./types";

export interface PostChatterMessageRequest {
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  author_id: string;
  author_name: string;
  message_type?: "note" | "email" | "comment";
  content: string;
  attachment_ids?: string[];
}

export interface PostChatterMessageResult {
  message: ChatterMessage;
  mentions: RecordMention[];
  follower_notification_id?: string;
}

export class ChatterService {
  private static readonly messages: Map<string, ChatterMessage[]> = new Map();

  private static key(orgId: string, type: RecordEntityType, id: string): string {
    return `${orgId}:${type}:${id}`;
  }

  /**
   * Parses `@username` tokens from message text (e.g. "@John Please review").
   */
  static parseMentions(content: string): string[] {
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
    if (!matches) return [];
    const unique = Array.from(new Set(matches.map((m) => m.slice(1))));
    return unique;
  }

  /**
   * Posts a message or internal note to a record's Chatter, creating mentions
   * and notifying followers.
   */
  static postMessage(request: PostChatterMessageRequest): PostChatterMessageResult {
    const mentionedNames = this.parseMentions(request.content);
    const nowIso = new Date().toISOString();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const message: ChatterMessage = {
      id: msgId,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      author_id: request.author_id,
      author_name: request.author_name,
      message_type: request.message_type ?? "note",
      content: request.content,
      mentions: mentionedNames,
      attachment_ids: request.attachment_ids ?? [],
      created_at: nowIso,
    };

    // Generate RecordMention alerts for mentioned users
    const mentions: RecordMention[] = mentionedNames.map((name, idx) => ({
      id: `men-${msgId}-${idx + 1}`,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      chatter_message_id: msgId,
      mentioned_user_id: `user-${name.toLowerCase()}`, // Resolved ID
      mentioned_user_name: name,
      is_read: false,
      created_at: nowIso,
    }));

    // Notify followers
    const notification = FollowerService.notifyFollowers(
      request.organization_id,
      request.record_type,
      request.record_id,
      "new_message",
      `New Chatter note on ${request.record_type.toUpperCase()} #${request.record_id}`,
      request.content,
    );

    const k = this.key(request.organization_id, request.record_type, request.record_id);
    const existing = this.messages.get(k) ?? [];
    this.messages.set(k, [...existing, message]);

    return {
      message,
      mentions,
      follower_notification_id: notification.id,
    };
  }

  static getMessages(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
  ): ChatterMessage[] {
    const k = this.key(organizationId, recordType, recordId);
    return this.messages.get(k) ?? [];
  }
}
