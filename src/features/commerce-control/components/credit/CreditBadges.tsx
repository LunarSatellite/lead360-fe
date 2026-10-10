import type { AgreementKindValue, AgreementStateValue } from '../../api/stylemint-credit.api';
import { KIND_LABEL, STATE_LABEL, STATE_TONE } from '../../lib/credit-console';

const PILL = 'shrink-0 rounded-sm border-thin px-2 py-0.5 text-center text-[10px] font-black';

export function StateBadge({ state }: { state: AgreementStateValue }) {
  return (
    <span className={`${PILL} ${STATE_TONE[state] ?? 'border-border-subtle text-text-muted'}`}>
      {STATE_LABEL[state] ?? `State ${state}`}
    </span>
  );
}

export function KindBadge({ kind }: { kind: AgreementKindValue }) {
  return (
    <span className={`${PILL} w-[92px] border-border-subtle text-text-secondary`}>
      {KIND_LABEL[kind] ?? `Kind ${kind}`}
    </span>
  );
}
