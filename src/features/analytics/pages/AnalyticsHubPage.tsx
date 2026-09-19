import { useState } from 'react';
import { Building2, MessageSquare, TrendingUp } from 'lucide-react';
import { Component as ConversationAnalytics } from './AnalyticsPage';
import { Component as CrmAnalytics } from '@/features/crm/pages/CrmAnalyticsPage';

type Section = 'conversations' | 'crm';

/**
 * One Analytics entry point.
 *
 * The rail listed "Analytics" twice — once in the primary nav and once in the CRM group — with
 * both pointing at the CRM dashboard, while the conversation analytics at `/dashboard/analytics`
 * were reachable only by typing the URL. Two links to one page, and a whole page nobody could
 * find.
 *
 * These are not duplicate implementations, so there is nothing to merge in code: conversation
 * analytics cover the bot funnel, CRM analytics cover the sales funnel. They are different
 * subjects that belong under one heading, which is what this is.
 *
 * Commerce analytics are deliberately absent. They exist as a per-vendor panel inside Vendor
 * operations and are driven by the selected vendor's data — putting them here would mean inventing
 * a vendor picker for a page that is otherwise tenant-wide, so they stay where the vendor context
 * already is.
 */
export function AnalyticsHubPage() {
  const [section, setSection] = useState<Section>('conversations');

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Reporting
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <TrendingUp className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Conversation and sales funnels. Vendor performance lives with the vendor, under Vendor
          operations.
        </p>
      </div>

      <div className="flex gap-1 rounded-card border-thin border-border-subtle bg-bg-card p-1">
        <SectionTab
          active={section === 'conversations'}
          onClick={() => setSection('conversations')}
          icon={MessageSquare}
          label="Conversations"
        />
        <SectionTab
          active={section === 'crm'}
          onClick={() => setSection('crm')}
          icon={Building2}
          label="CRM"
        />
      </div>

      {section === 'conversations' ? <ConversationAnalytics /> : <CrmAnalytics />}
    </div>
  );
}

function SectionTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2 text-xs font-bold transition ${
        active
          ? 'bg-brand-soft text-brand'
          : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      {label}
    </button>
  );
}

export { AnalyticsHubPage as Component };
