// ═══════════════════════════════════════════════════════════════
// ComplianceProfileForm — Create / Edit Custom Profile
// Full form with add/remove for all rule types.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  Plus,
  X,
  Save,
  Loader2,
  Ban,
  FileWarning,
  MessageSquareOff,
  ArrowRightLeft,
  Database,
  Headset,
} from 'lucide-react';
import type {
  ComplianceProfile,
  ComplianceProfileCreateRequest,
  ComplianceProfileUpdateRequest,
  DisclaimerRule,
  MandatoryReferenceRule,
} from '../types/compliance.types';

interface ComplianceProfileFormProps {
  /** If provided, we're editing. If null, we're creating. */
  existingProfile?: ComplianceProfile | null;
  isSubmitting: boolean;
  onSubmit: (data: ComplianceProfileCreateRequest | ComplianceProfileUpdateRequest) => void;
  onCancel: () => void;
}

const input =
  'w-full px-3 py-2 rounded-lg bg-glass-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
const smallInput =
  'w-full px-2.5 py-1.5 rounded-lg bg-glass-2 border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';

export function ComplianceProfileForm({
  existingProfile,
  isSubmitting,
  onSubmit,
  onCancel,
}: ComplianceProfileFormProps) {
  const isEdit = !!existingProfile;

  // ─── Form State ───
  const [name, setName] = useState(existingProfile?.name ?? '');
  const [description, setDescription] = useState(existingProfile?.description ?? '');
  const [industry, setIndustry] = useState(existingProfile?.industry ?? '');
  const [requiresAgeVerification, setRequiresAgeVerification] = useState(
    existingProfile?.requiresAgeVerification ?? false,
  );
  const [minimumAge, setMinimumAge] = useState<number | ''>(existingProfile?.minimumAge ?? '');
  const [maxResponseLength, setMaxResponseLength] = useState<number | ''>(
    existingProfile?.maxResponseLength ?? '',
  );

  // Rule arrays
  const [prohibitedTopics, setProhibitedTopics] = useState<string[]>(existingProfile?.prohibitedTopics ?? []);
  const [restrictedPhrases, setRestrictedPhrases] = useState<string[]>(
    existingProfile?.restrictedPhrases ?? [],
  );
  const [requiredDisclaimers, setRequiredDisclaimers] = useState<DisclaimerRule[]>(
    existingProfile?.requiredDisclaimers ?? [],
  );
  const [mandatoryReferences, setMandatoryReferences] = useState<MandatoryReferenceRule[]>(
    existingProfile?.mandatoryReferences ?? [],
  );

  // Data handling
  const [dhProhibited, setDhProhibited] = useState<string[]>(existingProfile?.dataHandling?.prohibited ?? []);
  const [dhConsent, setDhConsent] = useState<string[]>(
    existingProfile?.dataHandling?.allowedWithConsent ?? [],
  );
  const [dhFree, setDhFree] = useState<string[]>(existingProfile?.dataHandling?.freelyCollected ?? []);

  // Temp inputs for adding items
  const [newTopic, setNewTopic] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [newDhProhibited, setNewDhProhibited] = useState('');
  const [newDhConsent, setNewDhConsent] = useState('');
  const [newDhFree, setNewDhFree] = useState('');

  const handleSubmit = () => {
    const dataHandling =
      dhProhibited.length || dhConsent.length || dhFree.length
        ? { prohibited: dhProhibited, allowedWithConsent: dhConsent, freelyCollected: dhFree }
        : null;

    if (isEdit) {
      const update: ComplianceProfileUpdateRequest = {
        name: name || null,
        description: description || null,
        prohibitedTopics,
        requiredDisclaimers,
        restrictedPhrases,
        mandatoryReferences,
        dataHandling,
        requiresAgeVerification,
        minimumAge: minimumAge === '' ? null : minimumAge,
        maxResponseLength: maxResponseLength === '' ? null : maxResponseLength,
      };
      onSubmit(update);
    } else {
      const create: ComplianceProfileCreateRequest = {
        name,
        industry,
        description: description || null,
        prohibitedTopics,
        requiredDisclaimers,
        restrictedPhrases,
        mandatoryReferences,
        dataHandling,
        requiresAgeVerification,
        minimumAge: minimumAge === '' ? null : minimumAge,
        maxResponseLength: maxResponseLength === '' ? null : maxResponseLength,
      };
      onSubmit(create);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Basic Info ─── */}
      <div className="bg-glass-1 border border-border-subtle rounded-2xl p-5 space-y-4">
        <div className="text-xs font-bold uppercase tracking-[2px] text-brand">Basic info</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-1.5">
              Profile name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Healthcare Custom"
              className={input}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-1.5">
              Industry *
            </label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Healthcare"
              disabled={isEdit}
              className={`${input} ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this compliance profile is for..."
            rows={2}
            className={`${input} resize-none`}
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresAgeVerification}
              onChange={(e) => setRequiresAgeVerification(e.target.checked)}
              className="w-4 h-4 rounded bg-glass-2 border-border-subtle accent-brand"
            />
            <span className="text-xs font-semibold text-text-secondary">Requires age verification</span>
          </label>
          {requiresAgeVerification && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-muted">Min age:</label>
              <input
                type="number"
                value={minimumAge}
                onChange={(e) => setMinimumAge(e.target.value ? Number(e.target.value) : '')}
                placeholder="18"
                className="w-16 px-2 py-1 rounded-lg bg-glass-2 border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-muted">Max response length:</label>
            <input
              type="number"
              value={maxResponseLength}
              onChange={(e) => setMaxResponseLength(e.target.value ? Number(e.target.value) : '')}
              placeholder="500"
              className="w-20 px-2 py-1 rounded-lg bg-glass-2 border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* ─── Prohibited Topics ─── */}
      <RuleSection
        icon={Ban}
        title="Prohibited Topics"
        color="danger"
        description="Topics the chatbot must never discuss"
      >
        <TagListEditor
          items={prohibitedTopics}
          setItems={setProhibitedTopics}
          newValue={newTopic}
          setNewValue={setNewTopic}
          placeholder="e.g. Medical diagnosis"
          color="danger"
        />
      </RuleSection>

      {/* ─── Restricted Phrases ─── */}
      <RuleSection
        icon={MessageSquareOff}
        title="Restricted Phrases"
        color="warning"
        description="Words or phrases the chatbot must never use"
      >
        <TagListEditor
          items={restrictedPhrases}
          setItems={setRestrictedPhrases}
          newValue={newPhrase}
          setNewValue={setNewPhrase}
          placeholder="e.g. guaranteed cure"
          color="warning"
        />
      </RuleSection>

      {/* ─── Required Disclaimers ─── */}
      <RuleSection
        icon={FileWarning}
        title="Required Disclaimers"
        color="info"
        description="Disclaimers automatically appended when a trigger topic is mentioned"
      >
        <DisclaimerEditor items={requiredDisclaimers} setItems={setRequiredDisclaimers} />
      </RuleSection>

      {/* ─── Mandatory References ─── */}
      <RuleSection
        icon={ArrowRightLeft}
        title="Mandatory References"
        color="brand"
        description="Required messages with optional agent handoff"
      >
        <MandatoryRefEditor items={mandatoryReferences} setItems={setMandatoryReferences} />
      </RuleSection>

      {/* ─── Data Handling ─── */}
      <RuleSection
        icon={Database}
        title="Data Handling Rules"
        color="success"
        description="Control what data the chatbot can collect"
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold text-danger mb-1.5">Never collect</div>
            <TagListEditor
              items={dhProhibited}
              setItems={setDhProhibited}
              newValue={newDhProhibited}
              setNewValue={setNewDhProhibited}
              placeholder="e.g. health_conditions"
              color="danger"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-warning mb-1.5">With consent only</div>
            <TagListEditor
              items={dhConsent}
              setItems={setDhConsent}
              newValue={newDhConsent}
              setNewValue={setNewDhConsent}
              placeholder="e.g. date_of_birth"
              color="warning"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-success mb-1.5">Freely collected</div>
            <TagListEditor
              items={dhFree}
              setItems={setDhFree}
              newValue={newDhFree}
              setNewValue={setNewDhFree}
              placeholder="e.g. name, email"
              color="success"
            />
          </div>
        </div>
      </RuleSection>

      {/* ─── Actions ─── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!isEdit && (!name || !industry))}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 disabled:opacity-40 transition-all"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create profile'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Reusable sub-components
// ═══════════════════════════════════════════════════════

function RuleSection({
  icon: Icon,
  title,
  color,
  description,
  children,
}: {
  icon: typeof Ban;
  title: string;
  color: string;
  description: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
    brand: 'text-brand',
    success: 'text-success',
  };
  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-b-border-subtle flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${colorMap[color] || 'text-text-muted'}`} strokeWidth={1.6} />
        <div>
          <div className="text-sm font-bold text-text-primary">{title}</div>
          <div className="text-[10px] text-text-muted">{description}</div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Tag List (for prohibited topics, restricted phrases, data handling) ───

function TagListEditor({
  items,
  setItems,
  newValue,
  setNewValue,
  placeholder,
  color,
}: {
  items: string[];
  setItems: (v: string[]) => void;
  newValue: string;
  setNewValue: (v: string) => void;
  placeholder: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    danger: 'bg-danger-soft text-danger border-[rgba(244,63,94,0.15)]',
    warning: 'bg-warning-soft text-warning border-[rgba(245,158,11,0.15)]',
    success: 'bg-success-soft text-success border-[rgba(6,214,160,0.15)]',
    info: 'bg-info-soft text-info border-[rgba(59,130,246,0.15)]',
    brand: 'bg-brand-soft text-brand border-brand',
  };

  const add = () => {
    const v = newValue.trim();
    if (v && !items.includes(v)) {
      setItems([...items, v]);
      setNewValue('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorMap[color] || colorMap.brand}`}
          >
            {item}
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-text-muted italic">No items added</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={smallInput}
        />
        <button
          onClick={add}
          disabled={!newValue.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Disclaimer Editor (trigger + text) ───

function DisclaimerEditor({
  items,
  setItems,
}: {
  items: DisclaimerRule[];
  setItems: (v: DisclaimerRule[]) => void;
}) {
  const [trigger, setTrigger] = useState('');
  const [text, setText] = useState('');

  const add = () => {
    if (trigger.trim() && text.trim()) {
      setItems([...items, { trigger: trigger.trim(), text: text.trim() }]);
      setTrigger('');
      setText('');
    }
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-glass-2 border border-border-subtle"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-info font-mono">{d.trigger}</div>
                <div className="text-xs text-text-secondary mt-0.5">{d.text}</div>
              </div>
              <button
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="text-text-muted hover:text-danger shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[140px_1fr_auto] gap-2">
        <input
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="Trigger"
          className={smallInput}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Disclaimer text..."
          className={smallInput}
        />
        <button
          onClick={add}
          disabled={!trigger.trim() || !text.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Mandatory Reference Editor (trigger + message + handoff) ───

function MandatoryRefEditor({
  items,
  setItems,
}: {
  items: MandatoryReferenceRule[];
  setItems: (v: MandatoryReferenceRule[]) => void;
}) {
  const [trigger, setTrigger] = useState('');
  const [message, setMessage] = useState('');
  const [handoff, setHandoff] = useState(false);

  const add = () => {
    if (trigger.trim() && message.trim()) {
      setItems([...items, { trigger: trigger.trim(), message: message.trim(), handoff }]);
      setTrigger('');
      setMessage('');
      setHandoff(false);
    }
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-glass-2 border border-border-subtle"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand font-mono">{r.trigger}</span>
                  {r.handoff && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-success-soft text-success">
                      <Headset className="w-2.5 h-2.5" /> Handoff
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">{r.message}</div>
              </div>
              <button
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="text-text-muted hover:text-danger shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="w-32">
          <input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Trigger"
            className={smallInput}
          />
        </div>
        <div className="flex-1">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder="Reference message..."
            className={smallInput}
          />
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={handoff}
            onChange={(e) => setHandoff(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-brand"
          />
          <span className="text-[10px] font-semibold text-text-muted">Handoff</span>
        </label>
        <button
          onClick={add}
          disabled={!trigger.trim() || !message.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary disabled:opacity-30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
