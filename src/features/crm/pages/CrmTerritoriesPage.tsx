import { useState } from 'react';
import { createPortal } from 'react-dom';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  Map, Plus, Trash2, X, ChevronDown, ChevronUp,
  UserPlus, UserMinus, Tag, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  useTerritories, useCreateTerritory, useUpdateTerritory, useDeleteTerritory,
  useAddTerritoryRule, useRemoveTerritoryRule,
  useAddTerritoryMember, useRemoveTerritoryMember,
} from '../api/crm-rbac.queries';
import {
  TerritoryRuleField, TerritoryRuleOperator, TerritoryRuleLogic,
  TERRITORY_RULE_FIELD_LABEL, TERRITORY_RULE_OPERATOR_LABEL,
} from '../types/crm-rbac.types';
import type {
  SalesTerritoryDto, SalesTerritoryRuleDto, SalesTerritoryMemberDto,
  TerritoryRuleFieldValue, TerritoryRuleOperatorValue, TerritoryRuleLogicValue,
} from '../types/crm-rbac.types';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';

export function Component() {
  const { data, isLoading } = useTerritories();
  const territories = (data as unknown as SalesTerritoryDto[]) || [];
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const create = useCreateTerritory();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined, priority, rules: [] },
      { onSuccess: () => { setShowCreate(false); setName(''); setDescription(''); setPriority(1); } },
    );
  };

  const toggle = (id: string) =>
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Sales Territories</h1>
          <p className="text-base text-text-secondary mt-1">Route leads automatically based on rules — round-robin within each territory</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New territory
        </button>
      </div>

      {showCreate && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="drawer-slide-in relative w-[520px] flex flex-col overflow-hidden"
            style={{
              borderRadius: 18,
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,217,138,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
            <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="text-base font-extrabold leading-tight" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>New Territory</h2>
                <p className="text-xs text-text-muted mt-0.5">Create a new sales territory</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Basic Info</span>
                <div className="h-px bg-brand/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Name <span className="text-danger">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North America"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Priority</label>
                <input type="number" min={1} value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description <span className="text-text-muted font-normal">(optional)</span></label>
                <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} placeholder="What leads does this territory cover?"
                  className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
              </div>
            </form>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
              <button type="submit" disabled={create.isPending || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {create.isPending ? <span className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Territory
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-muted">Loading territories...</div>
      ) : territories.length === 0 && !showCreate ? (
        <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center">
          <Map className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <div className="text-base font-bold text-text-primary mb-1">No territories yet</div>
          <div className="text-sm text-text-muted">Create territories to automatically route leads to the right reps.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {territories.map((t, i) => (
            <TerritoryCard
              key={t.id}
              territory={t}
              index={i}
              isExpanded={expanded.has(t.id)}
              onToggle={() => toggle(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Territory card ─────────────────────────────────────────────────────────
function TerritoryCard({ territory, index, isExpanded, onToggle }: {
  territory: SalesTerritoryDto;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const updateTerritory = useUpdateTerritory();
  const deleteTerritory = useDeleteTerritory();

  const toggleActive = () =>
    updateTerritory.mutate({
      id: territory.id,
      data: {
        name: territory.name,
        description: territory.description ?? undefined,
        priority: territory.priority,
        isActive: !territory.isActive,
      },
    });

  return (
    <div className={`bg-glass-1 border rounded-2xl overflow-hidden transition-all ${territory.isActive ? 'border-border-subtle' : 'border-border-subtle opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-7 h-7 rounded-lg bg-glass-2 border border-border-medium flex items-center justify-center text-xs font-bold text-text-muted flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">{territory.name}</span>
            {!territory.isActive && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-glass-2 text-text-muted">Inactive</span>
            )}
          </div>
          {territory.description && <div className="text-xs text-text-muted mt-0.5">{territory.description}</div>}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {territory.rules.length} rules</span>
          <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> {territory.members.length} members</span>
        </div>
        <button
          onClick={toggleActive}
          className={`transition-colors ${territory.isActive ? 'text-brand' : 'text-text-muted'}`}
          title={territory.isActive ? 'Deactivate' : 'Activate'}
        >
          {territory.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
        <button
          onClick={() => confirmDialog({ message: `Delete territory "${territory.name}"?`, confirmText: 'Delete', danger: true })
            .then((ok) => { if (ok) deleteTerritory.mutate(territory.id); })}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={onToggle} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-2 transition-all">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-border-subtle grid grid-cols-2 divide-x divide-border-subtle">
          <RulesPanel territory={territory} />
          <MembersPanel territory={territory} />
        </div>
      )}
    </div>
  );
}

// ── Rules panel ────────────────────────────────────────────────────────────
function RulesPanel({ territory }: { territory: SalesTerritoryDto }) {
  const addRule = useAddTerritoryRule();
  const removeRule = useRemoveTerritoryRule();
  const [showForm, setShowForm] = useState(false);
  const [field, setField] = useState<TerritoryRuleFieldValue>(TerritoryRuleField.Country);
  const [operator, setOperator] = useState<TerritoryRuleOperatorValue>(TerritoryRuleOperator.Equals);
  const [value, setValue] = useState('');
  const [logicGate, setLogicGate] = useState<TerritoryRuleLogicValue>(TerritoryRuleLogic.And);

  const select = 'px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-brand';

  const handleAdd = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    addRule.mutate(
      { territoryId: territory.id, data: { field, operator, value: value.trim(), logicGate, sortOrder: territory.rules.length } },
      { onSuccess: () => { setValue(''); setShowForm(false); } },
    );
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted">Matching Rules</span>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
          <Plus className="w-3.5 h-3.5" /> Add rule
        </button>
      </div>

      {territory.rules.length === 0 && !showForm && (
        <div className="text-xs text-text-muted py-2">No rules — this territory matches all leads (catch-all).</div>
      )}

      {territory.rules.map((rule, i) => (
        <RuleRow key={rule.id} rule={rule} index={i} territoryId={territory.id} onRemove={() => removeRule.mutate({ territoryId: territory.id, ruleId: rule.id })} />
      ))}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 pt-2 border-t border-border-subtle">
          {territory.rules.length > 0 && (
            <select value={logicGate} onChange={(e) => setLogicGate(Number(e.target.value) as TerritoryRuleLogicValue)} className={select}>
              <option value={TerritoryRuleLogic.And} className="bg-bg">AND</option>
              <option value={TerritoryRuleLogic.Or} className="bg-bg">OR</option>
            </select>
          )}
          <div className="grid grid-cols-3 gap-2">
            <select value={field} onChange={(e) => setField(Number(e.target.value) as TerritoryRuleFieldValue)} className={select}>
              {Object.entries(TerritoryRuleField).map(([_k, v]) => (
                <option key={v} value={v} className="bg-bg">{TERRITORY_RULE_FIELD_LABEL[v as TerritoryRuleFieldValue]}</option>
              ))}
            </select>
            <select value={operator} onChange={(e) => setOperator(Number(e.target.value) as TerritoryRuleOperatorValue)} className={select}>
              {Object.entries(TerritoryRuleOperator).map(([_k, v]) => (
                <option key={v} value={v} className="bg-bg">{TERRITORY_RULE_OPERATOR_LABEL[v as TerritoryRuleOperatorValue]}</option>
              ))}
            </select>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value..." className={`${select} placeholder:text-text-muted`} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={!value.trim() || addRule.isPending} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:brightness-110 disabled:opacity-50">Add</button>
          </div>
        </form>
      )}
    </div>
  );
}

function RuleRow({ rule, index, onRemove }: { rule: SalesTerritoryRuleDto; index: number; territoryId: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {index > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-glass-2 text-text-muted font-bold">
          {rule.logicGate === TerritoryRuleLogic.And ? 'AND' : 'OR'}
        </span>
      )}
      <span className="text-text-secondary font-medium">{TERRITORY_RULE_FIELD_LABEL[rule.field]}</span>
      <span className="text-text-muted">{TERRITORY_RULE_OPERATOR_LABEL[rule.operator]}</span>
      <span className="font-semibold text-text-primary">{rule.value}</span>
      <button onClick={onRemove} className="ml-auto p-1 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-all">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Members panel ──────────────────────────────────────────────────────────
function MembersPanel({ territory }: { territory: SalesTerritoryDto }) {
  const addMember = useAddTerritoryMember();
  const removeMember = useRemoveTerritoryMember();
  const { data: teamRaw } = useTeamMembers();
  const teamMembers = (teamRaw as unknown as UserDto[]) || [];
  const [selectedUserId, setSelectedUserId] = useState('');

  const existingIds = new Set(territory.members.map((m) => m.userId));
  const available = teamMembers.filter((u) => !existingIds.has(u.id));

  const handleAdd = () => {
    if (!selectedUserId) return;
    addMember.mutate(
      { territoryId: territory.id, data: { userId: selectedUserId } },
      { onSuccess: () => setSelectedUserId('') },
    );
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted">Members (round-robin)</div>

      {territory.members.length === 0 ? (
        <div className="text-xs text-text-muted py-2">No members yet.</div>
      ) : (
        <div className="space-y-2">
          {territory.members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              onRemove={() => removeMember.mutate({ territoryId: territory.id, memberId: m.id })}
            />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
          >
            <option value="" className="bg-bg">Select team member...</option>
            {available.map((u) => (
              <option key={u.id} value={u.id} className="bg-bg">{u.firstName} {u.lastName}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selectedUserId || addMember.isPending}
            className="p-2 rounded-lg bg-brand text-white hover:brightness-110 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, onRemove }: { member: SalesTerritoryMemberDto; onRemove: () => void }) {
  const initials = member.userName.split(' ').map((p) => p[0] || '').join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-primary truncate">{member.userName}</div>
        {member.userEmail && <div className="text-xs text-text-muted truncate">{member.userEmail}</div>}
      </div>
      <button onClick={onRemove} className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-soft transition-all flex-shrink-0">
        <UserMinus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
