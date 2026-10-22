import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, IndianRupee, GraduationCap, FileText } from 'lucide-react';
import { DEFAULT_PAGE_TEXT, normalizeAcademy, type AcademyConfig, type AcademyPageText, type AcademyProgramme } from '../data/academyCatalog';

const inputClass = 'w-full p-2 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary bg-white';
const labelClass = 'block text-xs font-bold text-silver mb-1';
const cardClass = 'bg-white p-6 rounded-sm shadow-sm border border-silver/30';
const smallBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors';

const PAGE_FIELDS: Array<[keyof AcademyPageText, string, boolean]> = [
  ['pickTitle', 'Programme card: heading', false],
  ['pickIntro', 'Programme card: intro ({gst} = GST rate)', true],
  ['trackLabel', 'Track label (programmes with levels)', false],
  ['singleTrackLabel', 'Track label (single packages)', false],
  ['levelsLabel', 'Levels heading', false],
  ['selectAllLabel', 'Select-all button', false],
  ['levelsHint', 'Hint under the levels', true],
  ['dateTbaText', 'Level date when none is set', false],
  ['detailsTitle', 'Details form: heading', false],
  ['detailsIntro', 'Details form: intro', true],
  ['educationLabel', 'Education field label', false],
  ['summaryTitle', 'Order summary: heading', false],
  ['cohortText', 'Cohort / next start text', false],
  ['courseFeeLabel', 'Course fee line', false],
  ['gstLabel', 'GST line ({gst} = GST rate)', false],
  ['totalLabel', 'Total line ({gst} = GST rate)', false],
  ['saveText', 'Saving message ({amount} = saved amount)', false],
  ['priceNote', 'Note under the total ({gst} = GST rate)', true],
  ['consentText', 'Consent / terms text', true],
  ['continueButton', 'Continue button', false],
];

const newProgramme = (): AcademyProgramme => ({
  id: 'p' + Date.now().toString(36), cat: 'New programme', name: 'New programme', tag: '', line: '', who: '',
  tracks: ['General'], trackHint: '', single: false, itemLabel: '', duration: '', startNote: '', cardNote: '',
  price: 0, std: 0, levels: [{ title: 'Level 1', hours: '', price: 0, std: 0, date: '' }],
});

const rupees = (n: unknown) => {
  const value = Number(n);
  return Number.isFinite(value) ? '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
};

export function AcademyEditor({ academy, onChange }: { academy: AcademyConfig; onChange: (next: AcademyConfig) => void }) {
  const valid = normalizeAcademy(academy) !== null;
  const gst = Number(academy.gstRate) || 0;
  const withGst = (price: unknown) => rupees(Math.round(Number(price) * (1 + gst / 100) * 100) / 100);

  const setProgramme = (idx: number, patch: Partial<AcademyProgramme>) =>
    onChange({ ...academy, programmes: academy.programmes.map((p, i) => (i === idx ? { ...p, ...patch } : p)) });
  const moveProgramme = (idx: number, dir: -1 | 1) => {
    const list = [...academy.programmes];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    onChange({ ...academy, programmes: list });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm text-sm text-ink/80">
        This controls the enrolment page (<strong>/register</strong>) and the programme cards on the Academy page. Prices are entered <strong>excluding GST</strong>;
        the GST rate below is added at checkout and the server charges exactly what is shown here. Remember to press <strong>Save Database</strong>.
      </div>
      {!valid && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-sm text-sm font-medium text-red-700">
          Something here cannot be saved yet. Check that every programme has an ID, a name, at least one track and, for levels programmes, at least one level with a title and a price; and that the GST rate is between 0 and 100.
        </div>
      )}

      <div className={cardClass}>
        <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2"><IndianRupee size={16} className="text-primary" /> GST</h3>
        <div className="max-w-xs">
          <label className={labelClass}>GST rate (%) added to every price</label>
          <input type="number" min={0} max={100} step="0.01" value={academy.gstRate as any} onChange={e => onChange({ ...academy, gstRate: e.target.value as any })} className={inputClass} />
        </div>
      </div>

      {academy.programmes.map((p, idx) => (
        <div key={p.id} className={cardClass}>
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2"><GraduationCap size={16} className="text-primary" /> {p.name || 'Untitled'} <span className="text-xs font-mono text-silver font-normal">(ID: {p.id})</span></h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => moveProgramme(idx, -1)} disabled={idx === 0} aria-label="Move up" className="p-2 text-silver hover:text-primary disabled:opacity-30"><ArrowUp size={16} /></button>
              <button type="button" onClick={() => moveProgramme(idx, 1)} disabled={idx === academy.programmes.length - 1} aria-label="Move down" className="p-2 text-silver hover:text-primary disabled:opacity-30"><ArrowDown size={16} /></button>
              <button
                type="button"
                disabled={academy.programmes.length === 1}
                onClick={() => { if (window.confirm(`Remove "${p.name}"? Existing orders and invoices keep their details.`)) onChange({ ...academy, programmes: academy.programmes.filter((_, i) => i !== idx) }); }}
                aria-label={`Remove ${p.name}`}
                className="p-2 text-silver hover:text-red-600 disabled:opacity-30"
              ><Trash2 size={16} /></button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Card heading</label><input type="text" value={p.name} onChange={e => setProgramme(idx, { name: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Name on invoices and order summary</label><input type="text" value={p.cat} onChange={e => setProgramme(idx, { cat: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Small label above the heading (optional)</label><input type="text" value={p.tag} onChange={e => setProgramme(idx, { tag: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>One-line pitch (optional)</label><input type="text" value={p.line} onChange={e => setProgramme(idx, { line: e.target.value })} className={inputClass} /></div>
            <div className="md:col-span-2"><label className={labelClass}>Who it is for</label><input type="text" value={p.who} onChange={e => setProgramme(idx, { who: e.target.value })} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Tracks (one per line; students pick one)</label>
              <textarea rows={3} value={p.tracks.join('\n')} onChange={e => setProgramme(idx, { tracks: e.target.value.split('\n') })} className={inputClass} />
            </div>
            <div><label className={labelClass}>Hint under the tracks (optional)</label><textarea rows={3} value={p.trackHint} onChange={e => setProgramme(idx, { trackHint: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Note under the price on the Academy page</label><input type="text" value={p.cardNote} onChange={e => setProgramme(idx, { cardNote: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Duration text (blank = worked out from the levels)</label><input type="text" value={p.duration} onChange={e => setProgramme(idx, { duration: e.target.value })} placeholder="e.g. 5 levels, 24 hours" className={inputClass} /></div>
          </div>

          <label className="mt-5 flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={p.single} onChange={e => setProgramme(idx, { single: e.target.checked })} className="w-4 h-4" />
            Single fixed-price package (no level choice, e.g. a bootcamp)
          </label>

          {p.single ? (
            <div className="mt-5 pt-5 border-t border-silver/20 grid md:grid-cols-3 gap-4">
              <div><label className={labelClass}>Price (excl. GST) *</label><input type="number" min={0} value={p.price as any} onChange={e => setProgramme(idx, { price: e.target.value as any })} className={inputClass} /><p className="text-xs text-silver mt-1">Customer pays {withGst(p.price)}</p></div>
              <div><label className={labelClass}>Standard price (struck through, optional)</label><input type="number" min={0} value={p.std as any} onChange={e => setProgramme(idx, { std: e.target.value as any })} className={inputClass} /></div>
              <div><label className={labelClass}>Line in the order summary</label><input type="text" value={p.itemLabel} onChange={e => setProgramme(idx, { itemLabel: e.target.value })} className={inputClass} /></div>
              <div className="md:col-span-3"><label className={labelClass}>Start note (optional)</label><input type="text" value={p.startNote} onChange={e => setProgramme(idx, { startNote: e.target.value })} placeholder="e.g. Bootcamp starts: 3 Nov 2026" className={inputClass} /></div>
            </div>
          ) : (
            <div className="mt-5 pt-5 border-t border-silver/20">
              <h4 className="text-sm font-bold text-ink mb-1">Levels</h4>
              <p className="text-xs text-silver mb-3">Students tick the levels they want. Prices exclude GST; leave the standard price equal to the price (or empty) for no strike-through.</p>
              <div className="hidden md:grid grid-cols-[1.6fr_6rem_6.5rem_6.5rem_1.2fr_2.5rem] gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-silver">
                <span>Title</span><span>Hours</span><span>Price</span><span>Standard</span><span>Date shown</span><span />
              </div>
              <div className="space-y-2">
                {p.levels.map((l, lIdx) => {
                  const setLevel = (patch: Partial<typeof l>) => setProgramme(idx, { levels: p.levels.map((x, i) => (i === lIdx ? { ...x, ...patch } : x)) });
                  return (
                    <div key={lIdx}>
                      <div className="grid md:grid-cols-[1.6fr_6rem_6.5rem_6.5rem_1.2fr_2.5rem] gap-2 items-center">
                        <input type="text" value={l.title} onChange={e => setLevel({ title: e.target.value })} placeholder={`Level ${lIdx + 1} title`} aria-label={`Level ${lIdx + 1} title`} className={inputClass} />
                        <input type="text" value={l.hours} onChange={e => setLevel({ hours: e.target.value })} placeholder="4 hours" aria-label="Hours" className={inputClass} />
                        <input type="number" min={0} value={l.price as any} onChange={e => setLevel({ price: e.target.value as any })} aria-label="Price" className={inputClass} />
                        <input type="number" min={0} value={l.std as any} onChange={e => setLevel({ std: e.target.value as any })} aria-label="Standard price" className={inputClass} />
                        <input type="text" value={l.date} onChange={e => setLevel({ date: e.target.value })} placeholder="e.g. 12 Nov, 6 pm" aria-label="Date shown" className={inputClass} />
                        <button type="button" onClick={() => setProgramme(idx, { levels: p.levels.filter((_, i) => i !== lIdx) })} disabled={p.levels.length === 1} aria-label={`Remove level ${lIdx + 1}`} className="p-2 text-silver hover:text-red-600 disabled:opacity-30 justify-self-start"><Trash2 size={16} /></button>
                      </div>
                      <p className="mt-0.5 text-xs text-silver">Customer pays {withGst(l.price)} including GST</p>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => setProgramme(idx, { levels: [...p.levels, { title: '', hours: '', price: 0, std: 0, date: '' }] })} className={`mt-3 ${smallBtn}`}><Plus size={14} /> Add level</button>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={() => onChange({ ...academy, programmes: [...academy.programmes, newProgramme()] })} className={smallBtn}><Plus size={14} /> Add programme</button>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold font-heading flex items-center gap-2"><FileText size={16} className="text-primary" /> Page text</h3>
          <button type="button" onClick={() => { if (window.confirm('Put every page text back to the original wording?')) onChange({ ...academy, page: { ...DEFAULT_PAGE_TEXT } }); }} className={smallBtn}>Restore original text</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {PAGE_FIELDS.map(([key, label, long]) => (
            <div key={key} className={long ? 'md:col-span-2' : ''}>
              <label className={labelClass}>{label}</label>
              {long
                ? <textarea rows={2} value={academy.page[key]} onChange={e => onChange({ ...academy, page: { ...academy.page, [key]: e.target.value } })} className={inputClass} />
                : <input type="text" value={academy.page[key]} onChange={e => onChange({ ...academy, page: { ...academy.page, [key]: e.target.value } })} className={inputClass} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
