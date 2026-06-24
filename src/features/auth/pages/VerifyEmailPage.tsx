import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import axios from 'axios';
import { authApi } from '../api/auth.api';
import { useResendVerification } from '../api/auth.queries';

type Status = 'verifying' | 'success' | 'error';

export function Component() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const resend = useResendVerification();

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setErrorMsg('Invalid verification link. Missing token or email.');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const result = await authApi.verifyEmail({ token, email });
        if (cancelled) return;
        if (result.message) {
          setMessage(result.message);
        }
        setStatus('success');
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus('error');
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          setErrorMsg(err.response.data.message);
        } else if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Verification failed. The link may have expired or is invalid.');
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, email]);

  return (
    <div className="space-y-8 text-center">
      {status === 'verifying' && (
        <>
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-brand animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Verifying your email...</h1>
          <p className="text-base text-text-secondary">Please wait while we confirm your address.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{message || 'Email verified!'}</h1>
          <p className="text-base text-text-secondary">Your account is now active. You can sign in.</p>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white text-base font-bold hover:brightness-110 transition-all"
          >
            Go to sign in
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-danger-soft flex items-center justify-center">
              <XCircle className="w-8 h-8 text-danger" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Verification failed</h1>
          <p className="text-base text-text-secondary">{errorMsg}</p>

          {email && (
            <button
              onClick={() => resend.mutate({ email })}
              disabled={resend.isPending || resend.isSuccess}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-glass-2 border border-border-medium text-base font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-3 disabled:opacity-40 transition-all"
            >
              <Mail className="w-5 h-5" />
              {resend.isPending
                ? 'Sending...'
                : resend.isSuccess
                  ? 'Email sent!'
                  : 'Resend verification email'}
            </button>
          )}

          <div className="pt-2">
            <Link
              to="/auth/login"
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
