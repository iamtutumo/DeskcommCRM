/**
 * Record Follower Service (lib/chatter/follower-service.ts).
 *
 * Allows users to subscribe to record lifecycle events (status changes,
 * messages, documents, activities) so they receive notifications without
 * constantly opening the record.
 */

import type { RecordEntityType, RecordFollower } from "./types";

export interface AddFollowerRequest {
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subscribed_events?: string[];
}

export interface FollowerNotificationEvent {
  id: string;
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  event_type: "status_change" | "new_message" | "document_upload" | "activity_assigned" | "mention";
  title: string;
  message: string;
  recipient_user_ids: string[];
  created_at: string;
}

export class FollowerService {
  private static readonly followers: Map<string, RecordFollower[]> = new Map();

  private static key(orgId: string, type: RecordEntityType, id: string): string {
    return `${orgId}:${type}:${id}`;
  }

  /**
   * Subscribes a user as a follower on a business record.
   */
  static addFollower(request: AddFollowerRequest): RecordFollower {
    const k = this.key(request.organization_id, request.record_type, request.record_id);
    const existingList = this.followers.get(k) ?? [];

    const existingIndex = existingList.findIndex((f) => f.user_id === request.user_id);
    if (existingIndex >= 0) {
      return existingList[existingIndex]!;
    }

    const follower: RecordFollower = {
      id: `fol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      user_id: request.user_id,
      user_name: request.user_name,
      user_email: request.user_email,
      subscribed_events: request.subscribed_events ?? [
        "status_change",
        "new_message",
        "document_upload",
        "activity_assigned",
      ],
      created_at: new Date().toISOString(),
    };

    this.followers.set(k, [...existingList, follower]);
    return follower;
  }

  /**
   * Unsubscribes a user from a record.
   */
  static removeFollower(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
    userId: string,
  ): boolean {
    const k = this.key(organizationId, recordType, recordId);
    const existingList = this.followers.get(k) ?? [];
    const filtered = existingList.filter((f) => f.user_id !== userId);
    this.followers.set(k, filtered);
    return filtered.length < existingList.length;
  }

  /**
   * Lists all followers subscribed to a record.
   */
  static getFollowers(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
  ): RecordFollower[] {
    const k = this.key(organizationId, recordType, recordId);
    return this.followers.get(k) ?? [];
  }

  /**
   * Generates a follower notification event dispatched to all subscribed users.
   */
  static notifyFollowers(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
    eventType: "status_change" | "new_message" | "document_upload" | "activity_assigned",
    title: string,
    message: string,
  ): FollowerNotificationEvent {
    const subscribers = this.getFollowers(organizationId, recordType, recordId);
    const recipientIds = subscribers.map((s) => s.user_id);

    return {
      id: `fn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      organization_id: organizationId,
      record_type: recordType,
      record_id: recordId,
      event_type: eventType,
      title,
      message,
      recipient_user_ids: recipientIds,
      created_at: new Date().toISOString(),
    };
  }
}
