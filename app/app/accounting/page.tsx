/**
 * Authoritative Accounting Page (app/app/accounting/page.tsx).
 *
 * Dedicated double-entry accounting in UGX for DeskcommCRM.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";

export const dynamic = "force-dynamic";

export default function AccountingPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <AccountingDashboard organizationId="org-default-01" />
    </div>
  );
}
