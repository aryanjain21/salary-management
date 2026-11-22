# ACME Salary Management: Requirements (one page)

## Goal
ACME's HR team keeps salary data for about 10,000 employees in several countries in Excel files. That is slow, easy to get wrong, and makes simple questions ("what do we pay a Senior Engineer in India?") take hours. We will replace the spreadsheets with a web app that is **the single source of truth for employee salaries** and **answers pay questions in seconds**.

## Persona
**HR Manager.** Uses a desktop browser and is comfortable with spreadsheets, but is not technical. They need to trust the numbers, find a person quickly, and answer leadership's questions about pay without building pivot tables.

## In scope

| # | Feature | Why it matters |
|---|---|---|
| 1 | **Employee directory.** A paginated table (on the server) with search by name, email or employee code, filters for country, department and job title, and sorting. | Replaces scrolling through 10k spreadsheet rows. |
| 2 | **Create, view, edit and delete employees,** with validation (unique email and code, positive salary, valid country). | The core of "manage salary data". Validation stops the data-quality problems that spreadsheets allow. |
| 3 | **Multi-currency salaries.** Each salary is stored in its local currency, which is derived from the country. Fixed reference FX rates convert to USD for comparisons across countries. | You can't compare INR with USD directly. Deriving currency from country removes a whole class of mistakes. |
| 4 | **Salary change history.** Every salary change is recorded automatically with the old value, new value, an optional reason and a timestamp. | HR is regularly asked "when and why did this change?". Spreadsheets lose this information. |
| 5 | **Pay insights dashboard**, covering: headcount and total payroll by country; min, max, average and median salary per country; average, min and max salary for a job title in a country; salary by department; salary distribution; best-paid roles. | This is the part of the problem about answering questions on how the org pays people. |
| 6 | **Seed script** that creates 10,000 realistic, deterministic employees. | Realistic volume for testing performance and for the demo. |

## Planned for later phases

Phase 1 focuses on getting the salary data right and making it easy to query. These items build on that foundation and are planned for later phases.

| Feature | Planned for | Notes |
|---|---|---|
| Authentication and role-based access | **Phase 2 (next)** | SSO plus an audit of who viewed what. The API already runs through a single middleware chain, so auth slots in without touching business logic. |
| Bulk Excel import and export | **Phase 2 (next)** | The natural next step for moving HR fully off spreadsheets, now that the data model and CRUD are in place. |
| Live FX rates | Phase 3 | Phase 1 uses fixed, dated reference rates, clearly labelled in the UI, so analysis stays consistent. A live rate provider can replace the rate table behind the same interface. |
| Pay-equity analytics (gender, ethnicity) | Phase 3 | Needs legal and privacy sign-off before this data is collected. The schema can be extended to support it. |
| Bonuses, equity and approval workflows | Phase 3 | Extends the salary record into full compensation planning. |
| Payroll runs and tax | To be evaluated | Usually handled by a dedicated payroll system. We'll decide whether to build it or integrate once phase 2 is live. |
| Multi-tenancy, localization, mobile layout | As needed | The current users are one HR team on desktop. These come in when the user base grows. |

## Success criteria
- Every list, filter and insight request responds in **under 300 ms** on 10k employees, on a laptop.
- Seeding 10,000 employees takes **under 5 s**.
- The core flows (CRUD, salary history and every insight calculation) are covered by **fast, deterministic automated tests**.
- An HR Manager can answer "average salary of a *job title* in *country*" in **3 clicks or fewer**.
