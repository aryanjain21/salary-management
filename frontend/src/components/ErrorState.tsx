import { Alert, Button } from '@mui/material';
import { toApiError } from '../api/client';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  const { message } = toApiError(error);
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      <strong>{title}.</strong> {message}
    </Alert>
  );
}
