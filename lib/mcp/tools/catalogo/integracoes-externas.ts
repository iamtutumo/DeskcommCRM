/**
 * Capacidades de INTEGRAÇÕES EXTERNAS — SMS EgoSMS, Assinatura Documenso,
 * Verificação KYC IdSwyft e Armazenamento de Arquivos MinIO.
 */
import { declararTools } from "./tipos";

export const TOOLS_INTEGRACOES_EXTERNAS = declararTools([
  {
    name: "external_send_sms_egosms",
    category: "write",
    description:
      "Sends an SMS notification via EgoSMS gateway to borrowers across Uganda and East Africa (+256 E.164 format).",
    rotulo: "Enviar mensagem de texto por celular",
    explicacao:
      "Manda uma mensagem de texto (SMS) para o celular do cliente quando a internet ou o WhatsApp estiverem fora do ar.",
    oQueToca: "Mensagens de celular do cliente",
    risco: "atencao",
    pacotes: ["atender", "reter"],
  },
  {
    name: "external_verify_kyc_idswyft",
    category: "read",
    description:
      "Triggers an IdSwyft identity verification check for a borrower document (national ID, passport, or selfie).",
    rotulo: "Verificar documento de identidade",
    explicacao:
      "Confere se o documento de identidade ou a foto do cliente é verdadeiro na plataforma de checagem de cadastro.",
    oQueToca: "Documentos e cadastro do cliente",
    risco: "seguro",
    pacotes: ["atender", "vender"],
  },
  {
    name: "external_create_signature_documenso",
    category: "write",
    description:
      "Generates an electronic signature request on Documenso for a Loan Agreement or Promissory Note PDF.",
    rotulo: "Solicitar assinatura digital de contrato",
    explicacao:
      "Cria um link seguro para o cliente assinar o contrato ou a promissória de forma digital pelo celular ou computador.",
    oQueToca: "Contratos e assinaturas",
    risco: "atencao",
    pacotes: ["vender"],
  },
  {
    name: "external_get_storage_url_minio",
    category: "read",
    description:
      "Generates a secure, expiring signed URL for a document or PDF stored in self-hosted MinIO object storage.",
    rotulo: "Gerar link seguro para documento",
    explicacao:
      "Cria um endereço temporário e seguro para abrir ou baixar um documento guardado no servidor de arquivos da empresa.",
    oQueToca: "Arquivos e documentos guardados",
    risco: "seguro",
    pacotes: ["atender", "vender"],
  },
]);
