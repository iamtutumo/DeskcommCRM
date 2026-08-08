import { describe, expect, it } from "vitest";

import { catalogEntry } from "@/lib/mcp/tools/catalog";
import { getToolByName } from "@/lib/mcp/tools";
import {
  mifosListOffices,
  mifosListStaff,
  mifosListProducts,
  mifosGetSavingsAccounts,
  mifosGetShareAccounts,
  mifosTriggerSync,
} from "@/lib/mcp/tools/mifos";

describe("Mifos Expanded MCP Tools Suite — Branches, Staff, Products, Savings, Shares, and Sync", () => {
  const newTools = [
    "mifos_list_offices",
    "mifos_list_staff",
    "mifos_list_products",
    "mifos_get_savings_accounts",
    "mifos_get_share_accounts",
    "mifos_trigger_sync",
  ];

  it("all 6 new Mifos tools are declared in the catalog with leigo-friendly labels", () => {
    for (const name of newTools) {
      const entry = catalogEntry(name);
      expect(entry, `catalog must contain ${name}`).toBeDefined();
      expect(entry?.rotulo).toBeDefined();
      expect(entry?.explicacao.length).toBeGreaterThanOrEqual(40);
    }
  });

  it("all 6 new Mifos tools are registered in allTools and getToolByName", () => {
    for (const name of newTools) {
      const tool = getToolByName(name);
      expect(tool, `allTools must contain ${name}`).toBeDefined();
      expect(tool?.name).toBe(name);
    }
  });

  it("mifosListProducts returns available loan products by default", async () => {
    const result = (await mifosListProducts.handler(
      { product_type: "loans" },
      {} as unknown as any,
    )) as any;

    expect(result.ok).toBe(true);
    expect(result.product_type).toBe("loans");
    expect(Array.isArray(result.products)).toBe(true);
  });
});
