import { describe, expect, it } from "vitest";

import {
  EXTERNAL_INTEGRATIONS_CATALOG,
  getExternalIntegrationMetadata,
  type ExternalProviderType,
} from "@/lib/integrations/external/registry";

describe("External Integrations Suite — Menu Registry & Catalog", () => {
  const expectedProviders: ExternalProviderType[] = [
    "egosms",
    "documenso",
    "heyforms",
    "idswyft",
    "minio",
  ];

  it("contains metadata definitions for all 5 external ecosystem providers", () => {
    expect(EXTERNAL_INTEGRATIONS_CATALOG).toHaveLength(5);
    for (const p of expectedProviders) {
      const meta = getExternalIntegrationMetadata(p);
      expect(meta, `Catalog must define ${p}`).toBeDefined();
      expect(meta?.documentation_url).toMatch(/^https:\/\//);
      expect(meta?.required_fields.length).toBeGreaterThan(0);
      expect(meta?.capabilities.length).toBeGreaterThan(0);
    }
  });

  it("EgoSMS specifies East Africa SMS capabilities and required credentials", () => {
    const ego = getExternalIntegrationMetadata("egosms");
    expect(ego?.label).toContain("EgoSMS");
    expect(ego?.required_fields).toContain("username");
    expect(ego?.required_fields).toContain("sender_id");
  });

  it("MinIO specifies object storage capabilities and bucket configuration", () => {
    const minio = getExternalIntegrationMetadata("minio");
    expect(minio?.capabilities).toContain("signed_urls");
    expect(minio?.required_fields).toContain("bucket_name");
  });
});
