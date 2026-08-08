-- =============================================================================
-- Migration 0134_record_chatter_and_audit_trail
-- Technical Specification 19 — Odoo-Inspired Business Record Collaboration Suite
-- =============================================================================

-- 1. Immutable Audit Trail Table
CREATE TABLE IF NOT EXISTS "public"."record_audit_trail" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "changed_by_user_id" "text" NOT NULL,
    "changed_by_name" "text" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_audit_trail_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "record_audit_trail_type_check" CHECK (("record_type" = ANY (ARRAY['claim'::"text", 'loan'::"text", 'customer'::"text", 'opportunity'::"text", 'invoice'::"text", 'ticket'::"text"])))
);

ALTER TABLE "public"."record_audit_trail" OWNER TO "postgres";
ALTER TABLE "public"."record_audit_trail" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_audit_trail_org_policy" ON "public"."record_audit_trail"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 2. Record Chatter Messages Table
CREATE TABLE IF NOT EXISTS "public"."record_chatter_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "author_id" "text" NOT NULL,
    "author_name" "text" NOT NULL,
    "message_type" "text" DEFAULT 'note'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "mentions" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "attachment_ids" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_chatter_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "record_chatter_messages_type_check" CHECK (("message_type" = ANY (ARRAY['note'::"text", 'email'::"text", 'comment'::"text"])))
);

ALTER TABLE "public"."record_chatter_messages" OWNER TO "postgres";
ALTER TABLE "public"."record_chatter_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_chatter_messages_org_policy" ON "public"."record_chatter_messages"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 3. Record Followers Table
CREATE TABLE IF NOT EXISTS "public"."record_followers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "user_id" "text" NOT NULL,
    "user_name" "text" NOT NULL,
    "user_email" "text" NOT NULL,
    "subscribed_events" "text"[] DEFAULT ARRAY['status_change'::"text", 'new_message'::"text", 'document_upload'::"text", 'activity_assigned'::"text"]::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_followers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "record_followers_unique_sub" UNIQUE ("organization_id", "record_type", "record_id", "user_id")
);

ALTER TABLE "public"."record_followers" OWNER TO "postgres";
ALTER TABLE "public"."record_followers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_followers_org_policy" ON "public"."record_followers"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 4. Record Mentions Table
CREATE TABLE IF NOT EXISTS "public"."record_mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "chatter_message_id" "text" NOT NULL,
    "mentioned_user_id" "text" NOT NULL,
    "mentioned_user_name" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_mentions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."record_mentions" OWNER TO "postgres";
ALTER TABLE "public"."record_mentions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_mentions_org_policy" ON "public"."record_mentions"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 5. Record Activities Table
CREATE TABLE IF NOT EXISTS "public"."record_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "assigned_to_user_id" "text" NOT NULL,
    "assigned_to_name" "text" NOT NULL,
    "due_date" date NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by_user_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "record_activities_type_check" CHECK (("activity_type" = ANY (ARRAY['call'::"text", 'email'::"text", 'meeting'::"text", 'todo'::"text", 'follow_up'::"text", 'review_document'::"text"]))),
    CONSTRAINT "record_activities_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'overdue'::"text"])))
);

ALTER TABLE "public"."record_activities" OWNER TO "postgres";
ALTER TABLE "public"."record_activities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_activities_org_policy" ON "public"."record_activities"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 6. Record Emails Table
CREATE TABLE IF NOT EXISTS "public"."record_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "from_address" "text" NOT NULL,
    "to_addresses" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "cc_addresses" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "bcc_addresses" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "subject" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "body_text" "text" NOT NULL,
    "attachment_ids" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "message_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_emails_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "record_emails_dir_check" CHECK (("direction" = ANY (ARRAY['outbound'::"text", 'inbound'::"text"])))
);

ALTER TABLE "public"."record_emails" OWNER TO "postgres";
ALTER TABLE "public"."record_emails" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_emails_org_policy" ON "public"."record_emails"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 7. Record Attachments Table
CREATE TABLE IF NOT EXISTS "public"."record_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by_user_id" "text" NOT NULL,
    "uploaded_by_name" "text" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "record_attachments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."record_attachments" OWNER TO "postgres";
ALTER TABLE "public"."record_attachments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_attachments_org_policy" ON "public"."record_attachments"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 8. User Discuss Channels Table (Direct & Group Chat)
CREATE TABLE IF NOT EXISTS "public"."user_discuss_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "member_user_ids" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_discuss_channels_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."user_discuss_channels" OWNER TO "postgres";
ALTER TABLE "public"."user_discuss_channels" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_discuss_channels_org_policy" ON "public"."user_discuss_channels"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));

-- 9. User Discuss Messages Table
CREATE TABLE IF NOT EXISTS "public"."user_discuss_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "author_id" "text" NOT NULL,
    "author_name" "text" NOT NULL,
    "content" "text" NOT NULL,
    "mentions" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "attachment_ids" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_discuss_messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."user_discuss_messages" OWNER TO "postgres";
ALTER TABLE "public"."user_discuss_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_discuss_messages_org_policy" ON "public"."user_discuss_messages"
    USING (("organization_id" = ANY ("public"."fn_user_org_ids"())));
