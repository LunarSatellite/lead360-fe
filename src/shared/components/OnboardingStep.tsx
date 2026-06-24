import { Check } from 'lucide-react';

export type StepState = 'done' | 'active' | 'locked';

export interface OnboardingStepData {
  number: number;
  title: string;
  description: string;
  state: StepState;
  statusText: string;
  progress: number;
}

interface OnboardingStepProps {
  step: OnboardingStepData;
}

export function OnboardingStep({ step }: OnboardingStepProps) {
  const isDone = step.state === 'done';
  const isActive = step.state === 'active';

  return (
    <div className={`relative flex-1 p-5 rounded-xl overflow-hidden border transition-all duration-150 cursor-pointer ${
      isDone
        ? 'bg-glass-1 border-border-success hover:bg-glass-2'
        : isActive
        ? 'bg-brand-soft border-brand'
        : 'bg-glass-1 border-border-subtle opacity-45'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold mb-3 ${
        isDone ? 'bg-success-soft text-success' : isActive ? 'bg-brand-soft text-brand' : 'bg-glass-2 text-text-muted'
      }`}>
        {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : step.number}
      </div>

      <div className="text-base font-bold text-text-primary mb-1">{step.title}</div>
      <div className="text-sm text-text-muted leading-relaxed">{step.description}</div>

      <div className={`mt-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
        isDone ? 'text-success' : isActive ? 'text-brand' : 'text-text-muted'
      }`}>
        {isDone && (
          <span className="w-5 h-5 rounded-md bg-success-soft flex items-center justify-center">
            <Check className="w-3 h-3" strokeWidth={3} />
          </span>
        )}
        {step.statusText}
      </div>

      <div className={`absolute bottom-0 left-0 h-1 rounded-bl-xl transition-all duration-500 ${
        isDone ? 'bg-success' : isActive ? 'bg-brand' : 'bg-transparent'
      }`} style={{ width: `${step.progress}%` }} />
    </div>
  );
}
