import InsightsIcon from '@mui/icons-material/InsightsOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { NavLink, Outlet } from 'react-router';

const NAV_ITEMS = [
  { to: '/employees', label: 'Employees', icon: <PeopleIcon /> },
  { to: '/insights', label: 'Pay insights', icon: <InsightsIcon /> },
];

export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 3 }}>
          <Typography variant="h6" component="span" sx={{ color: 'primary.main' }}>
            ACME Salary Manager
          </Typography>
          <Box component="nav" aria-label="Main" sx={{ display: 'flex', gap: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                startIcon={item.icon}
                color="inherit"
                sx={{ '&.active': { color: 'primary.main', bgcolor: 'action.selected' } }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" component="main" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
