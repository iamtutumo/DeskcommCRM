import { describe, expect, it } from "vitest";

import { EvolutionApiClient } from "@/lib/evolution/api-client";
import { isEvolutionConfigured } from "@/lib/evolution/config";

describe("EvolutionApiClient — Evolution API WhatsApp Engine", () => {
  it("reports unconfigured state when EVOLUTION_API_URL or KEY is missing", () => {
    expect(isEvolutionConfigured()).toBe(false);
  });

  it("throws clear error when creating client without required config", () => {
    expect(() => new EvolutionApiClient()).toThrow(
      "EvolutionApiClient is not configured: set EVOLUTION_API_URL and EVOLUTION_API_KEY.",
    );
  });

  it("instantiates successfully when explicit EvolutionConfig override is passed", () => {
    const client = new EvolutionApiClient({
      baseUrl: "https://evolution.local.app",
      apiKey: "test-evolution-key",
      instanceName: "deskcomm-instance-01",
    });

    expect(client).toBeDefined();
  });
});
