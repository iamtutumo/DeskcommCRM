/**
 * MCP Tools for External Integrations Suite (lib/mcp/tools/external-integrations.ts).
 *
 * Exposes EgoSMS, IdSwyft KYC, Documenso e-signatures, and MinIO document storage
 * to AI agents.
 */
import { z } from "zod";

import { EgoSmsAdapter } from "@/lib/integrations/external/adapters/egosms";
import { DocumensoSignatureAdapter } from "@/lib/integrations/external/adapters/documenso";
import { IdSwyftKycAdapter } from "@/lib/integrations/external/adapters/idswyft";
import { MinioStorageAdapter } from "@/lib/integrations/external/adapters/minio";
import type { McpToolDefinition } from "../types";

const sendSmsInputShape = {
  to: z.string().min(8),
  message: z.string().min(1).max(160),
};

export const externalSendSmsEgosms: McpToolDefinition<typeof sendSmsInputShape> = {
  name: "external_send_sms_egosms",
  description:
    "Sends an SMS notification via EgoSMS gateway to borrowers across Uganda and East Africa (+256 E.164 format).",
  inputSchema: sendSmsInputShape,
  category: "write",
  requiresRole: "agent",
  requiresScope: "mcp:write",
  handler: async (input) => {
    const adapter = new EgoSmsAdapter();
    const res = await adapter.sendSms(input.to, input.message);
    return { ok: res.ok, result: res };
  },
};

const verifyKycInputShape = {
  contact_id: z.string(),
  document_number: z.string(),
  document_type: z.enum(["national_id", "passport", "driver_license", "selfie"]),
  photo_url: z.string().url(),
};

export const externalVerifyKycIdswyft: McpToolDefinition<typeof verifyKycInputShape> = {
  name: "external_verify_kyc_idswyft",
  description:
    "Triggers an IdSwyft identity verification check for a borrower document (national ID, passport, or selfie).",
  inputSchema: verifyKycInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    const adapter = new IdSwyftKycAdapter();
    const res = await adapter.verifyIdentity({
      contact_id: input.contact_id,
      document_number: input.document_number,
      document_type: input.document_type,
      photo_url: input.photo_url,
    });
    return { ok: true, verification: res };
  },
};

const createSignatureInputShape = {
  document_id: z.string(),
  signer_email: z.string().email(),
  signer_name: z.string(),
  title: z.string(),
};

export const externalCreateSignatureDocumenso: McpToolDefinition<
  typeof createSignatureInputShape
> = {
  name: "external_create_signature_documenso",
  description:
    "Generates an electronic signature request on Documenso for a Loan Agreement or Promissory Note PDF.",
  inputSchema: createSignatureInputShape,
  category: "write",
  requiresRole: "agent",
  requiresScope: "mcp:write",
  handler: async (input) => {
    const adapter = new DocumensoSignatureAdapter();
    const res = await adapter.createSigningRequest({
      document_id: input.document_id,
      signer_email: input.signer_email,
      signer_name: input.signer_name,
      title: input.title,
    });
    return { ok: true, signingRequest: res };
  },
};

const getStorageUrlInputShape = {
  key: z.string(),
  expires_in_seconds: z.number().int().positive().optional().default(259200), // 72 hours
};

export const externalGetStorageUrlMinio: McpToolDefinition<
  typeof getStorageUrlInputShape
> = {
  name: "external_get_storage_url_minio",
  description:
    "Generates a secure, expiring signed URL for a document or PDF stored in self-hosted MinIO object storage.",
  inputSchema: getStorageUrlInputShape,
  category: "read",
  requiresRole: "agent",
  requiresScope: "mcp:read",
  handler: async (input) => {
    const adapter = new MinioStorageAdapter();
    const res = await adapter.getSignedUrl(
      input.key,
      input.expires_in_seconds,
    );
    return { ok: true, signedUrl: res };
  },
};
