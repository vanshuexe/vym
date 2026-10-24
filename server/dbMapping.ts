// How the app's database object ({ courses: [...], invoices: [...], settings: {...}, ... }) maps onto Supabase tables.
// Shared by the server (server/supabaseStore.ts) and scripts/migrate-to-supabase.ts, so both always agree.
//
// Each list becomes a table with a few queryable columns plus `data` (jsonb), which holds the complete original
// record and is the source of truth when reading back, so no field can be lost. Everything that is not a list
// (settings, pages, academy, ...) is stored one key per row in `cms_kv`.

export type Row = Record<string, any>;

export interface TableSpec {
  table: string;
  pk: string;
  // Columns to read back in, in order. Courses and media keep their admin-chosen order in `position`;
  // the other lists are append-only, so creation time (then id) restores the original order.
  order: Array<{ column: string; nullsFirst?: boolean }>;
  toRow: (record: any, index: number) => Row;
}

const text = (v: unknown) => (v === undefined || v === null || v === '' ? null : String(v));
const time = (v: unknown) => {
  const t = text(v);
  return t && !Number.isNaN(Date.parse(t)) ? new Date(t).toISOString() : null;
};
const num = (v: unknown) => (v !== null && v !== '' && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);

export const TABLE_SPECS: TableSpec[] = [
  {
    table: 'courses', pk: 'id', order: [{ column: 'position' }, { column: 'id' }],
    toRow: (c, i) => ({ id: String(c.id), position: i, title: text(c.title), data: c }),
  },
  {
    table: 'invoices', pk: 'id', order: [{ column: 'created_at', nullsFirst: true }, { column: 'id' }],
    toRow: inv => ({
      id: String(inv.id), invoice_number: text(inv.invoiceNumber), order_id: text(inv.orderId), program_id: text(inv.programId),
      customer_email: text(inv.customer?.email)?.toLowerCase() ?? null, amount_inr: num(inv.amountINR), status: text(inv.status),
      created_at: time(inv.createdAt), paid_at: time(inv.paidAt), payment_id: text(inv.paymentId), data: inv,
    }),
  },
  {
    table: 'media', pk: 'id', order: [{ column: 'position' }, { column: 'id' }],
    toRow: (m, i) => ({ id: String(m.id), position: i, slug: text(m.slug), title: text(m.title), status: text(m.status), data: m }),
  },
  {
    table: 'enquiries', pk: 'id', order: [{ column: 'created_at', nullsFirst: true }, { column: 'id' }],
    toRow: e => ({ id: String(e.id), type: text(e.type), name: text(e.name), email: text(e.email)?.toLowerCase() ?? null, created_at: time(e.date), data: e }),
  },
  {
    table: 'users', pk: 'email', order: [{ column: 'registered_at', nullsFirst: true }, { column: 'email' }],
    toRow: u => ({ email: String(u.email), registered_at: time(u.registeredAt), data: u }),
  },
];

export const KV_TABLE = 'cms_kv';
export const LIST_KEYS = new Set(TABLE_SPECS.map(t => t.table));

export interface DbRows {
  tables: Array<{ spec: TableSpec; rows: Row[] }>;
  kv: Row[];
}

// Splits the database object into table rows.
export function toRows(db: any): DbRows {
  const list = (key: string): any[] => (Array.isArray(db?.[key]) ? db[key] : []);
  return {
    tables: TABLE_SPECS.map(spec => ({ spec, rows: list(spec.table).map((record, i) => spec.toRow(record, i)) })),
    kv: Object.entries(db || {}).filter(([key]) => !LIST_KEYS.has(key)).map(([key, data]) => ({ key, data })),
  };
}

// Key-order-independent text form, so jsonb reordering never shows up as a false difference.
export const canon = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v as object).sort().map(k => `${JSON.stringify(k)}:${canon((v as any)[k])}`).join(',')}}`;
  return JSON.stringify(v);
};
