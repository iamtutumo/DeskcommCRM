/**
 * Adapter Evolution API — o `ChannelAdapter` do WhatsApp engine open-source
 * (substitui o WAHA no transporte).
 *
 * Mesmo contrato dos irmãos: burro de propósito, traduz formato e nada mais.
 * Nenhuma regra de negócio mora aqui (ver `ChannelAdapter` em ../types) — janela
 * de 24h, cap diário, throttle e warm-up são da cadeia `before_send`.
 *
 * O transporte real é `lib/evolution/*` (EvolutionApiClient), que já existe e já
 * é testado; este arquivo só o enbrulha na forma do seam. Quando a Fase 3
 * absorver `lib/waha/`, o padrão deste adapter é o espelho a seguir.
 */
import { getEvolutionClient } from "@/lib/evolution";
import type { EvolutionMessageResponse } from "@/lib/evolution/types";
import type { ChannelAdapter, OutboundEnvelope, RecipientInput } from "../types";

/**
 * O id que a Evolution devolve no envio. A resposta traz `key.id` (o id Baileys
 * da mensagem), que é o mesmo id que o eco do webhook grava — então o par é
 * simétrico e não precisamos construir formas compostas (ao contrário do WAHA).
 */
function messageIdOf(res: EvolutionMessageResponse): string | null {
  return res.key?.id ?? null;
}

/**
 * Endereço do destinatário na Evolution API.
 *
 * 1:1 com telefone → E.164 em dígitos (sem `@c.us`): o `EvolutionApiClient`
 * espera um número e normaliza para dígitos no próprio envio.
 *
 * @lid → só os dígitos (a Evolution aceita o lid quando o número é privado);
 * sem o sufixo `@lid` porque o cliente limpa não-dígitos de qualquer forma.
 *
 * Grupo → null (fail-closed): o cliente atual limpa não-dígitos, o que
 * mutilaria um JID `…@g.us` e mandaria a mensagem para um número errado —
 * pior que não mandar. Grupos na Evolution pedem um ramo próprio de envio
 * (fora do escopo deste adapter) antes de serem habilitados.
 */
function resolveEvolutionRecipient(input: RecipientInput): string | null {
  if (input.isGroup) return null;
  if (input.waLid) return input.waLid;
  if (input.waIdentity?.startsWith("lid:")) return input.waIdentity.slice(4);
  if (input.phoneNumber) return input.phoneNumber.replace(/\D/g, "");
  return null;
}

/** `kind` do envelope → `mediatype` da Evolution (para a rota sendMedia). */
function mediatypeFor(kind: OutboundEnvelope["kind"]): "image" | "document" | "video" | "audio" {
  switch (kind) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "audio";
    default:
      return "document";
  }
}

export const evolutionAdapter: ChannelAdapter = {
  provider: "evolution",

  resolveRecipient(input: RecipientInput): string | null {
    return resolveEvolutionRecipient(input);
  },

  isConfigured(): boolean {
    return getEvolutionClient() !== null;
  },

  // Mesmo vocabulário dos outros adapters: `notConfigured` para a UI mostrar o
  // banner de "canal não conectado" (não erro), e os demais gravados em
  // `messages.error_message`/`error_code` quando o envio falha.
  codes: {
    notConfigured: "evolution_not_configured",
    sendFailed: "evolution_error",
    unknownError: "evolution_unknown",
  },

  async send(envelope: OutboundEnvelope): Promise<{ externalId: string | null }> {
    const client = getEvolutionClient();
    // Sem env de Evolution o comportamento é NOOP (não erro), igual ao WAHA: a
    // UI mostra o banner de "canal não conectado".
    if (!client) return { externalId: null };

    if (envelope.media) {
      const res = await client.sendMedia(
        envelope.to,
        mediatypeFor(envelope.kind),
        envelope.media.url,
        envelope.media.filename ?? undefined,
        envelope.media.caption ?? undefined,
      );
      return { externalId: messageIdOf(res) };
    }

    const res = await client.sendText(envelope.to, envelope.body ?? "");
    return { externalId: messageIdOf(res) };
  },
};
