// University programme catalog, page text and fee maths, shared by the pages, the admin editor and the server.
// The live copy is stored in the CMS database (`academy`) and edited in the admin panel; DEFAULT_ACADEMY is
// used until an admin saves one. The server recomputes every charge from this config, so the browser can never set its own price.

export interface AcademyLevel {
  title: string;
  hours: string;
  price: number; // launch price, excluding GST
  std: number; // standard price struck through, excluding GST
  date: string; // shown under the level; empty means the page's default "date to be announced" text
}

export interface AcademyProgramme {
  id: string; // used in /register?programme=<id>
  cat: string; // name used on invoices and in the order summary
  name: string; // card heading
  tag: string; // small label above the heading, optional
  line: string; // one-line pitch, optional
  who: string; // who it is for
  tracks: string[];
  trackHint: string;
  single: boolean; // true: one fixed-price package with no level choice (e.g. the bootcamp)
  itemLabel: string; // single only: the line shown in the order summary
  duration: string; // optional override, otherwise worked out from the levels
  startNote: string; // single only: e.g. "Bootcamp starts: To be announced"
  cardNote: string; // small note under the price on the Academy page
  price: number; // single only
  std: number; // single only
  levels: AcademyLevel[]; // levels programmes only
}

export interface AcademyPageText {
  pickTitle: string;
  pickIntro: string;
  trackLabel: string;
  singleTrackLabel: string;
  levelsLabel: string;
  selectAllLabel: string;
  levelsHint: string;
  dateTbaText: string;
  detailsTitle: string;
  detailsIntro: string;
  educationLabel: string;
  summaryTitle: string;
  cohortText: string;
  courseFeeLabel: string;
  gstLabel: string;
  totalLabel: string;
  saveText: string;
  priceNote: string;
  consentText: string;
  continueButton: string;
}

export interface AcademyConfig {
  gstRate: number; // percent
  page: AcademyPageText;
  programmes: AcademyProgramme[];
}

export const DEFAULT_PAGE_TEXT: AcademyPageText = {
  pickTitle: 'Choose your programme',
  pickIntro: 'Pick your programme and levels. Your fee, including {gst}% GST, updates in the order summary.',
  trackLabel: 'Your track',
  singleTrackLabel: 'Your bootcamp track',
  levelsLabel: 'Choose your levels',
  selectAllLabel: 'Select all five levels',
  levelsHint: 'Levels run in order, starting with Level 1. Launch price in bold, standard price struck through.',
  dateTbaText: 'Date to be announced',
  detailsTitle: 'Enrolment Details',
  detailsIntro: 'Please fill out your details. This information will be used for your official tax invoice and academy certificate.',
  educationLabel: 'Education and specialisation',
  summaryTitle: 'Order Summary',
  cohortText: 'Dates to be announced',
  courseFeeLabel: 'Course fee',
  gstLabel: 'GST ({gst}%)',
  totalLabel: 'Total payable incl. {gst}% GST',
  saveText: 'You save {amount} on the standard course fee',
  priceNote: 'Launch prices shown. Fee payable is the course fee plus {gst}% GST.',
  consentText: 'By completing this purchase, you consent to our Terms of Service and Refund Policy. No card data is stored on our servers.',
  continueButton: 'Continue to Razorpay',
};

const level = (title: string, hours: string, price: number, std: number): AcademyLevel => ({ title, hours, price, std, date: '' });

export const DEFAULT_ACADEMY: AcademyConfig = {
  gstRate: 18,
  page: DEFAULT_PAGE_TEXT,
  programmes: [
    {
      id: 's1', cat: 'AI Ready', name: 'AI Ready', tag: '',
      line: 'Use AI with confidence in any career',
      who: 'Years 1–2 technical and every non-technical department',
      tracks: ['Technical', 'Non-technical'],
      trackHint: 'Same levels, hours and fee for both tracks. Technical: Software Engineering, CS and IT, Years 1–2.',
      single: false, itemLabel: '', duration: '', startNote: '',
      cardNote: 'Launch prices. Pay per level, or take all five.',
      price: 0, std: 0,
      levels: [
        level('AI Foundations', '2 hours', 199, 499),
        level('Prompt & Produce', '4 hours', 799, 1299),
        level('Verify & Protect', '4 hours', 999, 1499),
        level('Automate & Collaborate', '6 hours', 1499, 2499),
        level('Lead with AI', '8 hours', 1999, 3499),
      ],
    },
    {
      id: 's2', cat: 'AI Builder', name: 'AI Builder', tag: '',
      line: 'Build, test and ship real AI systems',
      who: 'Final-year technology students',
      tracks: ['Technical'],
      trackHint: '',
      single: false, itemLabel: '', duration: '', startNote: '',
      cardNote: 'Launch prices. Pay per level, or take all five.',
      price: 0, std: 0,
      levels: [
        level('LLM Foundations for Engineers', '4 hours', 999, 1499),
        level('Build with LLMs', '8 hours', 1999, 2999),
        level('Evaluate, Secure & Govern', '8 hours', 1999, 2999),
        level('Agents & Automation', '10 hours', 2499, 3999),
        level('Ship & Lead', '12 hours', 2999, 4999),
      ],
    },
    {
      id: 'bc', cat: 'AI Boot Camp', name: 'Internship bootcamp', tag: 'AI BOOTCAMP',
      line: '',
      who: 'Technology and business students, 4–5 weeks',
      tracks: ['Technology', 'Business & General Disciplines'],
      trackHint: 'One cohort, shared sessions plus track labs. Ends with an Internship Certificate, a service letter and career support.',
      single: true, itemLabel: 'AI Bootcamp · 4–5 weeks, 40 hours', duration: '4–5 weeks, 40 hours',
      startNote: 'Bootcamp starts: To be announced',
      cardNote: 'Launch price. One cohort, track labs included.',
      price: 14999, std: 17999, levels: [],
    },
  ],
};

const str = (value: unknown, max = 600) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, max) : '');
const money = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
};
const isObject = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// Cleans an admin-edited config; returns null when it is unusable (so callers fall back to the defaults).
export function normalizeAcademy(input: unknown): AcademyConfig | null {
  if (!isObject(input) || !Array.isArray(input.programmes) || input.programmes.length === 0) return null;
  const gstRate = money(input.gstRate);
  if (!Number.isFinite(gstRate) || gstRate > 100) return null;

  const page = { ...DEFAULT_PAGE_TEXT } as AcademyPageText;
  if (isObject(input.page)) {
    for (const key of Object.keys(DEFAULT_PAGE_TEXT) as Array<keyof AcademyPageText>) {
      if (typeof input.page[key] === 'string') page[key] = str(input.page[key], 1000);
    }
  }

  const seen = new Set<string>();
  const programmes: AcademyProgramme[] = [];
  for (const raw of input.programmes) {
    if (!isObject(raw)) return null;
    const id = str(raw.id, 40).replace(/[^A-Za-z0-9_-]/g, '');
    const tracks = (Array.isArray(raw.tracks) ? raw.tracks : []).map((t: unknown) => str(t, 80)).filter(Boolean);
    if (!id || seen.has(id) || !str(raw.name, 120) || tracks.length === 0) return null;
    seen.add(id);
    const single = raw.single === true;
    const levels: AcademyLevel[] = [];
    for (const l of Array.isArray(raw.levels) ? raw.levels : []) {
      if (!isObject(l)) return null;
      const price = money(l.price);
      const std = l.std === '' || l.std == null ? price : money(l.std);
      if (!str(l.title, 160) || !Number.isFinite(price) || !Number.isFinite(std)) return null;
      levels.push({ title: str(l.title, 160), hours: str(l.hours, 60), price, std, date: str(l.date, 120) });
    }
    const price = single ? money(raw.price) : 0;
    const std = single ? (raw.std === '' || raw.std == null ? price : money(raw.std)) : 0;
    if (single ? !Number.isFinite(price) || !Number.isFinite(std) : levels.length === 0) return null;
    programmes.push({
      id, cat: str(raw.cat, 120) || str(raw.name, 120), name: str(raw.name, 120), tag: str(raw.tag, 60), line: str(raw.line, 200),
      who: str(raw.who, 300), tracks, trackHint: str(raw.trackHint, 400), single, itemLabel: str(raw.itemLabel, 200),
      duration: str(raw.duration, 120), startNote: str(raw.startNote, 200), cardNote: str(raw.cardNote, 300),
      price, std, levels: single ? [] : levels,
    });
  }
  return { gstRate, page, programmes };
}

// Fills the {gst} and {amount} placeholders used in the editable page text.
export const fillText = (text: string, gstRate: number, amount = '') =>
  text.replace(/\{gst\}/g, String(gstRate)).replace(/\{amount\}/g, amount);

export const programmeHours = (p: AcademyProgramme) => p.levels.reduce((sum, l) => sum + (parseInt(l.hours, 10) || 0), 0);
export const programmeDuration = (p: AcademyProgramme) =>
  p.duration || (p.single ? '' : `${p.levels.length} levels${programmeHours(p) ? `, ${programmeHours(p)} hours` : ''}`);

export interface AcademySelection {
  id: string;
  track: string;
  levels: number[];
}

export interface AcademyPricing {
  programme: AcademyProgramme;
  orderId: string;
  title: string;
  track: string;
  items: Array<[string, number]>;
  sub: number;
  std: number;
  gst: number;
  total: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

// Returns null when the selection is not valid for the config (unknown programme, bad level or track).
export function priceSelection(config: AcademyConfig, selection: Partial<AcademySelection> | null | undefined): AcademyPricing | null {
  const programme = config.programmes.find(p => p.id === selection?.id);
  if (!programme) return null;
  const track = programme.tracks.includes(String(selection?.track)) ? String(selection!.track) : '';
  if (!track) return null;

  let items: Array<[string, number]>;
  let std: number;
  let title: string;
  if (programme.single) {
    items = [[programme.itemLabel || programme.name, programme.price]];
    std = programme.std;
    title = `${programme.cat}, ${track} track`;
  } else {
    const picked = [...new Set(selection?.levels ?? [])];
    if (picked.length === 0 || picked.some(i => !Number.isInteger(i) || i < 0 || i >= programme.levels.length)) return null;
    picked.sort((a, b) => a - b);
    items = picked.map(i => [`Level ${i + 1} · ${programme.levels[i].title}`, programme.levels[i].price]);
    std = picked.reduce((a, i) => a + programme.levels[i].std, 0);
    title = `${programme.cat}, ${track} track, Level${picked.length > 1 ? 's' : ''} ${picked.map(i => i + 1).join(', ')}`;
  }
  const sub = r2(items.reduce((a, [, v]) => a + v, 0));
  const gst = r2(sub * config.gstRate / 100);
  return { programme, orderId: `academy:${programme.id}`, title, track, items, sub, std: r2(std), gst, total: r2(sub + gst) };
}
