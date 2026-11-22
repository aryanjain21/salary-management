# How AI tools were used

**Tool:** Claude Code (agentic coding assistant in the terminal and VS Code), used throughout: planning, implementation, tests, verification and documentation.

**Principle:** AI accelerates the typing. The human owns the decisions and the verification. Every change was type-checked, linted and tested before it was committed. Where the AI's knowledge might be stale (new library majors), installed type definitions were checked instead of trusting memory.

## Workflow

1. **Plan first, no code.** The assessment brief was pasted into Claude Code in *plan mode* with this instruction:
   > "Check this assignment… prepare a plan which helps me clear this round and fulfil all the conditions. Backend and frontend in separate folders, backend in Node and frontend in React, both in TypeScript."

   The assistant asked about the open choices before planning. **Human decisions:** Express with layered architecture, SQLite + Prisma, MUI, and the scope (develop and commit locally; features beyond phase 1 framed as a roadmap).
2. **Requirements before code.** The one-page requirements doc was the first commit, then architecture and ADRs. The human edited both, reframing out-of-scope items as a phased roadmap.
3. **Small, verified increments.** For each step the assistant wrote code and tests, then ran `typecheck → lint → test` (and `build` for the frontend) before committing. The commit history mirrors that sequence.
4. **Run the real app.** After the features were done, the assistant drove the real UI in headless Chrome against the 10k-employee database and reviewed screenshots. That surfaced issues no unit test had caught (see below).

## Representative prompts and instructions

| Stage | Prompt / instruction (paraphrased) |
|---|---|
| Planning | The full assignment brief plus "prepare a plan… backend Node, frontend React, both TypeScript, separate folders". |
| Scope correction | "We don't want to deploy, just develop and push to the repo." Later also: don't mention deployment in the docs, and describe unbuilt features as planned phases. |
| Commit style | Plain conventional commits with no tool attribution trailers. |
| Execution | "Continue" after reviewing each step, which let the assistant proceed through the approved plan commit by commit. |

## Where AI output was checked, corrected or rejected

| Situation | What happened |
|---|---|
| **Toolchain** | The local Node 23 is EOL. Vitest 5 doesn't support it and npm 11.4 crashed while resolving dependencies. Pinned Node 24 LTS (`.nvmrc`) instead of downgrading libraries. |
| **Security** | `npm audit` reported 13 vulnerabilities in the first install. Upgraded to patched majors. Rejected `prisma@latest` because it was an 8.0 **release candidate**. Fixed two remaining dev-only transitive issues with `overrides`. Result: 0 vulnerabilities. |
| **New library majors** | MUI 9, MSW 3, React Router 8 and jest-dom 8 were newer than the assistant's working knowledge. APIs were verified from the installed `.d.ts` files. Real differences found: MSW renamed `onUnhandledRequest` to `onUnhandledFrame`, and MUI 9 removed system props such as `fontWeight` on `Typography`. |
| **Domain bug caught in design** | The first schema had one `currency` on `SalaryChange`. While writing the update rules it became clear that relocating someone from India to the US would make the history lie, or silently turn ₹2.4M into $2.4M. Added a second migration (`oldCurrency`/`newCurrency`) and a rule that relocation requires a new salary. |
| **Analytics correctness** | Recognized that sorting or ranking raw salaries across currencies is meaningless. Insights report local currency for one country and USD otherwise, and directory salary sorting is enabled only within one country. A unit test shows the wrong ranking raw INR would produce. |
| **Lint as a design signal** | oxlint flagged `setState` inside an effect in the first search box. Rather than suppress it, the component was redesigned (debounce in the event handler, plus render-time sync for external changes). |
| **Flaky test** | One UI test passed normally but failed under the slower coverage run. Root cause: it asserted before the drawer's data loaded. Fixed the race rather than raising timeouts, then re-ran several times. |
| **Found by running the real app** | (1) The directory briefly showed "10,000 matching employees" after a filter was applied (stale total kept by `keepPreviousData`). Fixed, and the regression test was confirmed to fail without the fix. (2) Grid cell alignment and a wrapped country link. Fixed. |
| **Don't trust a suspicious number** | A first latency measurement showed 0.3 ms for DB-backed endpoints, which is implausible. It was discarded, the endpoints were verified to return real data, and they were re-measured properly with a Node script (median and p95 over 30 requests). |
| **Housekeeping** | The Vite template's unused `App.tsx` slipped into a commit. It was noticed and removed before moving on. |

## What I would keep doing
- Ask the AI to **plan and ask questions first**. The early questions (stack, scope) prevented rework.
- Treat **linters, type errors and flaky tests as design feedback**, not noise to suppress.
- **Run the real product** before calling it done. Several of the most user-visible issues only showed up there.
