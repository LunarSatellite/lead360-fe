/**
 * Tenant currencies and their exchange rates.
 *
 * Mirrors `CrmMultiCurrencyController` (`/v1/crm/currencies`) and
 * `CrmMultiCurrencyDtos.cs`.
 *
 * `rate` is read against the base currency: one unit of this currency is
 * `rate` of the base. Exactly one currency carries `isBaseCurrency`, and
 * `set-base` moves it rather than toggling a flag, so there is no way through
 * the API to end up with two or none.
 */

export interface CrmCurrencyDto {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol?: string | null;
  decimalPlaces?: number;
  isBaseCurrency?: boolean;
}

export interface CrmExchangeRateDto {
  id: string;
  currencyId: string;
  rate: number;
  effectiveDate: string;
  source: string;
  createdAt: string;
}

export interface CreateExchangeRateRequest {
  currencyId: string;
  rate: number;
  source?: string;
}

export interface CurrencyConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
  rateDate: string;
}
