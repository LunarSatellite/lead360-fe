import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/shared/config/env';

/**
 * Live updates for the Shared Inbox. Connects to the staff SignalR hub and refreshes the inbox
 * whenever any teammate claims or releases an item, so the queue stays accurate without a manual
 * refresh. Best-effort — if the socket can't connect, the page still works (just not live).
 */
export function useInboxRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('omniflow_token');
    if (!token) return;

    // env.apiBaseUrl, not a hardcoded fallback: a literal localhost here ships to production
    // and fails there only, which is what no-hardcoded-origins.test.ts exists to catch.
    const apiBase = env.apiBaseUrl;
    const hubUrl = apiBase.replace('/api', '') + '/hubs/chat';

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('omniflow_token') || '',
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['crm', 'inbox'] });
    connection.on('InboxItemClaimed', refresh);
    connection.on('InboxItemReleased', refresh);

    connection.start().catch((err) => {
      console.warn('[CRM] Inbox real-time disabled — could not connect:', err);
    });

    return () => {
      connection.stop();
    };
  }, [queryClient]);
}
