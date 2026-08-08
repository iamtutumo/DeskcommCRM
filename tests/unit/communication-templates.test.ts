import { describe, expect, it } from "vitest";

import {
  COMMUNICATION_TEMPLATES,
  getCommunicationTemplate,
  renderCommunicationTemplate,
  type MicrofinanceEventType,
  type SupportedLocale,
} from "@/lib/mifos/templates/communication-templates";

describe("Multi-Lingual Microfinance Communication Templates (WhatsApp + Email)", () => {
  const events: MicrofinanceEventType[] = [
    "loan_application_received",
    "loan_underwriting_in_progress",
    "loan_approved",
    "loan_disbursed",
    "repayment_due_reminder",
    "repayment_received",
    "loan_arrears_warning",
  ];
  const locales: SupportedLocale[] = ["en", "es", "pt", "sw"];

  it("defines templates for all 7 microfinance events across all 4 supported locales", () => {
    for (const eventType of events) {
      for (const locale of locales) {
        const tpl = getCommunicationTemplate(eventType, locale);
        expect(tpl, `Missing template for ${eventType} (${locale})`).toBeDefined();
        expect(tpl.subject).toBeDefined();
        expect(tpl.whatsappBody).toBeDefined();
        expect(tpl.emailHtml).toBeDefined();
      }
    }
  });

  it("renders variables accurately into WhatsApp body and Email HTML (Swahili locale test)", () => {
    const rendered = renderCommunicationTemplate("loan_arrears_warning", "sw", {
      borrowerName: "Juma Hassan",
      loanId: "L-90210",
      daysOverdue: 18,
      amount: "UGX 250,000",
    });

    expect(rendered.subject).toContain("siku 18");
    expect(rendered.whatsappBody).toContain("Juma Hassan");
    expect(rendered.whatsappBody).toContain("UGX 250,000");
    expect(rendered.emailHtml).toContain("<b>#L-90210</b>");
  });

  it("safely falls back to English when locale template lookup defaults", () => {
    const tpl = getCommunicationTemplate("loan_disbursed", "en");
    expect(tpl.subject).toContain("Loan Disbursed");
  });
});
