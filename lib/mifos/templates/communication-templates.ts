/**
 * Multi-Lingual Microfinance Communication Templates.
 *
 * Supports 7 operational microfinance events across 4 languages (English, Spanish,
 * Portuguese, and Swahili). Templates are formatted for delivery via both
 * WhatsApp (Evolution API) and Email (Standard SMTP).
 */

export type MicrofinanceEventType =
  | "loan_application_received"
  | "loan_underwriting_in_progress"
  | "loan_approved"
  | "loan_disbursed"
  | "repayment_due_reminder"
  | "repayment_received"
  | "loan_arrears_warning";

export type SupportedLocale = "en" | "es" | "pt" | "sw";

export interface CommunicationTemplateDefinition {
  eventType: MicrofinanceEventType;
  locale: SupportedLocale;
  subject: string; // Email subject line (SMTP)
  whatsappBody: string; // Plain text / markdown (Evolution API)
  emailHtml: string; // Formatted HTML body (SMTP)
}

export const COMMUNICATION_TEMPLATES: ReadonlyArray<CommunicationTemplateDefinition> = [
  // --- 1. loan_application_received ---
  {
    eventType: "loan_application_received",
    locale: "en",
    subject: "Loan Application Received — {{loanId}}",
    whatsappBody:
      "Hello {{borrowerName}}, we have received your loan application #{{loanId}} for {{amount}}. Our credit underwriting team is reviewing your details. We will update you shortly!",
    emailHtml:
      "<h3>Loan Application Received</h3><p>Hello <b>{{borrowerName}}</b>,</p><p>We have received your loan application <b>#{{loanId}}</b> for the amount of <b>{{amount}}</b>. Our credit underwriting team is reviewing your profile and KYC documents.</p>",
  },
  {
    eventType: "loan_application_received",
    locale: "es",
    subject: "Solicitud de Préstamo Recibida — {{loanId}}",
    whatsappBody:
      "Hola {{borrowerName}}, hemos recibido su solicitud de préstamo #{{loanId}} por {{amount}}. Nuestro equipo de análisis está revisando sus datos. ¡Le avisaremos pronto!",
    emailHtml:
      "<h3>Solicitud de Préstamo Recibida</h3><p>Hola <b>{{borrowerName}}</b>,</p><p>Hemos recibido su solicitud de préstamo <b>#{{loanId}}</b> por el monto de <b>{{amount}}</b>.</p>",
  },
  {
    eventType: "loan_application_received",
    locale: "pt",
    subject: "Solicitação de Empréstimo Recebida — {{loanId}}",
    whatsappBody:
      "Olá {{borrowerName}}, recebemos sua solicitação de empréstimo #{{loanId}} no valor de {{amount}}. Nossa equipe de análise está revisando seus dados.",
    emailHtml:
      "<h3>Solicitação de Empréstimo Recebida</h3><p>Olá <b>{{borrowerName}}</b>,</p><p>Recebemos sua solicitação de empréstimo <b>#{{loanId}}</b> no valor de <b>{{amount}}</b>.</p>",
  },
  {
    eventType: "loan_application_received",
    locale: "sw",
    subject: "Ombi la Mkopo Limepokelewa — {{loanId}}",
    whatsappBody:
      "Habari {{borrowerName}}, tumepokea ombi lako la mkopo namba #{{loanId}} la kiasi cha {{amount}}. Timu yetu inafanyia kazi maombi yako. Tutakuarifu hivi punde!",
    emailHtml:
      "<h3>Ombi la Mkopo Limepokelewa</h3><p>Habari <b>{{borrowerName}}</b>,</p><p>Tumepokea ombi lako la mkopo <b>#{{loanId}}</b> la kiasi cha <b>{{amount}}</b>.</p>",
  },

  // --- 2. loan_underwriting_in_progress ---
  {
    eventType: "loan_underwriting_in_progress",
    locale: "en",
    subject: "Underwriting in Progress — Loan {{loanId}}",
    whatsappBody:
      "Hello {{borrowerName}}, your loan application #{{loanId}} is currently undergoing credit underwriting and identity verification. Please ensure your KYC photo ID is uploaded.",
    emailHtml:
      "<h3>Credit Underwriting in Progress</h3><p>Hello <b>{{borrowerName}}</b>,</p><p>Your loan application <b>#{{loanId}}</b> is currently under credit evaluation.</p>",
  },
  {
    eventType: "loan_underwriting_in_progress",
    locale: "es",
    subject: "Análisis de Crédito en Proceso — Préstamo {{loanId}}",
    whatsappBody:
      "Hola {{borrowerName}}, su solicitud de préstamo #{{loanId}} se encuentra en análisis de crédito y verificación de identidad.",
    emailHtml:
      "<h3>Análisis de Crédito en Proceso</h3><p>Hola <b>{{borrowerName}}</b>,</p><p>Su solicitud <b>#{{loanId}}</b> está en evaluación.</p>",
  },
  {
    eventType: "loan_underwriting_in_progress",
    locale: "pt",
    subject: "Análise de Crédito em Andamento — Empréstimo {{loanId}}",
    whatsappBody:
      "Olá {{borrowerName}}, sua solicitação de empréstimo #{{loanId}} está em análise de crédito e verificação de documentos.",
    emailHtml:
      "<h3>Análise em Andamento</h3><p>Olá <b>{{borrowerName}}</b>,</p><p>Sua solicitação <b>#{{loanId}}</b> está em avaliação cadastral.</p>",
  },
  {
    eventType: "loan_underwriting_in_progress",
    locale: "sw",
    subject: "Uhakiki wa Mkopo Unaendelea — {{loanId}}",
    whatsappBody:
      "Habari {{borrowerName}}, ombi lako la mkopo #{{loanId}} lipo kwenye uhakiki wa mikopo na vitambulisho. Tafadhali hakikisha umepakia kitambulisho chako.",
    emailHtml:
      "<h3>Uhakiki wa Mkopo Unaendelea</h3><p>Habari <b>{{borrowerName}}</b>,</p><p>Ombi lako la mkopo <b>#{{loanId}}</b> lipo kwenye uhakiki.</p>",
  },

  // --- 3. loan_approved ---
  {
    eventType: "loan_approved",
    locale: "en",
    subject: "Congratulations! Loan #{{loanId}} Approved",
    whatsappBody:
      "Congratulations {{borrowerName}}! Your loan #{{loanId}} for {{amount}} has been approved. Please review and sign your loan agreement to initiate disbursement.",
    emailHtml:
      "<h3>Loan Approved!</h3><p>Congratulations <b>{{borrowerName}}</b>!</p><p>Your loan <b>#{{loanId}}</b> for <b>{{amount}}</b> has been approved. Please review the attached agreement.</p>",
  },
  {
    eventType: "loan_approved",
    locale: "es",
    subject: "¡Felicidades! Préstamo #{{loanId}} Aprobado",
    whatsappBody:
      "¡Felicidades {{borrowerName}}! Su préstamo #{{loanId}} por {{amount}} ha sido aprobado. Por favor firme su contrato para proceder con el desembolso.",
    emailHtml:
      "<h3>¡Préstamo Aprobado!</h3><p>¡Felicidades <b>{{borrowerName}}</b>!</p><p>Su préstamo <b>#{{loanId}}</b> ha sido aprobado.</p>",
  },
  {
    eventType: "loan_approved",
    locale: "pt",
    subject: "Parabéns! Empréstimo #{{loanId}} Aprovado",
    whatsappBody:
      "Parabéns {{borrowerName}}! Seu empréstimo #{{loanId}} no valor de {{amount}} foi aprovado. Por favor confira e assine o contrato para liberação.",
    emailHtml:
      "<h3>Empréstimo Aprovado!</h3><p>Parabéns <b>{{borrowerName}}</b>!</p><p>Seu empréstimo <b>#{{loanId}}</b> foi aprovado.</p>",
  },
  {
    eventType: "loan_approved",
    locale: "sw",
    subject: "Hongera! Mkopo namba #{{loanId}} Umekubaliwa",
    whatsappBody:
      "Hongera {{borrowerName}}! Mkopo wako #{{loanId}} wa kiasi cha {{amount}} umekubaliwa. Tafadhali pitia na utie saini mkataba wako ili kupokea fedha.",
    emailHtml:
      "<h3>Mkopo Umekubaliwa!</h3><p>Hongera <b>{{borrowerName}}</b>,</p><p>Mkopo wako <b>#{{loanId}}</b> umekubaliwa.</p>",
  },

  // --- 4. loan_disbursed ---
  {
    eventType: "loan_disbursed",
    locale: "en",
    subject: "Loan Disbursed — #{{loanId}}",
    whatsappBody:
      "Hello {{borrowerName}}, good news! Your loan #{{loanId}} for {{amount}} has been disbursed. Your first installment is due on {{dueDate}}.",
    emailHtml:
      "<h3>Loan Disbursed</h3><p>Hello <b>{{borrowerName}}</b>,</p><p>Your loan <b>#{{loanId}}</b> for <b>{{amount}}</b> has been disbursed. Your first installment due date is <b>{{dueDate}}</b>.</p>",
  },
  {
    eventType: "loan_disbursed",
    locale: "es",
    subject: "Préstamo Desembolsado — #{{loanId}}",
    whatsappBody:
      "Hola {{borrowerName}}, ¡buenas noticias! Su préstamo #{{loanId}} por {{amount}} ha sido desembolsado. Su primera cuota vence el {{dueDate}}.",
    emailHtml:
      "<h3>Préstamo Desembolsado</h3><p>Hola <b>{{borrowerName}}</b>,</p><p>Su préstamo <b>#{{loanId}}</b> por <b>{{amount}}</b> ha sido liberado.</p>",
  },
  {
    eventType: "loan_disbursed",
    locale: "pt",
    subject: "Empréstimo Liberado — #{{loanId}}",
    whatsappBody:
      "Olá {{borrowerName}}, boas notícias! Seu empréstimo #{{loanId}} no valor de {{amount}} foi liberado. O vencimento da primeira parcela é em {{dueDate}}.",
    emailHtml:
      "<h3>Empréstimo Liberado</h3><p>Olá <b>{{borrowerName}}</b>,</p><p>Seu empréstimo <b>#{{loanId}}</b> no valor de <b>{{amount}}</b> foi liberado.</p>",
  },
  {
    eventType: "loan_disbursed",
    locale: "sw",
    subject: "Mkopo Umelipwa — #{{loanId}}",
    whatsappBody:
      "Habari {{borrowerName}}, habari njema! Mkopo wako #{{loanId}} wa kiasi cha {{amount}} umelipwa rasmi. Marejesho ya kwanza yatalipwa tarehe {{dueDate}}.",
    emailHtml:
      "<h3>Mkopo Umelipwa</h3><p>Habari <b>{{borrowerName}}</b>,</p><p>Mkopo wako <b>#{{loanId}}</b> umelipwa rasmi.</p>",
  },

  // --- 5. repayment_due_reminder ---
  {
    eventType: "repayment_due_reminder",
    locale: "en",
    subject: "Reminder: Installment Due on {{dueDate}} — Loan #{{loanId}}",
    whatsappBody:
      "Friendly reminder {{borrowerName}}: your installment of {{amount}} for loan #{{loanId}} is due on {{dueDate}}. Thank you for paying on schedule!",
    emailHtml:
      "<h3>Installment Due Reminder</h3><p>Hello <b>{{borrowerName}}</b>,</p><p>Your installment of <b>{{amount}}</b> for loan <b>#{{loanId}}</b> is due on <b>{{dueDate}}</b>.</p>",
  },
  {
    eventType: "repayment_due_reminder",
    locale: "es",
    subject: "Recordatorio: Cuota vence el {{dueDate}} — Préstamo #{{loanId}}",
    whatsappBody:
      "Recordatorio amigable {{borrowerName}}: su cuota de {{amount}} del préstamo #{{loanId}} vence el {{dueDate}}.",
    emailHtml:
      "<h3>Recordatorio de Pago</h3><p>Hola <b>{{borrowerName}}</b>,</p><p>Su cuota de <b>{{amount}}</b> vence el <b>{{dueDate}}</b>.</p>",
  },
  {
    eventType: "repayment_due_reminder",
    locale: "pt",
    subject: "Lembrete: Parcela vence em {{dueDate}} — Empréstimo #{{loanId}}",
    whatsappBody:
      "Lembrete amigável {{borrowerName}}: sua parcela de {{amount}} do empréstimo #{{loanId}} vence em {{dueDate}}.",
    emailHtml:
      "<h3>Lembrete de Parcela</h3><p>Olá <b>{{borrowerName}}</b>,</p><p>Sua parcela de <b>{{amount}}</b> vence em <b>{{dueDate}}</b>.</p>",
  },
  {
    eventType: "repayment_due_reminder",
    locale: "sw",
    subject: "Kikumbusho: Marejesho mnamo {{dueDate}} — Mkopo #{{loanId}}",
    whatsappBody:
      "Kikumbusho {{borrowerName}}: rejesho lako la {{amount}} la mkopo #{{loanId}} linalipwa tarehe {{dueDate}}. Asante kwa kulipa kwa wakati!",
    emailHtml:
      "<h3>Kikumbusho cha Marejesho</h3><p>Habari <b>{{borrowerName}}</b>,</p><p>Rejesho lako la <b>{{amount}}</b> linalipwa tarehe <b>{{dueDate}}</b>.</p>",
  },

  // --- 6. repayment_received ---
  {
    eventType: "repayment_received",
    locale: "en",
    subject: "Payment Confirmation — Loan #{{loanId}}",
    whatsappBody:
      "Thank you {{borrowerName}}! We have received your payment of {{amount}} for loan #{{loanId}}. Your remaining balance is {{balance}}.",
    emailHtml:
      "<h3>Payment Receipt Confirmed</h3><p>Hello <b>{{borrowerName}}</b>,</p><p>We have received your payment of <b>{{amount}}</b> for loan <b>#{{loanId}}</b>. Remaining balance: <b>{{balance}}</b>.</p>",
  },
  {
    eventType: "repayment_received",
    locale: "es",
    subject: "Confirmación de Pago — Préstamo #{{loanId}}",
    whatsappBody:
      "¡Gracias {{borrowerName}}! Hemos recibido su pago de {{amount}} para el préstamo #{{loanId}}. Su saldo restante es {{balance}}.",
    emailHtml:
      "<h3>Pago Recibido</h3><p>Hola <b>{{borrowerName}}</b>,</p><p>Hemos recibido su pago de <b>{{amount}}</b>. Saldo restante: <b>{{balance}}</b>.</p>",
  },
  {
    eventType: "repayment_received",
    locale: "pt",
    subject: "Confirmação de Pagamento — Empréstimo #{{loanId}}",
    whatsappBody:
      "Obrigado {{borrowerName}}! Recebemos seu pagamento de {{amount}} para o empréstimo #{{loanId}}. Seu saldo devedor restante é {{balance}}.",
    emailHtml:
      "<h3>Pagamento Confirmado</h3><p>Olá <b>{{borrowerName}}</b>,</p><p>Recebemos seu pagamento de <b>{{amount}}</b>. Saldo restante: <b>{{balance}}</b>.</p>",
  },
  {
    eventType: "repayment_received",
    locale: "sw",
    subject: "Thibitisho la Malipo — Mkopo #{{loanId}}",
    whatsappBody:
      "Asante {{borrowerName}}! Tumepokea malipo yako ya {{amount}} kwa ajili ya mkopo #{{loanId}}. Salio lako lililobaki ni {{balance}}.",
    emailHtml:
      "<h3>Thibitisho la Malipo</h3><p>Habari <b>{{borrowerName}}</b>,</p><p>Tumepokea malipo ya <b>{{amount}}</b>. Salio lililobaki: <b>{{balance}}</b>.</p>",
  },

  // --- 7. loan_arrears_warning ---
  {
    eventType: "loan_arrears_warning",
    locale: "en",
    subject: "Urgent Warning: Loan #{{loanId}} in Arrears ({{daysOverdue}} days)",
    whatsappBody:
      "Urgent notice {{borrowerName}}: your loan #{{loanId}} is {{daysOverdue}} days overdue. Please pay {{amount}} immediately to avoid additional late penalties.",
    emailHtml:
      "<h3>Urgent Arrears Notice</h3><p>Hello <b>{{borrowerName}}</b>,</p><p>Your loan <b>#{{loanId}}</b> is <b>{{daysOverdue}} days overdue</b>. Please make an immediate payment of <b>{{amount}}</b> to avoid penalties.</p>",
  },
  {
    eventType: "loan_arrears_warning",
    locale: "es",
    subject: "Aviso Urgente: Préstamo #{{loanId}} en Atraso ({{daysOverdue}} días)",
    whatsappBody:
      "Aviso urgente {{borrowerName}}: su préstamo #{{loanId}} tiene {{daysOverdue}} días de retraso. Por favor realice el pago de {{amount}} lo antes posible.",
    emailHtml:
      "<h3>Aviso Urgente de Atraso</h3><p>Hola <b>{{borrowerName}}</b>,</p><p>Su préstamo tiene <b>{{daysOverdue}} días de retraso</b>.</p>",
  },
  {
    eventType: "loan_arrears_warning",
    locale: "pt",
    subject: "Aviso Urgente: Empréstimo #{{loanId}} em Atraso ({{daysOverdue}} dias)",
    whatsappBody:
      "Aviso urgente {{borrowerName}}: seu empréstimo #{{loanId}} está em atraso há {{daysOverdue}} dias. Por favor efetue o pagamento de {{amount}} imediatamente.",
    emailHtml:
      "<h3>Aviso de Atraso</h3><p>Olá <b>{{borrowerName}}</b>,</p><p>Seu empréstimo está com <b>{{daysOverdue}} dias de atraso</b>.</p>",
  },
  {
    eventType: "loan_arrears_warning",
    locale: "sw",
    subject: "Onyo la Dharura: Mkopo #{{loanId}} Umepitisha Muda (siku {{daysOverdue}})",
    whatsappBody:
      "Taarifa muhimu {{borrowerName}}: mkopo wako #{{loanId}} umepitisha muda wa malipo kwa siku {{daysOverdue}}. Tafadhali lipa {{amount}} haraka ili kuepuka faini za ziada.",
    emailHtml:
      "<h3>Onyo la Marejesho</h3><p>Habari <b>{{borrowerName}}</b>,</p><p>Mkopo wako <b>#{{loanId}}</b> umepitisha muda kwa <b>siku {{daysOverdue}}</b>. Tafadhali lipa <b>{{amount}}</b> haraka.</p>",
  },
];

export function getCommunicationTemplate(
  eventType: MicrofinanceEventType,
  locale: SupportedLocale = "en",
): CommunicationTemplateDefinition {
  const match = COMMUNICATION_TEMPLATES.find(
    (t) => t.eventType === eventType && t.locale === locale,
  );
  if (match) {
    return match;
  }
  // Fallback to English if exact locale is not found
  const fallback = COMMUNICATION_TEMPLATES.find(
    (t) => t.eventType === eventType && t.locale === "en",
  );
  if (!fallback) {
    throw new Error(`No communication template defined for event '${eventType}'`);
  }
  return fallback;
}

/**
 * Replaces mustache-style variable tokens e.g. {{borrowerName}}, {{amount}}
 * with values from the variables record.
 */
export function renderTemplateText(
  text: string,
  variables: Record<string, string | number>,
): string {
  let output = text;
  for (const [key, val] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    output = output.replace(pattern, String(val));
  }
  return output;
}

export function renderCommunicationTemplate(
  eventType: MicrofinanceEventType,
  locale: SupportedLocale,
  variables: Record<string, string | number>,
): { subject: string; whatsappBody: string; emailHtml: string } {
  const template = getCommunicationTemplate(eventType, locale);
  return {
    subject: renderTemplateText(template.subject, variables),
    whatsappBody: renderTemplateText(template.whatsappBody, variables),
    emailHtml: renderTemplateText(template.emailHtml, variables),
  };
}
