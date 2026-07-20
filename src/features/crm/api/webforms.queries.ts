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
    queryFn: () => webformsApi.listForms(filter).then((r) => r.data),
  });
}

export function useWebForm(id: string | undefined | null) {
  return useQuery({
    queryKey: webformKeys.detail(id ?? ""),
    queryFn: () => webformsApi.getForm(id!).then((r) => r.data),
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
      qc.invalidateQueries({ queryKey: webformKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: webformKeys.all });
    },
    onError: (err) => toast.error(getApiError(err, "Failed to save form").message),
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
    onError: (err) =>
      toast.error(getApiError(err, "Failed to publish form").message),
  });
}

// ── Submissions ─────────────────────────────────────────────────────────────

export function useWebFormSubmissions(
  formId: string | undefined | null,
  filter: WebFormSubmissionFilter = {},
) {
  return useQuery({
    queryKey: webformKeys.submissions(formId ?? "", filter),
    queryFn: () => webformsApi.listSubmissions(formId!, filter).then((r) => r.data),
    enabled: !!formId,
  });
}

export function useWebFormSubmissionDetail(
  formId: string | undefined | null,
  submissionId: string | undefined | null,
) {
  return useQuery({
    queryKey: webformKeys.submission(formId ?? "", submissionId ?? ""),
    queryFn: () =>
      webformsApi.getSubmissionDetail(formId!, submissionId!).then((r) => r.data),
    enabled: !!formId && !!submissionId,
  });
}

// Mints a short-lived signed token for an attachment on a submission. The hook
// keeps the token in component state — not in the query cache — because the
// service returns per-request tokens; we don't want stale tokens across sessions.
export function useMintSubmissionFileToken() {
  return useMutation({
    mutationFn: (blobId: string) =>
      webformsApi.mintDownloadToken(blobId).then((r) => r.data),
    onError: (err) =>
      toast.error(getApiError(err, "Failed to generate download link").message),
  });
}
