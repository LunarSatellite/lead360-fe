import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import { portalApi } from './portal.api';
import {
  clearPortalTokens,
  getPortalToken,
} from '../hooks/usePortalAuth';
import type {
  PortalOpenCaseRequest,
  PortalReplyRequest,
  PortalResolveRequest,
} from '../types/portal.types';

export const portalKeys = {
  all: QUERY_KEYS.portal,
  me: () => [...portalKeys.all, 'me'] as const,
  cases: () => [...portalKeys.all, 'cases'] as const,
  caseDetail: (id: string) => [...portalKeys.all, 'cases', id] as const,
  invoices: () => [...portalKeys.all, 'invoices'] as const,
  orders: () => [...portalKeys.all, 'orders'] as const,
  subscriptions: () => [...portalKeys.all, 'subscriptions'] as const,
};

// ── Queries ──

export function usePortalMe() {
  return useQuery({
    queryKey: portalKeys.me(),
    queryFn: () => portalApi.getMe(),
    enabled: !!getPortalToken(),
    staleTime: 5 * 60_000,
  });
}

export function usePortalCases() {
  return useQuery({
    queryKey: portalKeys.cases(),
    queryFn: () => portalApi.getCases(),
    enabled: !!getPortalToken(),
  });
}

export function usePortalCase(id: string) {
  return useQuery({
    queryKey: portalKeys.caseDetail(id),
    queryFn: () => portalApi.getCase(id),
    enabled: !!getPortalToken() && !!id,
  });
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: portalKeys.invoices(),
    queryFn: () => portalApi.getInvoices(),
    enabled: !!getPortalToken(),
  });
}

export function usePortalOrders() {
  return useQuery({
    queryKey: portalKeys.orders(),
    queryFn: () => portalApi.getOrders(),
    enabled: !!getPortalToken(),
  });
}

export function usePortalSubscriptions() {
  return useQuery({
    queryKey: portalKeys.subscriptions(),
    queryFn: () => portalApi.getSubscriptions(),
    enabled: !!getPortalToken(),
  });
}

// ── Auth Mutations ──

export function usePortalRequestLink() {
  return useMutation({
    mutationFn: portalApi.requestLink,
    onSuccess: () => toast.success('Check your email for a sign-in link'),
    onError: () => toast.error('Failed to send magic link'),
  });
}

export function usePortalExchange() {
  return useMutation({
    mutationFn: portalApi.exchange,
  });
}

export function usePortalLogout() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: portalApi.logout,
    onSettled: () => {
      clearPortalTokens();
      qc.clear();
      navigate('/portal/auth');
    },
  });
}

// ── Data Mutations ──

export function usePortalOpenCase() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: PortalOpenCaseRequest) => portalApi.openCase(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: portalKeys.cases() });
      toast.success('Case opened');
      const r = result as unknown as Record<string, unknown>;
      const id = r.id ?? r.Id;
      if (id) navigate(`/portal/cases/${id}`);
    },
    onError: () => toast.error('Failed to open case'),
  });
}

export function usePortalReplyToCase(caseId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: PortalReplyRequest) => portalApi.replyToCase(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portalKeys.caseDetail(caseId) });
      toast.success('Reply sent');
    },
    onError: () => toast.error('Failed to send reply'),
  });
}

export function usePortalResolveCase(caseId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data?: PortalResolveRequest) => portalApi.resolveCase(caseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portalKeys.caseDetail(caseId) });
      qc.invalidateQueries({ queryKey: portalKeys.cases() });
      toast.success('Case resolved');
    },
    onError: () => toast.error('Failed to resolve case'),
  });
}
