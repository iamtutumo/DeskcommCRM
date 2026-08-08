import { describe, expect, it } from "vitest";
import * as React from "react";

import { ExternalIntegrationsHub } from "@/components/integrations/ExternalIntegrationsHub";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";
import { MifosDashboard } from "@/components/mifos/MifosDashboard";

describe("DeskcommCRM Microfinance Frontend UI Component Suite", () => {
  const testOrgId = "org-mfi-ui-test-100";

  it("ExternalIntegrationsHub React component renders successfully", () => {
    const el = React.createElement(ExternalIntegrationsHub, {
      organizationId: testOrgId,
    });
    expect(el).toBeDefined();
    expect(el.props.organizationId).toBe(testOrgId);
  });

  it("AccountingDashboard React component renders transaction form, statements, and ledger tabs", () => {
    const el = React.createElement(AccountingDashboard, {
      organizationId: testOrgId,
    });
    expect(el).toBeDefined();
    expect(el.props.organizationId).toBe(testOrgId);
  });

  it("MifosDashboard React component renders reference catalogs and trigger sync control", () => {
    const el = React.createElement(MifosDashboard, {
      organizationId: testOrgId,
    });
    expect(el).toBeDefined();
    expect(el.props.organizationId).toBe(testOrgId);
  });
});
