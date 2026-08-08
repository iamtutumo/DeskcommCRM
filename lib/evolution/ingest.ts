/**
 * lib/evolution/ingest.ts — ponte do webhook da Evolution API para a ingestão
 * compartilhada do CRM.
 *
 * A Evolution API também é um engine Baileys, então o payload do webhook traz a
 * estrutura Baileys que `lib/waha/ingest.ts` já sabe parser (key.remoteJid,
 * key.fromMe, key.id, messageTimestamp, pushName, message.<tipo>Message). Em vez
 * de duplicar as ~800 linhas de resolução atômica de contato/conversa, este
 * módulo traduz o envelope da Evolution para o `WahaEnvelope` e delega a
 * `dispatchWahaEvent`.
 *
 * Eventos tratados:
 *   messages.upsert   → message (entrada/saída pelo telefone pareado)
 *   messages.update   → message.ack (confirmação de entrega/leitura)
 *   connection.update → session.status (QR / CONNECTED / close)
 */
import { dispatchWahaEvent, type WahaEnvelope, type WahaPayload } from "@/lib/waha/ingest";

type Admin = Parameters<typeof dispatchWahaEvent>[0];
type Session = Parameters<typeof dispatchWahaEvent>[1];

/** Forma mínima do corpo do webhook da Evolution API. */
export interface EvolutionWebhookEnvelope {
  event?: string;
  instance?: string;
  data?: Record<string, unknown>;
}

interface BaileysKey {
  remoteJid?: string;
  participant?: string;
  fromMe?: boolean;
  id?: string;
}

interface BaileysData extends Record<string, unknown> {
  key?: BaileysKey;
  message?: Record<string, unknown>;
  messageTimestamp?: number;
  pushName?: string;
  notifyName?: string;
  /** `messages.update` traz `status` (PENDING|DELIVERY_ACK|READ...) no data. */
  status?: string;
}

/** Extrai o texto de uma mensagem Baileys (conversation / extendedTextMessage). */
function textFromMessage(message: Record<string, unknown> | undefined): string {
  if (!message) return "";
  const conversation = message.conversation;
  if (typeof conversation === "string") return conversation;
  const ext = message.extendedTextMessage as { text?: unknown } | undefined;
  if (ext && typeof ext.text === "string") return ext.text;
  return "";
}

/**
 * Detector de mídia: mensagem Baileys com conteúdo além de texto. Não-lista de
 * exceções — qualquer `*Message` que não seja texto é mídia.
 */
function mediaTypeOf(message: Record<string, unknown> | undefined): {
  hasMedia: boolean;
  kind: string | undefined;
  url: string | null;
  mimetype: string | null;
  filename: string | null;
} | null {
  if (!message) return null;
  const mediaTypes = ["image", "document", "video", "audio", "sticker"];
  for (const kind of mediaTypes) {
    const bloco = message[`${kind}Message`] as Record<string, unknown> | undefined;
    if (!bloco) continue;
    return {
      hasMedia: true,
      kind,
      url: typeof bloco.url === "string" ? bloco.url : null,
      mimetype: typeof bloco.mimetype === "string" ? bloco.mimetype : null,
      filename: typeof bloco.fileName === "string" ? bloco.fileName : null,
    };
  }
  return null;
}

/** Mapeia `event`/`status` da Evolution para o vocabulário de eventos do ingest. */
function mapEvent(env: EvolutionWebhookEnvelope): { event: string; ack?: number } {
  switch (env.event) {
    case "messages.upsert":
      return { event: "message" };
    case "messages.update": {
      const data = (env.data ?? {}) as BaileysData;
      const status = (data.status ?? "").toUpperCase();
      // PENDING=0 / DELIVERY_ACK=2 / READ=3 / PLAYED=4 — ackToStatus entende.
      const ack = status.includes("READ")
        ? 3
        : status.includes("PLAYED")
          ? 4
          : status.includes("DELIVERY")
            ? 2
            : 0;
      return { event: "message.ack", ack };
    }
    case "connection.update":
      return { event: "session.status" };
    default:
      return { event: env.event ?? "unknown" };
  }
}

/** Traduz o webhook da Evolution para o `WahaEnvelope` que o ingest espera. */
export function evolutionToWahaEnvelope(env: EvolutionWebhookEnvelope): WahaEnvelope {
  const data = (env.data ?? {}) as BaileysData;
  const key = data.key ?? {};
  const msg = data.message;
  const media = mediaTypeOf(msg);
  const { event, ack } = mapEvent(env);

  const payload: WahaPayload = {
    id: key.id,
    from: key.remoteJid,
    fromMe: key.fromMe ?? false,
    participant: key.participant,
    timestamp: typeof data.messageTimestamp === "number" ? data.messageTimestamp : undefined,
    body: textFromMessage(msg),
    hasMedia: media?.hasMedia ?? false,
    type: media?.kind,
    ack,
    media: media?.hasMedia
      ? { url: media.url, mimetype: media.mimetype, filename: media.filename }
      : undefined,
    // O ingest lê `_data.notifyName`, `_data.key.remoteJidAlt`, etc. — passar o
    // `data` inteiro preserva esses campos Baileys que a Evolution repassa.
    _data: data,
  };

  return {
    event,
    session: env.instance ?? "",
    payload,
  };
}

/** Despacha um webhook da Evolution para a ingestão compartilhada. */
export async function dispatchEvolutionEvent(
  admin: Admin,
  session: Session,
  envelope: EvolutionWebhookEnvelope,
  requestId: string,
): Promise<void> {
  const wahaEnvelope = evolutionToWahaEnvelope(envelope);
  await dispatchWahaEvent(admin, session, wahaEnvelope, requestId);
}
