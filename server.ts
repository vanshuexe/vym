import 'dotenv/config';
import express from 'express';
import path from 'path';
import { promisify } from 'util';
import { GoogleGenAI } from '@google/genai';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs-extra';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = Number(process.env.PORT) || 8980;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
// Behind a reverse proxy (Cloud Run, Nginx, ...) set TRUST_PROXY=1 so rate limits see the real client IP.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.use(express.json({
  limit: '1mb',
  // Razorpay webhooks are signed over the exact raw request body.
  verify: (req: any, _res, buf) => { req.rawBody = buf; }
}));

const DB_PATH = path.resolve(process.env.CMS_DB_PATH || path.join(process.cwd(), 'cms-db.json'));
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[auth] JWT_SECRET is not set; using a random secret. Everyone is signed out whenever the server restarts.');
  return crypto.randomBytes(48).toString('base64url');
})();
const JWT_VERIFY_OPTIONS: jwt.VerifyOptions = { algorithms: ['HS256'] };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Express 4 does not catch rejected promises; forward them to the error handler instead of hanging the request.
const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<unknown>) =>
  (req: any, res: any, next: any) => { fn(req, res, next).catch(next); };

const rateLimit = ({ windowMs, max, message }: { windowMs: number; max: number; message: string }) => {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();
  return (req: any, res: any, next: any) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
};

const adminLoginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, message: 'Too many login attempts. Please wait 15 minutes and try again.' });
const userAuthLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: 'Too many login attempts. Please wait a few minutes and try again.' });
const contactLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, message: 'Too many submissions. Please wait a few minutes and try again.' });
const chatLimiter = rateLimit({ windowMs: 5 * 60_000, max: 30, message: 'Too many messages. Please wait a moment and try again.' });
const orderLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: 'Too many checkout attempts. Please wait a few minutes and try again.' });

const cleanText = (value: unknown, maxLength = 200) =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, maxLength) : '';
const pickText = (source: any, fields: string[], maxLength = 200) =>
  Object.fromEntries(fields.map(key => [key, cleanText(source?.[key], maxLength)]));
const pickFlags = (source: any, fields: string[]) =>
  Object.fromEntries(fields.map(key => [key, source?.[key] === true]));
const isPlainObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(
  crypto.createHash('sha256').update(a).digest(),
  crypto.createHash('sha256').update(b).digest()
);
const hmacMatches = (payload: string, secret: string, signatureHex: unknown) => {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  const provided = Buffer.from(String(signatureHex || ''), 'hex');
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};

const readDB = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
    return { courses: [], media: [], enquiries: [], invoices: [], settings: {} };
  }
};

const writeDB = async (data: any) => {
  const tempPath = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, DB_PATH);
};
let mutationQueue: Promise<unknown> = Promise.resolve();
const mutateDB = <T>(mutator: (db: any) => Promise<T> | T): Promise<T> => {
  const task = mutationQueue.then(async () => {
    const db = await readDB();
    const result = await mutator(db);
    await writeDB(db);
    return result;
  });
  mutationQueue = task.catch(() => undefined);
  return task;
};

const scrypt = promisify(crypto.scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const isHashedPassword = (stored: unknown) => String(stored ?? '').startsWith('scrypt$');
const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
};
const verifyPassword = async (password: string, stored: unknown) => {
  const value = String(stored ?? '');
  // Legacy accounts stored plaintext; they are hashed on startup and on their next login.
  if (!isHashedPassword(value)) return value.length > 0 && safeEqual(password, value);
  const [, salt, storedHash] = value.split('$');
  const expected = Buffer.from(storedHash || '', 'hex');
  const actual = await scrypt(password, salt, 64);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const migratePlaintextPasswords = async () => {
  const snapshot = await readDB();
  if (!(snapshot.users || []).some((user: any) => user.password && !isHashedPassword(user.password))) return;
  const upgraded = await mutateDB(async db => {
    let count = 0;
    for (const user of db.users || []) {
      if (user.password && !isHashedPassword(user.password)) {
        user.password = await hashPassword(String(user.password));
        count += 1;
      }
    }
    return count;
  });
  console.log(`[auth] Hashed ${upgraded} legacy plaintext password(s) in ${path.basename(DB_PATH)}.`);
};

// Course prices are display strings such as "INR 2,499"; take the first number in them.
const parsePriceINR = (price: unknown) => {
  const match = String(price ?? '').match(/\d[\d,]*(?:\.\d{1,2})?/);
  return match ? Number(match[0].replace(/,/g, '')) : NaN;
};
const toPaise = (amountINR: unknown) => Math.round(Number(amountINR) * 100);

// A course session ({ name, dates }) as one display string; the checkout form builds the same string.
const formatSession = (session: any) =>
  [cleanText(session?.name), cleanText(session?.dates)].filter(Boolean).join(' · ');

// Session days are judged in India time, where the workshops run.
const SESSION_TIME_ZONE = process.env.SESSION_TIME_ZONE || 'Asia/Kolkata';
const todayInSessionZone = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: SESSION_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
// A session is open for enrolment through its last day (endDate, YYYY-MM-DD); without one it never closes.
const isSessionOpen = (session: any, today = todayInSessionZone()) =>
  !/^\d{4}-\d{2}-\d{2}$/.test(String(session?.endDate || '')) || session.endDate >= today;

// Public view of a course: only sessions still open, plus whether every configured session has ended.
const publicCourse = (course: any) => {
  if (!Array.isArray(course?.sessions)) return course;
  const today = todayInSessionZone();
  const configured = course.sessions.filter((session: any) => formatSession(session));
  const sessions = configured.filter((session: any) => isSessionOpen(session, today));
  return { ...course, sessions, sessionsClosed: configured.length > 0 && sessions.length === 0 };
};

// Whether the session booked on an invoice has already taken place.
const hasInvoiceSessionEnded = (invoice: any, courses: any[]) => {
  if (!invoice?.customer?.session) return false;
  const course = (courses || []).find((entry: any) => entry.id === invoice.programId);
  const session = (course?.sessions || []).find((entry: any) => formatSession(entry) === invoice.customer.session);
  return Boolean(session) && !isSessionOpen(session);
};

const escapePdfText = (value: unknown) => String(value ?? '-')
  .replace(/[·–—]/g, '-')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')
  .replace(/[^\x20-\x7E]/g, '');

const buildInvoicePdf = (invoice: any) => {
  const customer = invoice.customer || {};
  const address = [customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '-';
  const lines = [
    'VYOMATRIX.AI',
    'Academy Invoice',
    '',
    `Invoice: ${invoice.invoiceNumber || invoice.id}`,
    `Status: ${invoice.status || 'Unpaid'}`,
    `Created: ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleString('en-IN') : '-'}`,
    invoice.paidAt ? `Paid: ${new Date(invoice.paidAt).toLocaleString('en-IN')}` : '',
    '',
    'Billed to',
    `Name: ${customer.name || '-'}`,
    `Email: ${customer.email || '-'}`,
    `Phone: ${customer.phone || '-'}`,
    `Address: ${address}`,
    `Organization: ${customer.organization || customer.college || '-'}`,
    '',
    'Order details',
    `Service / Course: ${invoice.programTitle || invoice.programId || '-'}`,
    ...(customer.session ? [`Session: ${customer.session}`] : []),
    `Order ID: ${invoice.orderId || '-'}`,
    `Payment ID: ${invoice.paymentId || 'Not paid yet'}`,
    `Amount: INR ${Number(invoice.amountINR || 0).toLocaleString('en-IN')}`,
    '',
    'Thank you for choosing Vyomatrix.ai.',
    invoice.status === 'Paid' ? 'This invoice confirms payment received through Razorpay.' : 'Payment is pending through Razorpay.'
  ].flatMap(line => {
    const text = String(line);
    if (text.length <= 88) return [text];
    return text.match(/.{1,88}(?:\s|$)/g)?.map(part => part.trim()) || [text];
  });
  const commands = ['BT', '/F1 20 Tf', '50 760 Td'];
  lines.forEach((line, index) => {
    if (index > 0) commands.push('0 -26 Td');
    const fontSize = index === 0 ? 20 : index === 1 ? 14 : 10;
    commands.push(`/F1 ${fontSize} Tf (${escapePdfText(line)}) Tj`);
  });
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
};

// Middleware to protect CMS routes
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS) as any;
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to protect user routes
const authenticateUser = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS) as any;
    if (payload.role !== 'user' || !payload.email) return res.status(403).json({ error: 'User access required' });
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const authenticateInvoiceViewer = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// CMS Authentication
app.post('/api/admin/login', adminLoginLimiter, (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin login is not configured on the server.' });
  if (typeof password === 'string' && password.length > 0 && safeEqual(password, process.env.ADMIN_PASSWORD)) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// User Authentication
app.post('/api/user/auth', userAuthLimiter, asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email || typeof password !== 'string' || !password) return res.status(400).json({ error: 'Email and password are required' });
  const mode = req.body.mode === 'signup' ? 'signup' : 'login';
  if (!EMAIL_PATTERN.test(email) || email.length > 254 || password.length > 256 || (mode === 'signup' && password.length < 8)) {
    return res.status(400).json({ error: mode === 'signup' ? 'Enter a valid email and a password of at least 8 characters.' : 'Enter a valid email and password.' });
  }
  const findUser = (db: any) => (db.users || []).find((u: any) => String(u.email).toLowerCase() === email);

  if (mode === 'signup') {
    const passwordHash = await hashPassword(password);
    const created = await mutateDB(db => {
      if (findUser(db)) return null;
      const user = { email, password: passwordHash, registeredAt: new Date().toISOString() };
      db.users = db.users || [];
      db.users.push(user);
      return user;
    });
    if (!created) return res.status(409).json({ error: 'An account already exists for this email. Please log in.' });
  } else {
    const user = findUser(await readDB());
    if (!user) return res.status(401).json({ error: 'No account exists for this email. Please sign up.' });
    if (!(await verifyPassword(password, user.password))) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!isHashedPassword(user.password)) {
      const passwordHash = await hashPassword(password);
      await mutateDB(db => {
        const current = findUser(db);
        if (current && current.password === user.password) current.password = passwordHash;
      });
    }
  }

  const token = jwt.sign({ role: 'user', email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { email } });
}));

// User Dashboard Data
app.get('/api/user/me', authenticateUser, asyncHandler(async (req: any, res) => {
  const db = await readDB();
  const userEmail = String(req.user.email).toLowerCase();

  // Find all orders associated with this email
  const userOrders = (db.enquiries || [])
    .filter((e: any) => e.type === 'Academy Enrolment' && String(e.details?.email || '').toLowerCase() === userEmail)
    .reverse();
  const userInvoices = (db.invoices || [])
    .filter((invoice: any) => String(invoice.customer?.email || '').toLowerCase() === userEmail)
    .map((invoice: any) => ({ ...invoice, sessionEnded: invoice.status !== 'Paid' && hasInvoiceSessionEnded(invoice, db.courses) }))
    .reverse();

  res.json({
    email: userEmail,
    orders: userOrders,
    invoices: userInvoices
  });
}));

app.get('/api/invoices/:id/pdf', authenticateInvoiceViewer, asyncHandler(async (req: any, res) => {
  const db = await readDB();
  const invoice = (db.invoices || []).find((entry: any) => entry.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const isAdmin = req.user?.role === 'admin';
  const viewerEmail = req.user?.email?.toLowerCase();
  const invoiceEmail = invoice.customer?.email?.toLowerCase();
  if (!isAdmin && (!viewerEmail || viewerEmail !== invoiceEmail)) {
    return res.status(403).json({ error: 'You cannot access this invoice' });
  }
  const pdf = buildInvoicePdf(invoice);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${invoice.invoiceNumber || invoice.id}.pdf"`,
    'Content-Length': pdf.length
  });
  res.send(pdf);
}));

// CMS Endpoints
app.get('/api/cms/data', asyncHandler(async (req, res) => {
  const db = await readDB();
  const token = req.headers.authorization?.split(' ')[1];
  let isAdmin = false;
  if (token) {
    try { isAdmin = (jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS) as any).role === 'admin'; } catch { /* public CMS view */ }
  }
  // Password hashes never leave the server, even for admins.
  if (isAdmin) {
    return res.json({
      ...db,
      enquiries: db.enquiries || [],
      invoices: db.invoices || [],
      users: (db.users || []).map(({ password, ...user }: any) => user)
    });
  }
  res.json({
    pages: db.pages || {},
    courses: (db.courses || []).map(publicCourse),
    media: (db.media || []).filter((post: any) => post.status !== 'Draft')
  });
}));

const CMS_VALIDATORS: Record<string, (value: unknown) => boolean> = {
  pages: isPlainObject,
  settings: isPlainObject,
  courses: value => Array.isArray(value) && value.every(course =>
    isPlainObject(course) && typeof course.id === 'string' && course.id.length > 0 && typeof course.price === 'string' &&
    (course.sessions === undefined || (Array.isArray(course.sessions) && course.sessions.every(isPlainObject)))),
  media: value => Array.isArray(value) && value.every(isPlainObject)
};

app.post('/api/cms/data', authenticate, asyncHandler(async (req, res) => {
  // Only CMS editable fields are accepted; payment, user and enquiry records
  // must never be replaceable through the content editor.
  const updates = Object.keys(CMS_VALIDATORS).filter(key => Object.prototype.hasOwnProperty.call(req.body || {}, key));
  const invalid = updates.find(key => !CMS_VALIDATORS[key](req.body[key]));
  if (invalid) return res.status(400).json({ error: `Invalid ${invalid} data` });
  await mutateDB(db => {
    for (const key of updates) db[key] = req.body[key];
  });
  res.json({ success: true });
}));

// Contact & registration endpoint
const CONTACT_FIELDS = ['name', 'email', 'company', 'phone', 'interest'];
const REGISTRATION_FIELDS = ['name', 'email', 'phone', 'education', 'college', 'city', 'state', 'country', 'role', 'referredBy'];

app.post('/api/contact', contactLimiter, asyncHandler(async (req, res) => {
  const body = req.body || {};
  // Bots fill the hidden honeypot field; pretend success without storing anything.
  if (cleanText(body.honeypot)) return res.json({ success: true, message: 'Inquiry received.' });

  // Whitelist fields so a submission can never pose as a paid order or set admin-only data.
  const isRegistration = body.type === 'Registration';
  const entry: Record<string, unknown> = isRegistration
    ? { type: 'Registration', ...pickText(body, REGISTRATION_FIELDS), ...pickFlags(body, ['onSiteWorkshop', 'demo', 'bootcamp']) }
    : { ...pickText(body, CONTACT_FIELDS), message: cleanText(body.message, 5000), consent: body.consent === true };
  const email = String(entry.email).toLowerCase();
  const missing = !entry.name || !EMAIL_PATTERN.test(email) || !entry.phone ||
    (isRegistration ? !entry.college || !entry.city : !entry.message);
  if (missing) return res.status(400).json({ error: 'Please complete all required fields with a valid email address.' });

  const id = 'ENQ-' + crypto.randomUUID();
  await mutateDB(db => {
    db.enquiries = db.enquiries || [];
    db.enquiries.push({ ...entry, email, id, date: new Date().toISOString() });
  });
  console.log(`[contact] Saved ${isRegistration ? 'registration' : 'enquiry'} ${id}`);
  res.json({ success: true, message: 'Inquiry received.' });
}));

// Chatbot endpoint (24/7 AI Bot Support)
const CHAT_GREETING = 'Welcome to Vyomatrix.ai! How can I help you with our AI Quality, Managed Services, Platform, or Academy offerings today?';
// Prices are edited in the admin panel, so the bot always describes them from the live course data.
const describeCoursePricing = (courses: any[]) => (courses || [])
  .filter(course => course?.title && course?.price)
  .map(course => `${course.title}: ${course.price}${course.originalPrice ? ` (regularly ${course.originalPrice})` : ''}${course.offerLabel ? `, ${course.offerLabel}` : ''}`)
  .join('; ');
// Whole-word matching, so "which" or "this" are not mistaken for "hi".
const CHAT_TOPICS: Array<[RegExp, string | ((pricing: string) => string)]> = [
  [/\b(quality|audits?|assurance|hallucinations?|bias)\b/, 'Our AI Quality & Assurance offering provides independent auditing, accuracy & hallucination scoring, safety/bias reviews, and ongoing monitoring retainers for regulated industries.'],
  [/\b(managed|services?|build|deploy\w*|annotations?|moderation)\b/, 'Vyomatrix Managed AI Services helps build, deploy, and run custom AI bots, modernize legacy systems, and provide human data annotation, content moderation, and AI QA.'],
  [/\b(platform|governance|accountability|trails?)\b/, 'The Vyomatrix Platform is a unified suite for AI quality, governance, and accountability with configurable risk evaluation modules and immutable audit trails.'],
  [/\b(academy|courses?|bootcamps?|train\w*|learn\w*|workshops?)\b/, pricing => `Vyomatrix Academy offers practical training in AI evaluation & safety. ${pricing ? `Current programs: ${pricing}.` : 'See the Academy page for current programs.'}`],
  [/\b(price|pricing|cost|fees?|pay\w*|enrol\w*)\b/, pricing => `${pricing ? `Current Academy pricing: ${pricing}.` : 'Current pricing is listed on the Academy page.'} Check the Academy and Checkout pages for details.`],
  [/\b(contact|e-?mail|phone|reach|location|headquarters?)\b/, 'Vyomatrix.ai is headquartered in Malaysia, serving Southeast Asia. You can reach our team via the Contact page or email us at support@vyomatrix.ai.'],
  [/\b(hi|hello|hey|start|welcome)\b/, CHAT_GREETING]
];
const getFallbackResponse = (userMsg: string, pricing: string) => {
  const lower = userMsg.toLowerCase();
  const topic = CHAT_TOPICS.find(([pattern]) => pattern.test(lower));
  if (topic) return typeof topic[1] === 'function' ? topic[1](pricing) : topic[1];
  return 'Vyomatrix.ai empowers organizations with AI Quality Assurance, Managed AI Services, Enterprise Governance Platform, and Academy training. How can I assist you further with these solutions?';
};

const CHAT_SYSTEM_PROMPT = `You are a professional customer support AI for Vyomatrix.ai.
Vyomatrix is an early-stage company working in AI quality, governance and accountability, headquartered in Malaysia and serving regulated industries across Southeast Asia (Banking, Healthcare, Government, Telco).

If the user says "hi", "hello", or any other greeting, respond warmly with: "${CHAT_GREETING}"

Offerings:
1. AI Quality & Assurance: "Independent assurance for the AI you run." Includes AI system audits, accuracy and hallucination scoring, safety and bias review, and ongoing monitoring retainers.
2. Managed AI Services: "We build, deploy and run your AI, at the right cost." Includes AI bot and assistant implementation, integration, legacy modernization, and AI-powered QA. We also provide human data annotation and content moderation.
3. Platform: "One platform for AI quality, governance and accountability." Pre-launch configurable modules with immutable audit trails.
4. Vyomatrix Academy: "Train for a career in AI quality and evaluation." Hands-on programs taught on real work. Offerings include a 1-day workshop, 4-5 week bootcamp, and advanced workshops.

Keep responses very concise, professional, and helpful. Do not use Markdown formatting unless necessary.`;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const gemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('MY_GEMINI')
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.post('/api/chat', chatLimiter, asyncHandler(async (req, res) => {
  const message = cleanText(req.body?.message, 1000);
  const pricing = describeCoursePricing((await readDB()).courses);
  if (!message || !gemini) return res.json({ reply: getFallbackResponse(message, pricing) });

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: message,
      config: { systemInstruction: `${CHAT_SYSTEM_PROMPT}\n\nCurrent Academy programs and prices (always quote these exactly): ${pricing || 'see the Academy page'}.` }
    });
    res.json({ reply: response.text || getFallbackResponse(message, pricing) });
  } catch (apiErr) {
    console.error('Gemini API call error:', apiErr);
    res.json({ reply: getFallbackResponse(message, pricing) });
  }
}));

// Initialize Razorpay instance if keys exist
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;
const describeRazorpayError = (error: any) => error?.error?.description || error?.message || String(error);

const checkRazorpayCredentials = async () => {
  if (!razorpay) {
    console.warn('[payments] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set; checkout is disabled.');
    return;
  }
  const mode = String(process.env.RAZORPAY_KEY_ID).startsWith('rzp_test_') ? 'test' : 'live';
  try {
    await razorpay.orders.all({ count: 1 });
    console.log(`[payments] Razorpay ${mode} credentials verified.`);
  } catch (error: any) {
    if (error?.statusCode === 401) {
      console.error(`[payments] Razorpay rejected RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (401 Authentication failed). Checkout will fail until you generate a new ${mode} key pair in the Razorpay Dashboard (Account & Settings > API Keys) and update .env.`);
    } else {
      console.warn('[payments] Could not verify Razorpay credentials:', describeRazorpayError(error));
    }
  }
};

const markInvoicePaid = (orderId: string, paymentId: string, paidPaise: number) => mutateDB(db => {
  db.invoices = db.invoices || [];
  const found = db.invoices.find((entry: any) => entry.orderId === orderId);
  if (!found) throw new HttpError(404, 'No invoice is linked to this payment order.');
  if (paidPaise !== toPaise(found.amountINR)) throw new HttpError(400, 'Payment amount does not match the invoice.');
  if (found.status !== 'Paid') {
    found.status = 'Paid';
    found.paymentId = paymentId;
    found.paidAt = new Date().toISOString();
    db.enquiries = db.enquiries || [];
    db.enquiries.push({
      type: 'Academy Enrolment',
      details: { ...found.customer, programId: found.programId, programTitle: found.programTitle, amountINR: found.amountINR },
      paymentId,
      orderId,
      invoiceId: found.id,
      adminStatus: 'Payment Verified',
      id: 'ENQ-' + crypto.randomUUID(),
      date: new Date().toISOString()
    });
  }
  return found;
});

// Money already received for an order: a captured payment, or an authorized one that we capture now.
const findSettledPayment = async (client: Razorpay, orderId: string, amountPaise: number) => {
  const { items }: any = await client.orders.fetchPayments(orderId);
  const captured = items.find((payment: any) => payment.status === 'captured');
  if (captured) return captured;
  const authorized = items.find((payment: any) => payment.status === 'authorized' && Number(payment.amount) === amountPaise);
  return authorized ? client.payments.capture(authorized.id, authorized.amount, authorized.currency) : null;
};

// Pay an existing unpaid invoice later, e.g. from the customer dashboard.
app.post('/api/invoices/:id/pay', authenticateUser, orderLimiter, asyncHandler(async (req: any, res) => {
  if (!razorpay) return res.status(503).json({ error: 'Online payments are not configured yet. Please contact support.' });
  const db = await readDB();
  const invoice = (db.invoices || []).find((entry: any) => entry.id === req.params.id);
  if (!invoice || String(invoice.customer?.email || '').toLowerCase() !== String(req.user.email).toLowerCase()) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  if (invoice.status === 'Paid') return res.status(409).json({ error: 'This invoice is already paid.' });
  const amount = toPaise(invoice.amountINR);
  if (!Number.isSafeInteger(amount) || amount < 100) return res.status(400).json({ error: 'Invoice amount is invalid.' });

  let orderId = invoice.orderId;
  try {
    // Orders made with other keys (e.g. old test-mode keys) cannot be fetched; those get a fresh order.
    const order: any = orderId
      ? await razorpay.orders.fetch(orderId).catch((error: any) => { if (error?.statusCode === 401) throw error; return null; })
      : null;
    if (order) {
      // Never charge twice: if Razorpay already holds money for this order, just record it.
      const settled = await findSettledPayment(razorpay, order.id, amount);
      if (settled) {
        await markInvoicePaid(order.id, settled.id, Number(settled.amount));
        return res.json({ alreadyPaid: true, invoiceNumber: invoice.invoiceNumber });
      }
      if (order.status === 'paid') {
        return res.status(409).json({ error: 'Razorpay already shows this invoice as paid. Please refresh or contact support.' });
      }
    }
    if (hasInvoiceSessionEnded(invoice, db.courses)) {
      return res.status(409).json({ error: 'The session on this invoice has already ended. Please enrol in an upcoming session instead.' });
    }
    if (!order || Number(order.amount) !== amount) {
      const created = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: String(invoice.id).slice(0, 40),
        notes: { invoiceId: invoice.id, programId: String(invoice.programId || '') }
      });
      orderId = created.id;
      await mutateDB(db => {
        const current = (db.invoices || []).find((entry: any) => entry.id === invoice.id);
        if (!current || current.status === 'Paid') return;
        current.previousOrderIds = [...(current.previousOrderIds || []), current.orderId].filter(Boolean);
        current.orderId = orderId;
      });
    }
  } catch (error: any) {
    console.error('[payments] Could not prepare invoice payment:', describeRazorpayError(error));
    return res.status(error?.statusCode === 401 ? 503 : 502).json({ error: 'Could not start the payment with Razorpay. Please try again later or contact support.' });
  }

  const customer = invoice.customer || {};
  res.json({
    orderId,
    amount,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    programTitle: invoice.programTitle,
    prefill: { name: customer.name || '', email: customer.email || '', contact: customer.phone || '' }
  });
}));

// Payment endpoints (Academy Enrolment)
const ENROLMENT_FIELDS = ['name', 'phone', 'address', 'city', 'state', 'country', 'college', 'organization', 'education', 'role', 'referredBy', 'track', 'session', 'coupon'];

app.post('/api/payment/create-order', orderLimiter, asyncHandler(async (req, res) => {
  const { programId, studentDetails } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  let userEmail = '';
  try {
    const payload = jwt.verify(token || '', JWT_SECRET, JWT_VERIFY_OPTIONS) as any;
    if (payload.role !== 'user' || !payload.email) throw new Error('invalid user');
    userEmail = String(payload.email).trim().toLowerCase();
  } catch {
    return res.status(401).json({ error: 'Please sign in again to continue checkout.' });
  }

  // Never create a fake order: a successful enrollment must come from Razorpay.
  if (!razorpay) {
    return res.status(503).json({ error: 'Online payments are not configured yet. Please contact support.' });
  }

  const db = await readDB();
  const course = (db.courses || []).find((entry: any) => entry.id === programId);
  if (!course) return res.status(404).json({ error: 'Selected program was not found.' });
  const amountINR = parsePriceINR(course.price);
  if (!Number.isFinite(amountINR) || amountINR < 1) return res.status(400).json({ error: 'Program price is invalid.' });

  const details: Record<string, string | boolean> = {
    ...pickText(studentDetails, ENROLMENT_FIELDS),
    address: cleanText(studentDetails?.address, 500),
    ...pickFlags(studentDetails, ['onSiteWorkshop', 'demo', 'bootcamp'])
  };
  const required = ['name', 'phone', 'address', 'city', 'college', 'track'];
  if (required.some(key => !details[key]) ||
      String(studentDetails?.email || '').trim().toLowerCase() !== userEmail) {
    return res.status(400).json({ error: 'Complete all required enrolment details using the email address on your account.' });
  }
  if (Array.isArray(course.tracks) && course.tracks.length > 0 && !course.tracks.includes(details.track)) {
    return res.status(400).json({ error: 'Please choose one of the available tracks for this program.' });
  }
  const configuredSessions = (Array.isArray(course.sessions) ? course.sessions : []).filter((session: any) => formatSession(session));
  const openSessions = configuredSessions.filter((session: any) => isSessionOpen(session)).map(formatSession);
  if (configuredSessions.length > 0 && openSessions.length === 0) {
    return res.status(400).json({ error: 'All sessions for this program have ended. New dates will be announced soon.' });
  }
  if (openSessions.length > 0 && !openSessions.includes(details.session)) {
    return res.status(400).json({ error: 'Please choose one of the available sessions for this program.' });
  }
  if (configuredSessions.length === 0) delete details.session;

  const invoiceId = 'INV-' + crypto.randomUUID();
  let order: any;
  try {
    order = await razorpay.orders.create({
      amount: toPaise(amountINR),
      currency: 'INR',
      receipt: invoiceId.slice(0, 40), // Razorpay rejects receipts longer than 40 characters
      notes: { invoiceId, programId: String(programId) }
    });
  } catch (error: any) {
    console.error('[payments] Razorpay order creation failed:', describeRazorpayError(error));
    if (error?.statusCode === 401) {
      return res.status(503).json({ error: 'Online payments are temporarily unavailable. Please try again later or contact support.' });
    }
    return res.status(502).json({ error: 'Could not start the payment with Razorpay. Please try again.' });
  }

  const invoiceNumber = await mutateDB(currentDB => {
    currentDB.invoices = currentDB.invoices || [];
    const nextInvoiceNumber = `VM-${new Date().getFullYear()}-${String(currentDB.invoices.length + 1).padStart(5, '0')}`;
    currentDB.invoices.push({
      id: invoiceId,
      invoiceNumber: nextInvoiceNumber,
      orderId: order.id,
      programId,
      programTitle: course.title || programId,
      customer: { ...details, email: userEmail },
      amountINR,
      currency: 'INR',
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
      paidAt: null,
      paymentId: null
    });
    return nextInvoiceNumber;
  });
  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    invoiceId,
    invoiceNumber
  });
}));

app.post('/api/payment/verify', asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ success: false, message: 'Online payments are not configured on the server.' });
  }
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' ||
      !hmacMatches(`${orderId}|${paymentId}`, process.env.RAZORPAY_KEY_SECRET, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature' });
  }

  try {
    const invoice = ((await readDB()).invoices || []).find((entry: any) => entry.orderId === orderId);
    if (!invoice) throw new HttpError(404, 'No invoice is linked to this payment order.');
    let payment: any = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) throw new HttpError(400, 'Payment does not belong to this order.');
    if (Number(payment.amount) !== toPaise(invoice.amountINR)) throw new HttpError(400, 'Payment amount does not match the invoice.');
    if (payment.status === 'authorized') {
      // Accounts without automatic capture leave payments "authorized"; capture now so the
      // money settles instead of being auto-refunded and the invoice can be marked Paid.
      payment = await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
    }
    if (payment.status !== 'captured') {
      return res.status(409).json({ success: false, message: 'Payment is not captured yet. Your invoice remains unpaid; please refresh in a moment.' });
    }
    const paid = await markInvoicePaid(orderId, paymentId, Number(payment.amount));
    res.json({ success: true, message: 'Payment verified by Razorpay.', paymentId, orderId, invoiceNumber: paid.invoiceNumber });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ success: false, message: error.message });
    console.error('[payments] Razorpay payment verification error:', describeRazorpayError(error));
    res.status(502).json({ success: false, message: 'We could not confirm the payment with Razorpay yet. Your invoice remains unpaid; please retry or contact support.' });
  }
}));

// Razorpay webhook: marks invoices Paid even if the customer closes the browser before
// /api/payment/verify runs. Configure it in the Razorpay Dashboard (events: payment.captured,
// order.paid) pointing at /api/payment/webhook, and set RAZORPAY_WEBHOOK_SECRET to its secret.
app.post('/api/payment/webhook', asyncHandler(async (req: any, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'Webhook secret is not configured.' });
  if (!req.rawBody || !hmacMatches(req.rawBody.toString('utf8'), secret, req.headers['x-razorpay-signature'])) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
  const payment = req.body?.payload?.payment?.entity;
  if (['payment.captured', 'order.paid'].includes(req.body?.event) && payment?.order_id && payment.status === 'captured') {
    try {
      await markInvoicePaid(payment.order_id, payment.id, Number(payment.amount));
    } catch (error) {
      // Acknowledge anyway: retrying will not fix an unknown order or an amount mismatch.
      if (!(error instanceof HttpError)) throw error;
      console.warn(`[payments] Webhook for ${payment.order_id} ignored: ${error.message}`);
    }
  }
  res.json({ received: true });
}));

// Update order status (admin)
app.patch('/api/orders/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminStatus } = req.body;
  const validStatuses = ['Payment Verified', 'Simulated / Test', 'Pending', 'Cancelled', 'Refunded', 'Reviewed'];
  if (!validStatuses.includes(adminStatus)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  const updated = await mutateDB(db => {
    const idx = (db.enquiries || []).findIndex((e: any) => e.id === id);
    if (idx === -1) return false;
    db.enquiries[idx].adminStatus = adminStatus;
    return true;
  });
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, adminStatus });
}));

// Unknown API routes get a JSON 404 instead of falling through to the SPA.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: any, req: any, res: any, _next: any) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  console.error(`[server] ${req.method} ${req.originalUrl} failed:`, err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

// Vite Middleware for Full-Stack App
async function startServer() {
  await migratePlaintextPasswords().catch(error => console.error('[auth] Could not hash legacy passwords:', error));
  void checkRazorpayCredentials();

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // dist/ also holds the bundled server; never serve it or its source map.
    app.use(/^\/server\.cjs(\.map)?$/i, (_req, res) => { res.status(404).end(); });
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  server.on('error', (error: any) => {
    console.error(error?.code === 'EADDRINUSE'
      ? `[server] Port ${PORT} is already in use. Stop the other process or set PORT to a free port.`
      : `[server] Failed to start: ${error}`);
    process.exit(1);
  });
}

startServer().catch(error => {
  console.error('[server] Startup failed:', error);
  process.exit(1);
});
