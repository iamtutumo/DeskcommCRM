-- =============================================================================
-- Migration 0136_mifos_complete_catalogs_and_sync
-- Technical Specification 18 (v0.5) — Complete Reference Catalogs & Account Sync
-- Architectural Owner: Tutu Moses (iamtutumo)
-- =============================================================================

-- 1. Branches / Offices Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_office_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "external_id" "text",
    "opening_date" date,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_branches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_branches_org_office_uniq" UNIQUE ("organization_id", "fineract_office_id")
);
ALTER TABLE "public"."mifos_branches" OWNER TO "postgres";
ALTER TABLE "public"."mifos_branches" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_branches_org_policy" ON "public"."mifos_branches"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 2. Staff / Loan Officers Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_staff_id" bigint NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "office_id" bigint NOT NULL,
    "office_name" "text" NOT NULL,
    "is_loan_officer" boolean DEFAULT true NOT NULL,
    "mobile_no" "text",
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_staff_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_staff_org_staff_uniq" UNIQUE ("organization_id", "fineract_staff_id")
);
ALTER TABLE "public"."mifos_staff" OWNER TO "postgres";
ALTER TABLE "public"."mifos_staff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_staff_org_policy" ON "public"."mifos_staff"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 3. Loan Products Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_loan_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_product_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "short_name" "text" NOT NULL,
    "currency_code" character(3) DEFAULT 'UGX'::"bpchar" NOT NULL,
    "min_principal_minor_units" bigint,
    "max_principal_minor_units" bigint,
    "default_principal_minor_units" bigint,
    "interest_rate_per_period" numeric(10,4),
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_loan_products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_loan_products_org_product_uniq" UNIQUE ("organization_id", "fineract_product_id")
);
ALTER TABLE "public"."mifos_loan_products" OWNER TO "postgres";
ALTER TABLE "public"."mifos_loan_products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_loan_products_org_policy" ON "public"."mifos_loan_products"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 4. Savings Products Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_savings_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_product_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "short_name" "text" NOT NULL,
    "currency_code" character(3) DEFAULT 'UGX'::"bpchar" NOT NULL,
    "nominal_annual_interest_rate" numeric(10,4),
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_savings_products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_savings_products_org_product_uniq" UNIQUE ("organization_id", "fineract_product_id")
);
ALTER TABLE "public"."mifos_savings_products" OWNER TO "postgres";
ALTER TABLE "public"."mifos_savings_products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_savings_products_org_policy" ON "public"."mifos_savings_products"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 5. Share Equity Products Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_share_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_product_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "short_name" "text" NOT NULL,
    "currency_code" character(3) DEFAULT 'UGX'::"bpchar" NOT NULL,
    "unit_price_minor_units" bigint,
    "total_shares" bigint,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_share_products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_share_products_org_product_uniq" UNIQUE ("organization_id", "fineract_product_id")
);
ALTER TABLE "public"."mifos_share_products" OWNER TO "postgres";
ALTER TABLE "public"."mifos_share_products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_share_products_org_policy" ON "public"."mifos_share_products"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 6. Savings Accounts Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_savings_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_savings_id" bigint NOT NULL,
    "account_no" "text" NOT NULL,
    "client_id" "uuid",
    "fineract_client_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "product_name" "text" NOT NULL,
    "status_code" "text" NOT NULL,
    "account_balance_minor_units" bigint DEFAULT 0 NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_savings_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_savings_accounts_org_savings_uniq" UNIQUE ("organization_id", "fineract_savings_id")
);
ALTER TABLE "public"."mifos_savings_accounts" OWNER TO "postgres";
ALTER TABLE "public"."mifos_savings_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_savings_accounts_org_policy" ON "public"."mifos_savings_accounts"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 7. Share Equity Accounts Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_share_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_share_id" bigint NOT NULL,
    "account_no" "text" NOT NULL,
    "client_id" "uuid",
    "fineract_client_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "product_name" "text" NOT NULL,
    "status_code" "text" NOT NULL,
    "total_approved_shares" bigint DEFAULT 0 NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_share_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mifos_share_accounts_org_share_uniq" UNIQUE ("organization_id", "fineract_share_id")
);
ALTER TABLE "public"."mifos_share_accounts" OWNER TO "postgres";
ALTER TABLE "public"."mifos_share_accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_share_accounts_org_policy" ON "public"."mifos_share_accounts"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 8. Loan Charges / Fees Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_loan_charges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_charge_id" bigint NOT NULL,
    "fineract_loan_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "amount_minor_units" bigint NOT NULL,
    "amount_paid_minor_units" bigint DEFAULT 0 NOT NULL,
    "amount_outstanding_minor_units" bigint NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_loan_charges_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."mifos_loan_charges" OWNER TO "postgres";
ALTER TABLE "public"."mifos_loan_charges" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_loan_charges_org_policy" ON "public"."mifos_loan_charges"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 9. Repayment Schedules Cache
CREATE TABLE IF NOT EXISTS "public"."mifos_repayment_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "fineract_loan_id" bigint NOT NULL,
    "period_number" integer NOT NULL,
    "due_date" date NOT NULL,
    "principal_due_minor_units" bigint NOT NULL,
    "interest_due_minor_units" bigint NOT NULL,
    "fee_charges_due_minor_units" bigint DEFAULT 0 NOT NULL,
    "penalty_charges_due_minor_units" bigint DEFAULT 0 NOT NULL,
    "total_due_minor_units" bigint NOT NULL,
    "total_paid_minor_units" bigint DEFAULT 0 NOT NULL,
    "total_outstanding_minor_units" bigint NOT NULL,
    "is_complete" boolean DEFAULT false NOT NULL,
    "last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mifos_repayment_schedules_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."mifos_repayment_schedules" OWNER TO "postgres";
ALTER TABLE "public"."mifos_repayment_schedules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mifos_repayment_schedules_org_policy" ON "public"."mifos_repayment_schedules"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

notify pgrst, 'reload schema';
