import { apiClient } from '@/shared/lib/api-client';

export interface BookingPageEventTypeDto {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BookingPageDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  welcomeMessage: string | null;
  isActive: boolean;
  eventTypes: BookingPageEventTypeDto[];
}

export interface PublicEventTypeDto {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  color: string;
}

export interface PublicBookingPageDto {
  slug: string;
  title: string;
  description: string | null;
  welcomeMessage: string | null;
  eventTypes: PublicEventTypeDto[];
}

export interface MeetingSlotDto {
  start: string;
  end: string;
  timezone: string;
}

export interface PublicBookingConfirmRequest {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  selectedSlot: string;
  timezone?: string;
  notes?: string;
}

export interface PublicBookingConfirmedDto {
  meetingTitle: string;
  confirmedSlot: string;
  durationMinutes: number;
  joinUrl: string | null;
  message: string;
}

export interface UpsertBookingPageRequest {
  slug?: string;
  title: string;
  description?: string;
  welcomeMessage?: string;
  isActive: boolean;
}

export interface CreateEventTypeRequest {
  title: string;
  description?: string;
  durationMinutes: number;
  color?: string;
  sortOrder?: number;
}

export interface UpdateEventTypeRequest {
  title: string;
  description?: string;
  durationMinutes: number;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

export const bookingApi = {
  // Authenticated management
  getOrCreate: () =>
    apiClient.get<BookingPageDto>('/v1/booking-page'),

  update: (data: UpsertBookingPageRequest) =>
    apiClient.put<BookingPageDto>('/v1/booking-page', data),

  addEventType: (data: CreateEventTypeRequest) =>
    apiClient.post<BookingPageEventTypeDto>('/v1/booking-page/event-types', data),

  updateEventType: (id: string, data: UpdateEventTypeRequest) =>
    apiClient.put<BookingPageEventTypeDto>(`/v1/booking-page/event-types/${id}`, data),

  deleteEventType: (id: string) =>
    apiClient.delete(`/v1/booking-page/event-types/${id}`),

  // Public (no auth)
  getPublicPage: (slug: string) =>
    apiClient.get<PublicBookingPageDto>(`/v1/book/${slug}`),

  getPublicSlots: (slug: string, eventTypeId: string) =>
    apiClient.get<MeetingSlotDto[]>(`/v1/book/${slug}/${eventTypeId}/slots`),

  confirmBooking: (slug: string, eventTypeId: string, data: PublicBookingConfirmRequest) =>
    apiClient.post<PublicBookingConfirmedDto>(`/v1/book/${slug}/${eventTypeId}/confirm`, data),
};
