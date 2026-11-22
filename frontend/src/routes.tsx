import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { EmployeesPage } from './features/employees/EmployeesPage';
import { InsightsPage } from './features/insights/InsightsPage';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/employees" replace /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: '*', element: <Navigate to="/employees" replace /> },
    ],
  },
];
