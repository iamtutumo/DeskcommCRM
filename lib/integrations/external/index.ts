/**
 * External Integrations Suite for DeskcommCRM (lib/integrations/external/).
 *
 * Implements a unified menu and core adapters for 5 external microfinance
 * ecosystem providers:
 *   1. EgoSMS (Uganda & East Africa SMS Gateway)
 *   2. Documenso (Open-Source Digital Signatures)
 *   3. HeyForms (Onboarding & KYC Forms)
 *   4. IdSwyft (KYC Identity Verification Platform)
 *   5. MinIO (Self-Hosted S3 Object Storage)
 */

export * from "./adapters/documenso";
export * from "./adapters/egosms";
export * from "./adapters/heyforms";
export * from "./adapters/idswyft";
export * from "./adapters/minio";
export * from "./registry";
export * from "./types";
