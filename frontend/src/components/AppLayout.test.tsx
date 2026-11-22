import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/render';

describe('AppLayout', () => {
  it('redirects / to the employees page', async () => {
    const { router } = renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/employees');
  });

  it('navigates between sections', async () => {
    const { user } = renderApp({ route: '/employees' });

    await user.click(screen.getByRole('link', { name: /pay insights/i }));

    expect(await screen.findByRole('heading', { name: 'Pay insights' })).toBeInTheDocument();
  });
});
