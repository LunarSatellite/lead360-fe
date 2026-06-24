import { Check } from 'lucide-react';
import { PIPELINE_STEPS, type PipelineStep } from '../types/api-connection.types';

interface PipelineStepperProps {
  currentStep: PipelineStep;
  completedSteps: PipelineStep[];
  onStepClick: (step: PipelineStep) => void;
}

export function PipelineStepper({ currentStep, completedSteps, onStepClick }: PipelineStepperProps) {
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, idx) => {
        const isDone = completedSteps.includes(step.id);
        const isActive = currentStep === step.id;
        const isClickable = isDone || isActive || completedSteps.includes(PIPELINE_STEPS[idx - 1]?.id);

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                isActive
                  ? 'bg-brand-soft text-brand border border-brand'
                  : isDone
                    ? 'bg-success-soft text-success border border-[rgba(16,185,129,0.15)]'
                    : isClickable
                      ? 'bg-glass-1 text-text-secondary border border-border-subtle hover:bg-glass-2 cursor-pointer'
                      : 'bg-glass-1 text-text-muted border border-border-subtle opacity-50 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isDone
                    ? 'bg-success text-white'
                    : isActive
                      ? 'bg-brand text-white'
                      : 'bg-glass-2 text-text-muted'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" strokeWidth={2.5} /> : step.num}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div className={`w-6 h-px mx-1 ${isDone ? 'bg-success' : 'bg-border-subtle'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
