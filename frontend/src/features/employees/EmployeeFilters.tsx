import { Autocomplete, Button, MenuItem, Stack, TextField } from '@mui/material';
import type { EmployeeListParams, Meta } from '../../api/types';
import { SearchField } from './SearchField';

interface EmployeeFiltersProps {
  params: EmployeeListParams;
  meta: Meta | undefined;
  onChange: (changes: Partial<EmployeeListParams>) => void;
  onClear: () => void;
  hasFilters: boolean;
}

export function EmployeeFilters({
  params,
  meta,
  onChange,
  onClear,
  hasFilters,
}: EmployeeFiltersProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <SearchField value={params.search ?? ''} onSearch={(search) => onChange({ search })} />
      <TextField
        select
        label="Country"
        value={params.country ?? ''}
        onChange={(e) => onChange({ country: e.target.value || undefined })}
        size="small"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">All countries</MenuItem>
        {meta?.countries.map((c) => (
          <MenuItem key={c.code} value={c.code}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
      <Autocomplete
        options={meta?.departments ?? []}
        value={params.department ?? null}
        onChange={(_e, value) => onChange({ department: value ?? undefined })}
        renderInput={(props) => <TextField {...props} label="Department" size="small" />}
        sx={{ minWidth: 200 }}
      />
      <Autocomplete
        options={meta?.jobTitles ?? []}
        value={params.jobTitle ?? null}
        onChange={(_e, value) => onChange({ jobTitle: value ?? undefined })}
        renderInput={(props) => <TextField {...props} label="Job title" size="small" />}
        sx={{ minWidth: 240 }}
      />
      {hasFilters && (
        <Button onClick={onClear} sx={{ whiteSpace: 'nowrap' }}>
          Clear filters
        </Button>
      )}
    </Stack>
  );
}
