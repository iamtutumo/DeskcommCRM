-- =============================================================================
-- Migration 0132_mifos_accounting_and_evolution
-- Technical Specification 18 (v0.3) — Authoritative Accounting & Evolution API
-- =============================================================================

-- 1. Allow 'evolution' in channel_sessions provider check
ALTER TABLE "public"."channel_sessions"
  DROP CONSTRAINT IF EXISTS "channel_sessions_provider_check";

ALTER TABLE "public"."channel_sessions"
  ADD CONSTRAINT "channel_sessions_provider_check"
  CHECK (("provider" = ANY (ARRAY['waha'::"text", 'meta_cloud'::"text", 'evolution'::"text"])));

-- 2. Chart of Accounts Table
CREATE TABLE IF NOT EXISTS "public"."accounting_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "currency" character(3) DEFAULT 'USD'::"bpchar" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounting_accounts_org_code_uniq" UNIQUE ("organization_id", "code"),
    CONSTRAINT "accounting_accounts_type_check" CHECK (("type" = ANY (ARRAY['asset'::"text", 'liability'::"text", 'equity'::"text", 'revenue'::"text", 'expense'::"text"])))
);

ALTER TABLE "public"."accounting_accounts" OWNER TO "postgres";
ALTER TABLE "public"."accounting_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_accounts_org_policy" ON "public"."accounting_accounts"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 3. Double-Entry Journal Entries Table
CREATE TABLE IF NOT EXISTS "public"."accounting_journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entry_date" date NOT NULL,
    "description" "text" NOT NULL,
    "reference_id" "text",
    "reference_type" "text",
    "status" "text" DEFAULT 'posted'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accounting_journal_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounting_journal_entries_status_check" CHECK (("status" = ANY (ARRAY['posted'::"text", 'voided'::"text"])))
);

ALTER TABLE "public"."accounting_journal_entries" OWNER TO "postgres";
ALTER TABLE "public"."accounting_journal_entries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_journal_entries_org_policy" ON "public"."accounting_journal_entries"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 4. Journal Lines Table (Debit and Credit entries)
CREATE TABLE IF NOT EXISTS "public"."accounting_journal_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "journal_entry_id" "uuid" NOT NULL,
    "account_code" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "debit_cents" bigint DEFAULT 0 NOT NULL,
    "credit_cents" bigint DEFAULT 0 NOT NULL,
    "memo" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accounting_journal_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounting_journal_lines_non_negative_check" CHECK ((("debit_cents" >= 0) AND ("credit_cents" >= 0)))
);

ALTER TABLE "public"."accounting_journal_lines" OWNER TO "postgres";
ALTER TABLE "public"."accounting_journal_lines" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_journal_lines_org_policy" ON "public"."accounting_journal_lines"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));
