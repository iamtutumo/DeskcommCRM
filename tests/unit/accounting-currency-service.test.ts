import { describe, expect, it } from "vitest";

import {
  CurrencyService,
  DEFAULT_BASE_CURRENCY,
} from "@/lib/accounting/currency";

describe("DeskcommCRM Currency & Exchange Rate Service", () => {
  it("uses UGX (Uganda Shillings) as the default base currency", () => {
    expect(DEFAULT_BASE_CURRENCY).toBe("UGX");
    expect(CurrencyService.getExchangeRate("UGX")).toBe(1);
  });

  it("converts USD amounts into UGX using defined exchange rate", () => {
    const res = CurrencyService.convertToBase(100, "USD", "UGX");
    expect(res.original_amount).toBe(100);
    expect(res.original_currency).toBe("USD");
    expect(res.exchange_rate).toBe(3750); // 1 USD = 3750 UGX
    expect(res.base_amount).toBe(375000); // 100 * 3750
    expect(res.base_currency).toBe("UGX");
  });

  it("converts KES amounts into UGX", () => {
    const res = CurrencyService.convertToBase(1000, "KES", "UGX");
    expect(res.exchange_rate).toBe(29); // 1 KES = 29 UGX
    expect(res.base_amount).toBe(29000);
  });

  it("allows defining custom exchange rates", () => {
    CurrencyService.setExchangeRate("CAD", 2750, "UGX");
    const rate = CurrencyService.getExchangeRate("CAD", "UGX");
    expect(rate).toBe(2750);

    const converted = CurrencyService.convertToBase(50, "CAD", "UGX");
    expect(converted.base_amount).toBe(137500); // 50 * 2750
  });

  it("throws clear error when attempting to convert an undefined currency", () => {
    expect(() => CurrencyService.getExchangeRate("XXX", "UGX")).toThrow(
      "No exchange rate defined for XXX to UGX.",
    );
  });
});
