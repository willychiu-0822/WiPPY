# WiPPY Shared Agent Commands

These files are the shared source of truth for both Codex skills and Claude Code commands.

- Codex entrypoints live in `.codex/skills/*/SKILL.md`.
- Claude Code entrypoints live in `.claude/commands/*.md`.
- Both should point here instead of duplicating operational logic.

When the PR/CICD process changes, update these shared command files first.
