import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { stylemintCommerceApi, type StylemintCustomer } from '../api/stylemint-commerce.api';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';

export function StylemintCustomersPage() {
  const { user } = useAuth();
  const canManageCustomers = user?.role === UserRole.Owner;
  const client = useQueryClient();
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<StylemintCustomer | null>(null);

  const query = useQuery({
    queryKey: ['stylemint-customers', search, status],
    queryFn: () =>
      stylemintCommerceApi.customers({
        search: search || undefined,
        status: status ? Number(status) : undefined,
        pageNumber: 1,
        pageSize: 100,
      }),
    retry: false,
    enabled: canManageCustomers,
  });
  const stateAction = useMutation({
    mutationFn: async ({
      customer,
      action,
    }: {
      customer: StylemintCustomer;
      action: 'suspend' | 'reinstate';
    }) => {
      if (action === 'suspend')
        return stylemintCommerceApi.suspendCustomer(customer.id, 'Action operateur Kin Marche');
      return stylemintCommerceApi.reinstateCustomer(customer.id);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['stylemint-customers'] });
      setSelected(null);
    },
  });
  const customers = query.data?.items ?? [];
  const active = customers.filter((customer) => customer.status === 1).length;
  const verified = customers.filter((customer) => customer.emailVerified || customer.phoneVerified).length;

  if (!canManageCustomers) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-400/25 bg-amber-400/5 p-8 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-amber-400" />
        <h1 className="mt-4 text-xl font-black text-text-primary">Acces Owner requis</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Les donnees clients et la suspension des comptes sont reservees au proprietaire Kin Marche.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Vue client 360 Stylemint
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-text-primary">Clients Kin Marche</h1>
          <p className="mt-1 text-sm text-text-muted">
            Real accounts, verification and Stylemint access control.
          </p>
        </div>
        <button
          onClick={() => query.refetch()}
          className="flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Users} label="Clients trouves" value={query.data?.totalCount ?? 0} />
        <Metric icon={UserCheck} label="Actifs sur cette page" value={active} />
        <Metric icon={ShieldCheck} label="Identite verifiee" value={verified} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draftSearch.trim());
        }}
        className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3"
      >
        <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Nom, email ou telephone"
            className="w-full bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm font-semibold text-text-secondary outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="1">Actifs</option>
          <option value="2">Suspendus</option>
          <option value="3">Desactives</option>
        </select>
        <button className="rounded-xl bg-brand px-5 py-2 text-xs font-extrabold text-bg">Rechercher</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
        {query.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : query.isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
            <Users className="h-8 w-8 text-amber-400" />
            <p className="font-bold text-text-primary">Administration client non disponible</p>
            <p className="max-w-lg text-xs leading-5 text-text-muted">
              Le jeton Lead360 doit avoir le role administrateur Stylemint pour consulter les clients.
            </p>
          </div>
        ) : !customers.length ? (
          <div className="flex h-56 items-center justify-center text-sm text-text-muted">
            Aucun client trouve.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated">
                  {['Client', 'Contact', 'Pays / langue', 'Verification', 'Statut', 'Derniere activite'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-text-muted"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelected(customer)}
                    className="cursor-pointer border-b border-border-subtle last:border-0 hover:bg-bg-elevated"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xs font-black text-brand">
                          {customer.avatarUrl ? (
                            <img src={customer.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            customer.displayName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{customer.displayName}</p>
                          <p className="font-mono text-[9px] text-text-muted">{customer.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {customer.primaryEmail || '—'}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {customer.primaryPhone || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {customer.countryCode || '—'} · {customer.locale}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${customer.emailVerified || customer.phoneVerified ? 'bg-success-soft text-success' : 'bg-amber-400/10 text-amber-400'}`}
                      >
                        {customer.emailVerified || customer.phoneVerified ? 'Verifie' : 'A verifier'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Status status={customer.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {customer.lastActiveUtc
                        ? new Date(customer.lastActiveUtc).toLocaleString('fr-CD')
                        : 'Jamais'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Fermer"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelected(null)}
          />
          <aside className="relative h-full w-full max-w-md border-l border-border-subtle bg-bg-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Compte Stylemint</p>
            <h2 className="mt-2 text-xl font-black text-text-primary">{selected.displayName}</h2>
            <p className="mt-1 text-xs text-text-muted">
              {selected.primaryEmail || selected.primaryPhone || selected.id}
            </p>
            <div className="mt-5">
              <Status status={selected.status} />
            </div>
            <div className="mt-6 space-y-2 text-sm">
              <Row label="Language" value={selected.locale} />
              <Row label="Time zone" value={selected.timezone} />
              <Row label="Pays" value={selected.countryCode || 'Non renseigne'} />
              <Row label="Cree le" value={new Date(selected.createdUtc).toLocaleDateString('fr-CD')} />
            </div>
            {selected.status === 1 ? (
              <button
                disabled={stateAction.isPending}
                onClick={() => stateAction.mutate({ customer: selected, action: 'suspend' })}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger-soft py-3 text-sm font-bold text-danger disabled:opacity-50"
              >
                {stateAction.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}{' '}
                Suspendre le compte
              </button>
            ) : selected.status === 2 ? (
              <button
                disabled={stateAction.isPending}
                onClick={() => stateAction.mutate({ customer: selected, action: 'reinstate' })}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-bg disabled:opacity-50"
              >
                {stateAction.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}{' '}
                Reactiver le compte
              </button>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
          <p className="mt-1 text-2xl font-black text-text-primary">{value.toLocaleString('fr-CD')}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
          <Icon className="h-4 w-4 text-brand" />
        </div>
      </div>
    </div>
  );
}
function Status({ status }: { status: number }) {
  const label = status === 1 ? 'Actif' : status === 2 ? 'Suspendu' : status === 3 ? 'Desactive' : 'Ferme';
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${status === 1 ? 'border-success/25 bg-success-soft text-success' : 'border-danger/25 bg-danger-soft text-danger'}`}
    >
      {label}
    </span>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border-subtle py-2">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

export { StylemintCustomersPage as Component };
