---
name: wippy-check-deploy
description: Check whether WiPPY production deployment completed after a merge by inspecting GitHub Actions, Cloud Run health, and Firebase Hosting. Use when the user asks "確認部署", "有沒有上線", "merge 後部署成功嗎", "check deploy", or "確認正式環境".
---

# WiPPY Check Deploy

Follow the shared command at `docs/agent-commands/wippy-check-deploy.md`.

This skill is only the Codex entrypoint. Do not duplicate operational steps here; the shared command is the source of truth for both Codex and Claude Code.
