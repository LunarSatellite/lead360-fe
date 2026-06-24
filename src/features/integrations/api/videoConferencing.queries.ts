import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { videoConferencingApi, type VideoProvider } from './videoConferencing.api';

const KEYS = {
  status: () => ['videoConferencing', 'status'] as const,
};

export function useVideoConferencingStatus() {
  return useQuery({
    queryKey: KEYS.status(),
    queryFn:  () => videoConferencingApi.getStatus(),
  });
}

export function useConnectVideoProvider() {
  return useMutation({
    mutationFn: async ({ provider, redirectUri }: { provider: VideoProvider; redirectUri: string }) => {
      const res = await videoConferencingApi.getAuthorizationUrl(provider, redirectUri);
      return res.authorizationUrl;
    },
    onSuccess: (url) => {
      // Full-page redirect — browser goes to provider OAuth page.
      // After user authorizes, provider redirects to backend callback,
      // which then redirects back to this page with ?vc_connected or ?vc_error.
      window.location.href = url;
    },
    onError: () => toast.error('Failed to initiate OAuth connection.'),
  });
}

export function useDisconnectVideoProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: VideoProvider) => videoConferencingApi.disconnect(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status() });
      toast.success('Integration disconnected.');
    },
    onError: () => toast.error('Failed to disconnect integration.'),
  });
}

export function useSetDefaultVideoProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: VideoProvider) => videoConferencingApi.setDefault(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status() });
      toast.success('Default provider updated.');
    },
    onError: () => toast.error('Failed to set default provider.'),
  });
}
