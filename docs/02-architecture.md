# Architecture

## System overview

```mermaid
flowchart LR
  HR[HR Manager<br/>browser] -->|HTTPS| FE[React SPA<br/>Vite + MUI]
  FE -->|REST JSON /api/v1| BE[Express API<br/>TypeScript]
  BE -->|Prisma| DB[(SQLite)]
  SEED[seed.ts<br/>10k employees] --> DB
```

There are two independently built apps, `frontend/` and `backend/`. They communicate only through a versioned REST API. Neither imports code from the other, so either one can be changed or replaced without touching the other.

## Backend layers

```mermaid
flowchart TD
  R[routes<br/>URL → handler] --> C[controllers<br/>validate input, HTTP in/out]
  C --> S[services<br/>business rules]
  S --> RP[repositories<br/>Prisma queries]
  S --> D[domain<br/>pure functions: stats, currency]
  RP --> P[(Prisma / SQLite)]
```

| Layer | Responsibility | Knows about HTTP? | Knows about DB? |
|---|---|---|---|
| routes | Wire URLs to handlers | yes | no |
| controllers | Validate input with zod (`parseInput`), call the service, shape the response | yes | no |
| services | Rules (currency derived from country, salary history on change, not-found handling) | no | no (uses repository interface) |
| repositories | Queries, transactions, aggregation | no | yes |
| domain | Pure math: median, percentiles, histogram, FX conversion | no | no |

Services depend on a repository *interface*, so unit tests can use an in-memory fake. The real Prisma repository is covered by integration tests against a temporary SQLite file.

`createApp(deps)` builds the Express app without starting a server. `server.ts` only calls `listen`. That split keeps tests free of sockets.

`/meta` (reference data for dropdowns) is a thin route that queries Prisma directly. It has no business rules, so a service and repository would only add indirection.

### Code map

```
backend/src/
├── app.ts, server.ts          composition root / process entry
├── config/env.ts              zod-validated environment
├── domain/                    pure: countries, currency (FX), stats, employment types
├── errors/AppError.ts         client-safe error types
├── http/                      parseInput + shared query schemas
├── middleware/errorHandler.ts single error → JSON mapping
├── modules/employees/         routes · controller · schema · service · repository · mapper · types
├── modules/insights/          routes · schema · service · repository · types
├── modules/meta/              reference data route
└── seed/                      pure, deterministic employee generator (+ prisma/seed.ts)

frontend/src/
├── api/                       axios client, ApiError, endpoint modules, query keys, types
├── hooks/                     TanStack Query hooks, useDebouncedCallback
├── features/employees/        directory, filters, grid, form dialog, drawer, delete dialog
├── features/insights/         dashboard sections and charts
├── components/                layout, page header, error state, notifications
└── test/                      MSW server, render helper, fixtures
```

## Data model

```mermaid
erDiagram
  Employee ||--o{ SalaryChange : has
  Employee {
    int id PK
    string employeeCode UK
    string firstName
    string lastName
    string email UK
    string jobTitle
    string department
    string country "ISO-2"
    string currency "derived from country"
    int salary "annual, whole local units"
    string employmentType
    datetime hireDate
    datetime createdAt
    datetime updatedAt
  }
  SalaryChange {
    int id PK
    int employeeId FK
    int oldSalary
    string oldCurrency
    int newSalary
    string newCurrency "differs on relocation"
    string reason "nullable"
    datetime changedAt
  }
```

Indexes: `country`, `(country, jobTitle)`, `department`, `jobTitle`, `lastName`, `SalaryChange(employeeId)`.

## Request flow: updating a salary

```mermaid
sequenceDiagram
  participant UI
  participant API as Controller
  participant Svc as EmployeeService
  participant Repo as Repository
  UI->>API: PATCH /api/v1/employees/42 {salary, salaryChangeReason}
  API->>Svc: update(42, dto)
  Svc->>Repo: findById(42)
  Svc->>Repo: update(42, data, salaryChange?)
  Note over Repo: one transaction:<br/>update Employee + insert SalaryChange
  Repo-->>Svc: employee
  Svc-->>API: employee
  API-->>UI: 200 employee
```

## Frontend structure

- `api/`: a typed axios client plus one module per resource. This is the only code that knows URLs.
- `features/employees`, `features/insights`: page-level components for each feature.
- `hooks/`: TanStack Query hooks. Server state is cached and invalidated after mutations, so there is no global store.
- `components/`: shared layout and loading, empty and error states.

## Error contract
Every error response has the same shape:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ … ] } }
```
The codes are `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CONFLICT` (409, for a duplicate email or code) and `INTERNAL_ERROR` (500).
