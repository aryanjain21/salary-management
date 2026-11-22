# Demo video script (~6 minutes)

Before recording: `cd backend && npm run db:seed -- --reset && npm run dev`, then `cd frontend && npm run dev`, and open <http://localhost:5173>.

| Time | Show | Say |
|---|---|---|
| 0:00 | `docs/01-requirements.md` | The problem: 10k employees, several countries, Excel. Persona: the HR manager. What's in phase 1 and what's planned for later. |
| 0:45 | Employees page | 10,000 employees, server-side paging. Each salary is shown in local currency with a USD reference. |
| 1:15 | Type "sharma" in search, pick **India**, then **Engineering** | Debounced search and filters. The URL updates, so the view can be shared. The count changes to the matching total. |
| 1:45 | Click the **Salary** header (only works with a country selected) | Why salary sorting needs one country: ranking rupees against dollars is meaningless. |
| 2:05 | Click a row to open the drawer, then **Edit** and raise the salary with reason "Annual review" | The salary history entry appears with +x% and the reason. It's written in the same transaction as the update. |
| 2:45 | Edit again: change country to **United States** without changing the salary, then Save | It's blocked: a new salary in USD is required. This prevents silently turning ₹ into $. |
| 3:15 | **Add employee** and submit an empty form, then fill it in and save | Client validation, currency derived from country, success message, the new employee opens. |
| 3:45 | Pay insights | Headcount, payroll and median. Pay by country in local currency plus USD median. |
| 4:15 | Click **India** in the table | Everything switches to INR. "What do we pay a Staff Engineer in India?" is answered in two clicks: median, middle 50% and range. |
| 4:45 | Distribution and department charts | Shape of pay, and the spread per department. |
| 5:00 | Terminal: `npm test` in backend and frontend | 113 + 48 tests in seconds. Mention the pure domain functions, the real-SQLite integration tests and MSW UI tests. |
| 5:30 | `git log --oneline`, `docs/` | Incremental history; architecture, decisions, performance, testing and AI-usage docs. |
| 5:50 | Wrap up | Next phases: authentication and RBAC, then Excel import and export. |
