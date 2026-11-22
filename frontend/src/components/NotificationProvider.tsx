import { Alert, Snackbar } from '@mui/material';
import { useCallback, useState, type ReactNode } from 'react';
import { NotificationContext, type NotificationSeverity } from './notifications';

interface Notification {
  id: number;
  message: string;
  severity: NotificationSeverity;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Notification | null>(null);

  const notify = useCallback((message: string, severity: NotificationSeverity = 'success') => {
    setCurrent({ id: Date.now(), message, severity });
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        key={current?.id}
        open={current !== null}
        autoHideDuration={5000}
        onClose={(_e, reason) => reason !== 'clickaway' && setCurrent(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {current ? (
          <Alert
            severity={current.severity}
            variant="filled"
            onClose={() => setCurrent(null)}
            sx={{ width: '100%' }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
}
