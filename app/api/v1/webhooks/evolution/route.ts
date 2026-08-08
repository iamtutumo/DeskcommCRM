/**
 * POST /api/v1/webhooks/evolution — receiver global do webhook da Evolution API.
 *
 * Usado quando a Evolution tem um WEBHOOK_GLOBAL_URL único (docker-compose
 * atual) apontando para esta rota. Resolve a channel_session por
 * `body.instance` (= evolution_session_name).
 *
 * Pipeline: lookup session -> loga em webhook_events_log -> dispatchEvolutionEvent
 * (ponte para a ingestão compartilhada, ver lib/evolution/ingest.ts).
 *
 * A Evolution API NÃO assina o webhook por padrão (o `WEBHOOK_GLOBAL_ENABLED`
 * envia JSON sem HMAC) — por isso, diferente do WAHA, não há verificação de
 * assinatura aqui. Se você rodar a Evolution atrás de um proxy que assina, a
 * verificação deve morar no proxy.
 */
import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/wrappers";
import { audit } from "@/lib/audit";
import { ARCHIVED_AT, queryTolerantToMissingArchived } from "@/lib/channels/archived";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dispatchEvolutionEvent,
  type EvolutionWebhookEnvelope,
} from "@/lib/evolution/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = randomUUID();

  const rawBody = await req.text();
  let envelope: EvolutionWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody) as EvolutionWebhookEnvelope;
  } catch {
    return fail("invalid_request", "invalid_json", 400, { requestId });
  }

  const instanceName = envelope.instance;
  if (!instanceName) {
    return fail("invalid_request", "missing instance field", 400, { requestId });
  }

  const admin = createAdminClient();

  // Canal ARQUIVADO não ingere — mesmo motivo dos outros receivers: a sessão já
  // foi removida do transporte e o que chega é evento em voo.
  const base = () =>
    admin
      .from("channel_sessions")
      .select("id, organization_id, evolution_session_name, status, is_warmup_complete, warmup_started_at")
      .eq("evolution_session_name", instanceName);
  const { data: session, error: sessErr } = await queryTolerantToMissingArchived(
    () => base().is(ARCHIVED_AT, null).maybeSingle(),
    () => base().maybeSingle(),
  );

  if (sessErr) {
    return fail("internal_error", sessErr.message, 500, { requestId });
  }
  if (!session) {
    // Sessão ainda não registrada no nosso DB — aceita e ignora (200 para a
    // Evolution não ficar retentando). Comum quando a instância foi criada na
    // API antes da nossa linha existir.
    return ok(
      { accepted: false, reason: "session_not_registered", instance: instanceName },
      { requestId },
    );
  }

  const eventType = envelope.event ?? "unknown";
  const data = envelope.data as { key?: { id?: unknown } } | undefined;
  const externalId =
    typeof data?.key?.id === "string" ? data.key.id : (data?.key?.id ?? null);

  const headersJson: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith("authorization")) return;
    if (key.toLowerCase() === "cookie") return;
    headersJson[key] = value;
  });
  await admin.from("webhook_events_log").insert({
    organization_id: session.organization_id,
    channel_session_id: session.id,
    provider: "evolution",
    webhook_path_token: null,
    http_method: "POST",
    headers: headersJson,
    raw_body: rawBody,
    payload_parsed: envelope as unknown as Record<string, unknown>,
    signature_header: null,
    valid_signature: null,
    event_type: eventType,
    external_id: externalId as string | null,
    status: "received",
    attempts: 0,
  });

  try {
    await dispatchEvolutionEvent(admin, session, envelope, requestId);
  } catch (err) {
    console.error("[evolution.webhook] handler failed", err);
    await audit({
      action: "webhook.dispatch_failed",
      organizationId: session.organization_id,
      metadata: { provider: "evolution", session: instanceName, event: eventType },
    });
  }

  return ok({ accepted: true }, { requestId });
}
