import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, UserPlus, Check, X, Loader2, XCircle, Users } from 'lucide-react';
import { useValidateInvitation, useAcceptInvitation } from '../api/team.queries';
import { acceptInvitationSchema, type AcceptInvitationFormData } from '../types/team.schemas';
import { USER_ROLE_LABEL } from '@/features/auth/types/auth.types';
import type { UserRoleValue } from '@/features/auth/types/auth.types';
import type { TeamInvitationDto } from '../types/team.types';

export function Component() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useValidateInvitation(token, email);
  const invitation = data as unknown as TeamInvitationDto | undefined;

  if (!token || !email) {
    return <ErrorState message="Invalid invitation link. Missing token or email." />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 text-center">
        <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto" />
        <h1 className="text-2xl font-extrabold text-text-primary">Validating invitation...</h1>
      </div>
    );
  }

  if (isError || !invitation) {
    return <ErrorState message={(error as any)?.message || 'This invitation is invalid or has expired.'} />;
  }

  return <AcceptForm invitation={invitation} token={token} email={email} />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-danger-soft flex items-center justify-center mx-auto">
        <XCircle className="w-8 h-8 text-danger" />
      </div>
      <h1 className="text-2xl font-extrabold text-text-primary">Invitation invalid</h1>
      <p className="text-base text-text-secondary">{message}</p>
      <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-brand font-semibold">
        Go to sign in
      </Link>
    </div>
  );
}

function AcceptForm({ invitation, token, email }: { invitation: TeamInvitationDto; token: string; email: string }) {
  const navigate = useNavigate();
  const accept = useAcceptInvitation();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { token, email, firstName: '', lastName: '', password: '', phone: '' },
    mode: 'onChange',
  });

  const pw = form.watch('password');
  const pwChecks = [
    { label: '8+ chars', pass: pw.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(pw) },
    { label: 'Lowercase', pass: /[a-z]/.test(pw) },
    { label: 'Digit', pass: /[0-9]/.test(pw) },
  ];

  const onSubmit = (data: AcceptInvitationFormData) => {
    accept.mutate(
      { ...data, phone: data.phone || undefined } as any,
      { onSuccess: () => navigate('/dashboard/chat') },
    );
  };

  const input = "w-full px-4 py-3 rounded-lg bg-bg border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all";

  return (
    <div className="space-y-6">
      {/* Invitation info banner */}
      <div className="bg-brand-soft border border-brand rounded-xl p-5 text-center">
        <Users className="w-8 h-8 text-brand mx-auto mb-2" />
        <p className="text-base font-semibold text-text-primary">
          You've been invited to join <span className="text-brand">{invitation.tenantName}</span>
        </p>
        <p className="text-sm text-text-secondary mt-1">
          by {invitation.invitedByName} as <span className="font-bold text-brand">{USER_ROLE_LABEL[invitation.role as UserRoleValue]}</span>
        </p>
        {invitation.personalMessage && (
          <p className="text-sm text-text-muted mt-3 italic">"{invitation.personalMessage}"</p>
        )}
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Create your account</h1>
        <p className="text-sm text-text-secondary mt-1">Set up your account to join the team</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Email</label>
          <input value={email} disabled className="w-full px-4 py-3 rounded-lg bg-glass-1 border border-border-subtle text-base text-text-muted cursor-not-allowed" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">First name</label>
            <input {...form.register('firstName')} placeholder="John" className={input} />
            {form.formState.errors.firstName && <p className="text-xs text-danger mt-1.5">{form.formState.errors.firstName.message}</p>}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Last name</label>
            <input {...form.register('lastName')} placeholder="Doe" className={input} />
            {form.formState.errors.lastName && <p className="text-xs text-danger mt-1.5">{form.formState.errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Password</label>
          <div className="relative">
            <input {...form.register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" className={`${input} pr-12`} />
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

        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Phone <span className="opacity-40">(optional)</span></label>
          <input {...form.register('phone')} type="tel" placeholder="+254 712 345 678" className={input} />
        </div>

        {accept.isError && (
          <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
            {accept.error?.message || 'Failed to accept invitation.'}
          </div>
        )}

        <button type="submit" disabled={accept.isPending}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white text-base font-bold hover:brightness-110 disabled:opacity-50 transition-all">
          {accept.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-5 h-5" />}
          {accept.isPending ? 'Joining...' : 'Join team'}
        </button>
      </form>
    </div>
  );
}
