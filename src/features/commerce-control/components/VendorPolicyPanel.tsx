import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import {
  stylemintBrandStudioApi,
  type PatchVendorPolicy,
  type VendorBrandStudioPolicy,
} from '../api/stylemint-brand-studio.api';

/**
 * A vendor's brand-studio limits: how many model calls a month, the commission ceiling, and the
 * currency briefs default to.
 *
 * Asks for a vendor profile id because the backend serves no list — there is no "vendors with
 * custom policies" endpoint to populate a picker from. Rather than fake one, the panel is honest
 * about needing the id.
 *
 * The update is a PATCH, so a field left blank is left alone rather than cleared. The form
 * enforces that: only changed fields are sent.
 */
export function VendorPolicyPanel() {
  const [vendorId, setVendorId] = useState('');
  const [policy, setPolicy] = useState<VendorBrandStudioPolicy | null>(null);
  const [quota, setQuota] = useState('');
  const [ceiling, setCeiling] = useState('');
  const [currency, setCurrency] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useMutation({
    mutationFn: () => stylemintBrandStudioApi.vendorPolicy(vendorId.trim()),
    onSuccess: (result) => {
      setPolicy(result);
      setQuota(String(result.monthlyLlmCallQuota));
      setCeiling(String(result.commissionCeilingPercent));
      setCurrency(result.defaultCurrencyCode);
      setError(null);
      setOk(null);
    },
    onError: (caught: unknown) => {
      setPolicy(null);
      setOk(null);
      setError(
        caught instanceof Error && caught.message === 'NOT_FOUND'
          ? 'No policy is set for that vendor — they are on the platform defaults.'
          : caught instanceof Error
            ? caught.message
            : 'The policy could not be loaded.',
      );
    },
  });

  const save = useMutation({
    mutationFn: () => {
      // PATCH: send only what actually changed, so untouched fields keep their values.
      const patch: PatchVendorPolicy = {};
      if (policy && Number(quota) !== policy.monthlyLlmCallQuota) {
        patch.monthlyLlmCallQuota = Number(quota);
      }
      if (policy && Number(ceiling) !== policy.commissionCeilingPercent) {
        patch.commissionCeilingPercent = Number(ceiling);
      }
      if (policy && currency.trim() !== policy.defaultCurrencyCode) {
        patch.defaultCurrencyCode = currency.trim();
      }
      return stylemintBrandStudioApi.updateVendorPolicy(vendorId.trim(), patch);
    },
    onSuccess: (result) => {
      setPolicy(result);
      setError(null);
      setOk('Policy updated.');
    },
    onError: (caught: unknown) => {
      setOk(null);
      setError(caught instanceof Error ? caught.message : 'The policy could not be saved.');
    },
  });

  const changed =
    !!policy &&
    (Number(quota) !== policy.monthlyLlmCallQuota ||
      Number(ceiling) !== policy.commissionCeilingPercent ||
      currency.trim() !== policy.defaultCurrencyCode);

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-black text-text-primary">
        <SlidersHorizontal className="h-4 w-4 text-brand" strokeWidth={1.6} />
        Vendor brand-studio limits
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        Per vendor, by profile id — the backend serves no list to pick from. A blank field is left
        as it is, not cleared.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          placeholder="Vendor profile id"
          className="flex-1 rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
        />
        <button
          disabled={!vendorId.trim() || load.isPending}
          onClick={() => load.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {load.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Load
        </button>
      </div>

      {policy && (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Field label="Monthly model calls">
              <input
                type="number"
                min={0}
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Commission ceiling %">
              <input
                type="number"
                min={0}
                step="0.1"
                value={ceiling}
                onChange={(e) => setCeiling(e.target.value)}
                className={field}
              />
            </Field>
            <Field label="Default currency">
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={field}
              />
            </Field>
          </div>

          <p className="mt-2 text-[11px] text-text-muted">
            Last updated {new Date(policy.updatedUtc).toLocaleString()}
          </p>

          <button
            disabled={!changed || save.isPending}
            onClick={() => save.mutate()}
            className="mt-2 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            {save.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
            ) : (
              <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
            )}
            Save changes
          </button>
        </>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}
      {ok && (
        <p className="mt-2 rounded-sm border-thin border-border-glow bg-brand-soft p-2.5 text-xs text-text-secondary">
          {ok}
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary focus:border-border-glow focus:outline-none';
