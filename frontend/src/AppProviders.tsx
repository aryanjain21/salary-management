import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { NotificationProvider } from './components/NotificationProvider';
import { theme } from './theme';

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/** Providers shared by the real app and component tests. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>{children}</NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
