import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Users, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Kind = 'squad' | 'retainer';

export function VendorCollaborationDialog({
  kind,
  onClose,
  onDone,
}: {
  kind: Kind;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [briefId, setBriefId] = useState('');
  const [creatorAccountId, setCreatorAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [deliverables, setDeliverables] = useState('4');
  const [error, setError] = useState('');
  const amountNumber = Number(amount);
  const deliverablesNumber = Number(deliverables);
  const valid = kind === 'squad'
    ? Boolean(name.trim() && briefId.trim() && amountNumber > 0)
    : Boolean(
        creatorAccountId.trim() &&
        amountNumber > 0 &&
        Number.isInteger(deliverablesNumber) &&
        deliverablesNumber > 0,
      );

  const save = useMutation({
    mutationFn: () =>
      kind === 'squad'
        ? stylemintCommerceApi.createVendorSquad({
            name: name.trim(),
            briefId: briefId.trim(),
            budgetTotal: amountNumber,
            budgetCurrency: 'CDF',
          })
        : stylemintCommerceApi.createVendorRetainer({
            creatorAccountId: creatorAccountId.trim(),
            monthlyAmount: amountNumber,
            currency: 'CDF',
            deliverablesPerMonth: deliverablesNumber,
          }),
    onSuccess: onDone,
    onError: () =>
      setError(
        kind === 'squad'
          ? 'Creation impossible. Verifiez le brief et le budget.'
          : 'Proposition impossible. Verifiez le createur et les montants.',
      ),
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError('');
          save.mutate();
        }}
        className="relative w-full max-w-lg rounded-3xl border border-brand/20 bg-bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <span className="rounded-2xl bg-brand/10 p-3 text-brand"><Users className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-brand">Collaboration vendeur</p>
              <h3 className="mt-1 text-xl font-black text-text-primary">
                {kind === 'squad' ? 'Nouvelle escouade' : 'Nouveau contrat mensuel'}
              </h3>
              <p className="mt-1 text-xs text-text-muted">Tous les montants sont en francs congolais.</p>
            </div>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-bg-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {kind === 'squad' ? (
            <>
              <Input label="Nom de l'escouade" value={name} onChange={setName} />
              <Input label="Identifiant du brief commercial" value={briefId} onChange={setBriefId} mono />
              <Input label="Budget total" value={amount} onChange={setAmount} type="number" suffix="CDF" />
            </>
          ) : (
            <>
              <Input label="Identifiant du compte createur" value={creatorAccountId} onChange={setCreatorAccountId} mono />
              <Input label="Montant mensuel" value={amount} onChange={setAmount} type="number" suffix="CDF" />
              <Input label="Livrables par mois" value={deliverables} onChange={setDeliverables} type="number" />
            </>
          )}
        </div>
        {error && <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs font-semibold text-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-secondary">
            Annuler
          </button>
          <button disabled={!valid || save.isPending} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {kind === 'squad' ? "Creer l'escouade" : 'Proposer le contrat'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({
  label, value, onChange, type = 'text', suffix, mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
  mono?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span>
      <div className="flex rounded-xl border border-border-subtle bg-bg-elevated focus-within:border-brand/50">
        <input required min={type === 'number' ? 1 : undefined} type={type} value={value} onChange={(event) => onChange(event.target.value)}
          className={`min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none ${mono ? 'font-mono' : ''}`} />
        {suffix && <span className="flex items-center border-l border-border-subtle px-3 text-xs font-black text-brand">{suffix}</span>}
      </div>
    </label>
  );
}
