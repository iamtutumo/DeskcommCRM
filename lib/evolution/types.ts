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

export interface EvolutionWebhookPayload {
  event: string; // e.g. "messages.upsert", "messages.update", "connection.update"
  instance: string;
  data: Record<string, unknown>;
}
