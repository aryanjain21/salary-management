import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Employee } from '../../api/types';
import { META, makeEmployee, page } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { server } from '../../test/server';

/** Mock the list endpoint and record the query string of every request. */
function mockEmployeeList(rows: Employee[], total = rows.length) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get('/api/v1/meta', () => HttpResponse.json(META)),
    http.get('/api/v1/employees', ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(page(rows, { total }));
    }),
  );
  return requests;
}

describe('EmployeesPage', () => {
  it('lists employees with local and USD salaries and the total count', async () => {
    mockEmployeeList(
      [
        makeEmployee({
          firstName: 'Priya',
          lastName: 'Sharma',
          salary: 2_400_000,
          salaryUsd: 28_743,
        }),
        makeEmployee({
          firstName: 'Alice',
          lastName: 'Brown',
          country: 'US',
          currency: 'USD',
          salary: 150_000,
          salaryUsd: 150_000,
        }),
      ],
      10_000,
    );

    renderApp({ route: '/employees' });

    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('₹2,400,000')).toBeInTheDocument();
    expect(screen.getByText('$28,743')).toBeInTheDocument();
    expect(screen.getByText('10,000 employees')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  it('debounces search and sends it to the API', async () => {
    const requests = mockEmployeeList([makeEmployee()]);
    const { user, router } = renderApp({ route: '/employees' });
    await screen.findByText('Priya Sharma');

    await user.type(screen.getByLabelText('Search'), 'sharma');

    await waitFor(() => expect(requests.at(-1)?.get('search')).toBe('sharma'));
    expect(router.state.location.search).toContain('search=sharma');
    // One request for the initial load, one for the settled search term
    expect(requests.filter((r) => r.has('search'))).toHaveLength(1);
  });

  it('filters by country and resets to the first page', async () => {
    const requests = mockEmployeeList([makeEmployee()], 200);
    const { user } = renderApp({ route: '/employees?page=3' });
    await screen.findByText('Priya Sharma');
    expect(requests.at(-1)?.get('page')).toBe('3');

    await user.click(screen.getByLabelText('Country'));
    await user.click(within(screen.getByRole('listbox')).getByText('India'));

    await waitFor(() => expect(requests.at(-1)?.get('country')).toBe('IN'));
    expect(requests.at(-1)?.get('page')).toBe('1');
  });

  it('restores filters from the URL', async () => {
    const requests = mockEmployeeList([makeEmployee()]);

    renderApp({ route: '/employees?country=IN&department=Engineering&search=priya' });

    await screen.findByText('Priya Sharma');
    expect(requests[0]?.get('country')).toBe('IN');
    expect(requests[0]?.get('department')).toBe('Engineering');
    expect(screen.getByLabelText('Search')).toHaveValue('priya');
    expect(screen.getByText('1 matching employee')).toBeInTheDocument();
  });

  it('shows an error with retry when the API fails', async () => {
    let attempts = 0;
    server.use(
      http.get('/api/v1/meta', () => HttpResponse.json(META)),
      http.get('/api/v1/employees', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
              { status: 500 },
            )
          : HttpResponse.json(page([makeEmployee()]));
      }),
    );
    const { user } = renderApp({ route: '/employees' });

    expect(await screen.findByText(/could not load employees/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    mockEmployeeList([]);

    renderApp({ route: '/employees?search=nobody' });

    expect(await screen.findByText('No employees match these filters')).toBeInTheDocument();
  });

  it('clears all filters, including the search box', async () => {
    const requests = mockEmployeeList([makeEmployee()]);
    const { user, router } = renderApp({ route: '/employees?search=priya&country=IN' });
    await screen.findByText('Priya Sharma');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(requests.at(-1)?.has('country')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});
