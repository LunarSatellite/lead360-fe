import { CheckCircle2, Circle, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { useDealGateStatus, useToggleGateCheck } from '../api/crm.queries';
import { StageGateType } from '../types/crm.types';
import type { CrmDealGateStatusDto } from '../types/crm.types';

interface Props {
  dealId: string;
}

function GateRow({ gate, dealId }: { gate: CrmDealGateStatusDto; dealId: string }) {
  const toggle = useToggleGateCheck();
  const isManual = gate.gateType === StageGateType.ManualCheck;

  const handleToggle = () => {
    if (!isManual) return;
    toggle.mutate({ dealId, gateId: gate.gateId, isChecked: !gate.isChecked });
  };

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${
        isManual ? 'cursor-pointer hover:bg-bg-elevated' : ''
      }`}
      onClick={handleToggle}
    >
      <div className="shrink-0">
        {gate.isSatisfied ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-success" strokeWidth={1.5} />
        ) : gate.isRequired ? (
          <Lock className="w-4 h-4 text-danger" strokeWidth={1.5} />
        ) : (
          <Circle className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${gate.isSatisfied ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {gate.label}
        </p>
        {gate.checkedAt && gate.isSatisfied && (
          <p className="text-[10px] text-text-muted mt-0.5">
            Checked {new Date(gate.checkedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {!gate.isRequired && (
        <span className="text-[10px] text-text-muted font-semibold border border-border-subtle rounded px-1.5 py-0.5 shrink-0">optional</span>
      )}
    </div>
  );
}

export function DealGateChecklist({ dealId }: Props) {
  const { data: raw, isLoading } = useDealGateStatus(dealId);
  const evaluation = raw as any;

  if (isLoading || !evaluation) return null;
  if (evaluation.gates?.length === 0) return null;

  const allClear = evaluation.canAdvance;
  const blocking = evaluation.blockingReasons ?? [];

  return (
    <div className="rounded-2xl border bg-bg-card overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${allClear ? 'border-border-subtle' : 'border-danger/30 bg-danger/5'}`}>
        {allClear ? (
          <ShieldCheck className="w-4 h-4 text-success shrink-0" strokeWidth={1.5} />
        ) : (
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" strokeWidth={1.5} />
        )}
        <span className="text-sm font-bold text-text-primary">
          Stage Exit Checklist
        </span>
        <span className={`ml-auto text-xs font-semibold ${allClear ? 'text-success' : 'text-danger'}`}>
          {allClear ? 'Ready to advance' : `${blocking.length} gate${blocking.length > 1 ? 's' : ''} blocking`}
        </span>
      </div>

      <div className="p-2 space-y-0.5">
        {evaluation.gates.map((gate: CrmDealGateStatusDto) => (
          <GateRow key={gate.gateId} gate={gate} dealId={dealId} />
        ))}
      </div>
    </div>
  );
}
