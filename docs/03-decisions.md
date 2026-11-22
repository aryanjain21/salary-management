# Design decisions and trade-offs

Each entry is a short ADR: the decision, why we made it, and what we gave up.

### 1. Separate `backend/` and `frontend/` apps instead of a monorepo tool
- **Why:** Clear boundaries, independent tooling, and either app can be read without understanding the other.
- **Trade-off:** API types are written twice, once in the backend and once in `frontend/src/api/types.ts`. A shared package or OpenAPI codegen would remove that duplication, but that is overkill for two apps with about 10 endpoints.

### 2. Express with explicit layers (routes → controllers → services → repositories)
- **Why:** Express is widely known and has little magic. The layering makes business rules testable without HTTP or a database.
- **Rejected:** NestJS (more structure, but a lot of decorator and DI boilerplate for this size). Fastify (fine, but Express is more familiar to reviewers).

### 3. SQLite + Prisma
- **Why:** No setup for reviewers (`npm run seed` and it runs). Prisma gives typed queries and migrations. 10k rows is tiny for SQLite.
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
