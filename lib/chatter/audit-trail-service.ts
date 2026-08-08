/**
 * Audit Trail Service (lib/chatter/audit-trail-service.ts).
 *
 * Records immutable system history entries whenever important business record
 * fields change (e.g. status Assessment -> Investigation, assigned officer
 * David -> Sarah). Separate from Chatter collaboration.
 */

import type { AuditTrailEntry, RecordEntityType } from "./types";

export interface RecordFieldChangeRequest {
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  changed_by_user_id: string;
  changed_by_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
}

export class AuditTrailService {
  /**
   * Records a single immutable audit trail entry representing a field change.
   */
  static recordFieldChange(request: RecordFieldChangeRequest): AuditTrailEntry {
    const entryId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    return {
      id: entryId,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      changed_by_user_id: request.changed_by_user_id,
      changed_by_name: request.changed_by_name,
      field_name: request.field_name,
      old_value: request.old_value,
      new_value: request.new_value,
      changed_at: nowIso,
    };
  }

  /**
   * Compares an old record state against a new record state across specified
   * fields and returns an array of AuditTrailEntry items for every modified field.
   */
  static diffAndRecord(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
    changedByUserId: string,
    changedByName: string,
    oldRecord: Record<string, unknown>,
    newRecord: Record<string, unknown>,
    fieldsToWatch: string[],
  ): AuditTrailEntry[] {
    const entries: AuditTrailEntry[] = [];

    for (const field of fieldsToWatch) {
      const oldVal = oldRecord[field];
      const newVal = newRecord[field];

      const oldStr = oldVal === undefined || oldVal === null ? null : String(oldVal);
      const newStr = newVal === undefined || newVal === null ? null : String(newVal);

      if (oldStr !== newStr) {
        entries.push(
          this.recordFieldChange({
            organization_id: organizationId,
            record_type: recordType,
            record_id: recordId,
            changed_by_user_id: changedByUserId,
            changed_by_name: changedByName,
            field_name: field,
            old_value: oldStr,
            new_value: newStr,
          }),
        );
      }
    }

    return entries;
  }
}
