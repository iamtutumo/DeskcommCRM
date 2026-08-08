/**
 * Watchdog de sessão (Fase 4A-2) — o pedaço do Vendaval que ficou de fora do
 * porte e cuja falta causou o incidente real das mensagens presas: o webhook
 * session.status se perde num restart e o espelho `channel_sessions` diverge do
 * transporte real; como o envio exige WORKING no espelho, respostas ficam `queued`
 * para sempre.
 *
 * Dois deveres, um tick:
 *   1. RECONCILIADOR: lê o status REAL das sessões no transporte (WAHA e/ou
 *      Evolution) e corrige o espelho quando divergir (a fonte da verdade do
 *      status é o transporte);
 *   2. REDRIVE: mensagens `sent_via='ai'` presas em `queued` cuja sessão está
 *      WORKING são reenviadas pelo transporte do canal (com espaçamento
 *      anti-rajada) e marcadas `sent` — nunca dropadas, nunca duplicadas (só
 *      linhas ainda `queued`).
 *
 * Regra dura nº 4 respeitada: message-plane nunca fala com o transporte — este
 * módulo é o WATCHDOG (admin-plane), o único lugar do engine autorizado a falar
 * com o WAHA/Evolution diretamente (o envio normal segue via sendMessageHandler).
 */
import type pg from 'pg';

import { evolutionStateToChannelStatus } from '@/lib/channels/transport';
import { parseWahaMessageId } from '@/lib/waha/message-id';

import type { Logger } from '../../obs/logger';

/** Credenciais de um transporte (WAHA ou Evolution). */
export interface TransportCreds {
  baseUrl: string;
  apiKey: string;
}

export interface WatchdogConfig {
  /** WAHA (legado). Ausente = watchdog de WAHA OFF. */
  waha?: TransportCreds;
  /** Evolution API (transporte novo). Ausente = watchdog de Evolution OFF. */
  evolution?: TransportCreds & { instanceName?: string };
  /** intervalo do tick (knob WATCHDOG_INTERVAL_MS) */
  intervalMs: number;
  /** idade mínima de uma queued para redrive — evita corrida com o insert do handler */
  redriveMinAgeMs: number;
  /** teto de redrives por tick (anti-rajada) */
  redriveBatchSize: number;
  /** espaçamento entre redrives (base + jitter) */
  redriveSpacingMs: number;
}

interface RemoteSession {
  /** nome da sessão no transporte (waha_session_name OU evolution_session_name) */
  name: string;
  status: string;
  provider: 'waha' | 'evolution';
}

/** Lista as sessões do WAHA. Null = transporte fora (tick pula, não derruba). */
async function fetchWahaSessions(cfg: WatchdogConfig): Promise<RemoteSession[] | null> {
  if (!cfg.waha) return null;
  try {
    const res = await fetch(`${cfg.waha.baseUrl}/api/sessions?all=true`, {
      headers: { 'X-Api-Key': cfg.waha.apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { name: string; status: string }[];
    if (!Array.isArray(data)) return null;
    return data.map((s) => ({ name: s.name, status: s.status, provider: 'waha' as const }));
  } catch {
    return null;
  }
}

/**
 * Lista as sessões da Evolution via /instance/fetchInstances.
 *
 * `connectionStatus` é `open` | `connecting` | `close`; mapeamos para o
 * vocabulário canônico (WORKING/SCAN_QR_CODE/STOPPED) já aqui, para o
 * reconciliador só gravar o que o banco entende.
 */
async function fetchEvolutionSessions(cfg: WatchdogConfig): Promise<RemoteSession[] | null> {
  if (!cfg.evolution) return null;
  try {
    const res = await fetch(`${cfg.evolution.baseUrl}/instance/fetchInstances`, {
      headers: { apikey: cfg.evolution.apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      instanceName?: string;
      connectionStatus?: string;
    }[];
    if (!Array.isArray(data)) return null;
    return data
      .filter((s) => typeof s.instanceName === 'string' && s.instanceName)
      .map((s) => ({
        name: s.instanceName as string,
        status: evolutionStateToChannelStatus(s.connectionStatus),
        provider: 'evolution' as const,
      }));
  } catch {
    return null;
  }
}

/** Corrige o espelho channel_sessions para o status REAL do transporte. */
export async function reconcileSessions(
  pool: pg.Pool,
  cfg: WatchdogConfig,
  log: Logger,
): Promise<number> {
  const [wahaSessions, evolutionSessions] = await Promise.all([
    fetchWahaSessions(cfg),
    fetchEvolutionSessions(cfg),
  ]);
  const sessions: RemoteSession[] = [
    ...(wahaSessions ?? []),
    ...(evolutionSessions ?? []),
  ];
  if (sessions.length === 0) {
    const algum = Boolean(cfg.waha || cfg.evolution);
    if (algum) {
      log.warn('watchdog: transporte indisponível — tick de reconciliação pulado', {});
    }
    return 0;
  }

  let fixed = 0;
  for (const s of sessions) {
    const coluna = s.provider === 'evolution' ? 'evolution_session_name' : 'waha_session_name';
    const { rows } = await pool.query<{ id: string; status: string }>(
      `update channel_sessions
       set status = $2, updated_at = now()
       where ${coluna} = $1 and status is distinct from $2
       returning id, status`,
      [s.name, s.status],
    );
    for (const row of rows) {
      fixed += 1;
      log.warn('watchdog: espelho de sessão reconciliado com o transporte real', {
        channel_session_id: row.id,
        provider: s.provider,
        session: s.name,
        status: s.status,
      });
    }
  }
  return fixed;
}

interface QueuedRow {
  id: string;
  organization_id: string;
  body: string | null;
  provider: string | null;
  waha_session_name: string | null;
  evolution_session_name: string | null;
  wa_identity: string | null;
  wa_lid: string | null;
  phone_number: string | null;
  is_group: boolean;
  group_chat_id: string | null;
}

/**
 * chatId do WAHA a partir da identidade do contato — MESMA REGRA de
 * `resolveWahaChatId` (lib/waha/send.ts), e as duas precisam continuar iguais:
 * este caminho reenvia o que aquele deixou preso, e divergir aqui faria o
 * redrive mandar a mensagem para um endereço diferente do envio original.
 *
 * `wa_lid` na frente pelo motivo da 0122: `wa_identity` é GERADA com o telefone
 * antes do lid, então o contato @lid que ganhou número passa a bater na linha do
 * `phone:` e a conversa mudaria de canal no reenvio.
 *
 * A Evolution também é Baileys e usa o mesmo endereço JID; o `chatIdOf` devolve
 * o JID com sufixo (@c.us / @lid / @g.us) e o `EvolutionApiClient.sendText`
 * normaliza para dígitos no próprio envio — os dois se combinam.
 */
function chatIdOf(m: QueuedRow): string | null {
  if (m.is_group && m.group_chat_id) return m.group_chat_id;
  if (m.wa_lid) return `${m.wa_lid}@lid`;
  if (m.wa_identity?.startsWith('lid:')) return `${m.wa_identity.slice(4)}@lid`;
  if (m.wa_identity?.startsWith('phone:+')) return `${m.wa_identity.slice(7)}@c.us`;
  if (m.phone_number) return `${m.phone_number.replace('+', '')}@c.us`;
  return null;
}

/** Envia um texto de redrive pelo WAHA. Devolve o id externo ou null. */
async function redriveViaWaha(
  cfg: WatchdogConfig,
  sessionName: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; externalId: string | null }> {
  if (!cfg.waha) return { ok: false, externalId: null };
  const res = await fetch(`${cfg.waha.baseUrl}/api/sendText`, {
    method: 'POST',
    headers: { 'X-Api-Key': cfg.waha.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: sessionName, chatId, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return { ok: false, externalId: null };
  const data = (await res.json().catch(() => null)) as unknown;
  return { ok: true, externalId: parseWahaMessageId(data) };
}

/** Envia um texto de redrive pela Evolution. Devolve o id externo ou null. */
async function redriveViaEvolution(
  cfg: WatchdogConfig,
  sessionName: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; externalId: string | null }> {
  if (!cfg.evolution) return { ok: false, externalId: null };
  const cleanNumber = chatId.replace(/\D/g, '');
  const res = await fetch(
    `${cfg.evolution.baseUrl}/message/sendText/${encodeURIComponent(sessionName)}`,
    {
      method: 'POST',
      headers: { apikey: cfg.evolution.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: cleanNumber,
        textMessage: { text },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) return { ok: false, externalId: null };
  const data = (await res.json().catch(() => null)) as { key?: { id?: string } } | null;
  return { ok: true, externalId: data?.key?.id ?? null };
}

/** Reenvia mensagens AI presas em queued com sessão WORKING. */
export async function redriveQueued(
  pool: pg.Pool,
  cfg: WatchdogConfig,
  log: Logger,
): Promise<number> {
  const { rows } = await pool.query<QueuedRow>(
    `select m.id, m.organization_id, m.body, s.provider,
            s.waha_session_name, s.evolution_session_name,
            c.wa_identity, c.wa_lid, c.phone_number, v.is_group, v.group_chat_id
     from messages m
     join channel_sessions s on s.id = m.channel_session_id
     join conversations v on v.id = m.conversation_id
     join contacts c on c.id = m.contact_id
     where m.sent_via = 'ai' and m.status = 'queued'
       and s.status = 'WORKING'
       and c.is_blocked = false
       and m.created_at < now() - make_interval(secs => $1 / 1000.0)
     order by m.created_at
     limit $2`,
    [cfg.redriveMinAgeMs, cfg.redriveBatchSize],
  );

  let sent = 0;
  for (const m of rows) {
    const chatId = chatIdOf(m);
    if (chatId === null || m.body === null) {
      log.warn('watchdog: queued sem destino/corpo — pulada', { message_id: m.id });
      continue;
    }
    try {
      const provider = m.provider === 'evolution' ? 'evolution' : 'waha';
      const sessionName =
        provider === 'evolution' ? m.evolution_session_name : m.waha_session_name;
      if (!sessionName) {
        log.warn('watchdog: queued sem nome de sessão — pulada', { message_id: m.id });
        continue;
      }

      const res =
        provider === 'evolution'
          ? await redriveViaEvolution(cfg, sessionName, chatId, m.body)
          : await redriveViaWaha(cfg, sessionName, chatId, m.body);
      if (!res.ok) {
        log.warn('watchdog: redrive falhou no transporte — mantida queued para o próximo tick', {
          message_id: m.id,
          provider,
        });
        continue;
      }
      await pool.query(
        `update messages
         set status = 'sent', ack = 0,
             external_id = coalesce($2, external_id),
             metadata = metadata || '{"redrive":"watchdog"}'::jsonb
         where id = $1 and status = 'queued'`,
        [m.id, res.externalId],
      );
      sent += 1;
      log.info('watchdog: mensagem presa reenviada', {
        message_id: m.id,
        provider,
        has_external_id: res.externalId !== null,
      });
    } catch (err) {
      log.warn('watchdog: redrive com erro transiente — mantida queued', {
        message_id: m.id,
        error: (err instanceof Error ? err.message : String(err)).slice(0, 120),
      });
    }
    // espaçamento anti-rajada entre reenvios
    await new Promise((r) => setTimeout(r, cfg.redriveSpacingMs + Math.random() * cfg.redriveSpacingMs));
  }
  return sent;
}

/** Loop do watchdog — reconcilia e redrive a cada tick; erro nunca derruba o worker. */
export async function runSessionWatchdogLoop(
  pool: pg.Pool,
  cfg: WatchdogConfig,
  log: Logger,
  signal: AbortSignal,
): Promise<void> {
  while (!signal.aborted) {
    try {
      const fixed = await reconcileSessions(pool, cfg, log);
      const redriven = await redriveQueued(pool, cfg, log);
      if (fixed + redriven > 0) {
        log.info('watchdog: tick com ação', { reconciled: fixed, redriven });
      }
    } catch (err) {
      log.error('watchdog: tick falhou', {
        error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      });
    }
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, cfg.intervalMs);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }
}
