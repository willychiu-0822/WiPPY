# WiPPY Learning Production UAT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the approved production-first WiPPY Learning UAT in the browser, repair any reproducible defect in an isolated worktree, and verify the merged production deployment end to end.

**Architecture:** The stateful UAT runs sequentially against Firebase Hosting and the same-origin Cloud Run learning API with one access-enabled production account. Browser evidence feeds a decision gate: a clean run produces only a UAT report, while a reproducible defect creates a fresh `origin/main` worktree and a root-cause-specific TDD addendum before any product code changes. A fix may merge only after local verification, self-review, all CI jobs, automated deployment, and a production browser replay.

**Tech Stack:** Codex Browser, React 19, Vite 8, Express, TypeScript, Firebase Auth/Firestore/Hosting, Google Cloud Run/Cloud Tasks, Jest, Vitest, Playwright, GitHub Actions, PowerShell, Git worktrees.

## Global Constraints

- Production target is exactly `https://wippy-mvp.web.app/learn`; backend is `https://wippy-backend-ts2nxgrpfa-de.a.run.app`.
- Production-first is intentional; do not substitute Emulator results for the production Cloud Tasks path.
- Use only the browser's current user-approved account. Never inspect cookies, local storage, passwords, tokens, profiles, or session stores.
- Production source titles must be `UAT-20260812-<HHmmss>-reviewed-seed` and `UAT-20260812-<HHmmss>-unreviewed-source`, using Asia/Taipei time.
- Production source data is private and retained. Do not delete existing sources, attempts, knowledge, evidence, or any `learning*` document.
- A recoverable UI error gets one retry. A second failure stops new production writes.
- Stop immediately on unexpected `5xx`, cross-user data, uncontrolled duplication, persistent `/groups` redirect, or ingestion still incomplete after 120 seconds plus one UI retry.
- Do not create a repair PR or redeploy when the UAT finds no reproducible bug.
- A bug fix must start from latest `origin/main` in `C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY-worktrees\learning-uat-fix-production` on branch `codex/fix/learning-uat-production`.
- Never weaken assertions, hide production errors, increase timeouts to mask races, bypass UID ownership, print secrets, or include unrelated refactors.
- Automatic rollback is limited to revoking the test UID's learning access. Scheduler, queue, revision, hosting-release, other-user, or deletion changes require renewed user approval.

---

## File Map

**Always used:**

- Read: `docs/superpowers/specs/2026-08-12-learning-production-uat-design.md` — approved requirements and safety boundaries.
- Read: `docs/learning-canary-runbook.md` — existing production canary and rollback guidance.
- Create: `docs/uat/2026-08-12-learning-production-uat-report.md` — timestamped browser evidence, case results, defect packet, release evidence, and residual risks.
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md` — check completed steps as execution progresses.

**Conditional on a reproducible bug:**

- Create: `docs/superpowers/plans/2026-08-12-learning-production-uat-fix-addendum.md` in the repair worktree — exact root cause, exact source/test files, failing assertion, minimal implementation, and verification commands.
- Modify only files explicitly named in that addendum.
- Test only through exact test files named in that addendum, followed by the full gates in Task 8.

The conditional addendum is a safety boundary, not deferred design. Product files cannot be named truthfully until browser evidence and systematic debugging identify the failing boundary. No product code may be edited before that addendum contains exact paths and a red test.

---

### Task 1: Initialize the UAT Record and Browser Surface

**Files:**

- Read: `docs/superpowers/specs/2026-08-12-learning-production-uat-design.md`
- Read: `docs/learning-canary-runbook.md`
- Create: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: approved production target, test-data convention, stop conditions, and browser-control skill.
- Produces: one persistent browser binding selected for the production URL and a report with every case initially marked `NOT RUN`.

- [x] **Step 1: Create the report skeleton**

Create `docs/uat/2026-08-12-learning-production-uat-report.md` with these exact sections and initial states:

```markdown
# WiPPY Learning Production UAT Report — 2026-08-12

- Target: https://wippy-mvp.web.app/learn
- Timezone: Asia/Taipei
- Account scope: current user-approved production account
- Overall result: NOT RUN

## Production test data

| Case | Source title | Result |
|---|---|---|
| Reviewed seed | Recorded in Task 3 | NOT RUN |
| Unreviewed source | Recorded in Task 6 | NOT RUN |

## UAT results

| ID | Priority | Case | Result | Evidence |
|---|---|---|---|---|
| UAT-01 | P0 | Login, access, navigation | NOT RUN | |
| UAT-02 | P0 | Reviewed source ingestion | NOT RUN | |
| UAT-03 | P0 | Supported answer change | NOT RUN | |
| UAT-04 | P0 | Direct answer, skip, completion | NOT RUN | |
| UAT-05 | P0 | Knowledge, exclusion, persistence | NOT RUN | |
| UAT-06 | P1 | Unreviewed neutral state | NOT RUN | |
| UAT-07 | P1 | Low-pressure copy | NOT RUN | |
| UAT-08 | P1 | Mobile, desktop, keyboard | NOT RUN | |

## Defects

No reproducible defect recorded.

## Local verification

Not required unless a repair branch is created.

## PR, CI, and deployment

Not required unless a repair branch is created.

## Post-deploy production replay

Not required unless a repair branch is created.

## Residual risks

- Cross-account and Firestore rules remain covered by Emulator/integration tests, not a second production account.
```

- [x] **Step 2: Select the browser for the exact target URL**

Use the Browser skill's target-URL selection path for `https://wippy-mvp.web.app/learn`. Read the selected browser's complete documentation before obtaining or interacting with a tab. Reuse the resulting browser binding for the entire UAT.

- [x] **Step 3: Obtain one production tab and record the initial URL**

Navigate the tab to `https://wippy-mvp.web.app/learn`. Record the resolved URL, visible page state, viewport, and Asia/Taipei timestamp under UAT-01 evidence. Do not inspect browser storage or credentials.

- [x] **Step 4: Apply the authentication gate**

If the page requires sign-in, stop and ask the user to sign in in the selected browser and confirm readiness. If the page resolves to `/groups` after authentication, record UAT-01 as `BLOCKED`, capture the visible state and relevant `/api/learning/access` status when available, and execute Task 7 without creating source data.

- [x] **Step 5: Mark Task 1 complete in this plan**

Update only the checkboxes completed in Task 1. Do not commit the report yet because later tasks must append evidence.

---

### Task 2: Verify Access and Learning Navigation

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: authenticated production tab from Task 1.
- Produces: UAT-01 result and a stop/continue decision for production writes.

- [x] **Step 1: Verify the learning shell**

Confirm the page exposes the learning heading and the four navigation destinations `首頁`, `來源`, `來一輪`, and `知識庫`. Click each destination once and verify the route remains under `/learn`.

- [x] **Step 2: Check for blocking access states**

Fail UAT-01 if the UI remains in loading, shows `暫時無法確認使用權限`, redirects to `/groups`, or returns an unexpected learning API `5xx`. A visible recoverable access error may use `重新確認` once; a second failure is final for this session.

- [x] **Step 3: Record UAT-01**

Write `PASS`, `FAIL`, or `BLOCKED`, with timestamp, resolved URL, visible text summary, and HTTP method/path/status evidence. If `FAIL` or `BLOCKED`, skip Tasks 3–6 and execute Task 7.

- [x] **Step 4: Mark Task 2 complete in this plan**

Update the Task 2 checkboxes to reflect the actions actually completed.

---

### Task 3: Exercise Reviewed Source Ingestion in Production

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: UAT-01 `PASS`, current Asia/Taipei time, and the approved reviewed source body.
- Produces: reviewed UAT source title, source route, ingestion timing, network status evidence, and UAT-02 result.

- [x] **Step 1: Generate and record the reviewed source title**

Generate `UAT-20260812-<HHmmss>-reviewed-seed` using the actual Asia/Taipei submission time. Replace `Recorded in Task 3` in the report with the exact title before submitting the form.

- [x] **Step 2: Submit the reviewed source**

Navigate to `/learn/sources/new`, fill the exact title, and fill the body with:

```text
Before building it, run the idea by a few users. Later, run the company with care.
```

Submit with `收進知識庫`. Record the source-creation HTTP method/path/status without recording authorization values.

- [x] **Step 3: Observe production ingestion**

Start the 120-second observation window when the source request succeeds. Record every visible state transition and the final reader URL. If the UI exposes retry after a recoverable failure, use it once and record the retry request status.

- [x] **Step 4: Verify the completed reader**

Require the exact title, both English sentences, and `開始 3–5 分鐘練習`. Reload once and verify the completed state and CTA persist.

- [x] **Step 5: Record UAT-02 and apply the stop condition**

Mark UAT-02 `PASS` only when ingestion completes within the allowed window and survives reload. Mark `FAIL` on an unexpected `5xx`, retry exhaustion, permanent processing, incorrect source text, duplicated source, or lost completed state. On failure, stop new production writes and execute Task 7.

- [x] **Step 6: Mark Task 3 complete in this plan**

Update the Task 3 checkboxes to reflect actual execution.

---

### Task 4: Verify the Learning Round and Evidence Semantics

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: completed reviewed source from Task 3.
- Produces: UAT-03 and UAT-04 results, plus the completed round state needed by Task 5.

- [ ] **Step 1: Start the source-specific round**

Activate `開始 3–5 分鐘練習`. Verify a challenge appears with separate `確認答案`, hint, direct-answer, and skip controls.

- [ ] **Step 2: Exercise provisional answer and hint**

Choose the first radio option, activate `再給我一點提示`, and verify the provisional choice is not auto-submitted or erased. Choose a different option and confirm.

- [ ] **Step 3: Verify feedback semantics**

Require the heading `這題的語言證據`, an explanation of decisive language evidence, and visible acknowledgement of support. Fail if the result claims `延遲記憶已建立`, `已學會`, `精通`, or unaided success after the hint.

- [ ] **Step 4: Record UAT-03**

Record `PASS` or `FAIL`, including visible feedback text summary, control sequence, and the attempt request status.

- [ ] **Step 5: Exercise direct answer and skip**

Continue to the next challenge and use `直接看答案與證據` without selecting an answer first. Complete that round. Start a second source-specific round and use `跳過` on its first available challenge. If no challenge is available in the second round, record UAT-04 as `BLOCKED` with the neutral state; do not claim skip passed without executing it.

- [ ] **Step 6: Verify completion semantics**

Require the heading `這輪先到這裡`. Fail if direct answer or skip is presented as punishment, creates backlog/unfinished copy, or increases independent/delayed mastery claims.

- [ ] **Step 7: Record UAT-04**

Record the direct-answer, skip, and completion results with visible copy and relevant attempt statuses.

- [ ] **Step 8: Mark Task 4 complete in this plan**

Update the Task 4 checkboxes to reflect actual execution. If a P0 failure occurred, execute Task 7 before creating more production data.

---

### Task 5: Verify Knowledge, Exclusion, and Persistence

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: reviewed source and completed attempt evidence from Tasks 3–4.
- Produces: UAT-05 and UAT-07 results, restored item eligibility, and evidence for mobile/desktop replay.

- [ ] **Step 1: Open and inspect knowledge**

Navigate to `/learn/knowledge`. Require `run something by someone` and the exact word heading `run`. Verify meaning, chunk, syntax, and pragmatics are separate where applicable; an unattempted facet must say `尚無證據`, not `不會`.

- [ ] **Step 2: Verify persistence**

Reload the knowledge route and require the reviewed expression, word, and evidence to remain visible.

- [ ] **Step 3: Exclude the reviewed expression**

Activate `不要再出題` for `run something by someone`. Record the PATCH method/path/status and verify the card remains visible with an excluded state.

- [ ] **Step 4: Verify scheduling exclusion**

Open a new round. Pass when the excluded item does not appear; an empty neutral round is acceptable. Return to knowledge without creating artificial evidence for the excluded item.

- [ ] **Step 5: Restore eligibility**

Reverse `不要再出題`. Verify the card no longer displays exclusion and is eligible again. Do not require one subsequent round to select it because ranking is nondeterministic.

- [ ] **Step 6: Verify forbidden pressure copy**

Across the reader, round, completion, and knowledge text captured so far, search visible copy for `複習`, `到期`, `XP`, `連勝`, `排行榜`, `欠題`, `未完成`, `已學會`, and `精通`. Any product use in the learning UI fails UAT-07.

- [ ] **Step 7: Record UAT-05 and UAT-07**

Write the persistence, facet, exclusion, restoration, and forbidden-copy results with route and status evidence.

- [ ] **Step 8: Mark Task 5 complete in this plan**

Update the Task 5 checkboxes. Execute Task 7 immediately if a P0 failure occurred.

---

### Task 6: Verify the Neutral Source, Responsive Layout, and Keyboard Flow

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: stable production session and no unresolved P0 failure.
- Produces: unreviewed UAT source title, UAT-06 and UAT-08 results, and the completed browser UAT dataset.

- [ ] **Step 1: Generate and record the unreviewed source title**

Generate `UAT-20260812-<HHmmss>-unreviewed-source` using the actual Asia/Taipei submission time. Replace `Recorded in Task 6` in the report before submission.

- [ ] **Step 2: Submit the unreviewed source**

Use `/learn/sources/new` with this exact body:

```text
Curious makers carefully listen before choosing.
```

Observe processing for at most 120 seconds and use one visible retry only if offered.

- [ ] **Step 3: Verify the neutral state**

Require `內容已完整收進知識庫；目前沒有足夠可靠、適合出題的英文項目。`, require no `開始 3–5 分鐘練習` CTA, and verify `Curious` is visible in knowledge.

- [ ] **Step 4: Verify the mobile viewport**

Set or select a `390 × 844` viewport using the documented browser API. Inspect `/learn/sources/new`, the reviewed reader, a round state that remains available, and `/learn/knowledge`. Require no horizontal overflow and no action hidden outside the reachable viewport.

- [ ] **Step 5: Verify the desktop viewport**

Use a desktop viewport at least `1280 × 800`. Repeat navigation through the same routes and require all primary controls and text to remain visible without overlap.

- [ ] **Step 6: Verify keyboard-only round controls**

On an available round, use Tab, Shift+Tab, Space, and Enter only to select an option, request a hint, confirm, reach feedback, and continue. Record the focused element before and after feedback and the next challenge. Do not create additional source data for this step.

- [ ] **Step 7: Record UAT-06 and UAT-08**

Write the neutral-state, viewport, overflow, focus, and keyboard results with concise evidence.

- [ ] **Step 8: Mark Task 6 complete in this plan**

Update the Task 6 checkboxes and continue to Task 7.

---

### Task 7: Classify Results and Apply the Repair Decision Gate

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`
- Conditional create: `docs/superpowers/plans/2026-08-12-learning-production-uat-fix-addendum.md`

**Interfaces:**

- Consumes: all completed or stopped UAT cases and captured browser/network evidence.
- Produces: either a no-code completion path or one reproducible defect packet and a ready isolated repair worktree.

- [x] **Step 1: Classify every non-pass result**

Use the approved definitions: P0 for blocked core journeys, cross-user data, loss, unrecoverable ingestion, unexpected `5xx`, or false ability evidence; P1 for recoverable but incorrect state, exclusion/persistence failure, keyboard/mobile blocking, or high-risk copy; P2 for minor non-blocking visual/copy defects.

- [x] **Step 2: Write a complete defect packet for each P0/P1**

Record exact URL, Asia/Taipei time, UAT source title, viewport, visible state, HTTP method/path/status, shortest reproduction, one retry/reload result, expected behavior, and actual behavior. Never record auth headers or secrets.

- [x] **Step 3: Take the no-bug path when applicable**

If all P0/P1 cases pass, set the report overall result to `PASS`, leave repair/PR/deployment sections as not required, skip Tasks 8–10, and execute Task 11.

- [x] **Step 4: Commit the pre-fix UAT evidence on the documentation branch**

On `codex/feature/learning-core-loop`, stage only the report and this plan, then commit:

```powershell
git add docs/uat/2026-08-12-learning-production-uat-report.md docs/superpowers/plans/2026-08-12-learning-production-uat.md
git commit -m "docs: record learning production UAT failure"
```

Preserve `.tmp/` and `frontend/test-results/` as unrelated untracked files.

- [x] **Step 5: Create the isolated repair worktree when a reproducible P0/P1 exists**

From `C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY`, fetch and create exactly:

```powershell
git fetch origin main
git worktree add "C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY-worktrees\learning-uat-fix-production" -b codex/fix/learning-uat-production origin/main
```

Verify the resolved worktree path is inside `C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY-worktrees` before creation. If the path or branch already exists, inspect it and reuse it only when clean and based on current `origin/main`; otherwise stop and report the collision.

- [x] **Step 6: Bring the approved UAT documents into the repair branch**

Cherry-pick only the local documentation commits that are newer than the already-merged feature branch tip:

```powershell
git -C "C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY-worktrees\learning-uat-fix-production" cherry-pick origin/codex/feature/learning-core-loop..codex/feature/learning-core-loop
```

Expected: the repair branch gains the approved UAT spec, this implementation plan, and the pre-fix UAT report without bringing old feature implementation commits back into the PR.

- [x] **Step 7: Verify a clean baseline in the repair worktree**

Run:

```powershell
git status --short --branch
cd backend
npm run build
npm test -- --runInBand
cd ..\frontend
npm run lint
npm run build
npm test
```

Expected: no uncommitted tracked changes; every command exits 0. Existing baseline failures stop implementation and must be recorded separately from the production defect.

- [x] **Step 8: Perform systematic root-cause analysis without editing code**

Invoke `superpowers:systematic-debugging`. Trace the browser failure through the exact request, Express mount, production composition, queue configuration, worker, repository, or frontend state boundary. Use read-only Cloud Run configuration/log checks where relevant. Do not infer root cause solely from the known route/env suspicions.

- [x] **Step 9: Write the failure-specific TDD addendum**

Create `docs/superpowers/plans/2026-08-12-learning-production-uat-fix-addendum.md` in the repair worktree. It must name exact source and test paths, quote the exact current signatures, include the complete failing test code, state the expected failure message, include the minimal implementation code, and list targeted and full verification commands. Run the writing-plans self-review before Task 8.

- [x] **Step 10: Mark Task 7 complete in this plan**

Record the chosen branch of the decision gate and, when applicable, the worktree and addendum paths.

---

### Task 8: Execute the Root-Cause-Specific Fix and Full Local Gate

**Files:**

- Read: `docs/superpowers/plans/2026-08-12-learning-production-uat-fix-addendum.md`
- Modify: only exact files declared by the addendum
- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`

**Interfaces:**

- Consumes: clean repair worktree, systematic root cause, and reviewed addendum from Task 7.
- Produces: minimal tested repair, green full local gate, commits, and self-review evidence.

- [x] **Step 1: Execute the addendum with TDD**

Invoke `superpowers:test-driven-development`. Run the exact red test first, confirm it fails for the documented root cause, implement only the addendum's minimal change, and run the exact green test. If the red failure differs, stop and revise the addendum before code changes.

- [x] **Step 2: Run all backend gates**

From `backend/` run:

```powershell
npm run build
npm test -- --runInBand
npm run test:learning:emulator
```

Expected: all exit 0. The emulator command must use the repository's fixed `demo-wippy-learning` project and must not point at production Firebase.

- [x] **Step 3: Run all frontend gates**

From `frontend/` run:

```powershell
npm run lint
npm run build
npm test
npm run test:e2e:learning
```

Expected: all exit 0, including the three existing learning canary E2E tests.

- [ ] **Step 4: Verify the backend container**

From the repair worktree root run the same Docker build/start/`/health` behavior used by `.github/workflows/ci.yml`. Require HTTP success before stopping the test container.

- [x] **Step 5: Perform verification-before-completion and self-review**

Invoke `superpowers:verification-before-completion`, then `superpowers:requesting-code-review`. Review UID ownership, `private, no-store`, Cloud Tasks OIDC audience/URL/route consistency, idempotency, secret exposure, debug routes, unrelated diff, and exact environment-variable names.

- [ ] **Step 6: Commit the repair in root-cause-sized commits**

Stage only addendum-declared source/tests/docs and the UAT report. Use one commit per independent root cause with a `fix:` subject, followed by a `test:` or `docs:` commit only when those changes are independently meaningful.

- [x] **Step 7: Record local verification**

Add exact commands, exit results, test counts when available, commit hashes, and review findings to the UAT report.

---

### Task 9: Prepare, Review, and Merge the Repair PR

**Files:**

- Read: `.github/workflows/ci.yml`
- Read: `.github/workflows/deploy.yml`
- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`

**Interfaces:**

- Consumes: clean committed repair branch with green local gates.
- Produces: pushed branch, PR, all-green CI, squash merge commit, and deployment run identifier.

- [ ] **Step 1: Prepare the PR**

Use the WiPPY PR preparation workflow. Push `codex/fix/learning-uat-production` and create a PR to `main` whose body includes production evidence, root cause, red/green test, privacy impact, full verification, and rollback note.

- [ ] **Step 2: Check all PR jobs**

Require success for:

```text
CI / Backend build and test
CI / Backend Docker readiness
CI / Frontend lint, build, and test
CI / Learning emulator E2E
```

Do not merge on pending, skipped, cancelled, neutral, timed out, or failed learning E2E.

- [ ] **Step 3: Perform final PR review**

Use the WiPPY PR check workflow and inspect the final diff against `origin/main`. Reconfirm the PR contains no unrelated files, secrets, production test tokens, weakened assertions, or broad rollout changes.

- [ ] **Step 4: Squash merge**

Use the WiPPY merge workflow only after every gate is green. Record the PR URL/number and squash merge SHA in the report.

- [ ] **Step 5: Wait for the production deployment**

Locate the `Deploy Production` workflow triggered by the merge SHA. Record its run URL/ID and wait until the production preflight and deploy jobs finish.

---

### Task 10: Verify the Deployment and Replay Production UAT

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: successful merge and deployment run from Task 9, existing browser binding, and original defect packet.
- Produces: deployment health evidence, production defect replay, happy-path regression result, and rollback decision.

- [ ] **Step 1: Verify deployment health**

Use the WiPPY deploy-check workflow to confirm the merge SHA reached Cloud Run and Firebase Hosting. Require Cloud Run service health, successful `/health`, and successful Hosting response.

- [ ] **Step 2: Replay the exact failed case**

Reuse the selected browser and the shortest reproduction from Task 7. Create new production data only if the failed case requires a new source, using a new compliant UAT title. Record before/after behavior and request statuses.

- [ ] **Step 3: Replay the core happy path**

Confirm access, reviewed ingestion, one supported answer, round completion, and knowledge visibility. Avoid repeating cases that would add unnecessary production data when an existing post-fix source can be used.

- [ ] **Step 4: Apply the rollback boundary**

If the original P0 persists, automatically revoke only the test UID's learning access when the UID is safely available. If it is not available, or if scheduler/queue/revision/hosting changes are needed, stop and request explicit user approval. Never delete learning data.

- [ ] **Step 5: Record deployment and replay results**

Write workflow status, Cloud Run/Hosting health, replay outcome, new UAT titles, rollback action, and any residual risk. Set the report overall result to `PASS` only when the original defect and core happy path both pass.

- [ ] **Step 6: Mark Task 10 complete in this plan**

Update all actually completed Task 10 checkboxes.

---

### Task 11: Finalize the UAT Report and Handoff

**Files:**

- Modify: `docs/uat/2026-08-12-learning-production-uat-report.md`
- Modify: `docs/superpowers/plans/2026-08-12-learning-production-uat.md`

**Interfaces:**

- Consumes: no-bug path from Task 7 or post-deploy path from Task 10.
- Produces: complete auditable report and concise user-facing result.

- [ ] **Step 1: Resolve every report state**

Replace every `NOT RUN` with `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE`, each with a reason and evidence. List both production source titles that were actually created; leave a case as `NOT APPLICABLE` when the stop condition prevented its source from being created.

- [ ] **Step 2: Verify report completeness**

Require the report to contain executed cases, test-data titles, defects/root causes, automated tests, local commands/results, PR/CI/merge/deploy references when applicable, post-deploy smoke, residual risks, and all high-risk global actions not taken.

- [ ] **Step 3: Run documentation checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors. Preserve unrelated `.tmp/` and `frontend/test-results/` entries without staging or deleting them.

- [ ] **Step 4: Commit the final report on the active task branch**

If no repair branch exists, commit the report and completed plan on `codex/feature/learning-core-loop` with:

```powershell
git add docs/uat/2026-08-12-learning-production-uat-report.md docs/superpowers/plans/2026-08-12-learning-production-uat.md
git commit -m "docs: record learning production UAT"
```

If a repair branch exists, the report must already be included in the repair PR; commit only remaining report/checklist updates before PR merge, or document post-merge deployment evidence locally without rewriting `main` history.

- [ ] **Step 5: Deliver the result**

Lead with production outcome. Include UAT totals, test-data titles, bug/fix summary, verification evidence, PR/merge/deploy status, rollback status, and links to the report and changed files.
