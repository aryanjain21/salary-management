import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { PageLoader } from './components/PageLoader';

/**
 * Pages are lazy-loaded: the directory ships the data grid and the
 * dashboard ships the charting library, so neither pays for the other.
 */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    HydrateFallback: PageLoader,
    children: [
      { index: true, element: <Navigate to="/employees" replace /> },
      {
        path: 'employees',
        lazy: async () => ({
          Component: (await import('./features/employees/EmployeesPage')).EmployeesPage,
        }),
      },
      {
        path: 'insights',
        lazy: async () => ({
          Component: (await import('./features/insights/InsightsPage')).InsightsPage,
        }),
      },
      { path: '*', element: <Navigate to="/employees" replace /> },
    ],
  },
];
