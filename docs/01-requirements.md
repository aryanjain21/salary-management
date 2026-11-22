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

## Deliberately left out (and why)

| Left out | Reasoning |
|---|---|
| Authentication and role-based access | There is a single persona and the exercise is about the salary domain. Real salary data **must** sit behind auth (SSO plus an audit of who viewed what), so this is the **first follow-up**. |
| Gender, ethnicity and pay-equity analytics | These involve sensitive personal data that needs legal and privacy review before we collect it. The schema can be extended to support them. |
| Live FX rates | They add an external dependency and make the numbers change from run to run. Fixed, dated reference rates are enough for analysis and are clearly labelled in the UI. |
| Payroll runs, tax, bonuses or equity, approval workflows | These belong to a different product (payroll or compensation planning). Including them would dilute the core. |
| Bulk Excel import and export | High value, and the natural next step for migrating off spreadsheets. It comes after the data model and CRUD are proven. |
| Multi-tenancy, localization, mobile layout | Not needed for one org's HR team on desktop. |

## Success criteria
- Every list, filter and insight request responds in **under 300 ms** on 10k employees, on a laptop.
- Seeding 10,000 employees takes **under 5 s**.
- The core flows (CRUD, salary history and every insight calculation) are covered by **fast, deterministic automated tests**.
- An HR Manager can answer "average salary of a *job title* in *country*" in **3 clicks or fewer**.
