import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useGenerateFlow } from '../api/flow.queries';
import type { FlowDto } from '../types/flow.types';

const HINTS = [
  'Build order tracking flow',
  'Product menu with categories',
  'Customer support with sentiment',
  'Complaint handling flow',
];

const STEPS = [
  'Analyzing your description...',
  'Identifying conversation paths...',
  'Designing node architecture...',
  'Creating nodes & connections...',
  'Finalizing flow layout...',
];

interface NlpMagicBarProps {
  onFlowGenerated: (flow: FlowDto) => void;
}

export function NlpMagicBar({ onFlowGenerated }: NlpMagicBarProps) {
  const [input, setInput] = useState('');
  const [thinkingStep, setThinkingStep] = useState(-1);
  const generate = useGenerateFlow();

  const isThinking = generate.isPending;

  const handleGenerate = useCallback(() => {
    if (!input.trim() || isThinking) return;

    // Start step animation
    setThinkingStep(0);
    const interval = setInterval(() => {
      setThinkingStep((s) => {
        if (s >= STEPS.length - 1) {
          clearInterval(interval);
          return s;
        }
        return s + 1;
      });
    }, 800);

    generate.mutate(
      { Instruction: input.trim(), FlowName: input.trim().slice(0, 50) },
      {
        onSuccess: (flow) => {
          clearInterval(interval);
          setThinkingStep(-1);
          setInput('');
          onFlowGenerated(flow);
        },
        onError: () => {
          clearInterval(interval);
          setThinkingStep(-1);
        },
      },
    );
  }, [input, isThinking, generate, onFlowGenerated]);

  return (
    <div className="sticky top-4 z-[60] mx-auto" style={{ width: 560 }}>
      <div
        className="rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}
      >
        {/* Input row */}
        <div className="flex items-center p-2 gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#047857,#059669)' }}
          >
            ✨
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe your bot flow..."
            disabled={isThinking}
            className="flex-1 bg-transparent border-none outline-none text-sm py-2.5 px-2 text-text-primary placeholder:text-text-muted"
          />
          <button
            onClick={handleGenerate}
            disabled={isThinking || !input.trim()}
            className="w-10 h-10 rounded-xl border-none text-white text-lg cursor-pointer flex-shrink-0 flex items-center justify-center disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : '→'}
          </button>
        </div>

        {/* Thinking animation */}
        {isThinking && thinkingStep >= 0 && (
          <div
            className="px-4 pb-3 pt-2 border-t border-border-subtle"
            style={{
              background: 'linear-gradient(90deg,#F3E8FF,#FCE7F3,#F3E8FF)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🧠</span>
              <span className="text-xs font-bold text-[#7C3AED]">AI designing your flow...</span>
            </div>
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs mb-px"
                style={{
                  color: i < thinkingStep ? '#10B981' : i === thinkingStep ? '#059669' : '#94A3B8',
                  fontWeight: i === thinkingStep ? 600 : 400,
                }}
              >
                <span className="w-3 text-center">
                  {i < thinkingStep ? '✓' : i === thinkingStep ? '●' : '○'}
                </span>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Hint chips */}
        {!isThinking && (
          <div className="px-4 pb-2.5 pt-1.5 border-t border-border-subtle bg-glass-1">
            <div className="text-[11px] font-semibold text-text-muted mb-1.5">✨ Try:</div>
            <div className="flex flex-wrap gap-1">
              {HINTS.map((h) => (
                <button
                  key={h}
                  onClick={() => setInput(h)}
                  className="px-2.5 py-1 rounded-md text-2xs cursor-pointer bg-white border border-border-subtle text-text-secondary hover:border-brand hover:text-brand hover:bg-brand-soft transition-all"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
