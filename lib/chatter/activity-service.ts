/**
 * Record Activity Service (lib/chatter/activity-service.ts).
 *
 * Manages action items attached to business records (e.g. Call, Email,
 * Meeting, To Do, Follow-up, Review Document) assigned to users with due dates
 * and completion timestamps.
 */

import { FollowerService } from "./follower-service";
import type {
  ActivityStatus,
  ActivityType,
  RecordActivity,
  RecordEntityType,
} from "./types";

export interface CreateActivityRequest {
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  activity_type: ActivityType;
  summary: string;
  assigned_to_user_id: string;
  assigned_to_name: string;
  due_date: string; // YYYY-MM-DD
}

export class ActivityService {
  private static readonly activities: Map<string, RecordActivity[]> = new Map();

  private static key(orgId: string, type: RecordEntityType, id: string): string {
    return `${orgId}:${type}:${id}`;
  }

  /**
   * Creates an activity attached to a record and assigned to a user.
   */
  static createActivity(request: CreateActivityRequest): RecordActivity {
    const k = this.key(request.organization_id, request.record_type, request.record_id);
    const existing = this.activities.get(k) ?? [];
    const nowIso = new Date().toISOString();
    const actId = `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const activity: RecordActivity = {
      id: actId,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      activity_type: request.activity_type,
      summary: request.summary,
      assigned_to_user_id: request.assigned_to_user_id,
      assigned_to_name: request.assigned_to_name,
      due_date: request.due_date,
      status: "pending",
      created_at: nowIso,
    };

    this.activities.set(k, [...existing, activity]);

    // Notify record followers of activity assignment
    FollowerService.notifyFollowers(
      request.organization_id,
      request.record_type,
      request.record_id,
      "activity_assigned",
      `New activity '${request.activity_type}' assigned to ${request.assigned_to_name}`,
      request.summary,
    );

    return activity;
  }

  /**
   * Marks an activity as completed.
   */
  static completeActivity(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
    activityId: string,
    completedByUserId: string,
  ): RecordActivity {
    const k = this.key(organizationId, recordType, recordId);
    const existing = this.activities.get(k) ?? [];
    const idx = existing.findIndex((a) => a.id === activityId);
    if (idx < 0) {
      throw new Error(`Activity not found: ${activityId}`);
    }

    const current = existing[idx]!;
    const updated: RecordActivity = {
      ...current,
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by_user_id: completedByUserId,
    };

    existing[idx] = updated;
    this.activities.set(k, existing);
    return updated;
  }

  /**
   * Retrieves all activities attached to a specific record.
   */
  static getRecordActivities(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
    statusFilter?: ActivityStatus,
  ): RecordActivity[] {
    const k = this.key(organizationId, recordType, recordId);
    const list = this.activities.get(k) ?? [];
    if (!statusFilter) return list;
    return list.filter((a) => a.status === statusFilter);
  }
}
