import { describe, expect, it } from "vitest";

import { EgoSmsAdapter } from "@/lib/integrations/external/adapters/egosms";
import { DocumensoSignatureAdapter } from "@/lib/integrations/external/adapters/documenso";
import { HeyFormsAdapter, type HeyFormSubmissionPayload } from "@/lib/integrations/external/adapters/heyforms";
import { IdSwyftKycAdapter } from "@/lib/integrations/external/adapters/idswyft";
import { MinioStorageAdapter } from "@/lib/integrations/external/adapters/minio";

describe("External Integrations Core Adapters Suite", () => {
  describe("EgoSmsAdapter — East Africa SMS Gateway (+256 E.164)", () => {
    it("normalizes Ugandan mobile numbers to E.164 format (+256)", () => {
      expect(EgoSmsAdapter.normalizeE164("0771234567")).toBe("+256771234567");
      expect(EgoSmsAdapter.normalizeE164("256771234567")).toBe("+256771234567");
      expect(EgoSmsAdapter.normalizeE164("+256771234567")).toBe("+256771234567");
    });

    it("safely falls back to dev mock when EGOSMS credentials are unset", async () => {
      const adapter = new EgoSmsAdapter({});
      const res = await adapter.sendSms("0771234567", "Your loan is approved!");
      expect(res.ok).toBe(true);
      expect(res.recipient_e164).toBe("+256771234567");
      expect(res.message_id).toContain("mock-egosms-");
    });
  });

  describe("MinioStorageAdapter — S3 Object Storage & Expiring Signed URLs", () => {
    it("uploads documents and generates expiring signed URLs (default 72 hours)", async () => {
      const adapter = new MinioStorageAdapter({
        endpoint: "http://localhost:9000",
        access_key: "minio-admin",
        secret_key: "minio-secret",
        bucket_name: "mifos-documents",
      });

      const uploadRes = await adapter.uploadDocument(
        "agreements/loan-101.pdf",
        Buffer.from("dummy-pdf"),
      );
      expect(uploadRes.ok).toBe(true);

      const sigRes = await adapter.getSignedUrl("agreements/loan-101.pdf", 259200);
      expect(sigRes.expires_in_seconds).toBe(259200);
      expect(sigRes.signed_url).toContain("X-Amz-Expires=259200");
    });
  });

  describe("IdSwyftKycAdapter — KYC Identity Verification & Score Threshold", () => {
    it("evaluates borrower KYC documents and flags manual_review when below threshold", async () => {
      const adapter = new IdSwyftKycAdapter({
        api_key: "idswyft-key",
        api_url: "http://idswyft.local/api",
        confidence_threshold: 85,
      });

      const result = await adapter.verifyIdentity({
        contact_id: "contact-500",
        document_number: "CM90210X",
        document_type: "national_id",
        photo_url: "https://minio.local/mifos-documents/id.jpg",
      });

      expect(result.verification_id).toContain("idswyft-ver-");
      expect(result.score).toBeGreaterThan(0);
      expect(["verified", "manual_review"]).toContain(result.status);
    });
  });

  describe("DocumensoSignatureAdapter — Electronic Signatures", () => {
    it("generates an electronic signing request URL for a loan agreement", async () => {
      const adapter = new DocumensoSignatureAdapter({
        api_key: "documenso-key",
        api_url: "http://documenso.local/api/v1",
      });

      const res = await adapter.createSigningRequest({
        document_id: "doc-101",
        signer_email: "borrower@example.com",
        signer_name: "Juma Hassan",
        title: "Loan Agreement L-101",
      });

      expect(res.status).toBe("sent");
      expect(res.signing_url).toContain("http://documenso.local");
    });
  });

  describe("HeyFormsAdapter — Onboarding Form Webhook Parser", () => {
    it("maps HeyForm submissions cleanly into CRM lead properties", () => {
      const payload: HeyFormSubmissionPayload = {
        form_id: "form-loan-app",
        submission_id: "sub-99",
        created_at: "2026-08-08T10:00:00Z",
        answers: {
          name: "Juma Hassan",
          phone: "0771234567",
          amount: 500000,
          purpose: "Working capital for retail store",
        },
      };

      const lead = HeyFormsAdapter.parseSubmission(payload);
      expect(lead.borrower_name).toBe("Juma Hassan");
      expect(lead.borrower_phone).toBe("0771234567");
      expect(lead.requested_amount).toBe(500000);
      expect(lead.loan_purpose).toBe("Working capital for retail store");
    });
  });
});
