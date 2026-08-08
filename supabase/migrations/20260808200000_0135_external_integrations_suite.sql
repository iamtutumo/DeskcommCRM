-- =============================================================================
-- Migration 0135_external_integrations_suite
-- Technical Specification 20 — External Integrations Suite
-- (EgoSMS, Documenso, HeyForms, IdSwyft, MinIO)
-- =============================================================================

CREATE TABLE IF NOT EXISTS "public"."tenant_external_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "config_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'not_configured'::"text" NOT NULL,
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tenant_external_integrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tenant_external_integrations_org_provider_uniq" UNIQUE ("organization_id", "provider"),
    CONSTRAINT "tenant_external_integrations_provider_check" CHECK (("provider" = ANY (ARRAY['egosms'::"text", 'documenso'::"text", 'heyforms'::"text", 'idswyft'::"text", 'minio'::"text"]))),
    CONSTRAINT "tenant_external_integrations_status_check" CHECK (("status" = ANY (ARRAY['ready'::"text", 'connecting'::"text", 'error'::"text", 'not_configured'::"text"])))
);

ALTER TABLE "public"."tenant_external_integrations" OWNER TO "postgres";
ALTER TABLE "public"."tenant_external_integrations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_external_integrations_org_policy" ON "public"."tenant_external_integrations"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));
