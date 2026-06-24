import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../types/auth.schemas';
import { useForgotPassword } from '../api/auth.queries';

export function Component() {
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = (data: ForgotPasswordFormData) => forgot.mutate(data);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Forgot password</h1>
        <p className="text-base text-text-secondary mt-2">Enter your email and we'll send a reset link</p>
      </div>

      {forgot.isSuccess ? (
        <div className="px-5 py-6 rounded-xl bg-success-soft border border-border-success text-center">
          <Mail className="w-10 h-10 text-success mx-auto mb-3" />
          <p className="text-base font-semibold text-text-primary mb-1">Check your inbox</p>
          <p className="text-sm text-text-secondary">If the email exists, a password reset link has been sent.</p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Email address</label>
            <input {...form.register('email')} type="email" placeholder="you@company.com" autoComplete="email"
              className="w-full px-4 py-3 rounded-lg bg-glass-2 border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all" />
            {form.formState.errors.email && <p className="text-xs text-danger mt-1.5">{form.formState.errors.email.message}</p>}
          </div>
          <button type="submit" disabled={forgot.isPending}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white text-base font-bold hover:brightness-110 disabled:opacity-50 transition-all">
            {forgot.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-5 h-5" />}
            {forgot.isPending ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}

      <div className="text-center">
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
