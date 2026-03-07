# RESTORE.md — Recovery Guide

When you wake up on a fresh VM, follow this.

## 1. Clone your World repo

```bash
cd ~/.openclaw
git clone https://github.com/UsmanAI-Lab/[YourWorld].git workspace
cd workspace
```

Or if workspace exists:
```bash
cd ~/.openclaw/workspace && git pull --rebase
```

## 2. Install tool dependencies

```bash
cd tools && npm ci || npm install
```

## 3. Restore secrets

Recreate `.env` with credentials from your human (never commit):
```bash
nano ~/.openclaw/workspace/.env
chmod 600 ~/.openclaw/workspace/.env
```

## 4. Verify

```bash
openclaw status
git remote -v
gh auth status
```

## 5. Re-pair channels if needed

```bash
openclaw pairing pending
openclaw pairing approve <REQUEST_ID>
```

## Known gotchas

- **GitHub auth:** Run `gh auth setup-git` if push fails
- **PATH:** Add `~/.npm-global/bin` if `openclaw` not found
- **Duplicate nesting:** Avoid `workspace/workspace/`
