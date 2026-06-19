---
name: wippy-release-status
description: Report what WiPPY version is currently in production by comparing main, recent deploy workflow runs, Cloud Run revision, and Firebase Hosting health. Use when the user asks "正式環境是哪個版本", "production 狀態", "現在上線的是哪版", "release status", or "目前正式版".
---

# WiPPY Release Status

Follow the shared command at `docs/agent-commands/wippy-release-status.md`.

This skill is only the Codex entrypoint. Do not duplicate operational steps here; the shared command is the source of truth for both Codex and Claude Code.
