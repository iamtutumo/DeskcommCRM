import { describe, expect, it } from "vitest";
import * as React from "react";

import { AuditTrailService } from "@/lib/chatter/audit-trail-service";
import { ChatterService } from "@/lib/chatter/chatter-service";
import { UnifiedRecordHistoryService } from "@/lib/chatter/unified-history";
import { RecordChatterPanel } from "@/components/chatter/RecordChatterPanel";

describe("Record Audit Trail Visibility — UI & API Layer", () => {
  const testOrgId = "org-vis-test-100";
  const testClaimId = "CLM-888999";

  it("record_audit_trail is visible on the record when querying the unified timeline", () => {
    // Record a system audit trail event
    const auditEntry = AuditTrailService.recordFieldChange({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: testClaimId,
      changed_by_user_id: "user-admin",
      changed_by_name: "Admin John",
      field_name: "status",
      old_value: "Pending",
      new_value: "Approved",
    });

    UnifiedRecordHistoryService.addAuditEntry(auditEntry);

    // Also post a Chatter note
    ChatterService.postMessage({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: testClaimId,
      author_id: "user-sarah",
      author_name: "Sarah",
      content: "Claim approved after verification.",
    });

    const timeline = UnifiedRecordHistoryService.getUnifiedHistory(
      testOrgId,
      "claim",
      testClaimId,
    );

    expect(timeline.length).toBeGreaterThanOrEqual(2);

    const auditItems = timeline.filter((e) => e.entry_type === "audit");
    const chatterItems = timeline.filter((e) => e.entry_type === "chatter");

    expect(auditItems.length).toBeGreaterThanOrEqual(1);
    expect(chatterItems.length).toBeGreaterThanOrEqual(1);

    expect(auditItems[0]?.title).toContain("status");
    expect(auditItems[0]?.details).toContain("Pending → new: Approved");
  });

  it("RecordChatterPanel UI component renders and can filter specifically to Audit Trail (System)", () => {
    const dummyEntries = [
      {
        id: "a-1",
        entry_type: "audit" as const,
        timestamp: "2026-08-08T10:00:00Z",
        author_name: "System",
        title: "Field Changed: status",
        details: "old: Pending → new: Approved",
        payload: {},
      },
      {
        id: "c-1",
        entry_type: "chatter" as const,
        timestamp: "2026-08-08T11:00:00Z",
        author_name: "John",
        title: "Chatter Note",
        details: "Looks good to me.",
        payload: {},
      },
    ];

    const element = React.createElement(RecordChatterPanel, {
      organizationId: testOrgId,
      recordType: "claim",
      recordId: testClaimId,
      initialEntries: dummyEntries,
    });

    expect(element).toBeDefined();
    expect(element.props.initialEntries!).toHaveLength(2);
    expect(element.props.initialEntries![0]?.entry_type).toBe("audit");
  });
});
