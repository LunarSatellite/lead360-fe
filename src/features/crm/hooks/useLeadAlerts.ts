import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useLeadAlerts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('omniflow_token');
    if (!token) return;

    const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'https://localhost:50362/api';
    // Hub URL is at the API root, not under /api
    const hubUrl = apiBase.replace('/api', '') + '/hubs/chat';

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('omniflow_token') || '',
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('LeadAlert', (payload: any) => {
      const name = payload?.customerName || payload?.channelHandle || 'A lead';
      const type = payload?.notificationType;
      if (type === 'LeadConverted') {
        toast.success(`Booking confirmed: ${name}`, { duration: 6000 });
      } else {
        toast(`Hot lead: ${name} — Score ${payload?.score}/100`, {
          duration: 8000,
          icon: '🔥',
        });
      }
      // Invalidate leads + notifications so dashboard updates
      queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'notifications'] });
    });

    connection.on('StaffConnected', () => {
      console.debug('[CRM] Staff connected to real-time hub');
    });

    connection.start().catch((err) => {
      console.warn('[CRM] SignalR connection failed — real-time alerts disabled:', err);
    });

    return () => {
      connection.stop();
    };
  }, [queryClient]);
}
