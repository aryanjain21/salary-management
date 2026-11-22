import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { useState } from 'react';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

interface SearchFieldProps {
  /** Current committed search (from the URL). */
  value: string;
  /** Called with the settled input after the user stops typing. */
  onSearch: (value: string) => void;
}

/**
 * Typing is local and debounced; only settled input is committed. If the
 * committed value changes from outside (e.g. "Clear filters"), the box
 * follows it — but our own commits never overwrite text still being typed.
 */
export function SearchField({ value, onSearch }: SearchFieldProps) {
  const [text, setText] = useState(value);
  const [committed, setCommitted] = useState(value);

  if (value !== committed) {
    setCommitted(value);
    setText(value);
  }

  const commit = useDebouncedCallback((next: string) => {
    setCommitted(next);
    onSearch(next);
  }, 300);

  return (
    <TextField
      label="Search"
      placeholder="Name, email or employee code"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        commit(e.target.value.trim());
      }}
      size="small"
      sx={{ minWidth: 280, flex: 1 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
