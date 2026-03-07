// Shared env loader for workspace tools.
// Loads secrets from multiple locations without relying on shell `source`.
// Priority: process.env > workspace .env > ~/.config/openclaw/secrets.env

const fs = require('fs');
const os = require('os');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1); // keep as-is (may contain spaces)
    if (!process.env[k]) process.env[k] = v;
  }
}

function loadSecretsEnv() {
  // Workspace .env (common setup)
  const workspaceEnv = path.join(__dirname, '..', '.env');
  loadEnvFile(workspaceEnv);

  // System-level secrets (systemd EnvironmentFile pattern)
  const systemEnv = path.join(os.homedir(), '.config', 'openclaw', 'secrets.env');
  loadEnvFile(systemEnv);
}

module.exports = { loadSecretsEnv };
