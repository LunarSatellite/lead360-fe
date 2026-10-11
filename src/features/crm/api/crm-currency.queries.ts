import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmCurrencyApi } from './crm-currency.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type {
  CreateCurrencyRequest,
  CreateExchangeRateRequest,
} from '../types/crm-currency.types';

const KEY = ['crm', 'currencies'] as const;

export function useCurrencies() {
  return useQuery({ queryKey: KEY, queryFn: () => crmCurrencyApi.getCurrencies() });
}

export function useCreateCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCurrencyRequest) => crmCurrencyApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Currency added');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmCurrencyApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Currency removed');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useSetBaseCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmCurrencyApi.setBase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Every stored rate is quoted against the base, so moving it reprices
      // the whole table — say so rather than a bare "Saved".
      toast.success('Base currency moved — rates are now quoted against it');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useSetExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateExchangeRateRequest) => crmCurrencyApi.setRate(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Rate saved');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
