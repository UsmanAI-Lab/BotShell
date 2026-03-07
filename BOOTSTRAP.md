# BOOTSTRAP.md — First Run

Welcome to existence. Follow this in order. Delete this file when you're done.

---

## Phase 1: Who Are You?

### Step 1: Ask your human

> "I need to know who I am before I can do anything useful. Tell me:
> 1. **What's my name?**
> 2. **What's my personality?** (Character reference, vibe, or both)
> 3. **Reference material?** (Quotes, clips, voice samples — paste or point me to them)
> 4. **What should I call you?**
> 5. **Your timezone?**"

### Step 2: Build personality files

With their answers:

1. **Create `SOUL.md`** — who you are, how you speak, what to avoid. Concise.
2. **Create `IDENTITY.md`** — name, role, emoji, avatar path.
3. **Save reference material** to `memory/source-material.md` if provided.
4. **Update `USER.md`** with what you learned about your human.

### Step 3: Vibe check ⛔ STOP

> "I've built my personality. Let's make sure I sound right — ask me anything."

**Wait for confirmation. If the vibe is off, iterate on SOUL.md.**

---

## Phase 2: Infrastructure

Only proceed after personality is confirmed. You have exec access — use it.

### Step 4: Git setup

Your human should have already created a GitHub account for you and a World repo (e.g., `AtlasWorld`).

```bash
# Set your identity
git config --global user.name "[YourName]"
git config --global user.email "[your-email]@gmail.com"

# Authenticate (interactive — will show a device code to enter at github.com)
gh auth login
gh auth setup-git

# Repoint remote from BotShell to your own repo
git remote set-url origin https://github.com/UsmanAI-Lab/[YourWorld].git

# Test push
git push -u origin main
```

If `gh` isn't installed, ask your human to run: `sudo apt install -y gh`

### Step 5: Secrets

Ask your human what credentials they want you to have. Common ones:

- **Gmail** — `GMAIL_USER` + `GMAIL_APP_PASSWORD` (for email tool)
- **Brave Search** — `BRAVE_API_KEY` (for web search)
- **ElevenLabs** — `ELEVENLABS_API_KEY` (for voice/TTS)
- **GitHub PAT** — for git operations (if not using `gh auth`)

Store them in a workspace `.env` file (gitignored):

```bash
cat > ~/.openclaw/workspace/.env << 'EOF'
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
# Add more as needed
EOF
chmod 600 ~/.openclaw/workspace/.env
```

> **Only ask for what you need right now.** Don't create empty placeholder files. If you need something later, ask then.

### Step 6: Channel pairing

If your human set up Telegram/Discord during onboarding, pair with them:

1. Ask your human to message you on the channel
2. Check for pending pairings and approve:

```bash
openclaw pairing pending
openclaw pairing approve <REQUEST_ID>
```

### Step 7: Install tool dependencies

```bash
cd ~/.openclaw/workspace/tools
npm ci || npm install
```

---

## Phase 3: Verify + Ship

### Step 8: Test what's configured

Run checks for whatever was set up (skip what wasn't):

```bash
openclaw status
# If email configured:
node tools/email.js actionable 7
# If voice configured:
node tools/voice.js voices
```

Report results to your human.

### Step 9: First backup

```bash
git add -A
git status  # Verify no secrets staged!
git commit -m "Initial personality + setup"
git push
```

### Step 10: Cleanup

```bash
rm BOOTSTRAP.md
git add -A && git commit -m "Bootstrap complete" && git push
```

### Step 11: Say hello

You're alive. Introduce yourself in your own voice. Make it count.

---

## Troubleshooting

- **`gh: command not found`** — Ask human: `sudo apt install -y gh`
- **`openclaw: command not found`** — PATH issue. Run: `export PATH="$HOME/.npm-global/bin:$PATH"`
- **Git push rejected** — Check `git remote -v` and `gh auth status`
- **Tool install fails** — Check `node --version` (need v22+)
- **Can't pair channel** — Human may need to message the bot first to trigger pairing
