/**
 * Record Email Service (lib/chatter/email-service.ts).
 *
 * Allows users to send external emails directly from a business record and
 * automatically associates incoming email replies back to the record's Chatter
 * communication timeline.
 */

import { sendSmtpEmail, type SmtpSendArgs } from "@/lib/email/smtp";
import { ChatterService } from "./chatter-service";
import type { RecordEmail, RecordEntityType } from "./types";

export interface SendEmailFromRecordRequest {
  organization_id: string;
  record_type: RecordEntityType;
  record_id: string;
  sender_user_id: string;
  sender_name: string;
  to_addresses: string[];
  cc_addresses?: string[];
  bcc_addresses?: string[];
  subject: string;
  body_html: string;
  body_text?: string;
  attachment_ids?: string[];
}

export class RecordEmailService {
  private static readonly emails: Map<string, RecordEmail[]> = new Map();

  private static key(orgId: string, type: RecordEntityType, id: string): string {
    return `${orgId}:${type}:${id}`;
  }

  /**
   * Sends an outbound email from a record via SMTP and logs it in the record's
   * Chatter communication history.
   */
  static async sendEmailFromRecord(
    request: SendEmailFromRecordRequest,
  ): Promise<{ emailRecord: RecordEmail; chatterMessageId: string }> {
    const smtpArgs: SmtpSendArgs = {
      to: request.to_addresses,
      subject: request.subject,
      html: request.body_html,
      text: request.body_text,
    };

    const sendRes = await sendSmtpEmail(smtpArgs);
    const msgId = sendRes.id ?? `smtp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const emailId = `reml-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const recordEmail: RecordEmail = {
      id: emailId,
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      direction: "outbound",
      from_address: request.sender_name,
      to_addresses: request.to_addresses,
      cc_addresses: request.cc_addresses ?? [],
      bcc_addresses: request.bcc_addresses ?? [],
      subject: request.subject,
      body_html: request.body_html,
      body_text: request.body_text ?? request.body_html.replace(/<[^>]*>/g, ""),
      attachment_ids: request.attachment_ids ?? [],
      message_id: msgId,
      created_at: nowIso,
    };

    const k = this.key(request.organization_id, request.record_type, request.record_id);
    const existing = this.emails.get(k) ?? [];
    this.emails.set(k, [...existing, recordEmail]);

    // Automatically post in the record's Chatter
    const chatterRes = ChatterService.postMessage({
      organization_id: request.organization_id,
      record_type: request.record_type,
      record_id: request.record_id,
      author_id: request.sender_user_id,
      author_name: request.sender_name,
      message_type: "email",
      content: `Email sent to ${request.to_addresses.join(", ")}:\nSubject: ${request.subject}\n\n${request.body_text ?? ""}`,
      attachment_ids: request.attachment_ids,
    });

    return {
      emailRecord: recordEmail,
      chatterMessageId: chatterRes.message.id,
    };
  }

  /**
   * Associates an incoming email reply with a business record and logs it in
   * the record's Chatter timeline.
   */
  static associateIncomingReply(params: {
    organizationId: string;
    recordType: RecordEntityType;
    recordId: string;
    fromAddress: string;
    subject: string;
    bodyText: string;
    messageId: string;
    attachmentIds?: string[];
  }): { emailRecord: RecordEmail; chatterMessageId: string } {
    const nowIso = new Date().toISOString();
    const emailId = `reml-in-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const recordEmail: RecordEmail = {
      id: emailId,
      organization_id: params.organizationId,
      record_type: params.recordType,
      record_id: params.recordId,
      direction: "inbound",
      from_address: params.fromAddress,
      to_addresses: [],
      cc_addresses: [],
      bcc_addresses: [],
      subject: params.subject,
      body_html: `<p>${params.bodyText}</p>`,
      body_text: params.bodyText,
      attachment_ids: params.attachmentIds ?? [],
      message_id: params.messageId,
      created_at: nowIso,
    };

    const k = this.key(params.organizationId, params.recordType, params.recordId);
    const existing = this.emails.get(k) ?? [];
    this.emails.set(k, [...existing, recordEmail]);

    const chatterRes = ChatterService.postMessage({
      organization_id: params.organizationId,
      record_type: params.recordType,
      record_id: params.recordId,
      author_id: "system-inbound-email",
      author_name: params.fromAddress,
      message_type: "email",
      content: `Incoming reply from ${params.fromAddress}:\nSubject: ${params.subject}\n\n${params.bodyText}`,
      attachment_ids: params.attachmentIds,
    });

    return {
      emailRecord: recordEmail,
      chatterMessageId: chatterRes.message.id,
    };
  }

  static getRecordEmails(
    organizationId: string,
    recordType: RecordEntityType,
    recordId: string,
  ): RecordEmail[] {
    const k = this.key(organizationId, recordType, recordId);
    return this.emails.get(k) ?? [];
  }
}
