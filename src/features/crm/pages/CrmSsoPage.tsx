import { useState } from 'react';
import { KeyRound, Loader2, Lock, ShieldAlert, Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useProfile } from '@/features/auth/api/auth.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';
import {
  useCreateSsoConfiguration,
  useDeleteSsoConfiguration,
  useRecordSsoTest,
  useSsoConfigurations,
} from '../api/crm-sso.queries';
import {
  IS_SAML,
  SSO_PROVIDERS,
  SSO_PROVIDER_LABEL,
  type CrmSsoConfigurationDto,
  type SsoProvider,
} from '../types/crm-sso.types';

const field =
  'rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand';

export function Component() {
  const { data: profile } = useProfile();
  // Identity configuration is an owner/admin surface, like the audit log.
  const role = (profile as UserDto | undefined)?.role;
  const isManager = role === UserRole.Owner || role === UserRole.Admin;

  const { data, isLoading } = useSsoConfigurations();
  const create = useCreateSsoConfiguration();
  const remove = useDeleteSsoConfiguration();
  const recordTest = useRecordSsoTest();

  const [name, setName] = useState('');
  const [provider, setProvider] = useState<SsoProvider>('AzureAD');
  const [clientId, setClientId] = useState('');
  const [authorityUrl, setAuthorityUrl] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');
  const [enforce, setEnforce] = useState(false);

  if (profile && !isManager) {
    return (
      <div className="py-16 text-center">
        <Lock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text-primary">Restricted</h1>
        <p className="text-sm text-text-muted mt-1">
          Single sign-on is configured by Owners and Admins.
        </p>
      </div>
    );
  }

  const rows = (data ?? []) as CrmSsoConfigurationDto[];
  const saml = IS_SAML[provider];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      {
        name: name.trim(),
        provider,
        clientId: clientId.trim() || null,
        authorityUrl: authorityUrl.trim() || null,
        metadataUrl: metadataUrl.trim() || null,
        enforceForAllUsers: enforce,
      },
      {
        onSuccess: () => {
          setName('');
          setClientId('');
          setAuthorityUrl('');
          setMetadataUrl('');
          setEnforce(false);
        },
      }
    );
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Single sign-on</h1>
          <p className="text-sm text-text-muted">
            Connect an identity provider so people sign in with their work account.
          </p>
        </div>
      </div>

      {/* The endpoint behind "Record a check" stamps a date and contacts
          nothing. Rendering that as a passing connection test would be the
          most expensive kind of wrong — an admin enforces SSO on the strength
          of a green tick and locks the tenant out. */}
      <div
        className="rounded-2xl border border-warning/20 bg-warning-soft px-5 py-4 flex gap-3"
        data-testid="sso-no-live-test-notice"
      >
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            There is no live connection test.
          </span>{' '}
          "Record a check" only notes the date — the server never contacts the
          provider. Verify a connection by signing in with it yourself before you
          turn on <span className="font-semibold">Require for everyone</span>, or
          you can lock the whole workspace out.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4 space-y-3"
      >
        <h2 className="text-sm font-semibold text-text-primary">Add a connection</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Connection name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Staff sign-in"
            className={`flex-1 min-w-[200px] ${field}`}
          />
          <select
            aria-label="Identity provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as SsoProvider)}
            className={field}
          >
            {SSO_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {SSO_PROVIDER_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        {saml ? (
          <input
            aria-label="Metadata URL"
            value={metadataUrl}
            onChange={(e) => setMetadataUrl(e.target.value)}
            placeholder="https://idp.example.com/metadata.xml"
            className={`w-full ${field}`}
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            <input
              aria-label="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              className={`flex-1 min-w-[200px] ${field}`}
            />
            <input
              aria-label="Authority URL"
              value={authorityUrl}
              onChange={(e) => setAuthorityUrl(e.target.value)}
              placeholder="https://login.microsoftonline.com/<tenant>/v2.0"
              className={`flex-1 min-w-[220px] ${field}`}
            />
          </div>
        )}

        <p className="text-xs text-text-muted" data-testid="sso-secret-note">
          Add the client secret or signing certificate in your identity provider's
          console and paste it here only over HTTPS — the server stores it and never
          sends it back, so this form cannot show you what is already saved.
        </p>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={enforce}
            onChange={(e) => setEnforce(e.target.checked)}
            className="accent-brand"
          />
          Require for everyone
        </label>

        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="rounded-xl bg-brand text-text-inverted px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          {create.isPending ? 'Saving…' : 'Save connection'}
        </button>
      </form>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            No identity provider connected — everyone signs in with a password.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((s) => (
              <li key={s.id} className="py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-text-primary font-medium">{s.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {SSO_PROVIDER_LABEL[s.provider] ?? s.provider}
                    {s.testedAt ? (
                      <>
                        {' · last checked '}
                        {formatDistanceToNow(parseISO(s.testedAt), { addSuffix: true })}
                      </>
                    ) : (
                      ' · never checked'
                    )}
                  </p>
                </div>
                {s.enforceForAllUsers && (
                  <span className="rounded-full border border-warning/20 bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                    Required
                  </span>
                )}
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    s.isActive
                      ? 'text-success bg-success-soft border-success/20'
                      : 'text-text-muted bg-bg-elevated border-border-subtle'
                  }`}
                >
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => recordTest.mutate(s.id)}
                  disabled={recordTest.isPending}
                  className="rounded-xl border border-border-medium px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
                >
                  Record a check
                </button>
                <button
                  aria-label={`Remove ${s.name}`}
                  onClick={() => remove.mutate(s.id)}
                  disabled={remove.isPending}
                  className="rounded-xl border border-border-medium p-1.5 text-text-muted hover:text-danger hover:border-danger/20 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
