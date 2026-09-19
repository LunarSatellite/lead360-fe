import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * Render a console page the way the router renders it.
 *
 * Retries are off so a mocked rejection surfaces on the first tick rather than
 * after react-query's backoff, and each test gets its own client so one test's
 * cache cannot answer another test's question.
 */
export function renderPage(ui: ReactElement, { path = '/', route = '/' } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}

/** Render a plain component that only needs a router. */
export function renderIsolated(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}
