import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { PortalMeDto } from '../types/portal.types';
import { Loader2, Mail, Zap, ArrowRight } from 'lucide-react';
import { usePortalRequestLink, usePortalExchange } from '../api/portal.queries';
import { persistPortalTokens } from '../hooks/usePortalAuth';

export function Component() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const tenantId = searchParams.get('tenantId') ?? searchParams.get('tenant');

  if (token && tenantId) {
    return <ExchangeFlow tenantId={tenantId} token={token} />;
  }

  if (!tenantId) {
    return (
      <AuthShell>
        <div className="text-center">
          <p className="text-sm text-text-secondary mb-1">Invalid portal link</p>
          <p className="text-xs text-text-muted">Please use the link provided by your service provider.</p>
        </div>
      </AuthShell>
    );
  }

  return <LoginForm tenantId={tenantId} />;
}

function ExchangeFlow({ tenantId, token }: { tenantId: string; token: string }) {
  const navigate = useNavigate();
  const exchange = usePortalExchange();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exchange.isPending || exchange.isSuccess) return;

    exchange.mutate(
      { tenantId, token },
      {
        onSuccess: (result) => {
          const r = result as unknown as Record<string, unknown>;
          persistPortalTokens(
            {
              accessToken: (r.accessToken ?? r.AccessToken) as string,
              refreshToken: (r.refreshToken ?? r.RefreshToken) as string,
              expiresInMinutes: (r.expiresInMinutes ?? r.ExpiresInMinutes) as number,
              me: (r.me ?? r.Me) as PortalMeDto,
            },
            tenantId,
          );
          navigate('/portal/cases', { replace: true });
        },
        onError: () => setError('This link has expired or already been used.'),
      },
    );
  }, []);

  if (error) {
    return (
      <AuthShell>
        <div className="text-center">
          <p className="text-sm text-danger-400 mb-3">{error}</p>
          <a
            href={`/portal/auth?tenant=${tenantId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-brand text-bg font-bold hover:bg-brand-light transition-all text-xs"
          >
            Request new link
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
        <p className="text-xs text-text-muted font-medium">Signing you in...</p>
      </div>
    </AuthShell>
  );
}

function LoginForm({ tenantId }: { tenantId: string }) {
  const [email, setEmail] = useState('');
  const requestLink = usePortalRequestLink();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    requestLink.mutate({ tenantId, email: email.trim() });
  }

  if (requestLink.isSuccess) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-card bg-brand-soft border-thin border-border-glow flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand" strokeWidth={1.6} />
          </div>
          <h2 className="text-base font-extrabold text-text-primary mb-1">Check your email</h2>
          <p className="text-xs text-text-secondary">
            We sent a sign-in link to <span className="font-semibold text-text-primary">{email}</span>
          </p>
          <p className="text-xs text-text-muted mt-3">The link expires in 15 minutes.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center mb-6">
        <h2 className="text-lg font-extrabold text-text-primary mb-1">Sign in to your portal</h2>
        <p className="text-xs text-text-secondary">Enter your email to receive a magic sign-in link</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={requestLink.isPending || !email.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sm bg-brand text-bg font-bold hover:bg-brand-light transition-all disabled:opacity-30 text-sm"
        >
          {requestLink.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Send magic link
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl bg-brand/10" />
      <div className="pointer-events-none absolute top-20 right-0 w-80 h-80 rounded-full blur-3xl bg-[#00FFAA]/5" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div
            className="w-10 h-10 rounded-sm flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
          >
            <Zap className="w-5 h-5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
          </div>
        </div>
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
