/**
 * Configuration for Apache Fineract / Mifos X integration.
 *
 * Environment variables `MIFOS_BASE_URL`, `MIFOS_TENANT_ID`, `MIFOS_USERNAME`,
 * and `MIFOS_PASSWORD` (or `MIFOS_API_KEY`) allow authenticating against
 * self-hosted or cloud core banking instances.
 */

export const DEFAULT_FINERACT_TENANT_ID = "default";
export const DEFAULT_FINERACT_TIMEOUT_MS = 8000;
export const APP_USER_AGENT = "DeskcommCRM (Fineract/Mifos Integration)";

export interface FineractConfig {
  baseUrl: string;
  tenantId: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

/**
 * Reads the Mifos / Fineract provider environment configuration.
 * Returns null if no base URL is configured.
 */
export function getFineractConfig(): FineractConfig | null {
  const baseUrl = process.env.MIFOS_BASE_URL || "";
  if (!baseUrl) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""), // Strip trailing slashes
    tenantId: process.env.MIFOS_TENANT_ID || DEFAULT_FINERACT_TENANT_ID,
    username: process.env.MIFOS_USERNAME,
    password: process.env.MIFOS_PASSWORD,
    apiKey: process.env.MIFOS_API_KEY,
  };
}

export function isFineractConfigured(): boolean {
  return getFineractConfig() !== null;
}
