# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repo.

## Context

- **What this is:** a hackathon project (HACK2026). 4 people, ~36 hours.
- **Goal:** a working, demoable product by the deadline. Speed and a reliable demo matter more than polish, test coverage, or perfect architecture.
- **Project summary:** _TODO: one or two sentences on what we're building._

## Stack

_TODO: fill in once decided._

- Frontend:
- Backend:
- Database / storage:
- External APIs:
- Package manager:

## Commands

_TODO: keep these current so agents can run things without guessing._

```sh
# install
# run dev server
# lint / typecheck
# test (if any)
```

## Repo layout

_TODO: update as directories appear._

```
/            # root
```

## Working style

- **Keep changes small and focused.** Four people (plus their agents) are editing at the same time. Touch only the files the task needs. Don't reformat, rename, or reorganize code you weren't asked to change.
- **Don't add dependencies casually.** Prefer what's already installed. If a new package is genuinely needed, say so in the summary.
- **Make it work first.** Hardcoding, mock data, and TODOs are fine when they unblock the demo. Leave a `// TODO(hack):` comment so we can find them.
- **Don't break the main path.** Before finishing, run the app (or the relevant command) and confirm the core demo flow still works.
- **Ask instead of guessing** on product decisions (what a feature should do, what the UI should say). Decide on your own for routine implementation details.

## Git

- `main` should always run. Work on short-lived branches (`name/feature`) and merge often, at least every few hours, to avoid painful conflicts.
- Pull/rebase from `main` before starting a new task.
- Write short, descriptive commit messages.
- Don't force-push to `main` or rewrite shared history.
- Agents: only commit or push when asked.

## Secrets

- Never commit API keys, tokens, or `.env` files. Put secrets in `.env` (gitignored) and keep `.env.example` updated with the variable names.
- Don't paste secrets into code comments, logs, or commit messages.

## Ownership

_TODO: who owns which area, so agents (and people) know whose code they're touching._

| Area | Owner |
| ---- | ----- |
|      |       |
|      |       |
|      |       |
|      |       |
