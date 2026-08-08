/**
 * HeyForms Adapter (lib/integrations/external/adapters/heyforms.ts).
 *
 * Ingests loan application submissions, KYC questionnaires, and guarantor
 * disclosures from open-source HeyForms instances, mapping responses cleanly
 * to canonical contact and crm_lead properties.
 */

import type { HeyFormsConfig } from "../types";

export interface HeyFormSubmissionPayload {
  form_id: string;
  submission_id: string;
  created_at: string;
  answers: Record<string, string | number | boolean>;
}

export interface MappedHeyFormLead {
  borrower_name: string;
  borrower_phone: string;
  borrower_email?: string;
  document_number?: string;
  requested_amount?: number;
  loan_purpose?: string;
  form_id: string;
  submission_id: string;
}

export class HeyFormsAdapter {
  private readonly config: HeyFormsConfig;

  constructor(configOverride?: HeyFormsConfig) {
    this.config = configOverride ?? {
      api_key: process.env.HEYFORMS_API_KEY,
      api_url: process.env.HEYFORMS_API_URL || "http://localhost:8000/api/v1",
      webhook_secret: process.env.HEYFORMS_WEBHOOK_SECRET,
    };
  }

  isConfigured(): boolean {
    return Boolean(this.config.api_key && this.config.api_url);
  }

  /**
   * Maps a HeyForms webhook payload into structured CRM lead properties.
   */
  static parseSubmission(payload: HeyFormSubmissionPayload): MappedHeyFormLead {
    const a = payload.answers;
    return {
      borrower_name: String(a["name"] ?? a["full_name"] ?? "Anonymous Borrower"),
      borrower_phone: String(a["phone"] ?? a["mobile"] ?? ""),
      borrower_email: a["email"] ? String(a["email"]) : undefined,
      document_number: a["cpf"] ?? a["nin"] ?? a["id_number"] ? String(a["cpf"] ?? a["nin"] ?? a["id_number"]) : undefined,
      requested_amount: typeof a["amount"] === "number" ? a["amount"] : Number(a["amount"] ?? 0),
      loan_purpose: a["purpose"] ? String(a["purpose"]) : undefined,
      form_id: payload.form_id,
      submission_id: payload.submission_id,
    };
  }
}
