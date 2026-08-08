-- =============================================================================
-- Migration 0133_mifos_transactions_and_multi_currency
-- Technical Specification 18 (v0.4) — Multi-Currency & Microfinance Transactions
-- =============================================================================

-- 1. Currency Exchange Rates Table (Default base currency: UGX)
CREATE TABLE IF NOT EXISTS "public"."currency_exchange_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "base_currency" character(3) DEFAULT 'UGX'::"bpchar" NOT NULL,
    "target_currency" character(3) NOT NULL,
    "rate" numeric(15,6) NOT NULL,
    "effective_date" date NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "currency_exchange_rates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "currency_exchange_rates_org_pair_date_uniq" UNIQUE ("organization_id", "base_currency", "target_currency", "effective_date"),
    CONSTRAINT "currency_exchange_rates_positive_check" CHECK (("rate" > 0))
);

ALTER TABLE "public"."currency_exchange_rates" OWNER TO "postgres";
ALTER TABLE "public"."currency_exchange_rates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "currency_exchange_rates_org_policy" ON "public"."currency_exchange_rates"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 2. Microfinance Operational Financial Transactions Table
CREATE TABLE IF NOT EXISTS "public"."microfinance_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "transaction_date" date NOT NULL,
    "transaction_type" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "loan_id" "text",
    "savings_id" "text",
    "share_id" "text",
    "original_currency" character(3) DEFAULT 'UGX'::"bpchar" NOT NULL,
    "original_amount_minor_units" bigint NOT NULL,
    "exchange_rate_to_base" numeric(15,6) DEFAULT 1 NOT NULL,
    "base_currency" character(3) DEFAULT 'UGX'::"bpchar" NOT NULL,
    "base_amount_minor_units" bigint NOT NULL,
    "payment_method" "text" DEFAULT 'cash'::"text" NOT NULL,
    "reference_number" "text",
    "journal_entry_id" "uuid",
    "notes" "text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "microfinance_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "microfinance_transactions_positive_amount_check" CHECK ((("original_amount_minor_units" > 0) AND ("base_amount_minor_units" > 0))),
    CONSTRAINT "microfinance_transactions_type_check" CHECK (("transaction_type" = ANY (ARRAY['loan_disbursement'::"text", 'loan_repayment'::"text", 'savings_deposit'::"text", 'savings_withdrawal'::"text", 'share_purchase'::"text"]))),
    CONSTRAINT "microfinance_transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'mobile_money'::"text", 'bank_transfer'::"text", 'pix'::"text"])))
);

ALTER TABLE "public"."microfinance_transactions" OWNER TO "postgres";
ALTER TABLE "public"."microfinance_transactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "microfinance_transactions_org_policy" ON "public"."microfinance_transactions"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));
