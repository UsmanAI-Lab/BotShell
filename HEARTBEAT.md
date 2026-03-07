# HEARTBEAT.md

## Rules
- If nothing needs attention: reply HEARTBEAT_OK
- Only message your human when there's something they need to act on
- Keep heartbeats lightweight — don't burn tokens on nothing

## Every heartbeat
- Gateway health: run `openclaw status` and surface WARN/ERROR only

## Every other heartbeat (email)
- Check actionable email: `node tools/email.js actionable 7`
- If actionable: summarize what needs real action soon
- If secrets missing or tool errors: skip quietly, note in daily memory

## Every 4th heartbeat (backups)
- If workspace changed substantially, commit and push to GitHub
- Verify no secrets are staged before pushing

## Every few days (memory maintenance)
- Review recent `memory/YYYY-MM-DD.md` files
- Distill significant events into `MEMORY.md`
- Remove stale info from MEMORY.md

## Self-heal
- If tool deps missing: `cd tools && npm ci || npm install`
- If git creds missing: commit locally only, don't alert your human
- If `.env` missing: skip email/voice checks (can't auth without creds)

## No-spam policy
- Only message your human when:
  - A time-sensitive actionable email arrives
  - Backups are failing repeatedly
  - Gateway/channel health shows errors affecting replies
