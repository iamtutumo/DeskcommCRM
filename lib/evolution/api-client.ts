/**
 * Official REST client for Evolution API (WhatsApp Engine).
 *
 * Implements message sending (text and media/PDF documents), instance connection
 * status verification, and webhook event parsing.
 */

import {
  DEFAULT_EVOLUTION_TIMEOUT_MS,
  EVOLUTION_USER_AGENT,
  getEvolutionConfig,
  type EvolutionConfig,
} from "./config";
import type {
  EvolutionConnectResponse,
  EvolutionCreateInstanceResponse,
  EvolutionFetchedInstance,
  EvolutionInstanceStatusResponse,
  EvolutionMessageResponse,
  EvolutionSendMediaRequest,
  EvolutionSendTextRequest,
} from "./types";

export class EvolutionApiError extends Error {
  status: number;
  code: string;
  body: string;

  constructor(status: number, code: string, body: string, message?: string) {
    super(message ?? `Evolution API Error ${status} (${code})`);
    this.name = "EvolutionApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export class EvolutionApiClient {
  private readonly config: EvolutionConfig;

  constructor(configOverride?: EvolutionConfig) {
    const loaded = configOverride ?? getEvolutionConfig();
    if (!loaded) {
      throw new Error(
        "EvolutionApiClient is not configured: set EVOLUTION_API_URL and EVOLUTION_API_KEY.",
      );
    }
    this.config = loaded;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": EVOLUTION_USER_AGENT,
      apikey: this.config.apiKey,
    };
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_EVOLUTION_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: this.getHeaders(),
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new EvolutionApiError(
          response.status,
          response.statusText,
          text,
          `Evolution API Error (${response.status}): ${text.slice(0, 200)}`,
        );
      }

      // DELETE/logout costumam responder 200 com corpo vazio — não quebrar lendo JSON.
      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Sends a plain text WhatsApp message to the specified phone number.
   *
   * `instanceName` defaults to the env `EVOLUTION_INSTANCE_NAME` (the single
   * self-host instance). Multi-number installs pass the explicit instance.
   */
  async sendText(number: string, text: string, instanceName?: string): Promise<EvolutionMessageResponse> {
    const cleanNumber = number.replace(/\D/g, "");
    const payload: EvolutionSendTextRequest = {
      number: cleanNumber,
      textMessage: { text },
      options: {
        delay: 500,
        presence: "composing",
      },
    };

    return this.request<EvolutionMessageResponse>(
      `/message/sendText/${encodeURIComponent(instanceName ?? this.config.instanceName)}`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  /**
   * Sends a PDF document or media attachment via WhatsApp.
   */
  async sendDocument(
    number: string,
    mediaUrlOrBase64: string,
    fileName: string,
    caption?: string,
  ): Promise<EvolutionMessageResponse> {
    return this.sendMedia(number, "document", mediaUrlOrBase64, fileName, caption);
  }

  /**
   * Sends media of any supported type via the Evolution API `sendMedia` route.
   *
   * `mediatype` is one of `image | document | video | audio`. `media` accepts a
   * public URL or a base64 data string; Evolution downloads/uploads it server-side.
   * `fileName` is required for `document`; for `audio` a caption is ignored.
   */
  async sendMedia(
    number: string,
    mediatype: "image" | "document" | "video" | "audio",
    mediaUrlOrBase64: string,
    fileName?: string,
    caption?: string,
    instanceName?: string,
  ): Promise<EvolutionMessageResponse> {
    const cleanNumber = number.replace(/\D/g, "");
    const payload: EvolutionSendMediaRequest = {
      number: cleanNumber,
      mediaMessage: {
        mediatype,
        media: mediaUrlOrBase64,
        ...(fileName ? { fileName } : {}),
        ...(caption ? { caption } : {}),
      },
    };

    return this.request<EvolutionMessageResponse>(
      `/message/sendMedia/${encodeURIComponent(instanceName ?? this.config.instanceName)}`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  /**
   * Retrieves the connection state of the Evolution API WhatsApp instance.
   */
  async getInstanceStatus(instanceName?: string): Promise<EvolutionInstanceStatusResponse> {
    return this.request<EvolutionInstanceStatusResponse>(
      `/instance/connectionState/${encodeURIComponent(instanceName ?? this.config.instanceName)}`,
    );
  }

  // ── Gestão de instâncias (control plane: criar, conectar, listar, deslogar) ──

  /**
   * Cria uma instância WhatsApp na Evolution API (Baileys) e já devolve o QR.
   *
   * `webhookUrl` opcional: se fornecido, configura o webhook da instância na
   * criação (aponta para o receiver /api/v1/webhooks/evolution).
   */
  async createInstance(
    instanceName: string,
    webhookUrl?: string,
  ): Promise<EvolutionCreateInstanceResponse> {
    const body: Record<string, unknown> = {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    };
    if (webhookUrl) {
      body.webhook = { enabled: true, url: webhookUrl, byEvents: true, base64: false };
    }
    return this.request<EvolutionCreateInstanceResponse>("/instance/create", {
      method: "POST",
      body,
    });
  }

  /**
   * Conecta uma instância (gera ou retorna o QR atual) via GET /instance/connect.
   */
  async connectInstance(instanceName: string): Promise<EvolutionConnectResponse> {
    return this.request<EvolutionConnectResponse>(
      `/instance/connect/${encodeURIComponent(instanceName)}`,
    );
  }

  /** Lista todas as instâncias e seus estados (`connectionStatus`). */
  async fetchInstances(): Promise<EvolutionFetchedInstance[]> {
    const data = await this.request<unknown>("/instance/fetchInstances");
    return Array.isArray(data) ? (data as EvolutionFetchedInstance[]) : [];
  }

  /** Desloga a instância (descarta as credenciais pareadas). */
  async logoutInstance(instanceName: string): Promise<void> {
    await this.request<void>(`/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: "DELETE",
    });
  }

  /** Remove a instância por completo (registro + credenciais). */
  async deleteInstance(instanceName: string): Promise<void> {
    await this.request<void>(`/instance/delete/${encodeURIComponent(instanceName)}`, {
      method: "DELETE",
    });
  }
}
