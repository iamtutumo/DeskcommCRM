/**
 * lib/channels/transport.ts — helpers de TRANSPORTE por provider (control plane).
 *
 * Vive AQUI (não em feature) porque o invariante 1 da doutrina
 * (`docs/doctrine/restricao-de-canal.md`) proíbe feature de nomear provider. As
 * rotas de sessão (conectar, QR, reconectar, deletar) e o watchdog precisam de
 * operações de control-plane — criar/logar/deslogar/listar sessão — que são
 * específicas do transport, então a decisão de "qual transporte" mora neste
 * módulo de canal, e as features pedem um resultado (um status, uma imagem de
 * QR) sem saber com quem falam.
 *
 * Escopo: a transição WAHA → Evolution. Por enquanto os DOIS transportes
 * convivem (uma instalação usa um deles). `activeQrTransport` decide qual o
 * default para NOVAS conexões pareadas por QR.
 */
import { getEvolutionClient, isEvolutionConfigured } from "@/lib/evolution";
import { getWahaClient } from "@/lib/waha/client";

/** Provider de transporte possível para uma sessão pareada por QR. */
export type QrTransportProvider = "waha" | "evolution" | null;

/**
 * Qual transporte usar para NOVAS conexões por QR.
 *
 * A evolução de volta é: se a Evolution está configurada no env, as novas
 * conexões usam Evolution; senão, WAHA (comportamento legado). `null` = nenhum
 * transporte configurado (a UI mostra o banner de "container fora do ar").
 */
export function activeQrTransport(): QrTransportProvider {
  if (isEvolutionConfigured()) return "evolution";
  if (getWahaClient()) return "waha";
  return null;
}

/** Base URL pública do webhook da Evolution, ou undefined se não configurada. */
export function evolutionWebhookUrl(): string | undefined {
  const base = process.env.EVOLUTION_WEBHOOK_BASE_URL;
  if (!base) return undefined;
  return `${base.replace(/\/+$/, "")}/api/v1/webhooks/evolution`;
}

/**
 * Mapeia o estado da Evolution (`open` | `connecting` | `close`) para o
 * vocabulário canônico de `channel_sessions.status`.
 *
 *  open        → WORKING    (pareado e pronto)
 *  connecting  → SCAN_QR_CODE  (conectando — em geral à espera do QR)
 *  close       → STOPPED    (desconectado)
 */
export function evolutionStateToChannelStatus(state: string | undefined): string {
  switch (state) {
    case "open":
      return "WORKING";
    case "connecting":
      return "SCAN_QR_CODE";
    default:
      return "STOPPED";
  }
}

/**
 * Extrai os bytes de imagem do QR devolvido pela Evolution (`qrcode.base64`).
 *
 * A Evolution devolve `data:image/png;base64,<...>`. Esta função isola o
 * payload base64 e o decodifica em Buffer, ou devolve null quando não há QR
 * (instância já conectada, ou payload inesperado).
 */
export function evolutionQrImageBytes(qrBase64: string | undefined | null): Buffer | null {
  if (!qrBase64) return null;
  const payload = qrBase64.includes(",") ? qrBase64.split(",")[1] : qrBase64;
  if (!payload) return null;
  try {
    return Buffer.from(payload, "base64");
  } catch {
    return null;
  }
}

/**
 * Cria uma instância na Evolution para uma sessão nova.
 *
 * NÃO configura webhook per-instância de propósito: o docker-compose já liga o
 * `WEBHOOK_GLOBAL_URL` → /api/v1/webhooks/evolution, que cobre TODAS as
 * instâncias. Um webhook per-instância por cima resultaria em entrega DUPLICADA
 * (global + da instância) para o mesmo evento.
 */
export async function evolutionCreateInstance(sessionName: string): Promise<void> {
  const client = getEvolutionClient();
  if (!client) throw new Error("evolution_not_configured");
  await client.createInstance(sessionName);
}
