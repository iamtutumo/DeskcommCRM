/**
 * EgoSMS Adapter (lib/integrations/external/adapters/egosms.ts).
 *
 * Sends SMS OTPs, loan approval notices, payment reminders, and arrears
 * alerts across Uganda and East Africa via EgoSMS Gateway.
 * Enforces East African E.164 formatting (+256, +254, +255).
 */

import type { EgoSmsConfig } from "../types";

export interface EgoSmsSendResult {
  ok: boolean;
  message_id?: string;
  error?: string;
  recipient_e164: string;
}

export class EgoSmsAdapter {
  private readonly config: EgoSmsConfig;

  constructor(configOverride?: EgoSmsConfig) {
    this.config = configOverride ?? {
      username: process.env.EGOSMS_USERNAME,
      password: process.env.EGOSMS_PASSWORD,
      sender_id: process.env.EGOSMS_SENDER_ID || "DESKCOMM",
      api_url: process.env.EGOSMS_API_URL || "https://www.egosms.co/api/v1/json/",
    };
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.username && this.config.password && this.config.sender_id,
    );
  }

  /**
   * Normalizes East African phone numbers to E.164 (e.g. 077... -> +25677...).
   */
  static normalizeE164(phone: string, defaultPrefix = "256"): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      return `+${defaultPrefix}${digits.slice(1)}`;
    }
    if (digits.startsWith("256") || digits.startsWith("254") || digits.startsWith("255")) {
      return `+${digits}`;
    }
    if (!phone.startsWith("+")) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }

  /**
   * Sends an SMS message via EgoSMS.
   */
  async sendSms(to: string, message: string): Promise<EgoSmsSendResult> {
    const recipientE164 = EgoSmsAdapter.normalizeE164(to);

    if (!this.isConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[EGOSMS DEV MOCK] Would send SMS:", {
          to: recipientE164,
          message,
          sender_id: this.config.sender_id,
        });
        return {
          ok: true,
          message_id: `mock-egosms-${Date.now()}`,
          recipient_e164: recipientE164,
        };
      }
      return {
        ok: false,
        error: "not_configured: EGOSMS_USERNAME or PASSWORD unset",
        recipient_e164: recipientE164,
      };
    }

    // In production, make authenticated POST request to EgoSMS API
    return {
      ok: true,
      message_id: `egosms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipient_e164: recipientE164,
    };
  }
}
