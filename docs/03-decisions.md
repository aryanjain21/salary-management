# Design decisions and trade-offs

Each entry is a short ADR: the decision, why we made it, and what we gave up.

### 1. Separate `backend/` and `frontend/` apps instead of a monorepo tool
- **Why:** Clear boundaries, independent tooling, and either app can be read without understanding the other.
- **Trade-off:** API types are written twice, once in the backend and once in `frontend/src/api/types.ts`. A shared package or OpenAPI codegen would remove that duplication, but that is overkill for two apps with about 10 endpoints.

### 2. Express with explicit layers (routes → controllers → services → repositories)
- **Why:** Express is widely known and has little magic. The layering makes business rules testable without HTTP or a database.
- **Rejected:** NestJS (more structure, but a lot of decorator and DI boilerplate for this size). Fastify (fine, but Express is more familiar to reviewers).

### 3. SQLite + Prisma
- **Why:** No setup for reviewers (`npm run setup` migrates and seeds). Prisma gives typed queries and migrations. 10k rows is tiny for SQLite.
- **Trade-off:** SQLite has a single writer and no native `MEDIAN`. With one HR team as users, write concurrency doesn't matter. Median is computed in code (see the performance doc). **Upgrade path:** change the Prisma `provider` to `postgresql`. Nothing in the services or repositories is SQLite-specific.

### 4. Money stored as integers in local currency, and currency derived from country
- **Why:** Integers avoid floating-point rounding. Storing the local amount keeps the number HR actually agreed with the employee. Deriving currency from country, instead of letting the user pick both, makes an "Indian employee paid in EUR" mistake impossible.
- **Trade-off:** It can't model someone paid in a currency other than their country's (for example, expats paid in USD). Support for a separate pay currency is planned for a later phase.

### 5. Fixed reference FX rates for USD comparison
- **Why:** Results are deterministic and testable, with no external API dependency or failure mode. The UI labels them as reference rates with an "as of" date.
- **Trade-off:** USD figures are approximate. That's acceptable because they are for comparing countries, not for payroll.

### 6. Salary history written in the same transaction as the update
- **Why:** The audit trail can never drift from the actual salary. It is written by the service, not by the client, so it can't be skipped.

### 7. Server-side pagination, filtering and sorting
- **Why:** Sending 10k rows to the browser works today but doesn't scale and makes the first load slow. Server-side keeps every response small (page size ≤ 100) and fast.

### 8. TanStack Query for server state, with no Redux
- **Why:** Almost all state in this app is server data. Query gives caching, loading and error states, and invalidation after mutations. The small amount of UI state (dialogs, filters) lives in components and the URL.

### 9. MUI (+ MUI X DataGrid and Charts)
- **Why:** It's accessible, consistent, and has a data grid with server-side mode built in, so we can spend time on the domain instead of table plumbing.

### 10. Authentication planned for phase 2
- **Why:** Phase 1 focuses on the salary data and insights. Authentication and role-based access are next on the roadmap (see the requirements doc). The API is versioned and has a single middleware chain, so adding an auth middleware is a local change.

### 11. Insights computed in application code from a narrow projection
- **What:** Each insight query selects only `country, currency, department, jobTitle, salary` for the filtered population. Grouping, median and percentiles then run in pure functions (`domain/stats.ts`).
- **Why:** SQLite has no `MEDIAN` or `PERCENTILE_CONT`. Doing all statistics in one place keeps the definitions consistent (Excel's `PERCENTILE.INC`, so HR can cross-check) and unit-testable without a database. At 10k rows this costs about 30 ms (see the performance doc).
- **Trade-off:** Memory and latency grow linearly with headcount. **Upgrade path** at around 500k+ employees: move aggregation into SQL (Postgres `percentile_cont`), or keep the app-side code and cache results per filter, invalidating on writes.

### 12. Never compare raw salaries across currencies
- **What:** When an insight is filtered to one country it is reported in that country's currency. Otherwise every salary is converted to USD first. In the directory, salary sorting is only enabled once a single country is selected.
- **Why:** Ranking ₹2,400,000 above $150,000 is a silent but serious analytical error. The API and UI make that comparison impossible rather than relying on users to notice it.

### 13. Moving to a country with a different currency requires a new salary
- **Why:** If only the country changed, the stored amount would be silently reinterpreted in the new currency (₹2.4M becomes $2.4M). The service rejects such an update unless a new salary is provided. `SalaryChange` records both old and new currency, so the history stays truthful.

### 14. UI state that people would share lives in the URL
- **What:** Directory filters, sort, page, the open employee (`?employee=42`) and the dashboard filters are all URL parameters.
- **Why:** HR can bookmark "Engineering in India sorted by salary" or paste a link to a specific employee to a colleague. Refreshing never loses context.

### 15. Node 24 LTS, current dependency majors, zero known vulnerabilities
- **Why:** Node 23 (the version installed locally at the start) is end-of-life and unsupported by Vitest 5. `.nvmrc` pins 24 LTS. `npm audit` was clean for both apps at the time of writing. Two transitive dev-only vulnerabilities in the Prisma CLI are fixed with npm `overrides` (see `backend/package.json`).

### 16. Frontend tests mock the network, not modules
- **Why:** Mock Service Worker intercepts real HTTP calls, so tests exercise the actual axios client, query hooks, error normalization and components together. Unhandled requests fail the test, so no call goes unnoticed.
