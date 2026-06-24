import { useState } from 'react';
import { ListChecks, FileText, Activity } from 'lucide-react';
import ProcessTasksTab from './ProcessTasksTab';
import { Component as DefinitionsView } from './ProcessWorkflowDefinitionsPage';
import { Component as InstancesView } from './ProcessWorkflowInstancesPage';

type ProcessTab = 'tasks' | 'definitions' | 'instances';

const TABS: { key: ProcessTab; label: string; icon: typeof ListChecks }[] = [
  { key: 'tasks',       label: 'Tasks',       icon: ListChecks },
  { key: 'definitions', label: 'Definitions', icon: FileText },
  { key: 'instances',   label: 'Instances',   icon: Activity },
];

export function Component() {
  const [tab, setTab] = useState<ProcessTab>('tasks');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-DEFAULT/10 border border-violet-DEFAULT/20">
            <ListChecks className="w-5 h-5 text-violet-DEFAULT" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Process Workflows</h1>
            <p className="text-sm text-text-muted">Manage process workflow tasks, definitions, and instances</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-elevated border border-border-subtle w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-bg text-text-primary shadow-sm border border-border-subtle'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'tasks' && <ProcessTasksTab />}
      {tab === 'definitions' && <DefinitionsView />}
      {tab === 'instances' && <InstancesView />}
    </div>
  );
}
