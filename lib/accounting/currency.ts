/**
 * Flexible Currency & Exchange Rate Service for DeskcommCRM (lib/accounting/currency.ts).
 *
 * Supports multi-currency transactions with automatic conversion to the
 * organization's default base currency (default: UGX — Uganda Shillings).
 */

export const DEFAULT_BASE_CURRENCY = "UGX";

export interface CurrencyExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number; // e.g. 1 USD = 3750 UGX -> rate = 3750
  effective_date: string;
}

export interface CurrencyConversionResult {
  original_amount: number;
  original_currency: string;
  exchange_rate: number;
  base_amount: number;
  base_currency: string;
}

export class CurrencyService {
  private static readonly exchangeRates: Map<string, number> = new Map([
    ["UGX:UGX", 1],
    ["USD:UGX", 3750], // 1 USD = 3750 UGX
    ["KES:UGX", 29],   // 1 KES = 29 UGX
    ["EUR:UGX", 4100], // 1 EUR = 4100 UGX
    ["GBP:UGX", 4900], // 1 GBP = 4900 UGX
  ]);

  /**
   * Registers or updates an exchange rate between two currencies.
   */
  static setExchangeRate(
    targetCurrency: string,
    rateToBase: number,
    baseCurrency = DEFAULT_BASE_CURRENCY,
  ): void {
    if (rateToBase <= 0) {
      throw new Error("Exchange rate must be a positive number greater than zero.");
    }
    const key = `${targetCurrency.toUpperCase()}:${baseCurrency.toUpperCase()}`;
    this.exchangeRates.set(key, rateToBase);
  }

  /**
   * Retrieves the exchange rate to convert targetCurrency into baseCurrency.
   */
  static getExchangeRate(
    targetCurrency: string,
    baseCurrency = DEFAULT_BASE_CURRENCY,
  ): number {
    const key = `${targetCurrency.toUpperCase()}:${baseCurrency.toUpperCase()}`;
    const rate = this.exchangeRates.get(key);
    if (rate === undefined) {
      throw new Error(
        `No exchange rate defined for ${targetCurrency.toUpperCase()} to ${baseCurrency.toUpperCase()}.`,
      );
    }
    return rate;
  }

  /**
   * Automatically converts an amount in any supported currency into the
   * organization's default base currency (UGX).
   */
  static convertToBase(
    amount: number,
    currency: string,
    baseCurrency = DEFAULT_BASE_CURRENCY,
  ): CurrencyConversionResult {
    const rate = this.getExchangeRate(currency, baseCurrency);
    const baseAmount = Math.round(amount * rate);
    return {
      original_amount: amount,
      original_currency: currency.toUpperCase(),
      exchange_rate: rate,
      base_amount: baseAmount,
      base_currency: baseCurrency.toUpperCase(),
    };
  }
}
