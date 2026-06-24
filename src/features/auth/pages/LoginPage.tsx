import { useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../types/auth.schemas';
import { useLogin, useGoogleLogin } from '../api/auth.queries';

import { GoogleLogin } from '@react-oauth/google';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const [showPw, setShowPw] = useState(false);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // After login, go where the user was trying to reach, or straight to chat.
  // Three sources, in priority order:
  //   1. ?return=<path-with-query>   — from the approval email landing
  //      page (and any other public link that needs the user logged in).
  //      The whole target URL is URL-encoded into one param so nested
  //      ?token= and &decision= survive the round-trip.
  //   2. location.state.from.pathname — set by the RequireAuth guard
  //      when an authed-only route bounces an anonymous visitor here.
  //      Pathname only — guard doesn't preserve the query string.
  //   3. /dashboard/chat — the primary surface fallback.
  // Returned values are kept relative — we never honour an absolute
  // URL here (open-redirect protection: external return targets are
  // ignored).
  const returnParam = searchParams.get('return');
  const safeReturn =
    returnParam && returnParam.startsWith('/') && !returnParam.startsWith('//')
      ? returnParam
      : null;
  const from =
    safeReturn ||
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    '/dashboard/chat';

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data, { onSuccess: () => navigate(from, { replace: true }) });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Welcome back</h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1.5 sm:mt-2">Sign in to your workspace</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        {/* Email */}
        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">
            Email address
          </label>
          <input
            {...form.register('email')}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            inputMode="email"
            className="w-full px-3.5 sm:px-4 py-3 rounded-xl bg-bg-input border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,217,126,0.1)] transition-all"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-danger mt-1.5">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between mb-1.5 sm:mb-2">
            <label className="text-sm font-semibold text-text-primary">Password</label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-brand font-semibold hover:text-brand-light transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              {...form.register('password')}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••••"
              autoComplete="current-password"
              className="w-full px-3.5 sm:px-4 py-3 pr-12 rounded-xl bg-bg-input border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,217,126,0.1)] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-danger mt-1.5">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Error */}
        {login.isError && (
          <div className="px-3.5 sm:px-4 py-3 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
            {login.error?.message || 'Login failed.'}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-bg text-base font-bold bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {login.isPending ? (
            <span className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
          ) : null}
          {login.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      {/* Google */}
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const idToken = credentialResponse.credential;
            if (!idToken) return;
            googleLogin.mutate(
              { idToken },
              { onSuccess: () => navigate(from, { replace: true }) },
            );
          }}
          onError={() => {
            // GoogleLogin's onError fires for Google-side failures (popup blocked,
            // user cancelled, etc). The toast for backend failures is handled by
            // useGoogleLogin's onError.
          }}
          theme="filled_black"
          shape="pill"
          text="continue_with"
        />
      </div>

      <p className="text-center text-sm text-text-muted">
        No account?{' '}
        <Link
          to="/auth/register"
          className="text-brand font-semibold hover:text-brand-light transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
