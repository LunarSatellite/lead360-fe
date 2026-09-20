import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decisionTwinApi } from '../api/decision-twin.api';
import type {
  DecisionTwinStudy,
  OpenDecisionTwinStudyBody,
  RecordDecisionTwinOutcomeBody,
} from '../types/decision-twin.types';

export const decisionTwinKeys = {
  all: ['decision-twin'] as const,
  scenarios: ['decision-twin', 'scenarios'] as const,
  study: (studyId: string) => ['decision-twin', 'study', studyId] as const,
};

/**
 * A study is a closed record of runs that already happened, not a live feed.
 * Nothing here polls: refetching on focus would redraw an operator's comparison
 * table under them mid-sentence. Each page carries a Refresh control instead.
 */
const REPORT = { retry: false, refetchOnWindowFocus: false } as const;

export function useSimulationScenarios() {
  return useQuery({
    queryKey: decisionTwinKeys.scenarios,
    queryFn: () => decisionTwinApi.scenarios(),
    ...REPORT,
  });
}

export function useDecisionTwinStudy(studyId: string | undefined) {
  return useQuery({
    queryKey: decisionTwinKeys.study(studyId ?? ''),
    queryFn: () => decisionTwinApi.study(studyId as string),
    enabled: Boolean(studyId),
    ...REPORT,
  });
}

/**
 * Define + Simulate.
 *
 * The response is the whole study, so it is seeded straight into the study
 * cache: the operator lands on Compare reading the very runs their submission
 * produced, rather than a second GET that could answer from a different moment.
 */
export function useOpenDecisionTwinStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OpenDecisionTwinStudyBody) => decisionTwinApi.openStudy(body),
    onSuccess: (study: DecisionTwinStudy) => {
      queryClient.setQueryData(decisionTwinKeys.study(study.studyId), study);
    },
  });
}

/** Learn. Recording an observed outcome returns the study with the Learn rows filled in. */
export function useRecordDecisionTwinOutcome(studyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ armKey, body }: { armKey: string; body: RecordDecisionTwinOutcomeBody }) =>
      decisionTwinApi.recordOutcome(studyId, armKey, body),
    onSuccess: (study: DecisionTwinStudy) => {
      queryClient.setQueryData(decisionTwinKeys.study(study.studyId), study);
    },
  });
}
