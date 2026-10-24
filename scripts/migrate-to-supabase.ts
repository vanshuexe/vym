/**
 * Copies a cms-db.json backup into the NEW Supabase project and proves nothing was lost.
 *
 *   npx tsx scripts/migrate-to-supabase.ts            dry run: builds the rows and checks they rebuild the file exactly
 *   npx tsx scripts/migrate-to-supabase.ts --apply    writes to Supabase (empty tables only), reads everything back and compares
 *   npx tsx scripts/migrate-to-supabase.ts --verify   read-only: compares what is in Supabase right now with the file
 *   add  --file backups/cms-db.<stamp>.json  to use a specific file (default: the newest backup)
 *
 * --apply and --verify need NEW_SUPABASE_URL and NEW_SUPABASE_SECRET_KEY in the environment (.env or the command line).
 * The NEW_ prefix is deliberate, so this can never write into the old project by accident.
 * The JSON file is only ever read, never changed or deleted.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { KV_TABLE, LIST_KEYS, canon, toRows } from '../server/dbMapping';
import { createSupabaseStore } from '../server/supabaseStore';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const VERIFY = args.includes('--verify');
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : undefined;

const latestBackup = () => {
  const dir = path.resolve('backups');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^cms-db\..*\.json$/.test(f)).sort() : [];
  if (files.length === 0) throw new Error('No backup found in backups/. Create one first.');
  return path.join(dir, files[files.length - 1]);
};
const SOURCE = path.resolve(fileArg ?? latestBackup());
const db = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const rows = toRows(db);

const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
  return ok;
};
const info = (label: string) => console.log(`  info  ${label}`);

// The rows must rebuild the original file before anything is written.
function verifyOffline() {
  console.log(`Source: ${path.relative(process.cwd(), SOURCE)}`);
  let ok = true;
  for (const { spec, rows: tableRows } of rows.tables) {
    const original = Array.isArray(db[spec.table]) ? db[spec.table] : [];
    ok = check(`${spec.table}: ${tableRows.length} rows rebuild the original records exactly`, canon(tableRows.map(r => r.data)) === canon(original)) && ok;
    const keys = tableRows.map(r => r[spec.pk]);
    ok = check(`${spec.table}: primary keys unique`, new Set(keys).size === keys.length) && ok;
  }
  const original = Object.fromEntries(Object.entries(db).filter(([k]) => !LIST_KEYS.has(k)));
  ok = check(`${KV_TABLE}: ${rows.kv.length} entries (${rows.kv.map(r => r.key).join(', ') || 'none'}) rebuild the original`,
    canon(Object.fromEntries(rows.kv.map(r => [r.key, r.data]))) === canon(original)) && ok;
  console.log(`Total: ${rows.tables.reduce((n, t) => n + t.rows.length, 0) + rows.kv.length} rows across ${rows.tables.length + 1} tables`);
  return ok;
}

const connect = () => {
  const url = process.env.NEW_SUPABASE_URL;
  const key = process.env.NEW_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Set NEW_SUPABASE_URL and NEW_SUPABASE_SECRET_KEY (the NEW project) first.');
  if (url === process.env.OLD_SUPABASE_URL) throw new Error('NEW_SUPABASE_URL equals OLD_SUPABASE_URL. Refusing to continue.');
  console.log(`\nTarget: ${new URL(url).host}`);
  return { url, key };
};

// Reads Supabase back the same way the server does and compares it with the file. Content must match exactly;
// courses and media must also match in order, the other lists are reported if only their order differs.
async function compareWithSupabase(url: string, key: string) {
  const live = await createSupabaseStore(url, key).read();
  let ok = true;
  for (const { spec } of rows.tables) {
    const expected: any[] = Array.isArray(db[spec.table]) ? db[spec.table] : [];
    const actual: any[] = live[spec.table] ?? [];
    const bySort = (a: any, b: any) => canon(a).localeCompare(canon(b));
    const sameContent = canon([...actual].sort(bySort)) === canon([...expected].sort(bySort));
    const sameOrder = canon(actual) === canon(expected);
    const mustKeepOrder = spec.table === 'courses' || spec.table === 'media';
    ok = check(`${spec.table}: ${actual.length} of ${expected.length} records identical`, sameContent && actual.length === expected.length && (!mustKeepOrder || sameOrder)) && ok;
    if (sameContent && !sameOrder) info(`${spec.table}: same records, listed in a different order (restored by creation time)`);
  }
  const expectedKv = Object.fromEntries(Object.entries(db).filter(([k]) => !LIST_KEYS.has(k)));
  const actualKv = Object.fromEntries(Object.entries(live).filter(([k]) => !LIST_KEYS.has(k)));
  ok = check(`${KV_TABLE}: ${Object.keys(actualKv).length} of ${Object.keys(expectedKv).length} entries identical`, canon(actualKv) === canon(expectedKv)) && ok;
  return ok;
}

async function apply() {
  const { url, key } = connect();
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const targets = [...rows.tables.map(t => ({ table: t.spec.table, rows: t.rows })), { table: KV_TABLE, rows: rows.kv }];

  for (const t of targets) {
    const { data, error } = await supabase.from(t.table).select('*').limit(1);
    if (error) throw new Error(`Table "${t.table}" is not usable: ${error.message}. Run supabase/schema.sql in the new project's SQL Editor first.`);
    if ((data?.length ?? 0) > 0) throw new Error(`Table "${t.table}" already has rows. Refusing to write into a non-empty table.`);
  }
  for (const t of targets) {
    for (let i = 0; i < t.rows.length; i += 200) {
      const { error } = await supabase.from(t.table).insert(t.rows.slice(i, i + 200));
      if (error) throw new Error(`Writing "${t.table}" failed: ${error.message}. The JSON file is unchanged.`);
    }
    console.log(`  wrote ${String(t.rows.length).padStart(3)} rows -> ${t.table}`);
  }
  console.log('\nVerifying what is now in Supabase against the original file:');
  return compareWithSupabase(url, key);
}

(async () => {
  console.log(VERIFY ? 'MODE: verify (read-only)\n' : APPLY ? 'MODE: apply (writes to the new Supabase project)\n' : 'MODE: dry run (nothing is written anywhere)\n');
  if (VERIFY) {
    const { url, key } = connect();
    console.log(`Comparing Supabase with ${path.relative(process.cwd(), SOURCE)}:`);
    if (!(await compareWithSupabase(url, key))) throw new Error('Supabase and the file DIFFER.');
    console.log('\nSupabase matches the file exactly.');
    return;
  }
  if (!verifyOffline()) throw new Error('The row mapping does not rebuild the original file. Stopping before anything is written.');
  if (!APPLY) {
    console.log('\nDry run passed. Run again with --apply once the new project and keys are ready.');
    return;
  }
  if (!(await apply())) throw new Error('Verification FAILED. The original cms-db.json is untouched; do not switch the app over.');
  console.log('\nMigration complete and verified. cms-db.json and the backup were not modified.');
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
