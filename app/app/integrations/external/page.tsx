/**
 * External Integrations Hub Page (app/app/integrations/external/page.tsx).
 *
 * Dedicated management page for EgoSMS, Documenso, HeyForms, IdSwyft, and MinIO.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import { ExternalIntegrationsHub } from "@/components/integrations/ExternalIntegrationsHub";

export const dynamic = "force-dynamic";

export default function ExternalIntegrationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <ExternalIntegrationsHub organizationId="org-default-01" />
    </div>
  );
}
