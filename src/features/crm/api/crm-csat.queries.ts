import { useQuery } from '@tanstack/react-query';
import { crmCsatApi } from './crm-csat.api';

const KEYS = {
  byContact: (contactId: string) => ['crm', 'csat', 'contact', contactId] as const,
  summary: (since?: string) => ['crm', 'csat', 'summary', since ?? 'all'] as const,
};

export function useCsatByContact(contactId: string | undefined) {
  return useQuery({
    queryKey: KEYS.byContact(contactId ?? ''),
    queryFn: () => crmCsatApi.getByContact(contactId!),
    enabled: !!contactId,
  });
}

export function useCsatTenantSummary(since?: string) {
  return useQuery({
    queryKey: KEYS.summary(since),
    queryFn: () => crmCsatApi.getTenantSummary(since),
  });
}
