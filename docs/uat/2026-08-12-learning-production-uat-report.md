# WiPPY Learning Production UAT Report — 2026-08-12

- Target: https://wippy-mvp.web.app/learn
- Timezone: Asia/Taipei
- Account scope: current user-approved production account
- Overall result: FAIL — P0 completed-source reader failure

## Production test data

| Case | Source title | Result |
|---|---|---|
| Reviewed seed | `UAT-20260812-015530-reviewed-seed` | FAIL — source created and ingested; reader API returns 500 |
| Unreviewed source | Not created because the P0 stop condition fired | NOT APPLICABLE |

## UAT results

| ID | Priority | Case | Result | Evidence |
|---|---|---|---|---|
| UAT-01 | P0 | Login, access, navigation | PASS | 2026-08-12 01:54:22 Asia/Taipei；`/learn` 顯示探索首頁與四項 learning 導覽；`/learn/sources/new`、`/learn/round`、`/learn/knowledge` 均可進入；round `POST /api/learning/rounds` 201、knowledge `GET /api/learning/knowledge?limit=50` 200。 |
| UAT-02 | P0 | Reviewed source ingestion | FAIL | 2026-08-12 01:55:52 Asia/Taipei；`POST /api/learning/sources` 202 queued；run 先為 running，約 1 秒內 completed（16 items、2 verified）；`GET /api/learning/sources/6c6f2d63370f309d323206d49e4fd06f1ab55dde` 連續兩次 500 `internal_error`；reader 顯示 `Internal server error`。 |
| UAT-03 | P0 | Supported answer change | NOT APPLICABLE | P0 stop condition fired before the reader exposed the practice CTA. |
| UAT-04 | P0 | Direct answer, skip, completion | NOT APPLICABLE | P0 stop condition fired before a round could be started. |
| UAT-05 | P0 | Knowledge, exclusion, persistence | NOT APPLICABLE | P0 stop condition fired before knowledge verification. |
| UAT-06 | P1 | Unreviewed neutral state | NOT APPLICABLE | No second production source was created after the P0 failure. |
| UAT-07 | P1 | Low-pressure copy | NOT APPLICABLE | The complete learning flow was not reachable after the P0 failure. |
| UAT-08 | P1 | Mobile, desktop, keyboard | NOT APPLICABLE | Responsive and keyboard checks were stopped after the P0 failure. |

## Defects

### P0 — Completed source reader returns 500 after successful ingestion

- Time: 2026-08-12 01:55:52 Asia/Taipei
- Source title: `UAT-20260812-015530-reviewed-seed`
- Reader URL: `https://wippy-mvp.web.app/learn/sources/6c6f2d63370f309d323206d49e4fd06f1ab55dde?run=c928603742a4af486119961e2d4b36a0c8a4ed09`
- Source ID: `6c6f2d63370f309d323206d49e4fd06f1ab55dde`
- Run ID: `c928603742a4af486119961e2d4b36a0c8a4ed09`
- Reproduction: open `/learn/sources/new`; submit the reviewed UAT title and approved seed body; wait for navigation to the reader.
- Network sequence: source create 202 queued; run 200 running; source read 500; run 200 completed with `capturedItemCount: 16` and `verifiedItemCount: 2`; source read 500 again.
- Safe error body: `{"error":"Internal server error","code":"internal_error"}`.
- Visible result: `Internal server error` with no reader content or retry action.
- Expected: completed reader with both source sentences and `開始 3–5 分鐘練習`.
- Actual: ingestion succeeds, but the source projection cannot be read.
- Retry/reload: the application issued the source read twice; both returned 500. No visible retry control was available. No manual reload or additional source was created because unexpected 5xx is an immediate stop condition.
- Root cause: `FirestoreLearningRepository.getSource()` queries `learningSegments` by `userId`, `sourceId`, then ascending `ordinal`, while the deployed index file only defined the distinct `userId`, `sourceVersionId`, `ordinal` query. Production Firestore therefore rejected the reader query; the emulator does not enforce production composite-index availability.
- Repair: add the missing `learningSegments(userId ASC, sourceId ASC, ordinal ASC)` collection index and a deploy-artifact contract test. The existing `sourceVersionId` index remains because ingestion uses it independently.

## Local verification

- Repair worktree: `C:\Users\willy\Desktop\Side Project- WiPPY\WiPPY-worktrees\learning-uat-fix-production`
- Branch: `codex/fix/learning-uat-production`, based on production commit `48ccc38d5414f8b712c2dbe6c849313a2a3be042`.
- RED: `npm test -- --runInBand src/__tests__/learningIndexes.test.ts` failed 1/2 because the `sourceId` segment index was absent.
- GREEN: the same targeted command passed 2/2 after the index was added.
- Backend: `npm run build` passed; full Jest passed 38 suites / 297 tests (3 suites / 24 tests skipped); the two learning Firestore emulator suites passed 20/20 against the local `demo-wippy-learning` emulator.
- Frontend: lint and production build passed; Vitest passed 18 files / 171 tests; Playwright learning canary passed 3/3.
- `git diff --check` passed. Generated `.tmp/` and `frontend/test-results/` remain untracked and excluded from the repair.
- Backend container readiness was not runnable locally because this Windows host has no `docker` executable. The PR's mandatory `Backend Docker readiness` CI job remains the authoritative gate.
- Independent review: no Critical, Important, or Minor findings; the reviewer confirmed both segment indexes are necessary, field order/query scope are exact, deployment includes `firestore:indexes`, and no privacy/security-sensitive or unrelated tracked changes were introduced.

## PR, CI, and deployment

Not required unless a repair branch is created.

## Post-deploy production replay

Not required unless a repair branch is created.

## Residual risks

- Cross-account and Firestore rules remain covered by Emulator/integration tests, not a second production account.
