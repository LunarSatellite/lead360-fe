import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';
import { getApiError } from '@/shared/lib/get-api-error';

/**
 * Route-level error element. React Router renders this when a route's loader/lazy import
 * or render throws — e.g. a chunk that fails to load or a page that crashes on mount.
 * Keeps the app shell alive and offers recovery instead of a blank screen.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let message = 'This page failed to load.';
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else {
    message = getApiError(error, message).message;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-card bg-glass-2">
        <AlertTriangle size={20} strokeWidth={1.6} className="text-warning" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-800 text-text-primary">Something went wrong</p>
        <p className="max-w-md text-xs text-text-muted">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(0)}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-2 text-xs font-700 text-bg hover:bg-brand-light"
        >
          <RotateCw size={13} strokeWidth={1.6} />
          Reload
        </button>
        <button
          onClick={() => navigate('/dashboard/home')}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3.5 py-2 text-xs font-600 text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <Home size={13} strokeWidth={1.6} />
          Home
        </button>
      </div>
    </div>
  );
}
