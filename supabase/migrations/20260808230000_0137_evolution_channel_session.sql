-- 0137 — sessão Evolution API em channel_sessions.
--
-- A migration 0132 abriu o provider 'evolution' na CHECK `channel_sessions_provider_check`,
-- mas não completou o ramo da união tagged: não criou a coluna que identifica a sessão
-- nem atualizou `channel_sessions_provider_ref_check`, que ainda exigia `waha_session_name`
-- OU `meta_phone_number_id` — então uma sessão provider='evolution' seria recusada no INSERT.
--
-- Este arquivo fecha o triângulo que a doutrina da migration 0087 descreve:
--   * `evolution_session_name` = nome da instância WhatsApp na Evolution API (a stack
--     self-host usa uma instância única, `EVOLUTION_INSTANCE_NAME`).
--   * `channel_sessions_provider_ref_check` passa a aceitar o ramo evolution.
--
-- Backfill: nenhum. Linhas existentes são 'waha' (default) e seguem satisfazendo o ramo
-- 'waha' — a coluna nova nasce NULL e a CHECK só cobra not-null por provider.

ALTER TABLE "public"."channel_sessions"
  ADD COLUMN IF NOT EXISTS "evolution_session_name" text;

DO $$ BEGIN
  ALTER TABLE "public"."channel_sessions"
    DROP CONSTRAINT IF EXISTS "channel_sessions_provider_ref_check";
  ALTER TABLE "public"."channel_sessions"
    ADD CONSTRAINT "channel_sessions_provider_ref_check" CHECK (
      (provider = 'waha'       and waha_session_name     is not null) or
      (provider = 'meta_cloud' and meta_phone_number_id  is not null) or
      (provider = 'evolution'  and evolution_session_name is not null)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN "public"."channel_sessions"."evolution_session_name" IS
  'Nome da instância WhatsApp nesta Evolution API. Espelhado em lib/channels/session-ref.ts -> ChannelSessionRef (ramo evolution).';
