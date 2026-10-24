// Supabase (Postgres) storage for the app database. Exposes the same whole-database object that the JSON file
// used to hold, so the rest of server.ts does not change: read() builds it from the tables, and write() saves
// only what changed between the object as it was read and as it is after a mutation.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { KV_TABLE, TABLE_SPECS, canon, toRows, type Row } from './dbMapping';

const PAGE = 1000; // Supabase returns at most 1000 rows per request, so read in pages
const CHUNK = 200;

const fail = (action: string, error: { message: string }) => new Error(`Supabase: ${action} failed: ${error.message}`);

export interface SupabaseStore {
  host: string;
  ping: () => Promise<void>;
  read: () => Promise<any>;
  write: (before: any, after: any) => Promise<void>;
}

export function createSupabaseStore(url: string, secretKey: string): SupabaseStore {
  const supabase: SupabaseClient = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const selectAll = async (table: string, order: Array<{ column: string; nullsFirst?: boolean }>): Promise<Row[]> => {
    const rows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      let query = supabase.from(table).select('*');
      for (const o of order) query = query.order(o.column, { ascending: true, nullsFirst: o.nullsFirst ?? false });
      const { data, error } = await query.range(from, from + PAGE - 1);
      if (error) throw fail(`reading ${table}`, error);
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < PAGE) return rows;
    }
  };

  const read = async () => {
    const [lists, kv] = await Promise.all([
      Promise.all(TABLE_SPECS.map(spec => selectAll(spec.table, spec.order))),
      selectAll(KV_TABLE, [{ column: 'key' }]),
    ]);
    const db: any = {};
    TABLE_SPECS.forEach((spec, i) => { db[spec.table] = lists[i].map(row => row.data); });
    for (const row of kv) db[row.key] = row.data;
    return db;
  };

  const upsert = async (table: string, pk: string, rows: Row[]) => {
    const stamped = rows.map(row => ({ ...row, updated_at: new Date().toISOString() }));
    for (let i = 0; i < stamped.length; i += CHUNK) {
      const { error } = await supabase.from(table).upsert(stamped.slice(i, i + CHUNK), { onConflict: pk });
      if (error) throw fail(`saving ${table}`, error);
    }
  };
  const remove = async (table: string, pk: string, keys: string[]) => {
    for (let i = 0; i < keys.length; i += CHUNK) {
      const { error } = await supabase.from(table).delete().in(pk, keys.slice(i, i + CHUNK));
      if (error) throw fail(`deleting from ${table}`, error);
    }
  };

  // Rows that are new or different go up; rows that disappeared are deleted last, so a failure part-way never
  // removes anything before the new data is safely stored.
  const write = async (before: any, after: any) => {
    const was = toRows(before);
    const now = toRows(after);
    const pending: Array<() => Promise<void>> = [];

    const diff = (table: string, pk: string, oldRows: Row[], newRows: Row[]) => {
      const old = new Map(oldRows.map(r => [String(r[pk]), canon(r)]));
      const changed = newRows.filter(r => old.get(String(r[pk])) !== canon(r));
      const kept = new Set(newRows.map(r => String(r[pk])));
      const gone = [...old.keys()].filter(k => !kept.has(k));
      return { changed, gone, table, pk };
    };

    const diffs = [
      ...now.tables.map((t, i) => diff(t.spec.table, t.spec.pk, was.tables[i].rows, t.rows)),
      diff(KV_TABLE, 'key', was.kv, now.kv),
    ];
    for (const d of diffs) if (d.changed.length) pending.push(() => upsert(d.table, d.pk, d.changed));
    for (const d of diffs) if (d.gone.length) pending.push(() => remove(d.table, d.pk, d.gone));
    for (const step of pending) await step();
  };

  const ping = async () => {
    const { error } = await supabase.from(KV_TABLE).select('key').limit(1);
    if (error) throw fail(`connecting to ${new URL(url).host} (is SUPABASE_URL the new project, and was supabase/schema.sql run there?)`, error);
  };

  return { host: new URL(url).host, ping, read, write };
}
