import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '../types/auth.schemas';
import { useResetPassword } from '../api/auth.queries';

export function Component() {
  const [params] = useSearchParams();
  const reset = useResetPassword();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.get('token') || '', email: params.get('email') || '', newPassword: '' },
  });

  const pw = form.watch('newPassword');
  const pwChecks = [
    { label: '8+ characters', pass: pw.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(pw) },
    { label: 'Lowercase', pass: /[a-z]/.test(pw) },
    { label: 'Digit', pass: /[0-9]/.test(pw) },
  ];

  const onSubmit = (data: ResetPasswordFormData) => reset.mutate(data);

  if (reset.isSuccess) {
    return (
      <div className="space-y-8 text-center">
        <div className="px-5 py-6 rounded-xl bg-success-soft border border-border-success">
          <Check className="w-10 h-10 text-success mx-auto mb-3" strokeWidth={2.5} />
          <p className="text-base font-semibold text-text-primary mb-1">Password reset</p>
          <p className="text-sm text-text-secondary">You can now sign in with your new password.</p>
        </div>
        <Link to="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white text-base font-bold hover:brightness-110 transition-all">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Reset password</h1>
        <p className="text-base text-text-secondary mt-2">Choose a new password for your account</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">New password</label>
          <div className="relative">
            <input {...form.register('newPassword')} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" autoComplete="new-password"
              className="w-full px-4 py-3 pr-12 rounded-lg bg-glass-2 border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {pw.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {pwChecks.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  {c.pass ? <Check className="w-4 h-4 text-success" strokeWidth={3} /> : <X className="w-4 h-4 text-text-muted" strokeWidth={2} />}
                  <span className={`text-xs ${c.pass ? 'text-success' : 'text-text-muted'}`}>{c.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {reset.isError && <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">{reset.error?.message || 'Reset failed.'}</div>}
        <button type="submit" disabled={reset.isPending}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white text-base font-bold hover:brightness-110 disabled:opacity-50 transition-all">
          {reset.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-5 h-5" />}
          {reset.isPending ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
