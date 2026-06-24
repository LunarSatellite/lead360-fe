import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingApi } from './booking.api';
import type {
  UpsertBookingPageRequest,
  CreateEventTypeRequest,
  UpdateEventTypeRequest,
  PublicBookingConfirmRequest,
} from './booking.api';

const KEYS = {
  page: ['booking-page'] as const,
  publicPage: (slug: string) => ['public-booking', slug] as const,
  publicSlots: (slug: string, etId: string) => ['public-booking-slots', slug, etId] as const,
};

// ── Authenticated management ────────────────────────────────────────────────

export function useBookingPage() {
  return useQuery({
    queryKey: KEYS.page,
    queryFn: () => bookingApi.getOrCreate(),
  });
}

export function useUpdateBookingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertBookingPageRequest) => bookingApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.page });
      toast.success('Booking page updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Update failed'),
  });
}

export function useAddEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventTypeRequest) => bookingApi.addEventType(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.page });
      toast.success('Event type added');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add event type'),
  });
}

export function useUpdateEventType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEventTypeRequest) => bookingApi.updateEventType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.page });
      toast.success('Event type updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Update failed'),
  });
}

export function useDeleteEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingApi.deleteEventType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.page });
      toast.success('Event type removed');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Delete failed'),
  });
}

// ── Public ──────────────────────────────────────────────────────────────────

export function usePublicBookingPage(slug: string) {
  return useQuery({
    queryKey: KEYS.publicPage(slug),
    queryFn: () => bookingApi.getPublicPage(slug),
    enabled: !!slug,
    retry: false,
  });
}

export function usePublicSlots(slug: string, eventTypeId: string, enabled: boolean) {
  return useQuery({
    queryKey: KEYS.publicSlots(slug, eventTypeId),
    queryFn: () => bookingApi.getPublicSlots(slug, eventTypeId),
    enabled: enabled && !!slug && !!eventTypeId,
    retry: false,
  });
}

export function useConfirmBooking(slug: string, eventTypeId: string) {
  return useMutation({
    mutationFn: (data: PublicBookingConfirmRequest) =>
      bookingApi.confirmBooking(slug, eventTypeId, data),
  });
}
