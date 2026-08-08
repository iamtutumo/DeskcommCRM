import { describe, expect, it } from "vitest";

import {
  isSmtpConfigured,
  sendSmtpEmail,
  SmtpEmailClient,
} from "@/lib/email/smtp";

describe("SmtpEmailClient — Standard SMTP Email Engine", () => {
  it("reports unconfigured state when SMTP_HOST is not set", () => {
    expect(isSmtpConfigured()).toBe(false);
  });

  it("safely falls back to dev log mock when SMTP_HOST is unset in non-production", async () => {
    const res = await sendSmtpEmail({
      to: "borrower@example.com",
      subject: "Loan Agreement PDF",
      html: "<p>Your loan agreement is attached.</p>",
    });
    expect(res.ok).toBe(true);
    expect(res.id).toBe("mock-smtp-dev-id");
  });

  it("throws clear error when creating client without host configured", () => {
    expect(() => new SmtpEmailClient()).toThrow(
      "SmtpEmailClient is not configured: define SMTP_HOST in environment variables.",
    );
  });

  it("successfully formats and dispatches email when custom SmtpConfig is provided", async () => {
    const client = new SmtpEmailClient({
      host: "smtp.mailgun.org",
      port: 587,
      from: "noreply@deskcomm.app",
      secure: false,
    });

    const res = await client.send({
      to: ["borrower1@example.com", "officer@example.com"],
      subject: "Test Disbursement Notice",
      html: "<p>Disbursed.</p>",
    });

    expect(res.ok).toBe(true);
    expect(res.id).toContain("smtp-");
    expect(res.details).toContain("smtp.mailgun.org:587");
  });
});
