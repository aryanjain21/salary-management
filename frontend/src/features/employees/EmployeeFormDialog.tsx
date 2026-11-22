import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { ApiError } from '../../api/client';
import type { EmployeeDetail, Meta } from '../../api/types';
import { useCreateEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { employmentTypeLabel } from '../../utils/format';
import {
  employeeFormSchema,
  toCreateInput,
  toFormValues,
  toUpdateInput,
  type EmployeeFormOutput,
  type EmployeeFormValues,
} from './employeeForm';

interface EmployeeFormDialogProps {
  /** Omit to create a new employee. */
  employee?: EmployeeDetail;
  meta: Meta | undefined;
  onClose: () => void;
  onSaved: (employee: EmployeeDetail, mode: 'create' | 'edit') => void;
}

type FormControl = Control<EmployeeFormValues, unknown, EmployeeFormOutput>;
type TextFieldName = Exclude<keyof EmployeeFormValues, 'employmentType'>;

function FormTextField({
  control,
  name,
  ...props
}: { control: FormControl; name: TextFieldName } & React.ComponentProps<typeof TextField>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          inputRef={field.ref}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? props.helperText}
          fullWidth
        />
      )}
    />
  );
}

function SuggestField({
  control,
  name,
  label,
  options,
}: {
  control: FormControl;
  name: 'department' | 'jobTitle';
  label: string;
  options: string[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Autocomplete
          freeSolo
          options={options}
          inputValue={field.value}
          onInputChange={(_e, value) => field.onChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              inputRef={field.ref}
              onBlur={field.onBlur}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  );
}

export function EmployeeFormDialog({ employee, meta, onClose, onSaved }: EmployeeFormDialogProps) {
  const mode = employee ? 'edit' : 'create';
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  const { control, handleSubmit, setError, formState } = useForm<
    EmployeeFormValues,
    unknown,
    EmployeeFormOutput
  >({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: toFormValues(employee),
  });

  const countryCode = useWatch({ control, name: 'country' });
  const salaryText = useWatch({ control, name: 'salary' });
  const country = meta?.countries.find((c) => c.code === countryCode);
  const currencyChanged = Boolean(employee && country && country.currency !== employee.currency);
  const salaryEdited = Boolean(employee && salaryText.trim() !== String(employee.salary));
  const showReason = mode === 'edit' && (salaryEdited || currencyChanged);

  const onSubmit = async (values: EmployeeFormOutput) => {
    if (employee && currencyChanged && values.salary === employee.salary) {
      setError('salary', {
        message: `Enter the new salary in ${country?.currency} — moving to ${country?.name} changes the currency`,
      });
      return;
    }

    try {
      if (employee) {
        const changes = toUpdateInput(employee, values);
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        onSaved(await updateEmployee.mutateAsync({ id: employee.id, changes }), 'edit');
      } else {
        onSaved(await createEmployee.mutateAsync(toCreateInput(values)), 'create');
      }
    } catch (error) {
      applyServerErrors(error);
    }
  };

  function applyServerErrors(error: unknown) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === 'CONFLICT') {
      setError('email', { message: 'Another employee already uses this email' });
      return;
    }
    const fieldNames = Object.keys(toFormValues()) as (keyof EmployeeFormValues)[];
    const fieldErrors = error.details.filter((d) =>
      fieldNames.includes(d.path as keyof EmployeeFormValues),
    );
    for (const detail of fieldErrors) {
      setError(detail.path as keyof EmployeeFormValues, { message: detail.message });
    }
    if (fieldErrors.length === 0) setError('root', { message: error.message });
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        aria-label={mode === 'edit' ? 'Edit employee' : 'Add employee'}
      >
        <DialogTitle>{employee ? `Edit ${employee.fullName}` : 'Add employee'}</DialogTitle>
        <DialogContent dividers>
          {formState.errors.root && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formState.errors.root.message}
            </Alert>
          )}
          {currencyChanged && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Moving to {country?.name} changes the salary currency from {employee?.currency} to{' '}
              {country?.currency}. Enter the new salary in {country?.currency}.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="firstName" label="First name" autoFocus />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="lastName" label="Last name" />
            </Grid>
            <Grid size={12}>
              <FormTextField control={control} name="email" label="Work email" type="email" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SuggestField
                control={control}
                name="jobTitle"
                label="Job title"
                options={meta?.jobTitles ?? []}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SuggestField
                control={control}
                name="department"
                label="Department"
                options={meta?.departments ?? []}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="country" label="Country" select>
                {meta?.countries.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.name}
                  </MenuItem>
                )) ?? []}
              </FormTextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="employmentType"
                render={({ field }) => (
                  <TextField
                    {...field}
                    inputRef={field.ref}
                    select
                    label="Employment type"
                    fullWidth
                  >
                    {(meta?.employmentTypes ?? ['FULL_TIME', 'PART_TIME', 'CONTRACT']).map((t) => (
                      <MenuItem key={t} value={t}>
                        {employmentTypeLabel(t)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                control={control}
                name="salary"
                label="Annual base salary"
                helperText={
                  country ? `In ${country.currency}, whole amount` : 'Select a country first'
                }
                slotProps={{
                  htmlInput: { inputMode: 'numeric' },
                  input: {
                    startAdornment: country && (
                      <InputAdornment position="start">{country.currency}</InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                control={control}
                name="hireDate"
                label="Hire date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            {showReason && (
              <Grid size={12}>
                <FormTextField
                  control={control}
                  name="salaryChangeReason"
                  label="Reason for salary change (optional)"
                  placeholder="e.g. Annual review, promotion, relocation"
                  helperText="Saved in the employee's salary history"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" loading={formState.isSubmitting}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
