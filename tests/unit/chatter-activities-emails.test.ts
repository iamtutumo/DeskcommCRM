import { describe, expect, it } from "vitest";

import { ActivityService } from "@/lib/chatter/activity-service";
import { AttachmentService } from "@/lib/chatter/attachment-service";
import { RecordEmailService } from "@/lib/chatter/email-service";

describe("Record Activities, Emails, and Attachments Suite", () => {
  const testOrgId = "org-act-email-001";

  it("creates an activity assigned to a user and marks it as completed", () => {
    const act = ActivityService.createActivity({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: "CLM-555111",
      activity_type: "review_document",
      summary: "Review police report",
      assigned_to_user_id: "user-sarah",
      assigned_to_name: "Sarah",
      due_date: "2026-08-12",
    });

    expect(act.status).toBe("pending");
    expect(act.activity_type).toBe("review_document");

    const completed = ActivityService.completeActivity(
      testOrgId,
      "claim",
      "CLM-555111",
      act.id,
      "user-sarah",
    );

    expect(completed.status).toBe("completed");
    expect(completed.completed_at).toBeDefined();
  });

  it("attaches documents to a record and stores metadata", () => {
    const att = AttachmentService.attachDocument({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: "CLM-555111",
      file_name: "Police_Report.pdf",
      file_size: 102400,
      mime_type: "application/pdf",
      storage_path: "claims/CLM-555111/Police_Report.pdf",
      uploaded_by_user_id: "user-john",
      uploaded_by_name: "John",
    });

    expect(att.file_name).toBe("Police_Report.pdf");
    const list = AttachmentService.getRecordAttachments(
      testOrgId,
      "claim",
      "CLM-555111",
    );
    expect(list).toHaveLength(1);
  });

  it("sends an outbound email from the record and associates incoming replies to Chatter", async () => {
    const out = await RecordEmailService.sendEmailFromRecord({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: "CLM-555111",
      sender_user_id: "user-john",
      sender_name: "John",
      to_addresses: ["customer@example.com"],
      subject: "Your claim has been received",
      body_html: "<p>We have received your claim.</p>",
    });

    expect(out.emailRecord.direction).toBe("outbound");
    expect(out.chatterMessageId).toBeDefined();

    const reply = RecordEmailService.associateIncomingReply({
      organizationId: testOrgId,
      recordType: "claim",
      recordId: "CLM-555111",
      fromAddress: "customer@example.com",
      subject: "Re: Your claim has been received",
      bodyText: "Thank you. Here is the repair estimate.",
      messageId: "in-msg-12345",
    });

    expect(reply.emailRecord.direction).toBe("inbound");
    expect(reply.chatterMessageId).toBeDefined();

    const emails = RecordEmailService.getRecordEmails(
      testOrgId,
      "claim",
      "CLM-555111",
    );
    expect(emails).toHaveLength(2);
  });
});
