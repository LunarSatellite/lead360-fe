import { useState, useCallback } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useFlows, useGenerateFlow, useActivateFlow } from '@/features/flow-builder/api/flow.queries';
import type { FlowDto } from '@/features/flow-builder/types/flow.types';

interface Step4Props {
  onComplete: () => void;
}

export function Step4DesignFlows({ onComplete }: Step4Props) {
  const { data: flowsRaw } = useFlows();
  const flows = (flowsRaw as unknown as FlowDto[]) ?? [];
  const activeFlow = flows.find((f) => f.isActive);
  const generateFlow = useGenerateFlow();
  const activateFlow = useActivateFlow();
  const [input, setInput] = useState('');

  const handleGenerate = useCallback(() => {
    if (!input.trim()) return;
    generateFlow.mutate(
      { Instruction: input.trim(), FlowName: input.trim().slice(0, 50) },
      {
        onSuccess: (flow) => {
          // Auto-activate
          activateFlow.mutate(flow.id);
          setInput('');
        },
      },
    );
  }, [input, generateFlow, activateFlow]);

  if (activeFlow) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">✨</div>
          <h2 className="text-lg font-bold text-text-primary">Design Flows</h2>
        </div>
        <div className="p-6 rounded-xl bg-brand-soft border border-brand/20 text-center">
          <Check className="w-8 h-8 text-brand mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand">
            Active flow: "{activeFlow.name}" ({activeFlow.nodeCount} nodes)
          </p>
          <button
            onClick={onComplete}
            className="mt-4 px-6 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">✨</div>
        <h2 className="text-lg font-bold text-text-primary">Design Your Bot Flow</h2>
        <p className="text-sm text-text-muted mt-1">
          Describe your chatbot and AI will design the conversation flow.
        </p>
      </div>

      <div className="rounded-xl border border-border-subtle overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
        <div className="flex items-center p-3 gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#047857,#059669)' }}>✨</div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Build order tracking with status updates..."
            disabled={generateFlow.isPending}
            className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-2 text-text-primary placeholder:text-text-muted"
          />
          <button
            onClick={handleGenerate}
            disabled={generateFlow.isPending || !input.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            {generateFlow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
        </div>
        {generateFlow.isPending && (
          <div
            className="px-4 py-3 border-t border-border-subtle"
            style={{
              background: 'linear-gradient(90deg,#F3E8FF,#FCE7F3,#F3E8FF)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🧠</span>
              <span className="text-xs font-semibold text-[#7C3AED]">AI designing your flow... (30-90s)</span>
            </div>
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-border-subtle bg-glass-1">
          <div className="flex flex-wrap gap-1">
            {['Order tracking flow', 'Product menu', 'Customer support', 'FAQ bot'].map((h) => (
              <button key={h} onClick={() => setInput(h)}
                className="px-2.5 py-1 rounded-md text-2xs cursor-pointer bg-white border border-border-subtle text-text-secondary hover:border-brand hover:text-brand transition-all">
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {flows.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2">Or activate an existing flow:</p>
          {flows.slice(0, 3).map((f) => (
            <button
              key={f.id}
              onClick={() => activateFlow.mutate(f.id)}
              className="w-full p-3 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-left mb-1.5 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-text-primary">{f.name}</span>
                <span className="text-[10px] text-text-muted ml-2">{f.nodeCount} nodes • v{f.version}</span>
              </div>
              <span className="text-2xs font-semibold text-brand">Activate →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
