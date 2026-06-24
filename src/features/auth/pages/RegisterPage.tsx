import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '../types/auth.schemas';
import { useRegister } from '../api/auth.queries';
import { BusinessType } from '../types/auth.types';

export function Component() {
  const navigate = useNavigate();
  const register = useRegister();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' },
    mode: 'onChange',
  });

  const pw = form.watch('password');

  const pwChecks = [
    { label: '8+ characters', pass: pw.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(pw) },
    { label: 'Lowercase', pass: /[a-z]/.test(pw) },
    { label: 'Digit', pass: /[0-9]/.test(pw) },
  ];

  const onSubmit = ({ confirmPassword: _, ...data }: RegisterFormData) => {
    register.mutate(
      {
        ...data,
        businessName: 'My Business',
        businessType: BusinessType.Goods,
        industry: 'General',
        phone: data.phone || undefined,
      } as any,
      { onSuccess: () => navigate('/auth/login') },
    );
  };

  const inputCls =
    'w-full px-3.5 sm:px-4 py-3 rounded-xl bg-bg-input border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,217,126,0.1)] transition-all';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Create your account
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1.5 sm:mt-2">
          Create your account to get started
        </p>
      </div>

      {/* Google signup */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border-subtle bg-bg-card text-sm font-semibold text-text-primary hover:bg-bg-elevated transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">

        {/* First + Last name — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">First name</label>
            <input
              {...form.register('firstName')}
              placeholder="John"
              autoComplete="given-name"
              className={inputCls}
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-danger mt-1.5">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">Last name</label>
            <input
              {...form.register('lastName')}
              placeholder="Doe"
              autoComplete="family-name"
              className={inputCls}
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-danger mt-1.5">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">Email</label>
          <input
            {...form.register('email')}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            inputMode="email"
            className={inputCls}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-danger mt-1.5">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">Password</label>
          <div className="relative">
            <input
              {...form.register('password')}
              type={showPw ? 'text' : 'password'}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              className={`${inputCls} pr-12`}
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
          {pw.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2">
              {pwChecks.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  {c.pass ? (
                    <div className="w-4 h-4 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-brand" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-border-subtle flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-text-muted" strokeWidth={2} />
                    </div>
                  )}
                  <span className={`text-xs font-medium ${c.pass ? 'text-brand' : 'text-text-muted'}`}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">Confirm password</label>
          <div className="relative">
            <input
              {...form.register('confirmPassword')}
              type={showConfirmPw ? 'text' : 'password'}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
              aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
            >
              {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-danger mt-1.5">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-text-primary block mb-1.5 sm:mb-2">
            Phone <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            {...form.register('phone')}
            type="tel"
            placeholder="+254 712 345 678"
            autoComplete="tel"
            inputMode="tel"
            className={inputCls}
          />
        </div>

        {/* Error */}
        {register.isError && (
          <div className="px-3.5 sm:px-4 py-3 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
            {register.error?.message || 'Registration failed.'}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={register.isPending}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-bg text-base font-bold bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {register.isPending && (
            <span className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
          )}
          {register.isPending ? 'Creating...' : 'Create account'}
        </button>
      </form>

      {/* Terms */}
      <p className="text-center text-xs text-text-muted leading-relaxed px-2">
        By creating an account, you agree to the{' '}
        <span className="text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors">
          Terms
        </span>{' '}
        and{' '}
        <span className="text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors">
          Privacy Policy
        </span>
      </p>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-brand font-semibold hover:text-brand-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
