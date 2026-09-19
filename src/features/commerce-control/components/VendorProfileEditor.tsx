import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, ImageUp, Loader2, Save } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { data: unknown; canOperate: boolean; onSaved: () => void };

const empty = {
  businessName: '',
  tagline: '',
  description: '',
  brandStory: '',
  logoUrl: '',
  websiteUrl: '',
  originCity: 'Kinshasa',
  originCountryCode: 'CD',
  returnPolicySummary: '',
  supportUrl: '',
  pickupEnabled: false,
  pickupAddressLine: '',
  pickupCity: 'Kinshasa',
};

export function VendorProfileEditor({ data, canOperate, onSaved }: Props) {
  const [form, setForm] = useState(empty);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!data || typeof data !== 'object') return;
    const profile = data as Record<string, unknown>;
    setForm({
      businessName: String(profile.businessName ?? ''),
      tagline: String(profile.tagline ?? ''),
      description: String(profile.description ?? ''),
      brandStory: String(profile.brandStory ?? ''),
      logoUrl: String(profile.logoUrl ?? ''),
      websiteUrl: String(profile.websiteUrl ?? ''),
      originCity: String(profile.originCity ?? 'Kinshasa'),
      originCountryCode: String(profile.originCountryCode ?? 'CD'),
      returnPolicySummary: String(profile.returnPolicySummary ?? ''),
      supportUrl: String(profile.supportUrl ?? ''),
      pickupEnabled: Boolean(profile.pickupEnabled ?? profile.isPickupEnabled ?? false),
      pickupAddressLine: String(profile.pickupAddressLine ?? ''),
      pickupCity: String(profile.pickupCity ?? 'Kinshasa'),
    });
  }, [data]);
  const set = (key: keyof typeof empty, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      await stylemintCommerceApi.updateVendorProfile({
        businessName: form.businessName.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        brandStory: form.brandStory.trim(),
        logoUrl: form.logoUrl.trim(),
        websiteUrl: form.websiteUrl.trim(),
        originCity: form.originCity.trim(),
        originCountryCode: form.originCountryCode.trim().toUpperCase(),
        returnPolicySummary: form.returnPolicySummary.trim(),
        supportUrl: form.supportUrl.trim(),
      });
      await stylemintCommerceApi.updateVendorPickup({
        enabled: form.pickupEnabled,
        addressLine: form.pickupAddressLine.trim() || undefined,
        city: form.pickupCity.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      onSaved();
    },
  });
  const upload = useMutation({
    mutationFn: ({ kind, file }: { kind: 'logo' | 'cover'; file: File }) =>
      stylemintCommerceApi.uploadVendorMedia(kind, file),
    onSuccess: () => onSaved(),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
      className="p-5"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Identite Kin Marche">
          <Input
            label="Nom commercial"
            value={form.businessName}
            onChange={(value) => set('businessName', value)}
            required
            disabled={!canOperate}
          />
          <Input
            label="Signature"
            value={form.tagline}
            onChange={(value) => set('tagline', value)}
            disabled={!canOperate}
          />
          <Input
            label="Logo (HTTPS)"
            value={form.logoUrl}
            onChange={(value) => set('logoUrl', value)}
            disabled={!canOperate}
          />
          {canOperate && (
            <div className="grid gap-2 sm:grid-cols-2">
              <MediaUpload
                label="Upload logo"
                disabled={upload.isPending}
                onFile={(file) => upload.mutate({ kind: 'logo', file })}
              />
              <MediaUpload
                label="Upload cover"
                disabled={upload.isPending}
                onFile={(file) => upload.mutate({ kind: 'cover', file })}
              />
            </div>
          )}
          <Input
            label="Site web"
            value={form.websiteUrl}
            onChange={(value) => set('websiteUrl', value)}
            disabled={!canOperate}
          />
          <Area
            label="Description"
            value={form.description}
            onChange={(value) => set('description', value)}
            disabled={!canOperate}
          />
          <Area
            label="Brand story"
            value={form.brandStory}
            onChange={(value) => set('brandStory', value)}
            disabled={!canOperate}
          />
        </Section>
        <Section title="Service and pickup">
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Input
              label="Ville d'origine"
              value={form.originCity}
              onChange={(value) => set('originCity', value)}
              disabled={!canOperate}
            />
            <Input
              label="Pays ISO"
              value={form.originCountryCode}
              onChange={(value) => set('originCountryCode', value)}
              disabled={!canOperate}
            />
          </div>
          <Input
            label="URL support HTTPS"
            value={form.supportUrl}
            onChange={(value) => set('supportUrl', value)}
            disabled={!canOperate}
          />
          <Area
            label="Return policy"
            value={form.returnPolicySummary}
            onChange={(value) => set('returnPolicySummary', value)}
            disabled={!canOperate}
          />
          <label className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-card p-3 text-xs font-semibold text-text-secondary">
            <input
              type="checkbox"
              checked={form.pickupEnabled}
              disabled={!canOperate}
              onChange={(event) => set('pickupEnabled', event.target.checked)}
            />
            Retrait en magasin active
          </label>
          <Input
            label="Pickup address"
            value={form.pickupAddressLine}
            onChange={(value) => set('pickupAddressLine', value)}
            disabled={!canOperate || !form.pickupEnabled}
          />
          <Input
            label="Pickup city"
            value={form.pickupCity}
            onChange={(value) => set('pickupCity', value)}
            disabled={!canOperate || !form.pickupEnabled}
          />
        </Section>
      </div>
      {(save.isError || upload.isError) && (
        <p className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs font-semibold text-danger">
          {((save.error || upload.error) as Error).message}
        </p>
      )}
      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Enregistre
          </span>
        )}
        {canOperate ? (
          <button
            disabled={save.isPending || !form.businessName.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
        ) : (
          <span className="text-xs text-text-muted">Read only for the Agent role</span>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">{title}</h3>
      {children}
    </section>
  );
}
function MediaUpload({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand/30 bg-brand-soft px-3 py-3 text-[11px] font-extrabold text-brand hover:border-brand/60">
      <ImageUp className="h-4 w-4" />
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = '';
        }}
      />
    </label>
  );
}
function Input({
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <input
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50 disabled:opacity-60"
      />
    </label>
  );
}
function Area({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <textarea
        rows={4}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50 disabled:opacity-60"
      />
    </label>
  );
}
