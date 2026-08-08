import { describe, expect, it } from "vitest";

import { ActivityService } from "@/lib/chatter/activity-service";
import { AttachmentService } from "@/lib/chatter/attachment-service";
import { AuditTrailService } from "@/lib/chatter/audit-trail-service";
import { ChatterService } from "@/lib/chatter/chatter-service";
import { RecordEmailService } from "@/lib/chatter/email-service";
import { UnifiedRecordHistoryService } from "@/lib/chatter/unified-history";

describe("Unified Record History Timeline — Complete Lifecycle Single Source of Truth", () => {
  const testOrgId = "org-unified-life-01";
  const claimId = "CLM-777888";

  it("combines audit trail, chatter, activities, emails, and attachments into a chronological timeline", async () => {
    // 1. Audit trail field change (08:00)
    const auditEntry = AuditTrailService.recordFieldChange({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: claimId,
      changed_by_user_id: "user-admin",
      changed_by_name: "Admin",
      field_name: "status",
      old_value: "Assessment",
      new_value: "Investigation",
    });

    // Manually register in the UnifiedService map
    UnifiedRecordHistoryService.addAuditEntry(auditEntry);

    // 2. Activity created (09:00)
    ActivityService.createActivity({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: claimId,
      activity_type: "review_document",
      summary: "Review police report",
      assigned_to_user_id: "user-sarah",
      assigned_to_name: "Sarah",
      due_date: "2026-08-10",
    });

    // 3. Document attachment uploaded (10:00)
    AttachmentService.attachDocument({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: claimId,
      file_name: "Accident_Photos.zip",
      file_size: 204800,
      mime_type: "application/zip",
      storage_path: `claims/${claimId}/Accident_Photos.zip`,
      uploaded_by_user_id: "user-sarah",
      uploaded_by_name: "Sarah",
    });

    // 4. Chatter message posted (11:00)
    ChatterService.postMessage({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: claimId,
      author_id: "user-sarah",
      author_name: "Sarah",
      content: "Photos uploaded. @David please review.",
    });

    // 5. Email sent to claimant (12:00)
    await RecordEmailService.sendEmailFromRecord({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: claimId,
      sender_user_id: "user-sarah",
      sender_name: "Sarah",
      to_addresses: ["claimant@example.com"],
      subject: "Your claim investigation has started",
      body_html: "<p>Investigation initiated.</p>",
    });

    const timeline = UnifiedRecordHistoryService.getUnifiedHistory(
      testOrgId,
      "claim",
      claimId,
    );

    expect(timeline.length).toBeGreaterThanOrEqual(4);

    const types = timeline.map((t) => t.entry_type);
    expect(types).toContain("audit");
    expect(types).toContain("activity");
    expect(types).toContain("attachment");
    expect(types).toContain("email");

    // Check chronology: timestamp of i <= timestamp of i+1
    for (let i = 0; i < timeline.length - 1; i++) {
      expect(
        timeline[i]!.timestamp.localeCompare(timeline[i + 1]!.timestamp),
      ).toBeLessThanOrEqual(0);
    }
  });
});
