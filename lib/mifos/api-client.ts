/**
 * Official REST client for Apache Fineract / Mifos X.
 *
 * Enforces the mandatory `fineract-platform-tenantid` header on every HTTP
 * request, preventing tenant data leakage across shared Fineract clusters (M-01).
 *
 * Supports Clients, Loan Accounts, Savings Accounts, Share Accounts,
 * Amortization Schedules, Charges/Fees, Local Simulation, Document Generation,
 * Branches (Offices), Staff, and Financial Products.
 */

import {
  APP_USER_AGENT,
  DEFAULT_FINERACT_TIMEOUT_MS,
  getFineractConfig,
  type FineractConfig,
} from "./config";
import type {
  FineractClientSummary,
  FineractCreateLoanRequest,
  FineractDocumentMetadata,
  FineractLoanAccountSummary,
  FineractLoanCharge,
  FineractLoanProduct,
  FineractLoanSimulationParams,
  FineractLoanSimulationResult,
  FineractOffice,
  FineractRepaymentSchedule,
  FineractSavingsAccountSummary,
  FineractSavingsProduct,
  FineractShareAccountSummary,
  FineractShareProduct,
  FineractStaff,
} from "./types";

export class FineractApiError extends Error {
  status: number;
  code: string;
  body: string;

  constructor(status: number, code: string, body: string, message?: string) {
    super(message ?? `Apache Fineract API Error ${status} (${code})`);
    this.name = "FineractApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export class FineractApiClient {
  private readonly config: FineractConfig;

  constructor(configOverride?: FineractConfig) {
    const loaded = configOverride ?? getFineractConfig();
    if (!loaded) {
      throw new Error(
        "FineractApiClient is not configured: set MIFOS_BASE_URL in environment variables.",
      );
    }
    this.config = loaded;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": APP_USER_AGENT,
      "fineract-platform-tenantid": this.config.tenantId,
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    } else if (this.config.username && this.config.password) {
      const basic = Buffer.from(
        `${this.config.username}:${this.config.password}`,
      ).toString("base64");
      headers["Authorization"] = `Basic ${basic}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_FINERACT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: this.getHeaders(),
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new FineractApiError(
          response.status,
          response.statusText,
          text,
          `Fineract API Error (${response.status}): ${text.slice(0, 200)}`,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  // --- Reference Catalog Endpoints ---

  async getOffices(): Promise<FineractOffice[]> {
    try {
      const res = await this.request<FineractOffice[]>("/fineract-provider/api/v1/offices");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  async getStaff(officeId?: number): Promise<FineractStaff[]> {
    try {
      const query = officeId ? `?officeId=${officeId}` : "";
      const res = await this.request<FineractStaff[]>(`/fineract-provider/api/v1/staff${query}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  async getLoanProducts(): Promise<FineractLoanProduct[]> {
    try {
      const res = await this.request<FineractLoanProduct[]>("/fineract-provider/api/v1/loanproducts");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  async getSavingsProducts(): Promise<FineractSavingsProduct[]> {
    try {
      const res = await this.request<FineractSavingsProduct[]>("/fineract-provider/api/v1/savingsproducts");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  async getShareProducts(): Promise<FineractShareProduct[]> {
    try {
      const res = await this.request<FineractShareProduct[]>("/fineract-provider/api/v1/shareproducts");
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  // --- Client & Account Endpoints ---

  async getClientByMobileNo(mobileNo: string): Promise<FineractClientSummary[]> {
    const cleanPhone = mobileNo.replace(/\D/g, "");
    const res = await this.request<{ pageItems?: FineractClientSummary[] }>(
      `/fineract-provider/api/v1/clients?mobileNo=${encodeURIComponent(cleanPhone)}`,
    );
    return res.pageItems ?? [];
  }

  async getClientByExternalId(externalId: string): Promise<FineractClientSummary | null> {
    const res = await this.request<{ pageItems?: FineractClientSummary[] }>(
      `/fineract-provider/api/v1/clients?externalId=${encodeURIComponent(externalId)}`,
    );
    const items = res.pageItems ?? [];
    return items.length > 0 ? (items[0] ?? null) : null;
  }

  async getLoanAccounts(clientId: number): Promise<FineractLoanAccountSummary[]> {
    const res = await this.request<{
      loanAccounts?: FineractLoanAccountSummary[];
    }>(`/fineract-provider/api/v1/clients/${clientId}/accounts`);
    return res.loanAccounts ?? [];
  }

  async getSavingsAccounts(clientId: number): Promise<FineractSavingsAccountSummary[]> {
    try {
      const res = await this.request<{
        savingsAccounts?: FineractSavingsAccountSummary[];
      }>(`/fineract-provider/api/v1/clients/${clientId}/accounts`);
      return res.savingsAccounts ?? [];
    } catch {
      return [];
    }
  }

  async getShareAccounts(clientId: number): Promise<FineractShareAccountSummary[]> {
    try {
      const res = await this.request<{
        shareAccounts?: FineractShareAccountSummary[];
      }>(`/fineract-provider/api/v1/clients/${clientId}/accounts`);
      return res.shareAccounts ?? [];
    } catch {
      return [];
    }
  }

  async getRepaymentSchedule(loanId: number): Promise<FineractRepaymentSchedule | null> {
    try {
      const res = await this.request<{ repaymentSchedule?: FineractRepaymentSchedule }>(
        `/fineract-provider/api/v1/loans/${loanId}?associations=repaymentSchedule`,
      );
      return res.repaymentSchedule ?? null;
    } catch (e) {
      if (e instanceof FineractApiError && e.status === 404) {
        return null;
      }
      throw e;
    }
  }

  async getLoanCharges(loanId: number): Promise<FineractLoanCharge[]> {
    try {
      const res = await this.request<FineractLoanCharge[]>(
        `/fineract-provider/api/v1/loans/${loanId}/charges`,
      );
      return Array.isArray(res) ? res : [];
    } catch (e) {
      if (e instanceof FineractApiError && e.status === 404) {
        return [];
      }
      throw e;
    }
  }

  async getDocuments(
    entityType: "clients" | "loans",
    entityId: number,
  ): Promise<FineractDocumentMetadata[]> {
    try {
      const res = await this.request<FineractDocumentMetadata[]>(
        `/fineract-provider/api/v1/${entityType}/${entityId}/documents`,
      );
      return Array.isArray(res) ? res : [];
    } catch (e) {
      if (e instanceof FineractApiError && e.status === 404) {
        return [];
      }
      throw e;
    }
  }

  simulateLoanSchedule(params: FineractLoanSimulationParams): FineractLoanSimulationResult {
    const principal = params.principal;
    const n = params.numberOfRepayments;
    const rate = params.interestRatePerPeriod / 100;

    let installment = 0;
    if (rate === 0 || n <= 0) {
      installment = n > 0 ? principal / n : principal;
    } else {
      const denominator = 1 - Math.pow(1 + rate, -n);
      installment = denominator > 0 ? principal * (rate / denominator) : principal / n;
    }

    const roundedInstallment = Number(installment.toFixed(2));
    const totalRepaymentExpected = Number((roundedInstallment * n).toFixed(2));
    const totalInterest = Number((totalRepaymentExpected - principal).toFixed(2));

    return {
      principal: Number(principal.toFixed(2)),
      totalInterest,
      totalRepaymentExpected,
      numberOfRepayments: n,
      estimatedInstallmentAmount: roundedInstallment,
      currency: "UGX",
    };
  }

  async createLoanApplication(
    request: FineractCreateLoanRequest,
  ): Promise<{ resourceId: number; loanId: number }> {
    const payload = {
      ...request,
      dateFormat: request.dateFormat ?? "dd MMMM yyyy",
      locale: request.locale ?? "en",
    };
    const res = await this.request<{ resourceId: number; loanId: number }>(
      `/fineract-provider/api/v1/loans`,
      {
        method: "POST",
        body: payload,
      },
    );
    return res;
  }
}
