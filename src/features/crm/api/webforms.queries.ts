import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/shared/config/query-keys";
import { getApiError } from "@/shared/lib/get-api-error";
import { webformsApi } from "./webforms.api";
import type {
  CrmWebFormFilter,
  CreateWebFormRequest,
  WebFormSubmissionFilter,
} from "../types/webforms.types";

const W = QUERY_KEYS.webforms;

export const webformKeys = {
  all: W,
  list: (filter: CrmWebFormFilter) => [...W, "list", filter] as const,
  detail: (id: string) => [...W, "detail", id] as const,
  submissions: (formId: string, filter: WebFormSubmissionFilter) =>
    [...W, "submissions", formId, filter] as const,
  submission: (formId: string, submissionId: string) =>
    [...W, "submission", formId, submissionId] as const,
};

// ── Forms ───────────────────────────────────────────────────────────────────

export function useWebForms(filter: CrmWebFormFilter = {}) {
  return useQuery({
    queryKey: webformKeys.list(filter),
    queryFn: () => webformsApi.listForms(filter),
  });
}

export function useWebForm(id: string | undefined | null) {
  return useQuery({
    queryKey: webformKeys.detail(id ?? ""),
    queryFn: () => webformsApi.getForm(id!),
    enabled: !!id,
  });
}

export function useCreateWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWebFormRequest) => webformsApi.createForm(payload),
    onSuccess: (res) => {
      toast.success("Web form created");
      qc.invalidateQueries({ queryKey: webformKeys.all });
      return res.data;
    },
    onError: (err) => toast.error(getApiError(err, "Failed to create form").message),
  });
}

export function useUpdateWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateWebFormRequest }) =>
      webformsApi.updateForm(id, payload),
    onSuccess: (_res, vars) => {
      toast.success("Web form saved");
      qc.invalidateQueries({ queryKey: webformKeys.all });
    },
    onError: (err) => toast.error(getApiError(err, "Failed to update form").message),
  });
}

export function useDeleteWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webformsApi.deleteForm(id),
    onSuccess: () => {
      toast.success("Web form deleted");
      qc.invalidateQueries({ queryKey: webformKeys.all });
    },
    onError: (err) => toast.error(getApiError(err, "Failed to delete form").message),
  });
}

export function usePublishWebForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webformsApi.publishForm(id),
    onSuccess: (_res, id) => {
      toast.success("Form published");
      qc.invalidateQueries({ queryKey: webformKeys.detail(id) });
      qc.invalidateQueries({ queryKey: webformKeys.all });
    },
    onError: (err) => toast.error(getApiError(err, "Failed to publish form").message),
  });
}

// ── Submissions ────────────────────────────────────────────────────────────

export function useWebFormSubmissions(formId: string | undefined, filter: WebFormSubmissionFilter = {}) {
  return useQuery({
    queryKey: formId ? webformKeys.submissions(formId, filter) : ["webforms", "submissions", "disabled"],
    queryFn: () => webformsApi.listSubmissions(formId!, filter),
    enabled: !!formId,
  });
}

export function useWebFormSubmissionDetail(formId: string | undefined, submissionId: string | undefined) {
  return useQuery({
    queryKey: formId && submissionId ? webformKeys.submission(formId, submissionId) : ["webforms", "submission", "disabled"],
    queryFn: () => webformsApi.getSubmissionDetail(formId!, submissionId!),
    enabled: !!formId && !!submissionId,
  });
}

// ── File downloads ──────────────────────────────────────────────────────────

export function useMintDownloadToken() {
  return useMutation({
    mutationFn: (blobId: string) => webformsApi.mintDownloadToken(blobId),
  });
}
