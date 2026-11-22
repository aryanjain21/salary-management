# Performance considerations

The target from the requirements is that every list, filter and insight request responds in **under 300 ms** for 10,000 employees, and seeding takes **under 5 s**. Both are met with a wide margin.

## Measured results

Environment: Apple M1 Pro laptop, Node 24.5, SQLite file database, 10,000 seeded employees, API running with `npm run dev` (tsx, not a production build). Each endpoint was warmed up, then requested 30 times sequentially over HTTP.

| Request | Median (ms) | p95 (ms) |
|---|---:|---:|
| `GET /employees` (page 1, default sort) | 1.9 | 2.2 |
| `GET /employees?search=priya sharma` | 8.4 | 9.5 |
| `GET /employees?country=IN&sortBy=salary&sortOrder=desc&page=50` | 4.0 | 4.3 |
| `GET /employees?department=Engineering&jobTitle=Staff Engineer` | 1.7 | 1.9 |
| `GET /employees/:id` (with salary history) | 0.7 | 0.9 |
| `GET /insights/summary` | 32.2 | 35.9 |
| `GET /insights/by-country` | 30.9 | 36.9 |
| `GET /insights/by-job-title` (all countries, USD) | 30.9 | 36.5 |
| `GET /insights/by-job-title?country=IN` | 9.3 | 9.8 |
| `GET /insights/by-department` | 31.3 | 36.8 |
| `GET /insights/distribution` | 31.1 | 39.3 |
| `GET /insights/distribution?country=US` | 10.4 | 10.9 |
| `GET /meta` | 10.5 | 12.1 |

**Seed:** 10,000 employees inserted in **0.5–0.9 s** (batches of 1,000 `createMany` inside one transaction).

## What makes it fast

### Database
- **Indexes** on `country`, `(country, jobTitle)`, `department`, `jobTitle`, `lastName` and `SalaryChange(employeeId, changedAt)`, matching the filters and sorts the UI offers (`backend/prisma/schema.prisma`).
- **Server-side pagination** with `page`/`pageSize` (max 100). The browser never downloads 10k rows. The page query and the count run in one Prisma transaction.
- **Stable sort.** A secondary `ORDER BY id` keeps paging deterministic when values tie.
- **Search** uses `LIKE '%term%'` on four columns. That's a full scan, but over 10k rows it takes about 8 ms. Each whitespace-separated term must match, so "priya sharma" narrows results instead of widening them.

### Insights
- Queries **select only the five columns** the statistics need (country, currency, department, jobTitle, salary), not full rows.
- Statistics run in pure TypeScript (`backend/src/domain/stats.ts`). One sort per group gives min, max, median and quartiles together.
- Most of the ~30 ms for org-wide insights is Prisma materializing 10k row objects. The math itself takes a few ms. Insights filtered to one country cost proportionally less (about 10 ms for India's 2.5k employees).

### Frontend
- **Route-level code splitting.** The directory page ships MUI DataGrid and the dashboard ships MUI X Charts, so neither downloads the other's library. The shared entry chunk went from 509 kB to 160 kB gzip.
- **TanStack Query caching** (`staleTime` 30 s) avoids refetching when switching between pages. `keepPreviousData` keeps the current page visible while the next one loads, so the grid never flickers.
- **Debounced search** (300 ms) sends one request per pause in typing, not one per keystroke.
- After a mutation, only the affected query families (employees, insights, meta) are invalidated.

## Scaling path

The design fits ACME's 10k employees comfortably. If the dataset grew by around 100×, this is the order I'd change things:

1. **Switch SQLite to Postgres.** It's a one-line Prisma provider change. That gives concurrent writers and native `percentile_cont`.
2. **Push aggregation into SQL** (`GROUP BY` plus `percentile_cont`) so the API stops materializing every row for insights. Or keep the current code and **cache insight results** per filter, invalidating on employee writes. Salary data changes rarely, so the hit rate would be very high.
3. **Full-text search** (Postgres `tsvector` or trigram index) instead of `LIKE '%…%'`.
4. **Keyset pagination** instead of `OFFSET` for very deep pages.

None of these are needed at the current scale, and each would add operational complexity, so they are deliberately not built yet.

## How to reproduce

```bash
cd backend
npm run db:seed -- --reset    # prints the seed time
npm run dev                   # then time requests, e.g.:
curl -s -o /dev/null -w "%{time_total}\n" "localhost:4000/api/v1/insights/by-country"
```
