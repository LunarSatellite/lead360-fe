import { NODE_TYPE_META, type FlowNodeTypeValue } from '../types/flow.types';

interface NodePaletteProps {
  onAddNode: (type: FlowNodeTypeValue, name: string) => void;
}

const PALETTE_ITEMS: { type: FlowNodeTypeValue; description: string }[] = [
  { type: 'trigger', description: 'Entry point' },
  { type: 'ai', description: 'AI processing' },
  { type: 'condition', description: 'Branch logic' },
  { type: 'response', description: 'Send message' },
  { type: 'api', description: 'API call' },
  { type: 'action', description: 'Execute action' },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const handleDragStart = (e: React.DragEvent, type: FlowNodeTypeValue) => {
    e.dataTransfer.setData('application/reactflow-type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="absolute left-4 top-[100px] bg-white rounded-xl p-3 z-[60] select-none"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,.1)', width: 140 }}
    >
      <h4 className="text-[11px] font-bold text-text-muted uppercase mb-2 tracking-wider">
        Drag to canvas
      </h4>
      {PALETTE_ITEMS.map(({ type, description }) => {
        const meta = NODE_TYPE_META[type];
        return (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onClick={() => onAddNode(type, `New ${meta.label}`)}
            className="flex items-center gap-2 px-2 py-[7px] rounded-lg text-2xs cursor-grab mb-px hover:bg-brand-soft hover:text-brand transition-colors text-text-secondary active:cursor-grabbing"
            title={description}
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[11px]"
              style={{ background: `${meta.color}15` }}
            >
              {meta.icon}
            </span>
            {meta.label}
          </div>
        );
      })}
    </div>
  );
}
