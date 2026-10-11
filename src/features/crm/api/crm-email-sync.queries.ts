import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmEmailSyncApi } from './crm-email-sync.api';
import { getApiError } from '@/shared/lib/get-api-error';

const KEY = ['crm', 'email-integrations'] as const;

export function useEmailIntegrations() {
  return useQuery({ queryKey: KEY, queryFn: () => crmEmailSyncApi.list() });
}

export function useDisconnectEmailIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmEmailSyncApi.disconnect(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Mailbox disconnected');
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useSyncEmailIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmEmailSyncApi.sync(id),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: KEY });
      // The endpoint answers 200 with an `error` field set when the provider
      // refused, so a bare "Synced" would report someone else's failure as
      // success. Read the body, not the status.
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Read ${result.emailsProcessed} ${result.emailsProcessed === 1 ? 'email' : 'emails'}, ` +
          `${result.signalsCreated} added to the CRM`
      );
    },
    onError: (e) => toast.error(getApiError(e).message),
  });
}
