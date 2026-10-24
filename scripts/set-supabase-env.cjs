/**
 * Points .env at the NEW Supabase project. Run it yourself in a terminal opened in the project folder:
 *
 *     node scripts/set-supabase-env.cjs
 *
 * It asks for the project URL and the secret key, then updates only SUPABASE_URL, VITE_SUPABASE_URL and
 * SUPABASE_SECRET_KEY in .env (adding any that are missing). Every other line is kept exactly as it is, a backup
 * copy .env.backup-<time> is saved first, and the key is never printed.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV = path.resolve(process.cwd(), '.env');
const DEFAULT_URL = 'https://fjqlviyamyfbbnhtdwqx.supabase.co';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, answer => resolve(answer.trim())));

(async () => {
  if (!fs.existsSync(ENV)) throw new Error(`No .env found in ${process.cwd()}. Open the terminal in the project folder first.`);

  const url = (await ask(`New Supabase project URL [${DEFAULT_URL}]: `)) || DEFAULT_URL;
  const key = await ask('New SECRET key (starts with sb_secret_; it will not be shown again): ');
  rl.close();

  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) throw new Error('That does not look like a Supabase project URL (https://<ref>.supabase.co).');
  if (!key.startsWith('sb_secret_') || /\s/.test(key)) throw new Error('That is not a secret key. It must start with sb_secret_ (not the publishable key).');
  const cleanUrl = url.replace(/\/$/, '');

  const original = fs.readFileSync(ENV, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(`${ENV}.backup-${stamp}`, original);

  const wanted = { SUPABASE_URL: cleanUrl, VITE_SUPABASE_URL: cleanUrl, SUPABASE_SECRET_KEY: key };
  const lines = original.split(/\r?\n/);
  const seen = new Set();
  const updated = lines.map(line => {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/);
    if (m && wanted[m[1]] !== undefined) {
      seen.add(m[1]);
      return `${m[1]}=${wanted[m[1]]}`;
    }
    return line;
  });
  // Drop trailing blank lines before appending anything missing, then end the file with one newline.
  while (updated.length && updated[updated.length - 1].trim() === '') updated.pop();
  for (const name of Object.keys(wanted)) if (!seen.has(name)) updated.push(`${name}=${wanted[name]}`);
  fs.writeFileSync(ENV, updated.join(eol) + eol);

  const dotenv = require('dotenv');
  const parsed = dotenv.parse(fs.readFileSync(ENV));
  console.log('\nDone. .env now says:');
  console.log('  SUPABASE_URL        ->', new URL(parsed.SUPABASE_URL).host);
  console.log('  VITE_SUPABASE_URL   ->', new URL(parsed.VITE_SUPABASE_URL).host);
  console.log('  SUPABASE_SECRET_KEY -> saved (hidden)');
  console.log(`  Backup of the old file: ${path.basename(ENV)}.backup-${stamp}`);
  console.log('\nNow tell Claude: "done".');
})().catch(err => {
  try { rl.close(); } catch {}
  console.error('\nNothing was changed. ' + err.message);
  process.exit(1);
});
