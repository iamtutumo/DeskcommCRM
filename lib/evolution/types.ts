/**
 * TypeScript domain definitions for Evolution API WhatsApp Engine.
 */

export interface EvolutionSendTextRequest {
  number: string;
  textMessage: {
    text: string;
  };
  options?: {
    delay?: number;
    presence?: "composing" | "available";
    linkPreview?: boolean;
  };
}

export interface EvolutionSendMediaRequest {
  number: string;
  mediaMessage: {
    mediatype: "image" | "document" | "video" | "audio";
    caption?: string;
    media: string; // Base64 string or public URL
    fileName?: string;
  };
}

export interface EvolutionMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: Record<string, unknown>;
  messageTimestamp?: number;
  status?: string;
}

export interface EvolutionInstanceStatusResponse {
  instance: {
    instanceName: string;
    state: "open" | "close" | "connecting";
  };
}

/** Resposta de POST /instance/create. */
export interface EvolutionCreateInstanceResponse {
  instance?: { instanceName?: string; status?: string };
  hash?: string;
  qrcode?: { code?: string; base64?: string } | null;
}

/** Resposta de GET /instance/connect/{name} (gera/retorna o QR). */
export interface EvolutionConnectResponse {
  qrcode?: { code?: string; base64?: string; pairingCode?: string } | null;
  instance?: { instanceName?: string; status?: string };
}

/** Item de GET /instance/fetchInstances. */
export interface EvolutionFetchedInstance {
  instanceName?: string;
  connectionStatus?: string;
  ownerJid?: string | null;
  number?: string | null;
}

export interface EvolutionWebhookPayload {
  event: string; // e.g. "messages.upsert", "messages.update", "connection.update"
  instance: string;
  data: Record<string, unknown>;
}
