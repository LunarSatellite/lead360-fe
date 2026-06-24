// ═══════════════════════════════════════════════════════════════
// BusinessProfileForm — Setup / edit the tenant's business profile
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Save, Loader2, Sparkles } from 'lucide-react';
import {
  useBusinessProfileDefaults,
  useUpsertBusinessProfile,
} from '../api/business-catalog.queries';
import {
  BUSINESS_TYPE_DESCRIPTION,
  BUSINESS_TYPE_LABEL,
  BusinessType,
  type BusinessProfile,
  type BusinessProfileUpsertRequest,
  type BusinessTypeValue,
} from '../types/business-catalog.types';

interface Props {
  existing: BusinessProfile | undefined;
  onSaved?: () => void;
}

const EMPTY_REQUEST: BusinessProfileUpsertRequest = {
  businessType: BusinessType.Other,
  transactionLabel: 'Request',
  transactionType: 'request',
  catalogLabel: 'Offerings',
  itemLabel: 'Offering',
  collectsQuantity: false,
  collectsTimeSlot: false,
  collectsDateRange: false,
  collectsMultipleItems: false,
  collectsAddress: false,
  collectsNotes: true,
  slotDurationMins: null,
  operationalHoursJson: null,
  confirmationMessage:
    'Thanks — we have received your request and will contact you shortly.',
  notifyEmail: null,
  notifyPhone: null,
  isActive: true,
};

export function BusinessProfileForm({ existing, onSaved }: Props) {
  const [form, setForm] = useState<BusinessProfileUpsertRequest>(() =>
    existing ? toRequest(existing) : EMPTY_REQUEST,
  );
  const [selectedType, setSelectedType] = useState<BusinessTypeValue | undefined>(
    existing ? existing.businessType : undefined,
  );

  const { data: defaults } = useBusinessProfileDefaults(selectedType);
  const upsert = useUpsertBusinessProfile();

  // When the owner picks a business type and we don't have an existing profile,
  // pre-fill from server-side defaults.
  useEffect(() => {
    if (existing) return;
    if (defaults && selectedType !== undefined) {
      setForm({ ...defaults, businessType: selectedType });
    }
  }, [defaults, selectedType, existing]);

  const handleSubmit = () => {
    upsert.mutate(form, {
      onSuccess: () => onSaved?.(),
    });
  };

  return (
    <div className="space-y-5">
      {/* ─── Business Type picker ─── */}
      {!existing && (
        <Section title="What kind of business is this?" subtitle="We'll set sensible defaults — edit any of them below.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(BUSINESS_TYPE_LABEL).map(([val, label]) => {
              const value = Number(val) as BusinessTypeValue;
              const selected = selectedType === value;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedType(value)}
                  className={[
                    'rounded-xl border p-3 text-left transition-all',
                    selected
                      ? 'border-brand bg-brand-soft'
                      : 'border-border-subtle bg-glass-1 hover:border-border-medium',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    {selected && <Sparkles className="w-3.5 h-3.5 text-brand" strokeWidth={2} />}
                    <span className="text-sm font-bold text-text-primary">{label}</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    {BUSINESS_TYPE_DESCRIPTION[value]}
                  </p>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* ─── Vocabulary ─── */}
      <Section
        title="Vocabulary"
        subtitle="How the bot will refer to your offerings and customer requests."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="What you call a customer request">
            <Input
              value={form.transactionLabel}
              onChange={(v) => setForm({ ...form, transactionLabel: v })}
              placeholder="Order / Appointment / Booking"
            />
          </Field>
          <Field label="Internal type code">
            <Input
              value={form.transactionType}
              onChange={(v) => setForm({ ...form, transactionType: v.toLowerCase() })}
              placeholder="order / appointment / booking"
            />
          </Field>
          <Field label="What you call your catalog">
            <Input
              value={form.catalogLabel}
              onChange={(v) => setForm({ ...form, catalogLabel: v })}
              placeholder="Products / Doctors / Rooms"
            />
          </Field>
          <Field label="What you call one item">
            <Input
              value={form.itemLabel}
              onChange={(v) => setForm({ ...form, itemLabel: v })}
              placeholder="Product / Doctor / Room"
            />
          </Field>
        </div>
      </Section>

      {/* ─── Behavior flags ─── */}
      <Section
        title="What the bot will collect"
        subtitle="Toggle the steps your customers will go through. Leave the rest off."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Toggle
            label="Quantity per item"
            description="Carts in retail or food — not clinics."
            checked={form.collectsQuantity}
            onChange={(v) => setForm({ ...form, collectsQuantity: v })}
          />
          <Toggle
            label="Multiple items in one request"
            description="Customer can add several offerings before submitting."
            checked={form.collectsMultipleItems}
            onChange={(v) => setForm({ ...form, collectsMultipleItems: v })}
          />
          <Toggle
            label="Specific date and time"
            description="Appointments, table reservations, service bookings."
            checked={form.collectsTimeSlot}
            onChange={(v) => setForm({ ...form, collectsTimeSlot: v })}
          />
          <Toggle
            label="Date range (start + end)"
            description="Hotel stays, equipment rental."
            checked={form.collectsDateRange}
            onChange={(v) => setForm({ ...form, collectsDateRange: v })}
          />
          <Toggle
            label="Delivery / service address"
            description="Where the order is going."
            checked={form.collectsAddress}
            onChange={(v) => setForm({ ...form, collectsAddress: v })}
          />
          <Toggle
            label="Customer notes"
            description="Free-text — e.g. 'no onions', 'doctor who speaks Hindi'."
            checked={form.collectsNotes}
            onChange={(v) => setForm({ ...form, collectsNotes: v })}
          />
        </div>

        {form.collectsTimeSlot && (
          <div className="mt-3">
            <Field label="Slot duration (minutes)">
              <Input
                type="number"
                value={form.slotDurationMins?.toString() ?? ''}
                onChange={(v) =>
                  setForm({
                    ...form,
                    slotDurationMins: v.trim() === '' ? null : Number(v),
                  })
                }
                placeholder="30"
              />
            </Field>
          </div>
        )}
      </Section>

      {/* ─── Confirmation & notifications ─── */}
      <Section
        title="After a request comes in"
        subtitle="What the customer sees, and where to alert your team."
      >
        <Field label="Confirmation message shown to the customer">
          <Textarea
            value={form.confirmationMessage}
            onChange={(v) => setForm({ ...form, confirmationMessage: v })}
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Notify email (optional)">
            <Input
              value={form.notifyEmail ?? ''}
              onChange={(v) => setForm({ ...form, notifyEmail: v.trim() === '' ? null : v })}
              placeholder="orders@yourbusiness.com"
            />
          </Field>
          <Field label="Notify phone (optional)">
            <Input
              value={form.notifyPhone ?? ''}
              onChange={(v) => setForm({ ...form, notifyPhone: v.trim() === '' ? null : v })}
              placeholder="+1 555 555 0123"
            />
          </Field>
        </div>
      </Section>

      {/* ─── Save ─── */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={upsert.isPending}
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                     bg-brand text-white hover:bg-brand/90 disabled:opacity-50
                     transition-all"
        >
          {upsert.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" strokeWidth={2} />
          )}
          {existing ? 'Update profile' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Local primitives
// ═══════════════════════════════════════════════════════════════

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-glass-1 border border-border-subtle p-5">
      <div className="mb-3">
        <h3 className="text-sm font-extrabold text-text-primary tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-text-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
}) {
  return (
    <input
      type={type ?? 'text'}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                 text-text-primary placeholder:text-text-muted
                 focus:outline-none focus:border-brand transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows ?? 2}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                 text-text-primary placeholder:text-text-muted
                 focus:outline-none focus:border-brand transition-colors resize-none"
    />
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        'rounded-xl border p-3 text-left transition-all flex items-start gap-3',
        checked
          ? 'border-brand bg-brand-soft'
          : 'border-border-subtle bg-glass-2 hover:border-border-medium',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 w-9 h-5 rounded-full relative transition-colors',
          checked ? 'bg-brand' : 'bg-glass-3',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          ].join(' ')}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-text-primary">{label}</div>
        <div className="text-[11px] text-text-muted">{description}</div>
      </div>
    </button>
  );
}

// ─── Helpers ───

function toRequest(p: BusinessProfile): BusinessProfileUpsertRequest {
  return {
    businessType: p.businessType,
    transactionLabel: p.transactionLabel,
    transactionType: p.transactionType,
    catalogLabel: p.catalogLabel,
    itemLabel: p.itemLabel,
    collectsQuantity: p.collectsQuantity,
    collectsTimeSlot: p.collectsTimeSlot,
    collectsDateRange: p.collectsDateRange,
    collectsMultipleItems: p.collectsMultipleItems,
    collectsAddress: p.collectsAddress,
    collectsNotes: p.collectsNotes,
    slotDurationMins: p.slotDurationMins,
    operationalHoursJson: p.operationalHoursJson,
    confirmationMessage: p.confirmationMessage,
    notifyEmail: p.notifyEmail,
    notifyPhone: p.notifyPhone,
    isActive: p.isActive,
  };
}
