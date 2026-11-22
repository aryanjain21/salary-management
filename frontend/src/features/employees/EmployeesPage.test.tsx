import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
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

  it('moves to the next page and shows its rows', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('/api/v1/meta', () => HttpResponse.json(META)),
      http.get('/api/v1/employees', ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        const pageNumber = Number(params.get('page'));
        return HttpResponse.json(
          page([makeEmployee({ firstName: `Page${pageNumber}`, lastName: 'Person' })], {
            page: pageNumber,
            total: 60,
            totalPages: 3,
          }),
        );
      }),
    );
    const { user, router } = renderApp({ route: '/employees' });
    await screen.findByText('Page1 Person');

    await user.click(screen.getByRole('button', { name: /next page/i }));

    expect(await screen.findByText('Page2 Person')).toBeInTheDocument();
    expect(screen.queryByText('Page1 Person')).not.toBeInTheDocument();
    expect(screen.getByText('26–50 of 60')).toBeInTheDocument();
    expect(router.state.location.search).toContain('page=2');
    expect(requests.at(-1)?.get('page')).toBe('2');
  });

  it('opens a deep-linked page without jumping back to page 1', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('/api/v1/meta', () => HttpResponse.json(META)),
      http.get('/api/v1/employees', ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json(
          page([makeEmployee({ firstName: 'Third' })], { page: 3, total: 60 }),
        );
      }),
    );
    const { router } = renderApp({ route: '/employees?page=3' });

    await screen.findByText('Third Sharma');
    expect(screen.getByText('51–60 of 60')).toBeInTheDocument();
    expect(router.state.location.search).toContain('page=3');
    expect(requests.every((r) => r.get('page') === '3')).toBe(true);
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

  it('never labels the previous total as the count for new filters', async () => {
    server.use(
      http.get('/api/v1/meta', () => HttpResponse.json(META)),
      http.get('/api/v1/employees', async ({ request }) => {
        if (new URL(request.url).searchParams.get('country') === 'IN') {
          await delay(150);
          return HttpResponse.json(page([makeEmployee()], { total: 2_539 }));
        }
        return HttpResponse.json(page([makeEmployee()], { total: 10_000 }));
      }),
    );
    const { user } = renderApp({ route: '/employees' });
    await screen.findByText('10,000 employees');

    await user.click(screen.getByLabelText('Country'));
    await user.click(within(screen.getByRole('listbox')).getByText('India'));

    expect(screen.getByText('Loading employees…')).toBeInTheDocument();
    expect(screen.queryByText('10,000 matching employees')).not.toBeInTheDocument();
    expect(await screen.findByText('2,539 matching employees')).toBeInTheDocument();
  });
});
