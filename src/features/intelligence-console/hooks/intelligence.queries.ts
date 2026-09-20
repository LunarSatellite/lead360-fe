import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { intelligenceApi, type WindowQuery } from '../api/intelligence.api';
import type {
  DeclareExpectationBody,
  DeclareImplementationWindowBody,
  RecordDecisionOptionBody,
  RecordOutcomeMeasurementBody,
} from '../types/intelligence.types';

/**
 * Query keys for the intelligence console.
 *
 * Every read is windowed, so the window is part of the key: two different
 * lookbacks are two different answers about two different periods, and
 * serving one from the other's cache would mislabel the denominator.
 */
export const intelligenceKeys = {
  all: ['intelligence-console'] as const,
  cockpitChain: (q?: WindowQuery) => ['intelligence-console', 'cockpit', 'chain', q ?? {}] as const,
  cockpitDecisions: (q?: WindowQuery) =>
    ['intelligence-console', 'cockpit', 'decisions', q ?? {}] as const,
  cockpitDecision: (id: string) => ['intelligence-console', 'cockpit', 'decision', id] as const,
  ledger: (q?: WindowQuery) => ['intelligence-console', 'ledger', q ?? {}] as const,
  ledgerEntry: (id: string) => ['intelligence-console', 'ledger', 'entry', id] as const,
  diagnosis: (days?: number) => ['intelligence-console', 'diagnosis', days ?? null] as const,
  diagnosisThreshold: ['intelligence-console', 'diagnosis', 'threshold'] as const,
  diagnosisFingerprint: (fp: string, days?: number) =>
    ['intelligence-console', 'diagnosis', 'fingerprint', fp, days ?? null] as const,
  relatedSignals: (days?: number) =>
    ['intelligence-console', 'aurora', 'related-signals', days ?? null] as const,
  recordSignals: (kind: string, id: string, days?: number) =>
    ['intelligence-console', 'aurora', 'record', kind, id, days ?? null] as const,
  decisionOwners: (days?: number) =>
    ['intelligence-console', 'aurora', 'decision-owners', days ?? null] as const,
  monitor: (q?: WindowQuery) => ['intelligence-console', 'autonomous', 'monitor', q ?? {}] as const,
  maintenanceWindows: ['intelligence-console', 'autonomous', 'maintenance-windows'] as const,
  actionLimits: ['intelligence-console', 'autonomous', 'action-limits'] as const,
};

/**
 * These are reports over a closed window, not live feeds. A cockpit that
 * silently refetched every fifteen seconds would redraw the window label under
 * the reader mid-sentence, so nothing here polls; there is a Refresh control
 * on every page instead.
 */
const REPORT = { retry: false, refetchOnWindowFocus: false } as const;

// ── 1. Executive cockpit ────────────────────────────────────────────────────

export function useCockpitChain(query?: WindowQuery) {
  return useQuery({
    queryKey: intelligenceKeys.cockpitChain(query),
    queryFn: () => intelligenceApi.cockpitChain(query),
    ...REPORT,
  });
}

export function useCockpitDecisions(query?: WindowQuery) {
  return useQuery({
    queryKey: intelligenceKeys.cockpitDecisions(query),
    queryFn: () => intelligenceApi.cockpitDecisions(query),
    ...REPORT,
  });
}

export function useCockpitDecision(id: string | undefined) {
  return useQuery({
    queryKey: intelligenceKeys.cockpitDecision(id ?? ''),
    queryFn: () => intelligenceApi.cockpitDecision(id as string),
    enabled: Boolean(id),
    ...REPORT,
  });
}

// ── 2. Decision memory ledger ───────────────────────────────────────────────

export function useDecisionLedger(query?: WindowQuery) {
  return useQuery({
    queryKey: intelligenceKeys.ledger(query),
    queryFn: () => intelligenceApi.ledger(query),
    ...REPORT,
  });
}

export function useDecisionLedgerEntry(decisionId: string | undefined) {
  return useQuery({
    queryKey: intelligenceKeys.ledgerEntry(decisionId ?? ''),
    queryFn: () => intelligenceApi.ledgerEntry(decisionId as string),
    enabled: Boolean(decisionId),
    ...REPORT,
  });
}

/**
 * The three ledger writes. Each appends one entry — nothing is edited or
 * removed — and each invalidates the entry it appended to so the screen
 * re-reads the server's state rather than assuming the write took.
 */
function useLedgerAppend<TBody>(
  decisionId: string,
  call: (id: string, body: TBody) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TBody) => call(decisionId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intelligenceKeys.ledgerEntry(decisionId) });
      void queryClient.invalidateQueries({ queryKey: ['intelligence-console', 'ledger'] });
    },
  });
}

export const useRecordOption = (decisionId: string) =>
  useLedgerAppend<RecordDecisionOptionBody>(decisionId, intelligenceApi.recordOption);

export const useDeclareImplementationWindow = (decisionId: string) =>
  useLedgerAppend<DeclareImplementationWindowBody>(
    decisionId,
    intelligenceApi.declareImplementationWindow,
  );

export const useRecordOutcomeMeasurement = (decisionId: string) =>
  useLedgerAppend<RecordOutcomeMeasurementBody>(
    decisionId,
    intelligenceApi.recordOutcomeMeasurement,
  );

// ── 3. Failure diagnosis ────────────────────────────────────────────────────

export function useDiagnosis(lookbackDays?: number) {
  return useQuery({
    queryKey: intelligenceKeys.diagnosis(lookbackDays),
    queryFn: () => intelligenceApi.diagnosis(lookbackDays),
    ...REPORT,
  });
}

export function useDiagnosisThreshold() {
  return useQuery({
    queryKey: intelligenceKeys.diagnosisThreshold,
    queryFn: intelligenceApi.diagnosisThreshold,
    ...REPORT,
  });
}

export function useDiagnosisFingerprint(fingerprint: string | undefined, lookbackDays?: number) {
  return useQuery({
    queryKey: intelligenceKeys.diagnosisFingerprint(fingerprint ?? '', lookbackDays),
    queryFn: () => intelligenceApi.diagnosisFingerprint(fingerprint as string, lookbackDays),
    enabled: Boolean(fingerprint),
    ...REPORT,
  });
}

// ── 4. Aurora relate ────────────────────────────────────────────────────────

export function useRelatedSignals(lookbackDays?: number) {
  return useQuery({
    queryKey: intelligenceKeys.relatedSignals(lookbackDays),
    queryFn: () => intelligenceApi.relatedSignals(lookbackDays),
    ...REPORT,
  });
}

export function useRecordSignals(
  targetKind: string | undefined,
  targetId: string | undefined,
  lookbackDays?: number,
) {
  return useQuery({
    queryKey: intelligenceKeys.recordSignals(targetKind ?? '', targetId ?? '', lookbackDays),
    queryFn: () =>
      intelligenceApi.recordSignals(targetKind as string, targetId as string, lookbackDays),
    enabled: Boolean(targetKind && targetId),
    ...REPORT,
  });
}

export function useDecisionOwners(lookbackDays?: number) {
  return useQuery({
    queryKey: intelligenceKeys.decisionOwners(lookbackDays),
    queryFn: () => intelligenceApi.decisionOwners(lookbackDays),
    ...REPORT,
  });
}

// ── 5. Autonomous operations ────────────────────────────────────────────────

export function useOperationMonitor(query?: WindowQuery) {
  return useQuery({
    queryKey: intelligenceKeys.monitor(query),
    queryFn: () => intelligenceApi.monitor(query),
    ...REPORT,
  });
}

export function useMaintenanceWindows() {
  return useQuery({
    queryKey: intelligenceKeys.maintenanceWindows,
    queryFn: intelligenceApi.maintenanceWindows,
    ...REPORT,
  });
}

export function useActionLimits() {
  return useQuery({
    queryKey: intelligenceKeys.actionLimits,
    queryFn: intelligenceApi.actionLimits,
    ...REPORT,
  });
}

export function useDeclareExpectation(decisionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeclareExpectationBody) =>
      intelligenceApi.declareExpectation(decisionId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['intelligence-console', 'autonomous', 'monitor'],
      });
    },
  });
}
