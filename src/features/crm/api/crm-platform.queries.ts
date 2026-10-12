import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmFormulaFieldApi, crmRollupApi, crmValidationRuleApi } from './crm-platform.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type {
  CreateFormulaFieldRequest,
  CreateRollupSummaryRequest,
  CreateValidationRuleRequest,
} from '../types/crm-platform.types';

const KEYS = {
  rules: (entityType?: string) => ['crm', 'validation-rules', entityType ?? 'all'] as const,
  formulas: (entityType?: string) => ['crm', 'formula-fields', entityType ?? 'all'] as const,
  rollups: ['crm', 'rollups'] as const,
};

export function useValidationRules(entityType?: string) {
  return useQuery({
    queryKey: KEYS.rules(entityType),
    queryFn: () => crmValidationRuleApi.list(entityType),
  });
}

export function useCreateValidationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateValidationRuleRequest) => crmValidationRuleApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'validation-rules'] });
      toast.success('Rule recorded');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteValidationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmValidationRuleApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'validation-rules'] });
      toast.success('Rule deleted');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useFormulaFields(entityType?: string) {
  return useQuery({
    queryKey: KEYS.formulas(entityType),
    queryFn: () => crmFormulaFieldApi.list(entityType),
  });
}

export function useCreateFormulaField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateFormulaFieldRequest) => crmFormulaFieldApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'formula-fields'] });
      toast.success('Formula recorded');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteFormulaField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmFormulaFieldApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'formula-fields'] });
      toast.success('Formula deleted');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useRollups() {
  return useQuery({ queryKey: KEYS.rollups, queryFn: () => crmRollupApi.list() });
}

export function useCreateRollup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateRollupSummaryRequest) => crmRollupApi.create(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rollups });
      toast.success('Rollup recorded');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteRollup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmRollupApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rollups });
      toast.success('Rollup deleted');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
