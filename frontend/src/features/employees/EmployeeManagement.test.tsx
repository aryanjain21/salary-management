import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { EmployeeDetail } from '../../api/types';
import { META, makeEmployee, makeEmployeeDetail, page } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { server } from '../../test/server';

const priya = makeEmployeeDetail({
  id: 5,
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@acme.example',
  country: 'IN',
  currency: 'INR',
  salary: 2_400_000,
  salaryHistory: [
    {
      id: 1,
      oldSalary: 2_200_000,
      oldCurrency: 'INR',
      newSalary: 2_400_000,
      newCurrency: 'INR',
      reason: 'Annual review',
      changedAt: '2026-01-15T10:00:00.000Z',
    },
  ],
});

/** Mock reference data, the list, and the detail endpoint for `employee`. */
function mockDirectory(employee: EmployeeDetail = priya) {
  server.use(
    http.get('/api/v1/meta', () => HttpResponse.json(META)),
    http.get('/api/v1/employees', () => HttpResponse.json(page([makeEmployee({ id: 1 })]))),
    http.get('/api/v1/employees/:id', () => HttpResponse.json(employee)),
  );
}

async function chooseOption(user: UserEvent, field: HTMLElement, option: string) {
  await user.click(field);
  await user.click(within(screen.getByRole('listbox')).getByText(option));
}

async function openCreateDialog(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Add employee' }));
  return screen.findByRole('dialog');
}

async function fillCreateForm(user: UserEvent, dialog: HTMLElement) {
  const form = within(dialog);
  await user.type(form.getByLabelText('First name'), 'Asha');
  await user.type(form.getByLabelText('Last name'), 'Rao');
  await user.type(form.getByLabelText('Work email'), 'asha.rao@acme.example');
  await user.type(form.getByLabelText('Job title'), 'Data Scientist');
  await user.type(form.getByLabelText('Department'), 'Data');
  await chooseOption(user, form.getByLabelText('Country'), 'India');
  await user.type(form.getByLabelText('Annual base salary'), '3,100,000');
}

describe('managing employees', () => {
  it('adds an employee and opens their details', async () => {
    mockDirectory(makeEmployeeDetail({ id: 77, firstName: 'Asha', lastName: 'Rao' }));
    let body: unknown;
    server.use(
      http.post('/api/v1/employees', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          makeEmployeeDetail({ id: 77, firstName: 'Asha', lastName: 'Rao' }),
          {
            status: 201,
          },
        );
      }),
    );
    const { user, router } = renderApp({ route: '/employees' });
    await screen.findByText('Priya Sharma');

    const dialog = await openCreateDialog(user);
    await fillCreateForm(user, dialog);
    expect(within(dialog).getByText('INR')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    await waitFor(() =>
      expect(body).toEqual({
        firstName: 'Asha',
        lastName: 'Rao',
        email: 'asha.rao@acme.example',
        jobTitle: 'Data Scientist',
        department: 'Data',
        country: 'IN',
        employmentType: 'FULL_TIME',
        salary: 3_100_000,
        hireDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
    expect(await screen.findByText('Asha Rao added')).toBeInTheDocument();
    expect(router.state.location.search).toContain('employee=77');
    const details = await screen.findByRole('region', { name: 'Employee details' });
    expect(within(details).getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
  });

  it('validates required fields before calling the API', async () => {
    mockDirectory();
    const create = vi.fn();
    server.use(http.post('/api/v1/employees', create));
    const { user } = renderApp({ route: '/employees' });
    await screen.findByText('Priya Sharma');

    const dialog = await openCreateDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await within(dialog).findByText('First name is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Salary is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Select a country')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('shows a duplicate email from the API on the email field', async () => {
    mockDirectory();
    server.use(
      http.post('/api/v1/employees', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'A record with this email already exists' } },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderApp({ route: '/employees' });
    await screen.findByText('Priya Sharma');

    const dialog = await openCreateDialog(user);
    await fillCreateForm(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(
      await within(dialog).findByText('Another employee already uses this email'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows details and salary history from a shareable URL', async () => {
    mockDirectory();

    renderApp({ route: '/employees?employee=5' });

    const details = await screen.findByRole('region', { name: 'Employee details' });
    expect(await within(details).findByText('₹2,400,000')).toBeInTheDocument();
    const history = within(details).getByRole('list', { name: 'Salary history' });
    expect(within(history).getByText('+9.1%')).toBeInTheDocument();
    expect(within(history).getByText(/Annual review/)).toBeInTheDocument();
  });

  it('updates a salary with a reason, sending only the changed fields', async () => {
    mockDirectory();
    let body: unknown;
    server.use(
      http.patch('/api/v1/employees/5', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...priya, salary: 2_700_000 });
      }),
    );
    const { user } = renderApp({ route: '/employees?employee=5' });
    const details = await screen.findByRole('region', { name: 'Employee details' });

    await user.click(await within(details).findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: /edit priya sharma/i });
    const salary = within(dialog).getByLabelText('Annual base salary');
    await user.clear(salary);
    await user.type(salary, '2700000');
    await user.type(
      within(dialog).getByLabelText('Reason for salary change (optional)'),
      'Promotion',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(body).toEqual({ salary: 2_700_000, salaryChangeReason: 'Promotion' }),
    );
    expect(await screen.findByText('Changes saved')).toBeInTheDocument();
  });

  it('requires a new salary when relocating to a different currency', async () => {
    mockDirectory();
    const update = vi.fn();
    server.use(http.patch('/api/v1/employees/5', update));
    const { user } = renderApp({ route: '/employees?employee=5' });
    const details = await screen.findByRole('region', { name: 'Employee details' });

    await user.click(await within(details).findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: /edit priya sharma/i });
    await chooseOption(user, within(dialog).getByLabelText('Country'), 'United States');

    expect(
      within(dialog).getByText(/changes the salary currency from INR to USD/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(
      await within(dialog).findByText(
        'Enter the new salary in USD — moving to United States changes the currency',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Annual base salary')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('deletes an employee after confirmation', async () => {
    mockDirectory();
    const remove = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(http.delete('/api/v1/employees/5', remove));
    const { user, router } = renderApp({ route: '/employees?employee=5' });
    const details = await screen.findByRole('region', { name: 'Employee details' });

    await user.click(await within(details).findByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('dialog', { name: /delete priya sharma/i });
    await user.click(within(confirm).getByRole('button', { name: 'Delete employee' }));

    expect(await screen.findByText('Priya Sharma deleted')).toBeInTheDocument();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(router.state.location.search).not.toContain('employee=');
  });
});
