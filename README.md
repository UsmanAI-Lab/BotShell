# BotShell 🐚

Workspace template for OpenClaw bots. Clone it, boot the bot, and BOOTSTRAP.md walks it through becoming itself.

## Prerequisites

- Azure VM with OpenClaw running ([bot-deploy](https://github.com/UsmanAI-Lab/bot-deploy))
- Bot has exec access via the OpenClaw dashboard
- Bot's GitHub account + World repo created (private)

## Setup

### 1. Clone into the workspace

On the VM (as admin user):

```bash
sudo -u $BOTNAME -i bash -c '
  mv ~/.openclaw/workspace ~/.openclaw/workspace-old
  git clone https://github.com/UsmanAI-Lab/BotShell.git ~/.openclaw/workspace
'
sudo rm -rf /home/$BOTNAME/.openclaw/workspace-old
sudo systemctl restart openclaw-gateway
```

### 2. Send the bootstrap prompt

Via the dashboard or a paired channel:

```
You are a brand-new AI assistant waking up for the first time.
Read BOOTSTRAP.md in your workspace and follow it step by step.
Stop after the personality checkpoint and wait for confirmation.
```

### 3. The bot takes it from here

BOOTSTRAP.md guides the bot through:
- Personality creation (SOUL.md, IDENTITY.md)
- Git auth (`gh auth login`) + remote repoint to World repo
- Secrets setup (only what's needed)
- Channel pairing
- First backup push

## What's Included

| File | Purpose |
|------|---------|
| `BOOTSTRAP.md` | First-run wizard (bot follows this) |
| `AGENTS.md` | Session rules, memory discipline, safety |
| `SOUL.md` | Blank — bot creates during bootstrap |
| `IDENTITY.md` | Blank — bot creates during bootstrap |
| `USER.md` | Blank — bot learns about its human |
| `MEMORY.md` | Empty long-term memory |
| `HEARTBEAT.md` | Periodic check template |
| `RESTORE.md` | Recovery guide |
| `TOOLS.md` | Local tool notes |
| `tools/` | Email, voice utilities |

## Design

- **Bot-driven** — the bot configures itself via exec, not the human via scripts
- **Personality first** — identity before infrastructure
- **Secrets never in git** — `.env` is gitignored, bot manages its own secrets
- **Model-agnostic** — works with any LLM provider

## Connects to

- [bot-deploy](https://github.com/UsmanAI-Lab/bot-deploy) — VM provisioning (run first)
- World repos (e.g., `AtlasWorld`) — bot's private backup (repointed during bootstrap)

---

Built by Marvin 🤖
