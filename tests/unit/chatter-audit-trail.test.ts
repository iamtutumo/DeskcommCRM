import { describe, expect, it } from "vitest";

import { AuditTrailService } from "@/lib/chatter/audit-trail-service";

describe("Audit Trail Service — Immutable Business Record System History", () => {
  const testOrgId = "org-audit-test-01";

  it("records a single field change with before/after values and user attribution", () => {
    const entry = AuditTrailService.recordFieldChange({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: "CLM-000123",
      changed_by_user_id: "user-john",
      changed_by_name: "John",
      field_name: "status",
      old_value: "Pending",
      new_value: "Approved",
    });

    expect(entry.id).toContain("audit-");
    expect(entry.record_id).toBe("CLM-000123");
    expect(entry.field_name).toBe("status");
    expect(entry.old_value).toBe("Pending");
    expect(entry.new_value).toBe("Approved");
    expect(entry.changed_by_name).toBe("John");
  });

  it("diffs old vs new record state across watched fields and emits an audit entry for each change", () => {
    const oldRecord = {
      status: "Assessment",
      assigned_officer: "David",
      amount_claimed: 5000,
    };
    const newRecord = {
      status: "Investigation",
      assigned_officer: "Sarah",
      amount_claimed: 5000, // Unchanged
    };

    const entries = AuditTrailService.diffAndRecord(
      testOrgId,
      "claim",
      "CLM-000123",
      "user-admin",
      "Admin Officer",
      oldRecord,
      newRecord,
      ["status", "assigned_officer", "amount_claimed"],
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]?.field_name).toBe("status");
    expect(entries[0]?.old_value).toBe("Assessment");
    expect(entries[0]?.new_value).toBe("Investigation");

    expect(entries[1]?.field_name).toBe("assigned_officer");
    expect(entries[1]?.old_value).toBe("David");
    expect(entries[1]?.new_value).toBe("Sarah");
  });
});
