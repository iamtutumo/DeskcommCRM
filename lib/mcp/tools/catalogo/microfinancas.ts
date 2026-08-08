/**
 * Capacidades de MICROFINANÇAS — consulta de clientes, contas de empréstimo,
 * cronograma de parcelas, simulações e originação no Apache Fineract / Mifos X.
 */
import { declararTools } from "./tipos";

export const TOOLS_MICROFINANCAS = declararTools([
  {
    name: "mifos_get_client",
    category: "read",
    description:
      "Busca cliente cadastrado no Apache Fineract / Mifos X por telefone (com ou sem código de país), ID externo ou CPF.",
    rotulo: "Buscar cliente no core banking",
    explicacao:
      "Procura o cliente por CPF, celular ou código no Apache Fineract / Mifos X para ver se já possui cadastro.",
    oQueToca: "Cadastro de clientes (Mifos)",
    risco: "seguro",
    pacotes: ["atender", "vender"],
  },
  {
    name: "mifos_get_loan_accounts",
    category: "read",
    description:
      "Lista todas as contas de empréstimo (ativas, pendentes, quitadas ou em atraso) de um cliente no Apache Fineract.",
    rotulo: "Ver empréstimos do cliente",
    explicacao:
      "Mostra a lista de empréstimos do cliente no Mifos, saldo devedor atual, parcelas pagas e situação de atraso.",
    oQueToca: "Contas de empréstimo",
    risco: "seguro",
    pacotes: ["atender", "vender", "reter"],
  },
  {
    name: "mifos_get_repayment_schedule",
    category: "read",
    description:
      "Retorna o cronograma de parcelas (datas de vencimento, valores, juros, saldo devedor e indicador de atraso) de uma conta de empréstimo.",
    rotulo: "Consultar cronograma de parcelas",
    explicacao:
      "Retorna as parcelas de um empréstimo com data de vencimento, valor de principal e juros, e indica se está em atraso.",
    oQueToca: "Cronograma de parcelas",
    risco: "seguro",
    pacotes: ["atender", "reter"],
  },
  {
    name: "mifos_get_loan_charges",
    category: "read",
    description:
      "Retrieves processing fees, late penalties, and billing breakdown (paid vs. outstanding charges) for a loan account in Apache Fineract.",
    rotulo: "Ver taxas e multas do empréstimo",
    explicacao:
      "Retorna as taxas administrativas, multas por atraso e encargos do empréstimo no Apache Fineract, mostrando o que já foi pago e o que está pendente.",
    oQueToca: "Encargos e multas",
    risco: "seguro",
    pacotes: ["atender", "reter", "vender"],
  },
  {
    name: "mifos_simulate_loan_schedule",
    category: "read",
    description:
      "Simula o cálculo de parcelas de um empréstimo localmente (tabela Price) para resposta em tempo real no chat, sem gravar na base bancária.",
    rotulo: "Simular financiamento de empréstimo",
    explicacao:
      "Simula o valor de parcelas e juros de um empréstimo em tempo real no chat, sem gravar nada no sistema bancário.",
    oQueToca: "Simulador de crédito",
    risco: "seguro",
    pacotes: ["vender", "atender"],
  },
  {
    name: "mifos_create_loan_application",
    category: "write",
    description:
      "Submete uma solicitação de empréstimo no Apache Fineract (pendente de aprovação) para o cliente informado.",
    rotulo: "Solicitar novo empréstimo no core banking",
    explicacao:
      "Cria uma proposta oficial de empréstimo pendente de aprovação no Apache Fineract para o cliente.",
    oQueToca: "Solicitações de crédito",
    risco: "atencao",
    pacotes: ["vender"],
  },
  {
    name: "mifos_list_offices",
    category: "read",
    description:
      "Lists synced branches and office locations from Apache Fineract / Mifos X.",
    rotulo: "Ver agências e escritórios bancários",
    explicacao:
      "Lista as agências e escritórios de atendimento da empresa sincronizados com o sistema bancário.",
    oQueToca: "Agências e escritórios",
    risco: "seguro",
    pacotes: ["atender", "organizar"],
  },
  {
    name: "mifos_list_staff",
    category: "read",
    description:
      "Lists loan officers and staff members from Apache Fineract / Mifos X.",
    rotulo: "Ver atendentes e oficiais de crédito",
    explicacao:
      "Lista os colaboradores e oficiais de crédito da empresa cadastrados no sistema bancário.",
    oQueToca: "Equipe e oficiais de crédito",
    risco: "seguro",
    pacotes: ["atender", "organizar"],
  },
  {
    name: "mifos_list_products",
    category: "read",
    description:
      "Lists available loan, savings, or share equity products from Apache Fineract / Mifos X.",
    rotulo: "Ver produtos de crédito e poupança",
    explicacao:
      "Mostra os tipos de empréstimo, contas de poupança e cotas patrimoniais disponíveis para contratação.",
    oQueToca: "Produtos bancários",
    risco: "seguro",
    pacotes: ["atender", "vender"],
  },
  {
    name: "mifos_get_savings_accounts",
    category: "read",
    description:
      "Lists savings deposit accounts belonging to a client in Apache Fineract / Mifos X.",
    rotulo: "Ver contas de poupança do cliente",
    explicacao:
      "Mostra as contas de poupança do cliente, com saldo disponível e taxa de juros aplicada.",
    oQueToca: "Contas de poupança",
    risco: "seguro",
    pacotes: ["atender", "reter"],
  },
  {
    name: "mifos_get_share_accounts",
    category: "read",
    description:
      "Lists member equity share accounts belonging to a client in Apache Fineract / Mifos X.",
    rotulo: "Ver cotas patrimoniais do cliente",
    explicacao:
      "Mostra as cotas de participação e capital do cliente cadastradas na instituição de microfinanças.",
    oQueToca: "Cotas patrimoniais",
    risco: "seguro",
    pacotes: ["atender", "vender"],
  },
  {
    name: "mifos_trigger_sync",
    category: "write",
    description:
      "Triggers an immediate bidirectional synchronization of reference catalogs and account details with Apache Fineract / Mifos X.",
    rotulo: "Sincronizar dados com o sistema bancário",
    explicacao:
      "Atualiza na hora as informações de agências, equipe, produtos, empréstimos e poupança com o servidor bancário.",
    oQueToca: "Sincronização bancária",
    risco: "atencao",
    pacotes: ["organizar"],
  },
]);
