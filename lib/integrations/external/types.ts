/**
 * Typed domain definitions for DeskcommCRM External Integrations Suite.
 *
 * Covers EgoSMS (Uganda/East Africa SMS Gateway), Documenso (Open-Source
 * Digital Signatures), HeyForms (Onboarding Forms), IdSwyft (KYC ID
 * Verification), and MinIO (Self-Hosted S3 Object Storage).
 */

export type ExternalProviderType =
  | "egosms"
  | "documenso"
  | "heyforms"
  | "idswyft"
  | "minio";

export type ExternalIntegrationStatus =
  | "ready"
  | "connecting"
  | "error"
  | "not_configured";

export interface EgoSmsConfig {
  username?: string;
  password?: string;
  sender_id?: string;
  api_url?: string;
}

export interface DocumensoConfig {
  api_key?: string;
  api_url?: string;
  webhook_secret?: string;
  default_template_id?: string;
}

export interface HeyFormsConfig {
  api_key?: string;
  api_url?: string;
  webhook_secret?: string;
  form_ids?: string[];
}

export interface IdSwyftConfig {
  api_key?: string;
  api_url?: string;
  webhook_secret?: string;
  confidence_threshold?: number; // 0-100 (default 85)
}

export interface MinioConfig {
  endpoint?: string;
  access_key?: string;
  secret_key?: string;
  bucket_name?: string;
  use_ssl?: boolean;
  region?: string;
}

export type ExternalIntegrationConfig =
  | EgoSmsConfig
  | DocumensoConfig
  | HeyFormsConfig
  | IdSwyftConfig
  | MinioConfig;

export interface ExternalIntegrationMetadata {
  provider: ExternalProviderType;
  label: string;
  description: string;
  documentation_url: string;
  required_fields: string[];
  capabilities: string[];
}

export interface KycVerificationResult {
  verification_id: string;
  score: number; // 0-100
  status: "verified" | "rejected" | "manual_review";
  details: string;
  timestamp: string;
}

export interface SigningRequestResult {
  request_id: string;
  signing_url: string;
  status: "created" | "sent" | "signed" | "rejected";
}

export interface MinioSignedUrlResult {
  bucket: string;
  key: string;
  signed_url: string;
  expires_in_seconds: number;
}
