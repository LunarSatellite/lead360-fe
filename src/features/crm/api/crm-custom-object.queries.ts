import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmCustomObjectApi } from './crm-custom-object.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type {
  CreateCustomObjectDefinitionRequest,
  CreateCustomObjectFieldRequest,
} from '../types/crm-custom-object.types';

const KEYS = {
  definitions: ['crm', 'custom-objects'] as const,
  definition: (id: string) => ['crm', 'custom-objects', id] as const,
};

export function useCustomObjectDefinitions() {
  return useQuery({
    queryKey: KEYS.definitions,
    queryFn: () => crmCustomObjectApi.getDefinitions(),
  });
}

export function useCustomObjectDefinition(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.definition(id ?? ''),
    queryFn: () => crmCustomObjectApi.getDefinition(id!),
    enabled: !!id,
  });
}

export function useCreateCustomObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCustomObjectDefinitionRequest) =>
      crmCustomObjectApi.createDefinition(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.definitions });
      toast.success('Object created');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteCustomObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmCustomObjectApi.deleteDefinition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.definitions });
      toast.success('Object deleted');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useAddCustomObjectField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      objectDefId,
      req,
    }: {
      objectDefId: string;
      req: CreateCustomObjectFieldRequest;
    }) => crmCustomObjectApi.addField(objectDefId, req),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.definition(vars.objectDefId) });
      qc.invalidateQueries({ queryKey: KEYS.definitions });
      toast.success('Field added');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
