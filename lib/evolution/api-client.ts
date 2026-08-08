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

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Sends a plain text WhatsApp message to the specified phone number.
   */
  async sendText(number: string, text: string): Promise<EvolutionMessageResponse> {
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
      `/message/sendText/${encodeURIComponent(this.config.instanceName)}`,
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
    const cleanNumber = number.replace(/\D/g, "");
    const payload: EvolutionSendMediaRequest = {
      number: cleanNumber,
      mediaMessage: {
        mediatype: "document",
        media: mediaUrlOrBase64,
        fileName,
        caption,
      },
    };

    return this.request<EvolutionMessageResponse>(
      `/message/sendMedia/${encodeURIComponent(this.config.instanceName)}`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  /**
   * Retrieves the connection state of the Evolution API WhatsApp instance.
   */
  async getInstanceStatus(): Promise<EvolutionInstanceStatusResponse> {
    return this.request<EvolutionInstanceStatusResponse>(
      `/instance/connectionState/${encodeURIComponent(this.config.instanceName)}`,
    );
  }
}
