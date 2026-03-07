// Email utility (Gmail IMAP/SMTP)
// Usage:
//   node tools/email.js inbox [limit]
//   node tools/email.js unread [limit]
//   node tools/email.js actionable [days]
//   node tools/email.js since <YYYY-MM-DD> [limit]
//   node tools/email.js read <uid>
//   node tools/email.js send <to> <subject> <body...>
//   node tools/email.js handled <uid>
//
// Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env or secrets.env

const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const { loadSecretsEnv } = require('./_env');
loadSecretsEnv();

const GMAIL_USER = process.env.GMAIL_USER || process.env.GMAIL_ADDRESS;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('Error: GMAIL_USER and/or GMAIL_APP_PASSWORD not set.');
  console.error('Add them to .env or ~/.config/openclaw/secrets.env');
  process.exit(1);
}

const IMAP = { host: 'imap.gmail.com', port: 993, tls: true, tlsOptions: { rejectUnauthorized: false } };
const SMTP = { host: 'smtp.gmail.com', port: 465, secure: true };

// --- Handled tracking ---
const HANDLED_FILE = path.join(__dirname, '..', 'memory', 'email-handled.json');

function loadHandled() {
  try { return JSON.parse(fs.readFileSync(HANDLED_FILE, 'utf8')); }
  catch { return { handled: [] }; }
}

function saveHandled(data) {
  const dir = path.dirname(HANDLED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HANDLED_FILE, JSON.stringify(data, null, 2));
}

function markHandled(uid) {
  const data = loadHandled();
  const key = `gmail:${uid}`;
  if (!data.handled.includes(key)) data.handled.push(key);
  saveHandled(data);
  return { marked: key };
}

function isHandled(uid) {
  const data = loadHandled();
  return data.handled.includes(`gmail:${uid}`);
}

// --- Noise filter ---
const NOISE_PATTERNS = [
  /no-?reply@/i, /noreply@/i, /notifications?@github\.com/i,
  /accounts?\.google\.com/i, /mailer-daemon/i, /postmaster/i
];
function isNoise(from) {
  return NOISE_PATTERNS.some(p => p.test(from || ''));
}

function getImapConfig() {
  return { imap: { user: GMAIL_USER, password: GMAIL_APP_PASSWORD, ...IMAP } };
}

function getSmtpTransport() {
  return nodemailer.createTransport({ ...SMTP, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
}

async function getInbox(searchCriteria = ['ALL'], limit = 10) {
  const conn = await imaps.connect(getImapConfig());
  await conn.openBox('INBOX');
  const messages = await conn.search(searchCriteria, {
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'],
    struct: true
  });

  const results = messages.slice(-limit).reverse().map(msg => {
    const header = msg.parts.find(p => p.which === 'HEADER.FIELDS (FROM SUBJECT DATE)');
    const attrs = msg.attributes;
    return {
      uid: attrs.uid,
      date: attrs.date,
      flags: attrs.flags,
      from: header?.body?.from?.[0] || 'unknown',
      subject: header?.body?.subject?.[0] || '(no subject)'
    };
  });

  conn.end();
  return results;
}

async function getSince(dateStr, limit = 20) {
  const since = new Date(dateStr);
  return getInbox([['SINCE', since]], limit);
}

async function getActionable(sinceDays = 7) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const all = await getInbox([['SINCE', since]], 50);
  return all.filter(m => {
    if (isNoise(m.from)) return false;
    if (isHandled(m.uid)) return false;
    return true;
  });
}

async function readMessage(uid) {
  const conn = await imaps.connect(getImapConfig());
  await conn.openBox('INBOX');
  const messages = await conn.search([['UID', uid]], { bodies: [''], struct: true });
  if (!messages.length) { conn.end(); return null; }

  const raw = messages[0].parts.find(p => p.which === '')?.body || '';
  const parsed = await simpleParser(raw);
  conn.end();

  return {
    uid,
    from: parsed.from?.text,
    to: parsed.to?.text,
    subject: parsed.subject,
    date: parsed.date,
    text: parsed.text,
    html: parsed.html ? '(HTML content available)' : null
  };
}

async function sendEmail(to, subject, body) {
  const transport = getSmtpTransport();
  const result = await transport.sendMail({ from: GMAIL_USER, to, subject, text: body });
  return { messageId: result.messageId, accepted: result.accepted };
}

async function main() {
  const [,, cmd, ...args] = process.argv;
  const filteredArgs = args.filter(a => !a.startsWith('--account='));

  try {
    switch (cmd) {
      case 'inbox': {
        const limit = parseInt(filteredArgs[0]) || 10;
        console.log(JSON.stringify(await getInbox(['ALL'], limit), null, 2));
        break;
      }
      case 'unread': {
        const limit = parseInt(filteredArgs[0]) || 10;
        console.log(JSON.stringify(await getInbox(['UNSEEN'], limit), null, 2));
        break;
      }
      case 'actionable': {
        const days = parseInt(filteredArgs[0]) || 7;
        console.log(JSON.stringify(await getActionable(days), null, 2));
        break;
      }
      case 'since': {
        const date = filteredArgs[0];
        const limit = parseInt(filteredArgs[1]) || 20;
        console.log(JSON.stringify(await getSince(date, limit), null, 2));
        break;
      }
      case 'read': {
        const uid = parseInt(filteredArgs[0]);
        console.log(JSON.stringify(await readMessage(uid), null, 2));
        break;
      }
      case 'send': {
        const [to, subject, ...bodyParts] = filteredArgs;
        console.log(JSON.stringify(await sendEmail(to, subject, bodyParts.join(' ')), null, 2));
        break;
      }
      case 'handled': {
        const uid = parseInt(filteredArgs[0]);
        console.log(JSON.stringify(markHandled(uid), null, 2));
        break;
      }
      default:
        console.log('Usage: node tools/email.js <inbox|unread|actionable|since|read|send|handled> [args]');
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
