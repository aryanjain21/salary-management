import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router';
import { AppProviders } from '../AppProviders';
import { routes as appRoutes } from '../routes';

interface RenderOptions {
  /** Initial URL, e.g. "/employees?country=IN" */
  route?: string;
  routes?: RouteObject[];
}

/** Render the real route tree (or custom routes) with fresh providers. */
export function renderApp({ route = '/', routes = appRoutes }: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const user = userEvent.setup();

  const utils = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { ...utils, user, router, queryClient };
}
