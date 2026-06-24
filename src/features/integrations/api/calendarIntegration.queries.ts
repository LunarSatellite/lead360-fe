import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { calendarIntegrationApi } from './calendarIntegration.api';

const KEYS = {
  status: () => ['calendarIntegration', 'status'] as const,
};

export function useCalendarIntegrationStatus() {
  return useQuery({
    queryKey: KEYS.status(),
    queryFn:  () => calendarIntegrationApi.getStatus(),
  });
}

export function useConnectCalendar() {
  return useMutation({
    mutationFn: async (redirectUri: string) => {
      const res = await calendarIntegrationApi.getAuthorizationUrl(redirectUri);
      return res.authorizationUrl;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: () => toast.error('Failed to initiate Google Calendar connection.'),
  });
}

export function useDisconnectCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => calendarIntegrationApi.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status() });
      toast.success('Google Calendar disconnected.');
    },
    onError: () => toast.error('Failed to disconnect Google Calendar.'),
  });
}
