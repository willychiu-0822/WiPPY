# WiPPY Shared Agent Commands

These files are the shared source of truth for both Codex skills and Claude Code commands.

- Codex entrypoints live in `.codex/skills/*/SKILL.md`.
- Claude Code entrypoints live in `.claude/commands/*.md`.
- Both should point here instead of duplicating operational logic.

When the PR/CICD process changes, update these shared command files first.

## PR Testing Gate

Both Codex and Claude Code must use `docs/agent-commands/wippy-prepare-pr.md` before opening a PR.

That shared command includes the Testing Impact Gate. Do not create a PR from either agent until required new or updated tests are added, existing coverage is identified, or the PR body documents why no automated test is appropriate.
