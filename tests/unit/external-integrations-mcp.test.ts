import { describe, expect, it } from "vitest";

import { catalogEntry } from "@/lib/mcp/tools/catalog";
import { getToolByName } from "@/lib/mcp/tools";
import {
  externalSendSmsEgosms,
  externalVerifyKycIdswyft,
  externalCreateSignatureDocumenso,
  externalGetStorageUrlMinio,
} from "@/lib/mcp/tools/external-integrations";

describe("External Integrations Suite — MCP Tools for AI Agents", () => {
  const externalTools = [
    "external_send_sms_egosms",
    "external_verify_kyc_idswyft",
    "external_create_signature_documenso",
    "external_get_storage_url_minio",
  ];

  it("all 4 external integration tools are declared in catalog.ts with Portuguese labels", () => {
    for (const name of externalTools) {
      const entry = catalogEntry(name);
      expect(entry, `catalog must contain ${name}`).toBeDefined();
      expect(entry?.rotulo).toBeDefined();
      expect(entry?.explicacao.length).toBeGreaterThanOrEqual(40);
    }
  });

  it("all 4 external integration tools are registered in allTools and getToolByName", () => {
    for (const name of externalTools) {
      const tool = getToolByName(name);
      expect(tool, `allTools must contain ${name}`).toBeDefined();
      expect(tool?.name).toBe(name);
    }
  });

  it("externalSendSmsEgosms sends an SMS and returns recipient_e164 formatted for Uganda (+256)", async () => {
    const result = (await externalSendSmsEgosms.handler(
      {
        to: "0771234567",
        message: "Your loan #100 is approved!",
      },
      {} as unknown as any,
    )) as any;

    expect(result.ok).toBe(true);
    expect(result.result.recipient_e164).toBe("+256771234567");
  });

  it("externalGetStorageUrlMinio generates an expiring signed URL from MinIO", async () => {
    const result = (await externalGetStorageUrlMinio.handler(
      {
        key: "agreements/loan-101.pdf",
        expires_in_seconds: 3600,
      },
      {} as unknown as any,
    )) as any;

    expect(result.ok).toBe(true);
    expect(result.signedUrl.signed_url).toContain("http://localhost:9000/mifos-documents/agreements/loan-101.pdf");
  });
});
