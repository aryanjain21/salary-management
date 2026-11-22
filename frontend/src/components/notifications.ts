import { createContext, useContext } from 'react';

export type NotificationSeverity = 'success' | 'error' | 'info';

export type Notify = (message: string, severity?: NotificationSeverity) => void;

export const NotificationContext = createContext<Notify | null>(null);

export function useNotify(): Notify {
  const notify = useContext(NotificationContext);
  if (!notify) throw new Error('useNotify must be used inside <NotificationProvider>');
  return notify;
}
