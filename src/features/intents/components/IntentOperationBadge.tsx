import {
  Zap, Search, FolderTree, FileText, UserCheck, Menu, Send, BrainCircuit,
} from 'lucide-react';
import { StatusBadge } from '@/shared/components';
import type { IntentOperationTypeValue } from '../types/intents.types';
import { OPERATION_TYPE_LABEL, OPERATION_TYPE_COLOR } from '../types/intents.types';

const ICON_MAP: Record<IntentOperationTypeValue, typeof Zap> = {
  1: Zap, 2: Search, 3: FolderTree, 4: FileText,
  5: UserCheck, 6: Menu, 7: Send, 8: BrainCircuit,
};

interface IntentOperationBadgeProps {
  operationType: IntentOperationTypeValue;
}

export function IntentOperationBadge({ operationType }: IntentOperationBadgeProps) {
  const Icon = ICON_MAP[operationType] ?? Zap;
  const label = OPERATION_TYPE_LABEL[operationType] ?? 'Unknown';
  const color = OPERATION_TYPE_COLOR[operationType] ?? 'muted';

  return (
    <StatusBadge variant={color}>
      <Icon className="w-3 h-3" strokeWidth={1.8} />
      {label}
    </StatusBadge>
  );
}
