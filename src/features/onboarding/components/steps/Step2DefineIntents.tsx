import { useState } from 'react';
import { useIntents } from '@/features/intents/api/intents.queries';
import { ImportDialog } from '@/features/intents/components/import/ImportDialog';
import { Check, Upload, Sparkles, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step2Props {
  onComplete: () => void;
}

export function Step2DefineIntents({ onComplete }: Step2Props) {
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';
  const { data: intentsRaw } = useIntents(tenantId);
  const intents = (intentsRaw as unknown as unknown[]) ?? [];
  const hasEnough = intents.length >= 3;
  const [showImport, setShowImport] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🧠</div>
        <h2 className="text-lg font-bold text-text-primary">Define Intents</h2>
        <p className="text-sm text-text-muted mt-1">
          Tell your bot what customers might ask. You need at least 3 intents.
          {intents.length > 0 && <span className="text-brand font-semibold"> ({intents.length} defined)</span>}
        </p>
      </div>

      {hasEnough ? (
        <div className="p-6 rounded-xl bg-brand-soft border border-brand/20 text-center">
          <Check className="w-8 h-8 text-brand mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand">{intents.length} intents defined!</p>
          <button
            onClick={onComplete}
            className="mt-4 px-6 py-2.5 rounded-lg text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            Continue →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/dashboard/api-connection')}
            className="p-4 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-center"
          >
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-xs font-semibold text-text-primary">LLM Suggestions</div>
            <div className="text-[10px] text-text-muted mt-0.5">Auto-generate from API</div>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="p-4 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-center"
          >
            <Upload className="w-6 h-6 text-info mx-auto mb-2" />
            <div className="text-xs font-semibold text-text-primary">Import File</div>
            <div className="text-[10px] text-text-muted mt-0.5">CSV, JSON, or XML</div>
          </button>
          <button
            onClick={() => navigate('/dashboard/intents')}
            className="p-4 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all text-center"
          >
            <Plus className="w-6 h-6 text-brand mx-auto mb-2" />
            <div className="text-xs font-semibold text-text-primary">Manual</div>
            <div className="text-[10px] text-text-muted mt-0.5">Create one by one</div>
          </button>
        </div>
      )}

      <ImportDialog open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
