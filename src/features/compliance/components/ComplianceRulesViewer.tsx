// ═══════════════════════════════════════════════════════════════
// ComplianceRulesViewer — Expandable Rule Sections
// Renders all 5 rule categories in collapsible accordion sections
// with proper formatting for each rule type.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  Ban,
  FileWarning,
  MessageSquareOff,
  ArrowRightLeft,
  Database,
  ChevronDown,
  ShieldOff,
  ShieldAlert,
  ShieldCheck,
  UserRoundX,
  Headset,
  Clock,
} from 'lucide-react';
import type {
  ComplianceProfile,
  DisclaimerRule,
  MandatoryReferenceRule,
  DataHandlingRules,
} from '../types/compliance.types';
import { DATA_HANDLING_CATEGORIES } from '../types/compliance.types';

// ─── Icon Lookup ───
const SECTION_ICONS: Record<string, React.ElementType> = {
  Ban,
  FileWarning,
  MessageSquareOff,
  ArrowRightLeft,
  Database,
};

// ─── Props ───

interface ComplianceRulesViewerProps {
  profile: ComplianceProfile;
  onClose?: () => void;
}

// ─── Collapsible Section Wrapper ───

function RuleSection({
  icon: Icon,
  label,
  count,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-sm bg-glass-1 border border-border-subtle overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3.5 py-2.5
                   hover:bg-glass-2 transition-all duration-150"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} strokeWidth={1.6} className="text-text-muted" />
          <span className="text-[11px] font-bold text-text-primary">{label}</span>
          <span className="text-[9px] font-bold text-text-muted bg-glass-2 px-1.5 py-0.5 rounded-xs">
            {count}
          </span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={1.6}
          className={`text-text-muted transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-3.5 pb-3 border-t border-border-subtle">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Prohibited Topics Section ───

function ProhibitedTopicsList({ topics }: { topics: string[] }) {
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {topics.map((topic, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xs bg-danger-soft border border-danger/10"
        >
          <Ban size={10} strokeWidth={1.6} className="text-danger shrink-0" />
          <span className="text-[10px] font-semibold text-text-secondary">{topic}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Required Disclaimers Section ───

function DisclaimersList({ disclaimers }: { disclaimers: DisclaimerRule[] }) {
  return (
    <div className="mt-2.5 overflow-hidden rounded-xs border border-border-subtle">
      {/* Table header */}
      <div className="grid grid-cols-[120px_1fr] bg-glass-2 px-3 py-1.5 border-b border-border-subtle">
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
          Trigger
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
          Disclaimer Text
        </span>
      </div>
      {disclaimers.map((d, i) => (
        <div
          key={i}
          className={`grid grid-cols-[120px_1fr] px-3 py-2 ${
            i % 2 === 1 ? 'bg-glass-1' : ''
          } ${i < disclaimers.length - 1 ? 'border-b border-border-subtle' : ''}`}
        >
          <span className="text-[9px] font-bold text-brand font-mono">
            {d.trigger}
          </span>
          <span className="text-[10px] font-medium text-text-secondary leading-relaxed">
            {d.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Restricted Phrases Section ───

function RestrictedPhrasesList({ phrases }: { phrases: string[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {phrases.map((phrase, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2.5 py-1 rounded-sm bg-warning-soft border border-warning/10
                     text-[9px] font-bold text-warning"
        >
          {phrase}
        </span>
      ))}
    </div>
  );
}

// ─── Mandatory References Section ───

function MandatoryReferencesList({ refs }: { refs: MandatoryReferenceRule[] }) {
  return (
    <div className="mt-2.5 overflow-hidden rounded-xs border border-border-subtle">
      {/* Table header */}
      <div className="grid grid-cols-[110px_1fr_80px] bg-glass-2 px-3 py-1.5 border-b border-border-subtle">
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
          Trigger
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
          Message
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted text-center">
          Agent Handoff
        </span>
      </div>
      {refs.map((ref, i) => (
        <div
          key={i}
          className={`grid grid-cols-[110px_1fr_80px] items-center px-3 py-2 ${
            i % 2 === 1 ? 'bg-glass-1' : ''
          } ${i < refs.length - 1 ? 'border-b border-border-subtle' : ''}`}
        >
          <span className="text-[9px] font-bold text-brand font-mono">
            {ref.trigger}
          </span>
          <span className="text-[10px] font-medium text-text-secondary">
            {ref.message}
          </span>
          <div className="flex justify-center">
            {ref.handoff ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-success-soft border border-success/10">
                <Headset size={9} strokeWidth={1.6} className="text-success" />
                <span className="text-[8px] font-bold text-success">Yes</span>
              </span>
            ) : (
              <span className="text-[8px] font-bold text-text-muted">No</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Data Handling Section ───

function DataHandlingSection({ data }: { data: DataHandlingRules }) {
  const categories = [
    {
      key: 'prohibited' as const,
      items: data.prohibited,
      icon: ShieldOff,
      ...DATA_HANDLING_CATEGORIES.prohibited,
    },
    {
      key: 'allowedWithConsent' as const,
      items: data.allowedWithConsent,
      icon: ShieldAlert,
      ...DATA_HANDLING_CATEGORIES.allowedWithConsent,
    },
    {
      key: 'freelyCollected' as const,
      items: data.freelyCollected,
      icon: ShieldCheck,
      ...DATA_HANDLING_CATEGORIES.freelyCollected,
    },
  ];

  const colorMap = {
    danger: {
      bg: 'bg-danger-soft',
      border: 'border-danger/10',
      text: 'text-danger',
      icon: 'text-danger',
    },
    warning: {
      bg: 'bg-warning-soft',
      border: 'border-warning/10',
      text: 'text-warning',
      icon: 'text-warning',
    },
    success: {
      bg: 'bg-success-soft',
      border: 'border-success/10',
      text: 'text-success',
      icon: 'text-success',
    },
  };

  return (
    <div className="mt-2.5 flex flex-col gap-2.5">
      {categories.map((cat) => {
        if (cat.items.length === 0) return null;
        const colors = colorMap[cat.color];
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <cat.icon size={11} strokeWidth={1.6} className={colors.icon} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>
                {cat.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((field, i) => (
                <span
                  key={i}
                  className={`inline-flex px-2 py-1 rounded-xs ${colors.bg} border ${colors.border}
                             text-[9px] font-semibold text-text-secondary`}
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Additional Settings ───

function AdditionalSettings({ profile }: { profile: ComplianceProfile }) {
  return (
    <div className="mt-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xs bg-glass-1">
        <span className="text-[10px] font-semibold text-text-secondary">
          Age verification required
        </span>
        <span
          className={`text-[10px] font-bold ${
            profile.requiresAgeVerification ? 'text-warning' : 'text-text-muted'
          }`}
        >
          {profile.requiresAgeVerification
            ? `Yes (${profile.minimumAge ?? 18}+)`
            : 'No'}
        </span>
      </div>
      {profile.maxResponseLength && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xs bg-glass-1">
          <span className="text-[10px] font-semibold text-text-secondary">
            Max response length
          </span>
          <span className="text-[10px] font-bold text-text-primary">
            {profile.maxResponseLength} characters
          </span>
        </div>
      )}
    </div>
  );
}

// ═══ Main Component ═══

export function ComplianceRulesViewer({ profile, onClose }: ComplianceRulesViewerProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Profile header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[13px] font-extrabold text-text-primary tracking-tight">
            {profile.name} — Rules
          </h3>
          <p className="text-[9px] font-medium text-text-muted mt-0.5">
            {profile.industry} industry compliance rules
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[9px] font-bold text-text-muted hover:text-text-secondary
                       transition-colors duration-150 uppercase tracking-wider"
          >
            Close
          </button>
        )}
      </div>

      {/* Collapsible Sections */}
      <RuleSection
        icon={Ban}
        label="Prohibited Topics"
        count={profile.prohibitedTopics.length}
        defaultOpen
      >
        <ProhibitedTopicsList topics={profile.prohibitedTopics} />
      </RuleSection>

      <RuleSection
        icon={FileWarning}
        label="Required Disclaimers"
        count={profile.requiredDisclaimers.length}
      >
        <DisclaimersList disclaimers={profile.requiredDisclaimers} />
      </RuleSection>

      <RuleSection
        icon={MessageSquareOff}
        label="Restricted Phrases"
        count={profile.restrictedPhrases.length}
      >
        <RestrictedPhrasesList phrases={profile.restrictedPhrases} />
      </RuleSection>

      <RuleSection
        icon={ArrowRightLeft}
        label="Mandatory References"
        count={profile.mandatoryReferences.length}
      >
        <MandatoryReferencesList refs={profile.mandatoryReferences} />
      </RuleSection>

      {profile.dataHandling && (
        <RuleSection
          icon={Database}
          label="Data Handling Rules"
          count={
            profile.dataHandling.prohibited.length +
            profile.dataHandling.allowedWithConsent.length +
            profile.dataHandling.freelyCollected.length
          }
        >
          <DataHandlingSection data={profile.dataHandling} />
        </RuleSection>
      )}

      {/* Additional settings (always visible, not collapsible) */}
      <div className="rounded-sm bg-glass-1 border border-border-subtle px-3.5 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={12} strokeWidth={1.6} className="text-text-muted" />
          <span className="text-[11px] font-bold text-text-primary">
            Additional Settings
          </span>
        </div>
        <AdditionalSettings profile={profile} />
      </div>
    </div>
  );
}
