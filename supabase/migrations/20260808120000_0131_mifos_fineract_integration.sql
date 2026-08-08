-- =============================================================================
-- Migration 0131_mifos_fineract_integration
-- Technical Specification 18 — Apache Fineract / Mifos X (Microfinance Integration)
-- =============================================================================

-- 1. Allow 'mifos' in the provider column of tenant_integrations
ALTER TABLE "public"."tenant_integrations"
  DROP CONSTRAINT IF EXISTS "tenant_integrations_provider_check";

ALTER TABLE "public"."tenant_integrations"
  ADD CONSTRAINT "tenant_integrations_provider_check"
  CHECK (("provider" = ANY (ARRAY['nuvemshop'::"text", 'vtex'::"text", 'shopify'::"text", 'mifos'::"text"])));

-- 2. Cache of Mifos / Apache Fineract Clients
CREATE TABLE IF NOT EXISTS "public"."mifos_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "external_id" "text",
    "fineract_client_id" bigint NOT NULL,
    "account_no" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "mobile_no" "text",
    "contact_id" "uuid",
    "status_code" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_clients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_clients_org_client_uniq" UNIQUE ("organization_id", "fineract_client_id")
);

ALTER TABLE "public"."mifos_clients" OWNER TO "postgres";
ALTER TABLE "public"."mifos_clients" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mifos_clients_org_policy" ON "public"."mifos_clients"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 3. Record of Mifos / Apache Fineract Loan Accounts
CREATE TABLE IF NOT EXISTS "public"."mifos_loan_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_loan_id" bigint NOT NULL,
    "account_no" "text" NOT NULL,
    "client_id" "uuid",
    "fineract_client_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "product_name" "text" NOT NULL,
    "status_code" "text" NOT NULL,
    "principal_cents" bigint NOT NULL,
    "total_outstanding_cents" bigint DEFAULT 0 NOT NULL,
    "total_overdue_cents" bigint DEFAULT 0 NOT NULL,
    "in_arrears" boolean DEFAULT false NOT NULL,
    "crm_lead_id" "uuid",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_loan_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_loan_accounts_org_loan_uniq" UNIQUE ("organization_id", "fineract_loan_id")
);

ALTER TABLE "public"."mifos_loan_accounts" OWNER TO "postgres";
ALTER TABLE "public"."mifos_loan_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mifos_loan_accounts_org_policy" ON "public"."mifos_loan_accounts"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));
