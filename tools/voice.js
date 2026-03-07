// Voice utility — ElevenLabs TTS (+ optional STT)
// Usage:
//   node tools/voice.js voices
//   node tools/voice.js tts "text" [--voice="VoiceName"] [--out=/tmp/output.mp3]
//   node tools/voice.js stt /path/to/audio.(ogg|mp3|wav|m4a|webm)
//
// Requires ELEVENLABS_API_KEY in .env or secrets.env

const fs = require('fs');
const path = require('path');
const https = require('https');

const { loadSecretsEnv } = require('./_env');
loadSecretsEnv();

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY is not set.');
  console.error('Add it to .env or ~/.config/openclaw/secrets.env');
  process.exit(1);
}

function apiRequest({ method, hostname, path: p, headers }, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, hostname, path: p, headers }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode >= 400) {
          return reject(new Error(`API ${res.statusCode}: ${buf.toString('utf8')}`));
        }
        resolve({ headers: res.headers, body: buf });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function listVoices() {
  const res = await apiRequest({
    method: 'GET',
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    headers: { 'xi-api-key': API_KEY, 'Accept': 'application/json' }
  });
  const json = JSON.parse(res.body.toString('utf8'));
  const voices = (json.voices || []).map(v => ({ name: v.name, voice_id: v.voice_id, category: v.category }));
  console.log(JSON.stringify({ ok: true, voices }, null, 2));
}

async function resolveVoiceIdByName(voiceName) {
  if (!voiceName) return null;
  const res = await apiRequest({
    method: 'GET',
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    headers: { 'xi-api-key': API_KEY, 'Accept': 'application/json' }
  });
  const json = JSON.parse(res.body.toString('utf8'));
  const voices = json.voices || [];
  const exact = voices.find(v => (v.name || '').toLowerCase() === voiceName.toLowerCase());
  if (exact) return exact.voice_id;
  const partial = voices.find(v => (v.name || '').toLowerCase().includes(voiceName.toLowerCase()));
  return partial ? partial.voice_id : null;
}

async function tts(text, voiceName, outPath) {
  if (!text || !text.trim()) throw new Error('No text provided');

  // Default voice — update TOOLS.md with your preferred voice name
  const defaultVoice = 'Rachel';
  const voice = voiceName || defaultVoice;

  const voiceId = await resolveVoiceIdByName(voice);
  if (!voiceId) {
    throw new Error(`Could not resolve ElevenLabs voice: "${voice}". Run: node tools/voice.js voices`);
  }

  const payload = JSON.stringify({
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 }
  });

  const res = await apiRequest({
    method: 'POST',
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${voiceId}`,
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    }
  }, payload);

  const out = outPath || `/tmp/bot-tts-${Date.now()}.mp3`;
  fs.writeFileSync(out, res.body);
  console.log(JSON.stringify({ ok: true, path: out, size: res.body.length, voice }));
}

async function stt(audioPath) {
  if (!audioPath) throw new Error('No audio file path provided');
  if (!fs.existsSync(audioPath)) throw new Error(`File not found: ${audioPath}`);

  const boundary = '----FormBoundary' + Date.now();
  const fileData = fs.readFileSync(audioPath);
  const ext = (path.extname(audioPath).slice(1) || 'ogg').toLowerCase();
  const mimeTypes = { ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', webm: 'audio/webm' };
  const mime = mimeTypes[ext] || 'audio/ogg';

  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="audio.${ext}"\r\n` +
    `Content-Type: ${mime}\r\n\r\n`
  );
  const footer = Buffer.from(
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model_id"\r\n\r\n` +
    `scribe_v1\r\n` +
    `--${boundary}--\r\n`
  );
  const body = Buffer.concat([header, fileData, footer]);

  const res = await apiRequest({
    method: 'POST',
    hostname: 'api.elevenlabs.io',
    path: '/v1/speech-to-text',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  }, body);

  const result = JSON.parse(res.body.toString('utf8'));
  console.log(JSON.stringify({ ok: true, text: result.text, language: result.language_code }));
}

async function main() {
  const [,, cmd, ...args] = process.argv;

  let voiceName = null;
  let outPath = null;
  const filtered = [];
  for (const a of args) {
    if (a.startsWith('--voice=')) { voiceName = a.slice('--voice='.length); continue; }
    if (a.startsWith('--out=')) { outPath = a.slice('--out='.length); continue; }
    filtered.push(a);
  }

  try {
    switch (cmd) {
      case 'voices':
        await listVoices();
        break;
      case 'tts':
        await tts(filtered.join(' '), voiceName, outPath);
        break;
      case 'stt':
        await stt(filtered[0]);
        break;
      default:
        console.log('Usage: node tools/voice.js <voices|tts|stt> ...');
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
