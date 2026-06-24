import { ONBOARDING_STEPS } from '../types/onboarding.types';

interface OnboardingProgressBarProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function OnboardingProgressBar({ currentStep, completedSteps, onStepClick }: OnboardingProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-1 py-4 px-6">
      {ONBOARDING_STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const isPast = step.number < currentStep;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <button
              onClick={() => onStepClick(step.number)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
                isCurrent
                  ? 'bg-brand text-white shadow-md'
                  : isCompleted
                  ? 'bg-brand-soft text-brand hover:bg-emerald-100'
                  : 'bg-glass-1 text-text-muted hover:bg-glass-2'
              }`}
            >
              <span className="text-sm">{isCompleted ? '✅' : step.icon}</span>
              <span className="hidden md:inline">{step.title}</span>
            </button>

            {/* Connector line */}
            {i < ONBOARDING_STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 rounded-full transition-colors ${
                  isPast || isCompleted ? 'bg-brand' : 'bg-border-subtle'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
