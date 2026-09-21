import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Globe2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAddTenantDomain,
  useRemoveTenantDomain,
  useSetTenantDomainStatus,
  useTenantDomains,
  useUploadTenantDomainCertificate,
} from '../api/tenant-domains.queries';
import {
  TENANT_DOMAIN_STATUS,
  type TenantDomainCreatedDto,
  type TenantDomainDto,
  type TenantDomainStatus,
} from '../types/tenant-domain.types';

const statusMeta: Record<TenantDomainStatus, { label: string; className: string }> = {
  [TENANT_DOMAIN_STATUS.Pending]: {
    label: 'Pending DNS',
    className: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  },
  [TENANT_DOMAIN_STATUS.Verified]: {
    label: 'Verified',
    className: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
  },
  [TENANT_DOMAIN_STATUS.Active]: {
    label: 'Active',
    className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  },
  [TENANT_DOMAIN_STATUS.Failed]: {
    label: 'Verification failed',
    className: 'border-red-400/25 bg-red-400/10 text-red-300',
  },
  [TENANT_DOMAIN_STATUS.Disabled]: {
    label: 'Disabled',
    className: 'border-border-subtle bg-bg-input text-text-muted',
  },
};

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0];
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error('Clipboard write failed.');
  }
}

function DnsSetup({ created, onClose }: { created: TenantDomainCreatedDto; onClose: () => void }) {
  const platformHost = window.location.hostname === 'localhost'
    ? 'your deployed OmniFlow host'
    : window.location.hostname;

  return (
    <section className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-400/10 p-2">
            <ShieldCheck className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Verify {created.domain.domain}</h2>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Add this TXT record with your DNS provider. Verification runs automatically every few minutes.
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary" aria-label="Close DNS instructions">
          <X className="h-4 w-4" />
        </button>
      </div>

      <DnsValue label="TXT record name" value={created.dnsRecord.host} />
      <DnsValue label="TXT record value" value={created.dnsRecord.value} />

      <div className="rounded-xl border border-border-subtle bg-bg-shell p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Traffic record</p>
        <p className="mt-1 text-xs text-text-secondary">
          After verification, point <span className="font-mono text-text-primary">{created.domain.domain}</span> to{' '}
          <span className="font-mono text-text-primary">{platformHost}</span> using a CNAME or your hosting provider's custom-domain mapping.
        </p>
      </div>
    </section>
  );
}

function DnsValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-input px-3 py-2.5">
        <code className="min-w-0 flex-1 break-all text-xs text-text-primary">{value}</code>
        <button
          onClick={() => void copyText(value, label)}
          className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-glass-2 hover:text-text-primary"
          aria-label={`Copy ${label}`}
        >
          <Clipboard className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CertificateForm({ domain, onClose }: { domain: TenantDomainDto; onClose: () => void }) {
  const upload = useUploadTenantDomainCertificate();
  const [certificatePem, setCertificatePem] = useState('');
  const [privateKeyPem, setPrivateKeyPem] = useState('');

  const submit = () => {
    if (!certificatePem.trim() || !privateKeyPem.trim()) {
      toast.error('Both certificate and private key PEM values are required.');
      return;
    }

    upload.mutate(
      { domainId: domain.id, request: { certificatePem, privateKeyPem } },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-border-subtle bg-bg-shell p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold text-text-primary">Optional origin certificate</p>
        <p className="mt-1 text-[11px] leading-5 text-text-muted">
          Skip this when Cloudflare or your hosting provider terminates TLS. Private keys must only be submitted over HTTPS.
        </p>
      </div>
      <textarea
        value={certificatePem}
        onChange={(event) => setCertificatePem(event.target.value)}
        rows={5}
        placeholder="-----BEGIN CERTIFICATE-----"
        className="w-full resize-y rounded-xl border border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
      />
      <textarea
        value={privateKeyPem}
        onChange={(event) => setPrivateKeyPem(event.target.value)}
        rows={5}
        placeholder="-----BEGIN PRIVATE KEY-----"
        className="w-full resize-y rounded-xl border border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border-subtle px-3 py-2 text-xs text-text-muted hover:text-text-primary">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={upload.isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-50"
        >
          {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
          Save certificate
        </button>
      </div>
    </div>
  );
}

function DomainCard({ domain }: { domain: TenantDomainDto }) {
  const setStatus = useSetTenantDomainStatus();
  const remove = useRemoveTenantDomain();
  const [showCertificate, setShowCertificate] = useState(false);
  const status = statusMeta[domain.status];
  const canActivate = domain.status === TENANT_DOMAIN_STATUS.Verified ||
    (domain.status === TENANT_DOMAIN_STATUS.Disabled && Boolean(domain.verifiedAt));
  const isActive = domain.status === TENANT_DOMAIN_STATUS.Active;
  const statusPending = setStatus.isPending && setStatus.variables?.domainId === domain.id;

  return (
    <article className="rounded-2xl border border-border-subtle bg-bg-elevated p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-brand-soft p-2.5">
            <Globe2 className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-all text-sm font-bold text-text-primary">{domain.domain}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Added {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {isActive && (
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle px-3 py-2 text-xs text-text-secondary hover:border-border-glow hover:text-text-primary"
            >
              Open <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {canActivate && (
            <button
              onClick={() => setStatus.mutate({ domainId: domain.id, status: TENANT_DOMAIN_STATUS.Active })}
              disabled={statusPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-50"
            >
              {statusPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Activate
            </button>
          )}
          {isActive && (
            <button
              onClick={() => setStatus.mutate({ domainId: domain.id, status: TENANT_DOMAIN_STATUS.Disabled })}
              disabled={statusPending}
              className="rounded-xl border border-border-subtle px-3 py-2 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              Disable
            </button>
          )}
          <button
            onClick={() => setShowCertificate((value) => !value)}
            className="rounded-xl border border-border-subtle p-2 text-text-muted hover:text-text-primary"
            title="Certificate"
          >
            <KeyRound className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove ${domain.domain}? It will stop routing immediately.`)) remove.mutate(domain.id);
            }}
            disabled={remove.isPending}
            className="rounded-xl border border-red-400/15 p-2 text-red-300/70 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
            title="Remove domain"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-border-subtle pt-4 text-xs sm:grid-cols-3">
        <DomainDetail label="DNS verification" value={domain.verifiedAt ? `Verified ${formatDistanceToNow(new Date(domain.verifiedAt), { addSuffix: true })}` : 'Waiting for TXT record'} />
        <DomainDetail label="Public origin" value={isActive ? `https://${domain.domain}` : 'Not active'} />
        <DomainDetail label="Certificate" value={domain.certExpiresAt ? `Expires ${new Date(domain.certExpiresAt).toLocaleDateString()}` : 'Cloudflare / hosting managed'} />
      </div>

      {domain.status === TENANT_DOMAIN_STATUS.Pending && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-400/[0.06] px-3 py-2.5 text-xs text-amber-200/80">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          DNS verification is pending. Use the TXT record shown when this domain was added, then refresh this page.
        </div>
      )}
      {domain.status === TENANT_DOMAIN_STATUS.Failed && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-400/[0.06] px-3 py-2.5 text-xs text-red-200/80">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Verification timed out. Remove this entry and add the domain again to receive a new TXT record.
        </div>
      )}
      {showCertificate && <CertificateForm domain={domain} onClose={() => setShowCertificate(false)} />}
    </article>
  );
}

function DomainDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 break-all text-text-secondary">{value}</p>
    </div>
  );
}

function CustomDomainsPage() {
  const navigate = useNavigate();
  const domains = useTenantDomains();
  const addDomain = useAddTenantDomain();
  const [domain, setDomain] = useState('');
  const [created, setCreated] = useState<TenantDomainCreatedDto | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeDomain(domain);
    if (!normalized || !normalized.includes('.')) {
      toast.error('Enter a complete domain such as book.example.com.');
      return;
    }

    addDomain.mutate(
      { domain: normalized },
      {
        onSuccess: (result) => {
          setCreated(result);
          setDomain('');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <button
        onClick={() => navigate('/dashboard/settings')}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand p-2.5">
              <Globe2 className="h-5 w-5 text-bg" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-text-primary">Custom domains</h1>
              <p className="mt-1 text-sm text-text-secondary">Use your own domain for public booking pages and hosted webforms.</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => void domains.refetch()}
          disabled={domains.isFetching}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${domains.isFetching ? 'animate-spin' : ''}`} /> Refresh verification
        </button>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-border-subtle bg-bg-elevated p-5">
        <label htmlFor="custom-domain" className="text-xs font-semibold text-text-primary">Add a domain</label>
        <p className="mt-1 text-xs text-text-muted">Use a subdomain such as book.example.com or forms.example.com. Do not include https:// or a path.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="custom-domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value.toLowerCase())}
              placeholder="book.example.com"
              className="w-full rounded-xl border border-border-subtle bg-bg-input py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={addDomain.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-50"
          >
            {addDomain.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add domain
          </button>
        </div>
      </form>

      {created && <DnsSetup created={created} onClose={() => setCreated(null)} />}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">Configured domains</h2>
          <span className="text-xs text-text-muted">{domains.data?.length ?? 0} of 10</span>
        </div>

        {domains.isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-border-subtle bg-bg-elevated">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : domains.isError ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-red-300" />
            <p className="mt-2 text-sm font-semibold text-red-200">Failed to load custom domains</p>
            <button onClick={() => void domains.refetch()} className="mt-3 text-xs font-semibold text-red-200 underline">Try again</button>
          </div>
        ) : domains.data?.length ? (
          domains.data.map((item) => <DomainCard key={item.id} domain={item} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-elevated p-10 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-text-muted" />
            <p className="mt-3 text-sm font-semibold text-text-primary">No custom domains yet</p>
            <p className="mt-1 text-xs text-text-muted">Your existing hosted URLs continue working until you add and activate one.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export { CustomDomainsPage as Component };
export default CustomDomainsPage;
