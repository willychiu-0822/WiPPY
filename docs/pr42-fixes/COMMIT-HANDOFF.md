# PR42 安裝 UAT 提交交接

> 2026-11-10 續作：Git 已可寫，以下修復與指南均已依序提交；此頁保留歷史紀錄，**不要再執行下方提交命令**。最新提交與驗證見 RESULTS。

2026-11-10 11:05 本輪接續：本 session 的 `.git` 仍是唯讀掛載；`git add` 回覆 `Unable to create .../.git/index.lock: Read-only file system`。HEAD 仍為 `46b5eda`，沒有新增 commit、沒有 push。以下是供 Product Builder 在可寫 Git 環境操作的提交分組，不是已完成的 commit 清單。

產品修改已在此工作樹套用。`patches/` 的九份 patch 是備援，不要在目前工作樹重複套用。沒有修改 remote、merge、開 PR 或操作其他 lane。

## 逐項提交（在可寫 Git 環境執行）

```bash
git add backend/src/hub/queries.ts backend/src/__tests__/hub/queries.test.ts firestore.indexes.json
git commit -m 'fix(PR42-UAT-11): enforce current group access before limiting saved work'

git add backend/src/hub/accounts.ts backend/src/hub/http/auth.ts backend/src/__tests__/hub/accounts.test.ts backend/src/__tests__/hub/httpP1.test.ts frontend/src/hub/RoleGate.tsx frontend/src/__tests__/RoleRouting.test.tsx
git commit -m 'fix(PR42-UAT-08): explain disabled Instinct accounts consistently'

git add frontend/src/contexts/AuthContext.tsx frontend/src/__tests__/AuthContext.test.tsx
git commit -m 'fix(PR42-UAT-13): keep login state independent of profile writes'

git add backend/src/hub/actions.ts backend/src/__tests__/hub/actions.test.ts
git commit -m 'fix(PR42-UAT-14): deny saved work completion after group access is revoked'

git apply --cached docs/pr42-fixes/patches/PR42-UAT-15.patch
git commit -m 'fix(PR42-UAT-15): explain how to recover a disabled Instinct login'

git add backend/src/hub/http/agentRouter.ts
git commit -m 'fix(PR42-UAT-16): isolate completion keys and allow explicit recovery keys'

git apply --cached docs/pr42-fixes/patches/PR42-UAT-17.patch
git commit -m 'fix(PR42-UAT-17): make login fields and inbox work labels readable'

git add frontend/src/hub/pages/AgentsPage.tsx
git commit -m 'fix(PR42-UAT-18): make one-time Grok and Instinct credentials readable'

git add frontend/src/hub/pages/WorkbenchPage.tsx frontend/src/__tests__/HubPages.test.tsx
git commit -m 'fix(PR42-UAT-19): explain workbench failures and preserve retry inputs'

git add README.md docs/agent-hub-setup-guide.md docs/agent-hub/INSTALL-GROK-BOT-AND-INSTINCT.md
git commit -m 'docs(PR42-UAT-10): document verified Grok and Instinct installation'

git add .gitignore package.json package-lock.json playwright.config.js e2e docs/uat docs/pr42-fixes/RESULTS.md docs/pr42-fixes/COMMIT-HANDOFF.md docs/pr42-fixes/patches docs/pr42-fixes/evidence wippy-pr42-install-uat-result.md
git commit -m 'test(PR42-UAT-01): automate installation journeys and preserve UAT evidence'
```

LoginPage 同時包含 UAT-15 與 UAT-17，WorkbenchPage 同時包含 UAT-17 與 UAT-19；上列 UAT-15／UAT-17 使用 `git apply --cached` 只暫存該項修復，保留其餘工作樹變更，之後再獨立提交。請依序執行。

各項驗收及最新結果見 [RESULTS.md](RESULTS.md) 與 [UAT-RESULTS.md](../uat/UAT-RESULTS.md)。本輪無法產生可推送的新提交；且本訊息同時包含唯一腳本 push 授權與後段禁止 push 規則，因此沒有執行任何 push。沒有繞過 Git 唯讀保護。後續請 Product Builder 在可寫 Git 環境完成上述提交，再依最終授權處理推送。

`/workspace/codex-burn/notes/` 不在本 session 的可寫範圍，且使用者要求只在目前目錄寫入；摘要保存在 repo 根目錄 `wippy-pr42-install-uat-result.md`，由 Product Builder 複製到指定 notes 路徑。

後續雲端部署另須包含 `firestore.indexes.json` 新增的兩個 agentInbox 複合索引；本輪沒有部署索引、雲端服務或 tunnel。
