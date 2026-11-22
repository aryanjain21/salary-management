# Testing strategy

**Goal:** tests that give confidence in the behaviour HR relies on (correct numbers, correct currency handling, no lost salary history), run in seconds, and never flake.

| | Backend | Frontend |
|---|---|---|
| Tests | 113 | 48 |
| Runtime | ~0.5 s | ~5 s |
| Line coverage | 100% | ~91% |
| Runner | Vitest | Vitest + jsdom |

Run them with `npm test` in either app, or `npm run test:coverage` for a report. CI runs both on every push (`.github/workflows/ci.yml`).

## The test pyramid we chose

### 1. Pure unit tests (most of the value, fastest)
Business-critical logic is written as pure functions so it can be tested exhaustively, with no mocks:

- `domain/stats.ts`: median for odd and even lists, percentiles checked against Excel's `PERCENTILE.INC`, empty input, nice histogram boundaries, no input mutation.
- `domain/currency.ts`, `domain/countries.ts`: conversion and rounding, unknown currency or country.
- `seed/generateEmployees.ts`: same seed gives the same data, unique codes and emails, currency always matches country, no hire dates after the reference date.
- Zod schemas: normalization (trim, lowercase email, upper-case country), rejection of each invalid field, and refusal of client-supplied currency or employee code.
- Frontend `employeeForm.ts`: form parsing (`"2,400,000"` → `2400000`), and PATCH bodies that contain only changed fields.

### 2. Service tests with an in-memory repository
`EmployeeService` and `InsightsService` depend on repository **interfaces**. Tests inject a small in-memory implementation (`tests/helpers/InMemoryEmployeeRepository.ts`) to test business rules without a database:

- Currency is derived from country. Employee codes are assigned by the server.
- A salary change writes history with its reason. An unchanged salary writes none.
- Moving IN → US without a new salary is rejected and nothing changes.
- Insights in local currency when filtered to one country, otherwise in USD. A test shows that comparing raw INR amounts would give the wrong ranking.

### 3. API integration tests against a real database
`supertest` drives the real Express app (`createApp`) backed by a **temporary SQLite file per test file**, with the real migrations applied (`tests/helpers/testDb.ts`). This covers what mocks can't: Prisma queries, indexes, transactions, unique constraints mapped to `409`, cascade deletes, the HTTP status codes and the error-body contract.

Each file builds its own database, so files run in parallel without sharing state.

### 4. Frontend component and flow tests
React Testing Library renders the **real route tree and providers**, and Mock Service Worker answers HTTP requests at the network layer. Tests act as a user would (type, click, choose options) and assert on what's visible and on the **exact request** the UI sent:

- Directory: data rendering, debounced search (one request per pause), filters reset paging, URL ↔ filter round trip, error and retry, empty state, clear filters.
- CRUD: create with validation, a duplicate email from the server shown on the field, editing a salary sends only `{salary, salaryChangeReason}`, relocation without a new salary is blocked, delete after confirmation.
- Dashboard: key figures, switching to a country shows local currency, filters restored from a shared link, error state.

MSW is configured with `onUnhandledFrame: 'error'`, so a component calling an unmocked endpoint fails the test.

## Keeping tests fast and deterministic
- **No real clock or randomness** in assertions. The seed generator takes a seed and a reference date. The in-memory repository uses a fixed clock. Fixture values are hand-checked (for example, ₹2,000,000 ÷ 83.5 = $23,952).
- **No network.** The backend uses local SQLite files and the frontend uses MSW.
- **No sleeps.** Timers are faked where timing is the subject (`useDebouncedCallback`). UI tests wait for observable states with `findBy*` and `waitFor`.
- **Flakiness found and fixed:** under the slower coverage run, one test asserted on the drawer before its data loaded. It was rewritten to wait for the heading (commit `test(frontend): wait for employee details…`), and the suite was re-run several times.
- **Bugs found by exercising the real app** got regression tests. For example, the directory briefly showed the previous total as the count for new filters. The test was confirmed to fail without the fix.

## What is not tested here, and why
- **Cross-browser and visual regressions:** no Playwright suite in CI. The app was exercised manually in Chrome against the 10k dataset (screenshots in `docs/screenshots`). An end-to-end smoke test is a reasonable next step.
- **Chart pixels:** charts are checked only for presence. The numbers behind them are covered by the insights tests.
- **Load testing:** latency was measured, not load-tested (see `04-performance.md`). One HR team is the expected concurrency.
