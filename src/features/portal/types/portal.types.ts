// ── Auth DTOs ──

export interface PortalRequestLinkRequest {
  tenantId: string;
  email: string;
}

export interface PortalExchangeRequest {
  tenantId: string;
  token: string;
}

export interface PortalTokenRefreshRequest {
  refreshToken: string;
}

export interface PortalLogoutRequest {
  refreshToken: string;
}

export interface PortalMeDto {
  contactId: string;
  fullName: string;
  email: string | null;
}

export interface PortalAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresInMinutes: number;
  me: PortalMeDto;
}

// ── Data DTOs ──

export interface PortalCaseListItemDto {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PortalCaseMessageDto {
  id: string;
  from: 'customer' | 'agent';
  body: string;
  sentAt: string;
}

export interface PortalCaseDetailDto {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  messages: PortalCaseMessageDto[];
}

export interface PortalInvoiceDto {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueDate: string;
  paidAt: string | null;
}

export interface PortalOrderDto {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentStatus: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
}

export interface PortalSubscriptionDto {
  id: string;
  planName: string;
  status: string;
  billingCadence: string;
  startDate: string;
  nextBillingDate: string | null;
  endDate: string | null;
  amount: number;
  currency: string;
}

// ── Write requests ──

export interface PortalOpenCaseRequest {
  subject: string;
  description?: string;
}

export interface PortalReplyRequest {
  body: string;
}

export interface PortalResolveRequest {
  note?: string;
}
