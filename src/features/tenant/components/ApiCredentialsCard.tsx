import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plug, Eye, EyeOff, MoreHorizontal, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApiCredentials, useSetApiCredentials, useDeleteApiCredentials } from '../api/settings.queries';
import { ApiError } from '@/shared/lib/api-client';
import type { ApiAuthType } from '../types/settings.types';
import { UserRole } from '@/features/auth/types/auth.types';
import { useAuth } from '@/shared/hooks/useAuth';

/* ─── Helpers ───────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const HEALTH_STYLES: Record<string, string> = {
  Healthy: 'text-[#10B981] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)]',
  Degraded: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)]',
  Unhealthy: 'text-[#F43F5E] bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.25)]',
  Unknown: 'text-text-muted bg-glass-1 border border-border-subtle',
};

const AUTH_LABELS: Record<ApiAuthType, string> = {
  Bearer: 'Bearer Token',
  ApiKey: 'API Key',
  Basic: 'Basic Auth',
  OAuth2: 'OAuth2',
};

/* ─── Zod schema ────────────────────────────────────────────────── */

const schema = z
  .object({
    baseUrl: z
      .string()
      .min(1, 'API base URL is required.')
      .regex(/^https?:\/\/.+/, 'Must be an absolute http(s) URL.'),
    authType: z.enum(['Bearer', 'ApiKey', 'Basic', 'OAuth2']),
    token: z.string().optional(),
    apiKey: z.string().optional(),
    headerName: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    accessToken: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.authType === 'Bearer' && !d.token?.trim())
      ctx.addIssue({ code: 'custom', path: ['token'], message: 'Required.' });
    if (d.authType === 'ApiKey' && !d.apiKey?.trim())
      ctx.addIssue({ code: 'custom', path: ['apiKey'], message: 'Required.' });
    if (d.authType === 'Basic') {
      if (!d.username?.trim()) ctx.addIssue({ code: 'custom', path: ['username'], message: 'Required.' });
      if (!d.password?.trim()) ctx.addIssue({ code: 'custom', path: ['password'], message: 'Required.' });
    }
    if (d.authType === 'OAuth2' && !d.accessToken?.trim())
      ctx.addIssue({ code: 'custom', path: ['accessToken'], message: 'Required.' });
  });

type FormValues = z.infer<typeof schema>;

// Map backend error messages to form field names
const BACKEND_FIELD_MAP: Record<string, keyof FormValues> = {
  "BaseUrl must be an absolute http(s) URL.": 'baseUrl',
  "Credentials must include non-empty 'token'.": 'token',
  "Credentials must include non-empty 'apiKey'.": 'apiKey',
  "Credentials must include non-empty 'username'.": 'username',
  "Credentials must include non-empty 'password'.": 'password',
  "Credentials must include non-empty 'accessToken'.": 'accessToken',
};

/* ─── Password field with eye toggle ────────────────────────────── */

function SecretInput({
  id,
  placeholder,
  error,
  registration,
}: {
  id: string;
  placeholder?: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>['register']>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          className={`form-input pr-10 ${error ? '!border-[rgba(244,63,94,0.6)]' : ''}`}
          {...registration}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          aria-label={show ? 'Hide value' : 'Show value'}
        >
          {show ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>
      {error && <p className="text-[10px] text-[#F43F5E] mt-1">{error}</p>}
    </div>
  );
}

/* ─── Credential fields by authType ─────────────────────────────── */

function CredentialFields({
  authType,
  form,
}: {
  authType: ApiAuthType;
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  const { register, formState: { errors } } = form;

  if (authType === 'Bearer') {
    return (
      <div>
        <label htmlFor="f-token" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
          Token
        </label>
        <SecretInput
          id="f-token"
          placeholder="eyJhbGci..."
          error={errors.token?.message}
          registration={register('token')}
        />
      </div>
    );
  }

  if (authType === 'ApiKey') {
    return (
      <div className="space-y-3.5">
        <div>
          <label htmlFor="f-apiKey" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            API Key
          </label>
          <SecretInput
            id="f-apiKey"
            placeholder="sk-..."
            error={errors.apiKey?.message}
            registration={register('apiKey')}
          />
        </div>
        <div>
          <label htmlFor="f-headerName" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            Header name <span className="text-text-muted font-normal normal-case tracking-normal">(optional, default X-API-Key)</span>
          </label>
          <input
            id="f-headerName"
            className="form-input"
            placeholder="X-API-Key"
            autoComplete="off"
            {...register('headerName')}
          />
        </div>
      </div>
    );
  }

  if (authType === 'Basic') {
    return (
      <div className="space-y-3.5">
        <div>
          <label htmlFor="f-username" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            Username
          </label>
          <input
            id="f-username"
            className={`form-input ${errors.username ? '!border-[rgba(244,63,94,0.6)]' : ''}`}
            placeholder="username"
            autoComplete="off"
            {...register('username')}
          />
          {errors.username && <p className="text-[10px] text-[#F43F5E] mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <label htmlFor="f-password" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            Password
          </label>
          <SecretInput
            id="f-password"
            placeholder="••••••••"
            error={errors.password?.message}
            registration={register('password')}
          />
        </div>
      </div>
    );
  }

  // OAuth2
  return (
    <div className="space-y-3.5">
      <div>
        <label htmlFor="f-accessToken" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
          Access token
        </label>
        <SecretInput
          id="f-accessToken"
          placeholder="ya29...."
          error={errors.accessToken?.message}
          registration={register('accessToken')}
        />
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed bg-glass-1 rounded-[10px] px-3.5 py-3 border border-border-subtle">
        OAuth2 token-exchange and refresh aren't supported yet — paste a pre-obtained access token.
        You'll need to update it before it expires.
      </p>
    </div>
  );
}

/* ─── Configure / Edit modal ────────────────────────────────────── */

function CredentialsModal({
  mode,
  onClose,
}: {
  mode: 'configure' | 'edit';
  onClose: () => void;
}) {
  const save = useSetApiCredentials();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      baseUrl: '',
      authType: 'Bearer',
      token: '',
      apiKey: '',
      headerName: '',
      username: '',
      password: '',
      accessToken: '',
    },
  });

  const authType = form.watch('authType') as ApiAuthType;

  // Clear credential field errors when authType changes
  useEffect(() => {
    form.clearErrors(['token', 'apiKey', 'headerName', 'username', 'password', 'accessToken']);
  }, [authType, form]);

  const onSubmit = async (data: FormValues) => {
    // Build credentials object based on authType — never include other fields
    let credentials: Record<string, string> = {};
    if (data.authType === 'Bearer') credentials = { token: data.token!.trim() };
    if (data.authType === 'ApiKey') {
      credentials = { apiKey: data.apiKey!.trim() };
      const h = data.headerName?.trim();
      if (h) credentials.headerName = h;
    }
    if (data.authType === 'Basic') {
      credentials = { username: data.username!.trim(), password: data.password!.trim() };
    }
    if (data.authType === 'OAuth2') credentials = { accessToken: data.accessToken!.trim() };

    try {
      await save.mutateAsync({
        baseUrl: data.baseUrl.replace(/\/$/, ''),
        authType: data.authType,
        credentials,
      });
      // Clear credential values before closing — never persist them
      form.reset();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong.';
      const field = BACKEND_FIELD_MAP[msg];
      if (field) {
        form.setError(field, { message: msg });
      } else if (msg.startsWith('Unsupported authType')) {
        toast.error(msg);
      } else {
        form.setError('root', { message: msg });
      }
    }
  };

  const AUTH_TYPES: { value: ApiAuthType; label: string }[] = [
    { value: 'Bearer', label: 'Bearer Token' },
    { value: 'ApiKey', label: 'API Key' },
    { value: 'Basic', label: 'Basic Auth' },
    { value: 'OAuth2', label: 'OAuth2' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 overflow-hidden flex flex-col"
        style={{
          background: '#0A0F0D',
          border: '1px solid #1E2E26',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-brand-soft border border-border-glow flex items-center justify-center">
              <Plug className="w-3.5 h-3.5 text-brand" strokeWidth={1.6} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">
              {mode === 'configure' ? 'Configure external API' : 'Update credentials'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={save.isPending}
            className="w-8 h-8 flex items-center justify-center rounded-[9px] text-text-muted hover:text-text-primary hover:bg-glass-2 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.6} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">
            {form.formState.errors.root && (
              <div className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.25)] text-[11px] text-[#F43F5E]">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Connection */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-text-muted mb-3">Connection</p>
              <label htmlFor="f-baseUrl" className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                API base URL
              </label>
              <input
                id="f-baseUrl"
                className={`form-input ${form.formState.errors.baseUrl ? '!border-[rgba(244,63,94,0.6)]' : ''}`}
                placeholder="https://api.example.com/v1"
                autoComplete="off"
                {...form.register('baseUrl')}
              />
              {form.formState.errors.baseUrl && (
                <p className="text-[10px] text-[#F43F5E] mt-1">{form.formState.errors.baseUrl.message}</p>
              )}
            </div>

            {/* Authentication */}
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-text-muted mb-3">Authentication</p>
              <fieldset>
                <legend className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">
                  Auth type
                </legend>
                <div className="grid grid-cols-2 gap-1.5">
                  {AUTH_TYPES.map((opt) => {
                    const checked = authType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer transition-colors text-xs ' +
                          (checked
                            ? 'bg-brand-soft border border-[rgba(0,255,136,0.15)] text-text-primary font-semibold'
                            : 'bg-bg-input border border-border-subtle text-text-secondary hover:bg-glass-2 hover:border-border-medium')
                        }
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          checked={checked}
                          onChange={() => form.setValue('authType', opt.value, { shouldValidate: false })}
                          className="sr-only"
                        />
                        <span
                          className={
                            'w-3 h-3 rounded-full border shrink-0 flex items-center justify-center ' +
                            (checked ? 'border-brand bg-brand' : 'border-border-medium')
                          }
                        >
                          {checked && <span className="w-1.5 h-1.5 rounded-full bg-bg" />}
                        </span>
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* Credentials */}
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-text-muted mb-3">Credentials</p>
              {mode === 'edit' && (
                <p className="text-[11px] text-text-muted mb-3.5">
                  Re-enter credentials — previous values are not shown for security.
                </p>
              )}
              <CredentialFields authType={authType} form={form} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              className="px-4 py-2 rounded-[10px] border border-border-subtle text-xs font-medium text-text-secondary hover:border-glass-3 hover:text-text-primary transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-xs font-semibold bg-brand text-bg hover:bg-brand-light disabled:opacity-40 transition-all"
            >
              {save.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === 'configure' ? 'Save credentials' : 'Update credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Disconnect confirm dialog ─────────────────────────────────── */

function DisconnectDialog({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div
        className="relative w-full max-w-sm mx-4"
        style={{
          background: '#0A0F0D',
          border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="px-6 py-5">
          <h2 className="text-sm font-bold text-text-primary mb-2">Disconnect external API?</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            This will remove stored credentials. Flows that depend on this API will start failing until you reconfigure.
          </p>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-[10px] border border-border-subtle text-xs font-medium text-text-secondary hover:border-glass-3 hover:text-text-primary transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(244,63,94,0.15)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)' }}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main card ─────────────────────────────────────────────────── */

export function ApiCredentialsCard() {
  const { data: creds, isPending: loading } = useApiCredentials();
  const deleteApi = useDeleteApiCredentials();
  const { hasRole } = useAuth();

  const [modal, setModal] = useState<'configure' | 'edit' | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const canEdit = hasRole(UserRole.Owner) || hasRole(UserRole.Admin);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDisconnect = () => {
    deleteApi.mutate(undefined, { onSuccess: () => setDisconnectOpen(false) });
  };

  if (loading) {
    return (
      <div className="rounded-[14px] border border-border-medium bg-bg-shell p-5 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-glass-1 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-36 bg-glass-1 rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-glass-1 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const configured = creds?.configured ?? false;
  const health = creds?.healthStatus ?? null;

  return (
    <>
      <div className="rounded-[14px] border border-border-medium bg-bg-shell p-5 mb-3.5 transition-colors hover:border-glass-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,217,126,0.06)] border border-border-subtle flex items-center justify-center shrink-0">
              <Plug className="w-4 h-4 text-brand" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary leading-tight">External API connection</div>
              {configured && creds?.baseUrl ? (
                <div className="text-xs text-text-secondary mt-0.5 truncate max-w-[280px]">{creds.baseUrl}</div>
              ) : (
                <div className="text-xs text-text-muted mt-0.5">Not configured</div>
              )}
            </div>
          </div>

          {/* Health pill */}
          {configured && health && creds?.lastHealthCheckAt && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[6px] shrink-0 ${HEALTH_STYLES[health] ?? HEALTH_STYLES.Unknown}`}>
              {health}
            </span>
          )}
        </div>

        {/* Sub-line (auth type + last check) */}
        {configured && creds?.authType && (
          <div className="text-[11px] text-text-muted mt-1.5 ml-12">
            Auth: {AUTH_LABELS[creds.authType]}
            {creds.lastHealthCheckAt && (
              <> · last checked {relativeTime(creds.lastHealthCheckAt)}</>
            )}
          </div>
        )}

        {/* Empty state description */}
        {!configured && (
          <p className="text-xs text-text-muted leading-relaxed mt-3 ml-12">
            OmniFlow will call your business's API once flows include api-call steps. Add the URL and auth
            credentials so we can reach it on your behalf.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          {!configured ? (
            canEdit && (
              <button
                type="button"
                onClick={() => setModal('configure')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-semibold bg-brand text-bg hover:bg-brand-light transition-all"
              >
                + Configure API
              </button>
            )
          ) : (
            <>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setModal('edit')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-border-subtle text-xs font-medium text-text-secondary hover:border-glass-3 hover:text-text-primary transition-all"
                >
                  <Edit2 className="w-3 h-3" strokeWidth={1.5} />
                  Edit
                </button>
              )}

              {/* Test connection — disabled, coming soon */}
              <div className="relative group">
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-border-subtle text-xs font-medium text-text-muted opacity-50 cursor-not-allowed"
                >
                  Test connection
                </button>
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block">
                  <div className="bg-bg-elevated border border-border-medium rounded-[8px] px-2.5 py-1.5 text-[10px] text-text-secondary whitespace-nowrap">
                    Coming soon
                  </div>
                </div>
              </div>

              {/* ⋯ menu */}
              {canEdit && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="w-8 h-8 flex items-center justify-center rounded-[9px] border border-border-subtle text-text-muted hover:text-text-primary hover:bg-glass-2 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-40 rounded-[10px] overflow-hidden z-20"
                      style={{ background: '#0D1410', border: '1px solid #1E2E26', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                    >
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setDisconnectOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#F43F5E] hover:bg-[rgba(244,63,94,0.06)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modal && <CredentialsModal mode={modal} onClose={() => setModal(null)} />}
      {disconnectOpen && (
        <DisconnectDialog
          onClose={() => setDisconnectOpen(false)}
          onConfirm={handleDisconnect}
          isPending={deleteApi.isPending}
        />
      )}
    </>
  );
}
