import { apiClient } from '@/shared/lib/api-client';
import type { PagedResult } from '@/shared/types';
import type {
  CreateCurrencyRequest,
  CreateExchangeRateRequest,
  CrmCurrencyDto,
  CrmExchangeRateDto,
  CurrencyConversionResult,
} from '../types/crm-currency.types';

const BASE = '/v1/crm/currencies';

export const crmCurrencyApi = {
  getCurrencies: (page = 1, pageSize = 50): Promise<PagedResult<CrmCurrencyDto>> =>
    apiClient.get(BASE, { params: { page, pageSize } }) as unknown as Promise<
      PagedResult<CrmCurrencyDto>
    >,

  create: (req: CreateCurrencyRequest): Promise<CrmCurrencyDto> =>
    apiClient.post(BASE, req) as unknown as Promise<CrmCurrencyDto>,

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`) as unknown as Promise<void>,

  /** Moves the base currency to this one; the previous base stops being base. */
  setBase: (id: string): Promise<void> =>
    apiClient.post(`${BASE}/${id}/set-base`, {}) as unknown as Promise<void>,

  setRate: (req: CreateExchangeRateRequest): Promise<CrmExchangeRateDto> =>
    apiClient.post(`${BASE}/rates`, req) as unknown as Promise<CrmExchangeRateDto>,

  /** Amount and codes go in the query string, not a body — see the controller. */
  convert: (
    amount: number,
    from: string,
    to: string
  ): Promise<CurrencyConversionResult> =>
    apiClient.post(`${BASE}/convert`, null, {
      params: { amount, from, to },
    }) as unknown as Promise<CurrencyConversionResult>,
};
