import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { POST_AUTH_LANDING } from './route-paths';
import { RedirectIfAuth } from './guards';
import { routeObjects } from './route-table';

/** A token the guard will accept: a real JWT shape with an exp far ahead. */
function liveToken(): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + 60 * 60 };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function WhereAmI() {
  const location = useLocation();
  return <span data-testid="landed">{location.pathname}</span>;
}

/** Renders `node` at /auth/login and reports the path it settles on. */
function landingFor(node: React.ReactNode) {
  render(
    <MemoryRouter initialEntries={['/auth/login']}>
      <Routes>
        <Route path="/auth/login" element={node} />
        <Route path="*" element={<WhereAmI />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getByTestId('landed').textContent;
}

afterEach(() => localStorage.clear());

describe('a logged-in operator lands in one place, whichever door they came through', () => {
  it('sends an authenticated visitor on an /auth/* URL to the landing surface', () => {
    localStorage.setItem('omniflow_token', liveToken());
    expect(landingFor(<RedirectIfAuth>{<span>login form</span>}</RedirectIfAuth>)).toBe(
      POST_AUTH_LANDING,
    );
  });

  it('still shows the auth page when there is no token', () => {
    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <RedirectIfAuth>
          <span>login form</span>
        </RedirectIfAuth>
      </MemoryRouter>,
    );
    expect(screen.getByText('login form')).toBeInTheDocument();
  });

  it('sends an authenticated visitor on "/" to the same landing surface', async () => {
    localStorage.setItem('omniflow_token', liveToken());
    const root = routeObjects.find((r) => r.path === '/');
    expect(root?.lazy).toBeTypeOf('function');

    const resolved = (await root!.lazy!()) as { Component?: React.ComponentType };
    expect(resolved.Component).toBeTypeOf('function');

    const Landing = resolved.Component!;
    expect(landingFor(<Landing />)).toBe(POST_AUTH_LANDING);
  });

  it('sends the /dashboard index to the same landing surface', () => {
    const dashboard = routeObjects.find((r) => r.path === '/dashboard');
    const index = dashboard?.children?.find((c: RouteObject) => c.index);
    expect(index).toBeDefined();

    render(
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route path="/start" element={index!.element} />
          <Route path="*" element={<WhereAmI />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('landed').textContent).toBe(POST_AUTH_LANDING);
  });

  it('does not land on CRM analytics, which the cutover creates empty', () => {
    // The guard used to send anyone arriving via /auth/* here. The omniflow
    // database starts empty, so the page opens as a wall of zeroes and has no
    // empty state to explain them.
    expect(POST_AUTH_LANDING).not.toBe('/dashboard/crm/analytics');
  });
});
