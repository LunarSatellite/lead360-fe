import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { queryClient } from '@/shared/config/query-client';
import { router } from '@/app/router/routes';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#111916',
            border: '1px solid #1E2E26',
            color: '#EEDCB5',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '14px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,217,126,0.04)',
            padding: '14px 18px',
          },
          classNames: {
            success: 'toast-success',
            error: 'toast-error',
            warning: 'toast-warning',
            info: 'toast-info',
          },
        }}
      />
    </QueryClientProvider>
  );
}
