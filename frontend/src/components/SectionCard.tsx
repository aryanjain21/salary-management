import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, actions, children }: SectionCardProps) {
  const headingId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <Card component="section" aria-labelledby={headingId}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography id={headingId} variant="h6" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
