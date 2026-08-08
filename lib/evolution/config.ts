/**
 * Configuration for Evolution API WhatsApp Engine (lib/evolution/config.ts).
 *
 * Supports Evolution API v2+ instances via EVOLUTION_API_URL, EVOLUTION_API_KEY,
 * and EVOLUTION_INSTANCE_NAME.
 */

export const DEFAULT_EVOLUTION_TIMEOUT_MS = 10000;
export const EVOLUTION_USER_AGENT = "DeskcommCRM (Evolution API Engine)";

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

export function getEvolutionConfig(): EvolutionConfig | null {
  const baseUrl = process.env.EVOLUTION_API_URL || "";
  const apiKey = process.env.EVOLUTION_API_KEY || "";
  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || "deskcomm-instance",
  };
}

export function isEvolutionConfigured(): boolean {
  return getEvolutionConfig() !== null;
}
