/**
 * Mifos Core Banking Hub Page (app/app/mifos/page.tsx).
 *
 * Dedicated sync dashboard for Branches, Staff, Products, and Customer Accounts.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import { MifosDashboard } from "@/components/mifos/MifosDashboard";

export const dynamic = "force-dynamic";

export default function MifosHubPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <MifosDashboard organizationId="org-default-01" />
    </div>
  );
}
