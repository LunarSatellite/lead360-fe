import { useSearchParams } from 'react-router-dom';
import { Briefcase, GitBranch, ShieldCheck } from 'lucide-react';
import { Component as DealsPage } from './DealsPage';
import { Component as PipelinesPage } from './CrmPipelinesPage';
import { Component as ApprovalsPage } from './CrmApprovalsPage';

const TABS = [
  { key: 'deals',     label: 'Deals',     icon: Briefcase  },
  { key: 'pipelines', label: 'Pipelines', icon: GitBranch  },
  { key: 'approvals', label: 'Approvals', icon: ShieldCheck },
] as const;

type TabKey = typeof TABS[number]['key'];

export function Component() {
  const [params, setParams] = useSearchParams();
  const active = (params.get('tab') as TabKey | null) ?? 'deals';

  const setTab = (key: TabKey) => setParams({ tab: key }, { replace: true });

  return (
    <div className="-mt-4 md:-mt-8">
      {/* Sticky tab bar */}
      <div className="sticky -top-6 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 mb-5 bg-bg border-b border-border-subtle">
        <div className="flex items-center gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand/[0.14] border border-border-glow text-text-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-glass-1 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? 'text-brand' : ''}`}
                  strokeWidth={1.6}
                />
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(100%+6px)] w-4 h-[2px] rounded-full bg-brand" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {active === 'deals'     && <DealsPage />}
      {active === 'pipelines' && <PipelinesPage />}
      {active === 'approvals' && <ApprovalsPage />}
    </div>
  );
}
