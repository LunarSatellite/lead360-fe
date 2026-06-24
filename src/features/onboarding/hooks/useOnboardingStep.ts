import { useState, useCallback, useEffect } from 'react';
import type { OnboardingProgress } from '../types/onboarding.types';

const KEY = 'omniflow_onboarding';

function load(): OnboardingProgress {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {}
  return { currentStep: 1, completedSteps: [], startedAt: new Date().toISOString(), lastVisitedAt: new Date().toISOString() };
}

export function useOnboardingStep() {
  const [p, setP] = useState<OnboardingProgress>(load);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify({ ...p, lastVisitedAt: new Date().toISOString() })); }, [p]);

  const goToStep = useCallback((s: number) => setP(prev => ({ ...prev, currentStep: s })), []);
  const completeStep = useCallback((s: number) => setP(prev => ({ ...prev, completedSteps: Array.from(new Set([...prev.completedSteps, s])).sort(), currentStep: Math.min(s + 1, 6) })), []);
  const skipStep = useCallback(() => setP(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 6) })), []);
  const isCompleted = useCallback((s: number) => p.completedSteps.includes(s), [p.completedSteps]);

  return { currentStep: p.currentStep, completedSteps: p.completedSteps, goToStep, completeStep, skipStep, isCompleted, allComplete: p.completedSteps.length >= 6 };
}
