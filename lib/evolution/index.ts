/**
 * Evolution API WhatsApp Engine Module for DeskcommCRM.
 */

export * from "./api-client";
export * from "./config";
export * from "./types";

import { EvolutionApiClient } from "./api-client";
import { isEvolutionConfigured } from "./config";

/**
 * Returns a configured Evolution API client, or null when env is not configured.
 *
 * Null means the Evolution API container/URL/key aren't set — callers treat that
 * as a noop (e.g. render a "channel not connected" banner) rather than an error,
 * mirroring `getWahaClient` for the legacy provider. Reads env on every call, so
 * the state is always current (no memoization).
 */
export function getEvolutionClient(): EvolutionApiClient | null {
  if (!isEvolutionConfigured()) return null;
  return new EvolutionApiClient();
}
