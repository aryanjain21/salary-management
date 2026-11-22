import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { toApiError } from '../../api/client';
import type { EmployeeDetail } from '../../api/types';
import { useDeleteEmployee } from '../../hooks/useEmployees';

interface DeleteEmployeeDialogProps {
  employee: EmployeeDetail;
  onClose: () => void;
  onDeleted: (employee: EmployeeDetail) => void;
}

export function DeleteEmployeeDialog({ employee, onClose, onDeleted }: DeleteEmployeeDialogProps) {
  const deleteEmployee = useDeleteEmployee();

  const confirm = () => {
    deleteEmployee.mutate(employee.id, { onSuccess: () => onDeleted(employee) });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete {employee.fullName}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This permanently removes {employee.fullName} ({employee.employeeCode}) and their salary
          history. This cannot be undone.
        </DialogContentText>
        {deleteEmployee.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {toApiError(deleteEmployee.error).message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={confirm}
          loading={deleteEmployee.isPending}
        >
          Delete employee
        </Button>
      </DialogActions>
    </Dialog>
  );
}
