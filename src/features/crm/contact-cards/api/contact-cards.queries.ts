import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-client";
import { contactCardsApi } from "./contact-cards.api";
import { cardFilename, saveBlob, absolutePublicUrl } from "./contact-cards.api";
import type { CrmContactCardDto, UpdateCrmContactCardRequest } from "../types/contact-cards.types";

export const contactCardKeys = {
  all: ["contact-cards"] as const,
  list: () => [...contactCardKeys.all, "list"] as const,
  detail: (userId: string) => [...contactCardKeys.all, "detail", userId] as const,
  stats: (userId: string) => [...contactCardKeys.all, "stats", userId] as const,
  payload: (userId: string) => [...contactCardKeys.all, "payload", userId] as const,
};

// ─── List all team cards ───
export function useContactCards() {
  return useQuery({
    queryKey: contactCardKeys.list(),
    queryFn: () => contactCardsApi.list(),
    staleTime: 60_000,
  });
}

// ─── Get one card by userId ───
export function useContactCard(userId: string | null | undefined) {
  return useQuery({
    queryKey: contactCardKeys.detail(userId ?? ""),
    queryFn: () => contactCardsApi.get(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ─── Scan stats for one card ───
export function useContactCardStats(userId: string | null | undefined) {
  return useQuery({
    queryKey: contactCardKeys.stats(userId ?? ""),
    queryFn: () => contactCardsApi.stats(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// ─── Pre-built MECARD / vCard / scanUrl payload ───
export function useContactCardPayload(userId: string | null | undefined) {
  return useQuery({
    queryKey: contactCardKeys.payload(userId ?? ""),
    queryFn: () => contactCardsApi.payload(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ─── Regenerate the public token (invalidates old QR/vCard links) ───
export function useRegenerateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => contactCardsApi.regenerateToken(userId),
    onSuccess: (data: CrmContactCardDto) => {
      qc.invalidateQueries({ queryKey: contactCardKeys.list() });
      qc.invalidateQueries({ queryKey: contactCardKeys.detail(data.userId) });
      qc.invalidateQueries({ queryKey: contactCardKeys.payload(data.userId) });
      toast.success("Token regenerated. Old QR codes will no longer work.");
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to regenerate token."),
  });
}

// ─── Patch notes / active flag ───
export function useUpdateContactCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateCrmContactCardRequest }) =>
      contactCardsApi.update(userId, data),
    onSuccess: (updated: CrmContactCardDto) => {
      qc.invalidateQueries({ queryKey: contactCardKeys.list() });
      qc.invalidateQueries({ queryKey: contactCardKeys.detail(updated.userId) });
      toast.success("Card updated.");
    },
    onError: (err: ApiError) =>
      toast.error(err.message || "Failed to update card."),
  });
}

// ─── Composite: download PNG ───
export function useDownloadCardPng() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string): Promise<string> => {
      const blob = await contactCardsApi.qrPng(userId, 1024);
      const card = qc.getQueryData<CrmContactCardDto>(contactCardKeys.detail(userId));
      const name = card ? cardFilename(card, "png") : `${userId}-qr.png`;
      saveBlob(blob, name);
      return name;
    },
    onSuccess: (filename: string) => toast.success(`Downloaded ${filename}`),
    onError: (err: ApiError) => toast.error(err.message || "Failed to download QR."),
  });
}

// ─── Composite: download SVG ───
export function useDownloadCardSvg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string): Promise<string> => {
      const blob = await contactCardsApi.qrSvg(userId);
      const card = qc.getQueryData<CrmContactCardDto>(contactCardKeys.detail(userId));
      const name = card ? cardFilename(card, "svg") : `${userId}-qr.svg`;
      saveBlob(blob, name);
      return name;
    },
    onSuccess: (filename: string) => toast.success(`Downloaded ${filename}`),
    onError: (err: ApiError) => toast.error(err.message || "Failed to download QR."),
  });
}

// ─── Composite: copy shareable scan URL ───
export function useCopyScanUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string): Promise<string> => {
      const card = qc.getQueryData<CrmContactCardDto>(contactCardKeys.detail(userId));
      if (!card) throw new Error("Card not loaded yet.");
      const url = absolutePublicUrl(`/api/v1/c/card/${card.token}`);
      await navigator.clipboard.writeText(url);
      return url;
    },
    onSuccess: (url: string) =>
      toast.success("Scan URL copied to clipboard.", { description: url }),
    onError: (err: Error) => toast.error(err.message || "Failed to copy URL."),
  });
}

// ─── Composite: copy the raw MECARD text ───
export function useCopyMeCard() {
  return useMutation({
    mutationFn: async (userId: string): Promise<string> => {
      const payload = await contactCardsApi.payload(userId);
      await navigator.clipboard.writeText(payload.meCard);
      return payload.meCard;
    },
    onSuccess: () => toast.success("MECARD copied."),
    onError: (err: ApiError) => toast.error(err.message || "Failed to copy MECARD."),
  });
}