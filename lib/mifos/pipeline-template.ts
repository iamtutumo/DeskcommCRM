/**
 * Pipeline and Vocabulary Templates for the Microfinance Domain.
 *
 * Available when installing or reconfiguring a tenant operating on
 * Apache Fineract / Mifos X. Implements DeskcommCRM's multi-niche standard
 * by remapping "lead/deal" to "Borrower/Loan".
 */

export interface MicrofinanceStageTemplate {
  name: string;
  slug: string;
  position: number;
  description: string;
}

export interface MicrofinancePipelineTemplate {
  name: string;
  slug: string;
  description: string;
  is_default: boolean;
  vocabulary: Record<string, string>;
  stages: MicrofinanceStageTemplate[];
}

export const MIFOS_VOCABULARY: Record<string, string> = {
  lead: "Borrower",
  lead_plural: "Borrowers",
  deal: "Loan",
  deal_plural: "Loans",
  won: "Disbursed",
  lost: "Rejected",
  stage: "Stage",
  stage_plural: "Stages",
};

export const MIFOS_ORIGINATION_PIPELINE: MicrofinancePipelineTemplate = {
  name: "Loan Origination",
  slug: "mifos-loan-origination",
  description:
    "Primary pipeline for credit proposals, simulation, KYC, and underwriting prior to disbursement in Apache Fineract.",
  is_default: true,
  vocabulary: MIFOS_VOCABULARY,
  stages: [
    {
      name: "1. Simulation & KYC",
      slug: "simulation-kyc",
      position: 1000,
      description: "Borrower simulating installment plans and submitting identity documents over WhatsApp.",
    },
    {
      name: "2. Credit Underwriting",
      slug: "credit-underwriting",
      position: 2000,
      description: "Credit profile check and Mifos/Fineract database lookup.",
    },
    {
      name: "3. Approved / Signature",
      slug: "approved-signature",
      position: 3000,
      description: "Credit proposal approved; awaiting agreement signature and compliance.",
    },
    {
      name: "4. Disbursed",
      slug: "disbursed",
      position: 4000,
      description: "Won — Credit amount disbursed to the loan account in core banking.",
    },
    {
      name: "5. Rejected / Cancelled",
      slug: "rejected-cancelled",
      position: 5000,
      description: "Lost — Proposal rejected by underwriting or cancelled by applicant.",
    },
  ],
};

export const MIFOS_COLLECTIONS_PIPELINE: MicrofinancePipelineTemplate = {
  name: "Servicing & Collections",
  slug: "mifos-servicing-collections",
  description:
    "Post-disbursement servicing pipeline for active accounts, renegotiation, and arrears recovery.",
  is_default: false,
  vocabulary: MIFOS_VOCABULARY,
  stages: [
    {
      name: "1. On Schedule",
      slug: "on-schedule",
      position: 1000,
      description: "Active loan accounts with up-to-date repayment schedules.",
    },
    {
      name: "2. Due in 3 Days",
      slug: "due-in-3-days",
      position: 2000,
      description: "Preventive monitoring and automatic WhatsApp reminder.",
    },
    {
      name: "3. 1-15 Days in Arrears",
      slug: "early-arrears",
      position: 3000,
      description: "Early overdue installments; conversational renegotiation by AI agent.",
    },
    {
      name: "4. Critical Arrears (>15 Days)",
      slug: "critical-arrears",
      position: 4000,
      description: "Mandatory handoff to human collections officer for recovery.",
    },
  ],
};

export function getMicrofinanceTemplates(): MicrofinancePipelineTemplate[] {
  return [MIFOS_ORIGINATION_PIPELINE, MIFOS_COLLECTIONS_PIPELINE];
}
