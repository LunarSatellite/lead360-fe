import { portalApiClient } from './portal-api-client';
import type {
  PortalAuthResult,
  PortalCaseDetailDto,
  PortalCaseListItemDto,
  PortalExchangeRequest,
  PortalInvoiceDto,
  PortalLogoutRequest,
  PortalMeDto,
  PortalOpenCaseRequest,
  PortalOrderDto,
  PortalReplyRequest,
  PortalRequestLinkRequest,
  PortalResolveRequest,
  PortalSubscriptionDto,
  PortalTokenRefreshRequest,
} from '../types/portal.types';

export const portalApi = {
  // ── Auth (anonymous) ──
  requestLink: (data: PortalRequestLinkRequest) =>
    portalApiClient.post<boolean>('/v1/portal/auth/request-link', data),

  exchange: (data: PortalExchangeRequest) =>
    portalApiClient.post<PortalAuthResult>('/v1/portal/auth/exchange', data),

  refresh: (data: PortalTokenRefreshRequest) =>
    portalApiClient.post<PortalAuthResult>('/v1/portal/auth/refresh', data),

  logout: (data: PortalLogoutRequest) =>
    portalApiClient.post<boolean>('/v1/portal/auth/logout', data),

  // ── Data (authenticated) ──
  getMe: () =>
    portalApiClient.get<PortalMeDto>('/v1/portal/me'),

  getCases: () =>
    portalApiClient.get<PortalCaseListItemDto[]>('/v1/portal/cases'),

  getCase: (id: string) =>
    portalApiClient.get<PortalCaseDetailDto>(`/v1/portal/cases/${id}`),

  openCase: (data: PortalOpenCaseRequest) =>
    portalApiClient.post<PortalCaseDetailDto>('/v1/portal/cases', data),

  replyToCase: (id: string, data: PortalReplyRequest) =>
    portalApiClient.post<PortalCaseDetailDto>(`/v1/portal/cases/${id}/messages`, data),

  resolveCase: (id: string, data?: PortalResolveRequest) =>
    portalApiClient.post<PortalCaseDetailDto>(`/v1/portal/cases/${id}/resolve`, data),

  getInvoices: () =>
    portalApiClient.get<PortalInvoiceDto[]>('/v1/portal/invoices'),

  getOrders: () =>
    portalApiClient.get<PortalOrderDto[]>('/v1/portal/orders'),

  getSubscriptions: () =>
    portalApiClient.get<PortalSubscriptionDto[]>('/v1/portal/subscriptions'),
};
