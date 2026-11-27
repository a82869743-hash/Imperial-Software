/* Imperial Group ERP + CRM. Data lives on the server (see server.js); mail/WhatsApp sending is simulated until connected. */
const PREFS_KEY = 'imperial_prefs';
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const rndToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
const uid = p => p + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const money = (n, c) => c === 'USD' ? '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) : inr(n);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = s => document.querySelector(s);

/* ---------- Seed data ---------- */
function seed() {
  const t = today();
  return {
    division: 'all', user: 'U1', route: 'dashboard',
    divisions: [
      { id: 'CHEM', name: 'Imperial Oilfield Chemicals' },
      { id: 'AGRO', name: 'Imperial Agro' },
      { id: 'PACK', name: 'Imperial Flexipack' },
      { id: 'SPC', name: 'SP Chemicals' }
    ],
    roles: {
      'Super Admin': ['*'],
      'Production Head': ['dashboard', 'approvals', 'workorders', 'inventory', 'procurement', 'lab', 'dispatch', 'machines', 'products', 'team', 'attendance'],
      'Marketing Head': ['dashboard', 'approvals', 'leads', 'inquiries', 'products', 'orders', 'payments', 'team', 'training', 'market', 'attendance'],
      'Accounts': ['dashboard', 'approvals', 'orders', 'payments', 'invoices', 'dispatch', 'procurement', 'attendance'],
      'HR': ['dashboard', 'approvals', 'attendance', 'training', 'team'],
      'Sales Executive': ['dashboard', 'approvals', 'leads', 'inquiries', 'team', 'training', 'attendance'],
      'Lab / R&D': ['dashboard', 'approvals', 'lab', 'inventory', 'attendance'],
      'Company Login': ['dashboard', 'approvals', 'inquiries', 'products', 'orders', 'payments', 'workorders', 'inventory', 'procurement', 'lab', 'dispatch', 'machines', 'attendance'],
      'Purchase & Store': ['dashboard', 'approvals', 'inventory', 'procurement', 'attendance']
    },
    users: [
      { id: 'U1', name: 'Admin', role: 'Super Admin', salary: 0 },
      { id: 'U2', name: 'Nirav', role: 'Production Head', salary: 85000, divs: ['CHEM', 'AGRO', 'SPC'] },
      { id: 'U3', name: 'Jagruti', role: 'Marketing Head', salary: 85000 },
      { id: 'U4', name: 'Rohan Shah', role: 'Sales Executive', salary: 28000 },
      { id: 'U5', name: 'Priya Mehta', role: 'Sales Executive', salary: 26000, intern: true, joined: addDays(t, -40) },
      { id: 'U6', name: 'Kunal Desai', role: 'Lab / R&D', salary: 42000 },
      { id: 'U7', name: 'Hetal Joshi', role: 'HR', salary: 38000 },
      { id: 'U8', name: 'Mahesh Patel', role: 'Accounts', salary: 40000 },
      { id: 'U9', name: 'Vikram Rao', role: 'Purchase & Store', salary: 30000 },
      { id: 'U10', name: 'Chem Team', role: 'Company Login', salary: 0, divs: ['CHEM'] },
      { id: 'U11', name: 'Agro Team', role: 'Company Login', salary: 0, divs: ['AGRO'] },
      { id: 'U12', name: 'Spc Team', role: 'Company Login', salary: 0, divs: ['SPC'] },
      { id: 'U13', name: 'Flexipack Team', role: 'Company Login', salary: 0, divs: ['PACK'] }
    ],
    products: [
      { id: 'P1', div: 'CHEM', name: 'Crude Oil Demulsifier', code: 'IMP-DM-210', alias: 'Surfactant Blend SB-210', unit: 'kg', price: 185, usd: 2.4, moq: 500, density: 0.96, haz: true, make: true },
      { id: 'P2', div: 'CHEM', name: 'Corrosion Inhibitor', code: 'IMP-CI-115', alias: 'Industrial Additive IA-115', unit: 'L', price: 160, usd: 2.1, moq: 400, density: 1.04, haz: true, make: true },
      { id: 'P3', div: 'CHEM', name: 'Scale Inhibitor', code: 'IMP-SI-330', alias: '', unit: 'kg', price: 140, usd: 1.8, moq: 500, density: 1.12, haz: false, make: true },
      { id: 'P4', div: 'AGRO', name: 'Calcium Thiosulphate Solution', code: 'IMP-CaTS-24', alias: '', unit: 'L', price: 58, usd: 0.72, moq: 1000, density: 1.25, haz: false, make: true },
      { id: 'P7', div: 'AGRO', name: 'Magnesium Thiosulphate Solution', code: 'IMP-MgTS-20', alias: '', unit: 'L', price: 62, usd: 0.78, moq: 1000, density: 1.23, haz: false, make: true },
      { id: 'P8', div: 'AGRO', name: 'Potassium Thiosulphate Solution', code: 'IMP-KTS-25', alias: '', unit: 'L', price: 85, usd: 1.05, moq: 1000, density: 1.46, haz: false, make: true },
      { id: 'P9', div: 'AGRO', name: 'Ammonium Thiosulphate Solution', code: 'IMP-ATS-60', alias: '', unit: 'L', price: 48, usd: 0.6, moq: 1000, density: 1.33, haz: false, make: true },
      { id: 'P10', div: 'AGRO', name: 'Ammonium Polysulfide Solution', code: 'IMP-APS-20', alias: 'Agro Sulphur Solution APS', unit: 'L', price: 70, usd: 0.88, moq: 500, density: 1.18, haz: true, make: true },
      { id: 'P5', div: 'PACK', name: 'Flexible Pouch 1 kg', code: 'IMP-FP-1K', alias: '', unit: 'pcs', price: 6.5, usd: 0.09, moq: 10000, density: 1, haz: false, make: true },
      { id: 'P6', div: 'CHEM', name: 'H2S Scavenger', code: 'IMP-HS-404', alias: 'Treatment Chemical TC-404', unit: 'kg', price: 210, usd: 2.7, moq: 300, density: 1.08, haz: true, make: true }
    ],
    leads: [
      { id: 'L-1001', div: 'CHEM', company: 'Gulf Petro Services', person: 'Ahmed Khan', phone: '+971 50 112 3344', email: 'ahmed@gulfpetro.ae', country: 'UAE', source: 'IndiaMART', need: 'Demulsifier 5 MT', status: 'New', owner: 'U4', date: t },
      { id: 'L-1002', div: 'CHEM', company: 'Shree Refinery Pvt Ltd', person: 'Vikas Rao', phone: '+91 98250 11223', email: 'vikas@shreeref.in', country: 'India', source: 'TradeIndia', need: 'Corrosion inhibitor', status: 'Contacted', owner: 'U5', date: addDays(t, -1) },
      { id: 'L-1003', div: 'AGRO', company: 'GreenField Farms', person: 'Sunil Patil', phone: '+91 99099 77665', email: 'sunil@greenfield.in', country: 'India', source: 'Call-me button', need: 'Calcium thiosulphate 10 KL', status: 'New', owner: 'U4', date: t },
      { id: 'L-1004', div: 'CHEM', company: 'Nile Oilfield Co', person: 'Omar Hassan', phone: '+20 100 555 8899', email: 'omar@nileoil.eg', country: 'Egypt', source: 'Website', need: 'H2S scavenger samples', status: 'Qualified', owner: 'U3', date: addDays(t, -3) }
    ],
    inquiries: [
      { id: 'INQ-501', div: 'CHEM', company: 'Gulf Petro Services', email: 'ahmed@gulfpetro.ae', country: 'UAE', text: 'Need Crude Oil Demulsifier 5000 kg, CIF Jebel Ali', productId: 'P1', qty: 5000, unit: 'kg', status: 'Quoted', date: addDays(t, -2) },
      { id: 'INQ-502', div: 'CHEM', company: 'Delta Paints', email: 'buy@deltapaints.in', country: 'India', text: 'Do you supply titanium dioxide pigment?', productId: null, qty: 0, unit: 'kg', status: 'Intro sent', date: addDays(t, -1) }
    ],
    orders: [
      { id: 'SO-2401', div: 'CHEM', client: 'Gulf Petro Services', country: 'UAE', export: true, currency: 'USD', productId: 'P1', qty: 5000, unit: 'kg', rate: 2.4, poNo: 'GPS/PO/7781', poReceived: true, approvedBy: '', terms: [{ pct: 30, days: 0 }, { pct: 70, days: 30 }], lc: true, date: addDays(t, -6), status: 'In production' },
      { id: 'SO-2402', div: 'CHEM', client: 'Shree Refinery Pvt Ltd', country: 'India', export: false, currency: 'INR', productId: 'P2', qty: 1200, unit: 'L', rate: 160, poNo: '', poReceived: false, approvedBy: 'Jagruti', terms: [{ pct: 50, days: 0 }, { pct: 50, days: 15 }], lc: false, date: addDays(t, -2), status: 'Awaiting payment' }
    ],
    payments: [],
    workorders: [],
    inventory: [
      { code: 'RM-101', div: 'CHEM', name: 'Polyalkylene Glycol', serial: 'RML-24-0091', unit: 'kg', qty: 1800, min: 1000, max: 5000, vendor: 'V1' },
      { code: 'RM-102', div: 'CHEM', name: 'Aromatic Solvent C9', serial: 'RML-24-0092', unit: 'L', qty: 650, min: 1500, max: 6000, vendor: 'V2' },
      { code: 'RM-103', div: 'CHEM', name: 'Imidazoline', serial: 'RML-24-0080', unit: 'kg', qty: 900, min: 400, max: 2500, vendor: 'V1' },
      { code: 'RM-104', div: 'CHEM', name: 'Methanol', serial: 'RML-24-0095', unit: 'L', qty: 2200, min: 800, max: 5000, vendor: 'V3' },
      { code: 'RM-105', div: 'CHEM', name: 'Phosphonate (ATMP)', serial: 'RML-24-0077', unit: 'kg', qty: 300, min: 500, max: 2000, vendor: 'V2' },
      { code: 'PK-201', div: 'PACK', name: '200 L HDPE Drum', serial: 'PKG-24-0012', unit: 'pcs', qty: 40, min: 50, max: 300, vendor: 'V4' },
      { code: 'PK-202', div: 'PACK', name: 'Laminated Roll 12 micron', serial: 'PKG-24-0015', unit: 'kg', qty: 900, min: 300, max: 2000, vendor: 'V5' },
      { code: 'RM-301', div: 'AGRO', name: 'Hydrated Lime', serial: 'RML-24-0101', unit: 'kg', qty: 6000, min: 4000, max: 20000, vendor: 'V3' },
      { code: 'RM-302', div: 'AGRO', name: 'Sulphur Powder', serial: 'RML-24-0104', unit: 'kg', qty: 2500, min: 5000, max: 25000, vendor: 'V3' },
      { code: 'RM-303', div: 'AGRO', name: 'Magnesium Hydroxide', serial: 'RML-24-0107', unit: 'kg', qty: 4200, min: 3000, max: 15000, vendor: 'V1' }
    ],
    vendors: [
      { id: 'V1', name: 'Gujarat Chem Traders', city: 'Vadodara', approved: true, channel: 'Mail', rates: { 'RM-101': 142, 'RM-103': 210, 'RM-303': 38 }, unit: { 'RM-101': 'kg', 'RM-103': 'kg', 'RM-303': 'kg' } },
      { id: 'V2', name: 'Shakti Solvents', city: 'Ankleshwar', approved: true, channel: 'Mail', rates: { 'RM-102': 78, 'RM-105': 118, 'RM-101': 149 }, unit: { 'RM-102': 'L', 'RM-105': 'kg', 'RM-101': 'kg' } },
      { id: 'V3', name: 'Narmada Petrochem', city: 'Bharuch', approved: false, channel: 'Mail', rates: { 'RM-104': 36, 'RM-102': 74, 'RM-301': 9, 'RM-302': 24 }, unit: { 'RM-104': 'L', 'RM-102': 'kg', 'RM-301': 'kg', 'RM-302': 'kg' } },
      { id: 'V4', name: 'Flexipack', city: 'Ahmedabad', approved: true, channel: 'WhatsApp + Mail', rates: { 'PK-201': 1450 }, unit: { 'PK-201': 'pcs' } },
      { id: 'V5', name: 'Bhavin Packaging', city: 'Ahmedabad', approved: true, channel: 'Manual entry', rates: { 'PK-202': 182 }, unit: { 'PK-202': 'kg' } }
    ],
    market: { 'RM-101': 145, 'RM-102': 80, 'RM-103': 205, 'RM-104': 38, 'RM-105': 120, 'PK-201': 1500, 'PK-202': 185, 'RM-301': 9.5, 'RM-302': 23, 'RM-303': 40 },
    pos: [
      { id: 'PO-7001', div: 'CHEM', vendor: 'V2', code: 'RM-102', qty: 3000, unit: 'L', rate: 78, date: addDays(t, -10), status: 'Received' },
      { id: 'PO-7002', div: 'CHEM', vendor: 'V1', code: 'RM-101', qty: 2000, unit: 'kg', rate: 142, date: addDays(t, -30), status: 'Received' }
    ],
    formulations: [
      { batch: 'F-DM-210-07', div: 'CHEM', productId: 'P1', client: 'Gulf Petro Services', version: 'Combination 2 of 4', date: addDays(t, -380), approved: true,
        items: [{ code: 'RM-101', pct: 45, lot: 'RML-23-0410' }, { code: 'RM-102', pct: 40, lot: 'RML-23-0388' }, { code: 'RM-104', pct: 15, lot: 'RML-23-0402' }], notes: 'Client selected combination 2 after field trial. Best water drop at 60°C.' },
      { batch: 'F-DM-210-06', div: 'CHEM', productId: 'P1', client: 'Gulf Petro Services', version: 'Combination 1 of 4', date: addDays(t, -380), approved: false,
        items: [{ code: 'RM-101', pct: 55, lot: 'RML-23-0410' }, { code: 'RM-102', pct: 45, lot: 'RML-23-0388' }], notes: 'Slower separation.' },
      { batch: 'F-CI-115-03', div: 'CHEM', productId: 'P2', client: 'Generic', version: 'Standard', date: addDays(t, -200), approved: true,
        items: [{ code: 'RM-103', pct: 30, lot: 'RML-24-0080' }, { code: 'RM-104', pct: 50, lot: 'RML-24-0095' }, { code: 'RM-102', pct: 20, lot: 'RML-24-0092' }], notes: '' }
    ],
    samples: [
      { id: 'SMP-301', div: 'CHEM', client: 'Nile Oilfield Co', type: 'Crude oil sample (inward)', received: addDays(t, -4), stage: 2, tests: 'BS&W 12%, API 28', batches: ['F-HS-404-01'] }
    ],
    machines: [
      { id: 'M1', div: 'CHEM', name: 'Reactor R-1 (5 KL)', last: addDays(t, -50), every: 60, avgHrs: 6, avgCost: 18000, log: [] },
      { id: 'M2', div: 'CHEM', name: 'Blending Vessel B-2', last: addDays(t, -20), every: 45, avgHrs: 3, avgCost: 7000, log: [] },
      { id: 'M3', div: 'CHEM', name: 'Drum Filling Line', last: addDays(t, -88), every: 90, avgHrs: 4, avgCost: 9500, log: [] },
      { id: 'M5', div: 'AGRO', name: 'Thiosulphate Reactor (Agro, 1500 MT/month)', last: addDays(t, -35), every: 45, avgHrs: 8, avgCost: 22000, log: [] },
      { id: 'M4', div: 'PACK', name: 'Pouch Laminator (Flexipack)', last: addDays(t, -10), every: 30, avgHrs: 5, avgCost: 12000, log: [] }
    ],
    tasks: [
      { id: 'T1', user: 'U4', date: t, title: 'Follow up Gulf Petro: 70% balance', done: false, tag: 'U8' },
      { id: 'T2', user: 'U4', date: t, title: 'Call 5 IndiaMART leads', done: true, tag: '' },
      { id: 'T3', user: 'U5', date: t, title: 'Send TDS to Shree Refinery', done: false, tag: 'U3' }
    ],
    activity: { U4: { calls: 14, msgs: 22, tCalls: 30, tMsgs: 40 }, U5: { calls: 9, msgs: 18, tCalls: 25, tMsgs: 30 }, U3: { calls: 6, msgs: 10, tCalls: 10, tMsgs: 15 } },
    attendance: [
      { user: 'U4', date: addDays(t, -1), in: '09:28', out: '19:15', shiftEnd: '18:30', geo: 'Office (32 m)', photo: true },
      { user: 'U5', date: addDays(t, -1), in: '09:35', out: '18:50', shiftEnd: '18:30', geo: 'Office (18 m)', photo: true },
      { user: 'U6', date: addDays(t, -1), in: '09:30', out: '20:05', shiftEnd: '18:30', geo: 'Plant (40 m)', photo: true }
    ],
    leaves: [{ id: 'LV1', user: 'U5', from: addDays(t, 5), to: addDays(t, 6), reason: 'Family function', status: 'Pending' }],
    holidays: [{ date: addDays(t, 9), name: 'Diwali' }, { date: addDays(t, 10), name: 'New Year (Gujarati)' }],
    modules: [
      { id: 'TM1', title: 'Company & Product Introduction', audio: true, lessons: 6 },
      { id: 'TM2', title: 'Hazardous Chemicals & Labelling (HAZ)', audio: true, lessons: 4 },
      { id: 'TM3', title: 'Handling Inquiries & IndiaMART Leads', audio: false, lessons: 5 }
    ],
    tests: [
      { id: 'TS1', module: 'TM1', title: 'Weekly Test: Products', mins: 10, due: addDays(t, 2), qs: [
        { q: 'Which product is used to separate water from crude oil?', o: ['Scale Inhibitor', 'Crude Oil Demulsifier', 'Bio Stimulant'], a: 1 },
        { q: 'Hazardous shipments must carry…', o: ['HAZ sticker', 'Only invoice', 'Nothing extra'], a: 0 },
        { q: 'When can a work order be approved?', o: ['Immediately', 'After at least part payment is received', 'After dispatch'], a: 1 }
      ] }
    ],
    results: [{ user: 'U5', test: 'TS1', score: 67, date: addDays(t, -7), flags: 1 }],
    countries: [
      { name: 'UAE', req: 'COO, MSDS, HAZ class labels, Arabic label optional', demand: 'Demulsifiers, H2S scavengers' },
      { name: 'Egypt', req: 'Legalised invoice, COO from chamber, pre-shipment inspection', demand: 'Oilfield chemicals' },
      { name: 'Nigeria', req: 'SONCAP certificate, Form M', demand: 'Corrosion inhibitors' },
      { name: 'Australia', req: 'Fertilizer registration per state, SDS, import permit', demand: 'Calcium & potassium thiosulphate (Imperial Agro)' },
      { name: 'Kenya', req: 'KEBS PVoC certificate, KEPHIS for agro inputs', demand: 'Liquid fertilizers, corrosion inhibitors' },
      { name: 'Brazil', req: 'MAPA registration, Portuguese labels', demand: 'Thiosulphate fertilizers' },
      { name: 'India', req: 'GST invoice, e-way bill, TREM card for HAZ', demand: 'All lines' }
    ],
    notifs: [{ to: 'U8', text: 'Rohan tagged you: Follow up Gulf Petro: 70% balance', date: t }],
    log: []
  };
}

/* ---------- Server sync ---------- */
// Shared data is stored per key on the server. Each save sends only the keys that changed;
// if someone else changed the same key meanwhile, their version is merged item by item with ours.
const OBJ_KEYS = ['divModules', 'workflows', 'templates', 'settings', 'roleView', 'market', 'internPlans'];
const SHARED = ['internPlans', 'divisions', 'roles', 'roleView', 'invoices', 'divModules', 'workflows', 'templates', 'settings', 'products', 'leads', 'inquiries', 'orders', 'payments', 'workorders', 'inventory', 'vendors', 'market', 'pos',
  'formulations', 'samples', 'machines', 'tasks', 'activity', 'attendance', 'leaves', 'holidays', 'modules', 'tests', 'results', 'countries', 'notifs', 'log'];
let S, VER = {}, SYNCED = {}, saveTimer = null, flushing = false;

async function api(url, body, method) {
  const r = await fetch(url, { method: method || (body ? 'POST' : 'GET'), headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  if (r.status === 401 && !url.endsWith('/login')) { showLogin(); throw new Error('Not logged in'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 409) throw Object.assign(new Error(j.error || 'Request failed'), { status: r.status, body: j });
  return r.status === 409 ? { conflict: true, ...j } : j;
}
async function load() {
  const r = await api('/api/state');
  let prefs = {}; try { prefs = JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { }
  S = { division: prefs.division || 'all', route: 'dashboard', user: r.me.id, users: r.users };
  SHARED.forEach(k => { if (k in r.data) S[k] = r.data[k]; });
  VER = r.versions; SYNCED = {};
  SHARED.forEach(k => { if (k in S) SYNCED[k] = JSON.stringify(S[k]); });
  return r.empty;
}
function save() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ division: S.division })); } catch (e) { }
  clearTimeout(saveTimer); saveTimer = setTimeout(flush, 300);
}
const itemId = x => x && typeof x === 'object' ? (x.id ?? x.code ?? x.batch ?? (x.user && x.date ? x.user + '|' + x.date + '|' + (x.test || '') : x.name ?? JSON.stringify(x))) : JSON.stringify(x);
function merge(server, mine, base) {
  if (Array.isArray(server) && Array.isArray(mine)) {
    const baseMap = new Map((base || []).map(x => [itemId(x), JSON.stringify(x)]));
    const out = new Map(server.map(x => [itemId(x), x]));
    mine.forEach(x => { const id = itemId(x); if (baseMap.get(id) !== JSON.stringify(x)) out.set(id, x); });
    baseMap.forEach((_, id) => { if (!mine.some(x => itemId(x) === id)) out.delete(id); });
    return [...out.values()];
  }
  if (server && mine && typeof server === 'object' && typeof mine === 'object') {
    const out = { ...server };
    Object.keys(mine).forEach(k => { if (JSON.stringify(mine[k]) !== JSON.stringify((base || {})[k])) out[k] = mine[k]; });
    Object.keys(base || {}).forEach(k => { if (!(k in mine)) delete out[k]; });
    return out;
  }
  return mine;
}
async function flush() {
  if (flushing) { save(); return; }
  flushing = true;
  let changed = false;
  try {
    for (const k of SHARED) {
      if (!(k in S)) continue;
      if (k === 'workorders') S.workorders.forEach(w => { w.productName = prod(w.productId).name; w.stageNames = flowOf(w).map(x => x.name); });
      const j = JSON.stringify(S[k]);
      if (j === SYNCED[k]) continue;
      let r;
      try { r = await api('/api/data/' + k, { value: S[k], base: VER[k] }, 'PUT'); }
      catch (e) { toast(e.status === 403 ? 'Not saved: ' + e.message : 'Could not save. Check the connection.'); if (e.status === 403 && SYNCED[k]) { S[k] = JSON.parse(SYNCED[k]); changed = true; } continue; }
      if (r.conflict) {
        S[k] = merge(r.value, S[k], SYNCED[k] ? JSON.parse(SYNCED[k]) : undefined);
        VER[k] = r.version; SYNCED[k] = JSON.stringify(r.value); changed = true;
        r = await api('/api/data/' + k, { value: S[k], base: VER[k] }, 'PUT');
        if (r.conflict) { save(); continue; }
      }
      VER[k] = r.version; SYNCED[k] = JSON.stringify(S[k]);
    }
  } finally { flushing = false; }
  if (changed && !$('#modal').innerHTML) rerender();
}
async function poll() {
  if (document.hidden || flushing || !S) return;
  const r = await api('/api/changes', { versions: VER }).catch(() => null);
  if (!r || !Object.keys(r.data).length) return;
  Object.keys(r.data).forEach(k => {
    const dirty = k in S && JSON.stringify(S[k]) !== SYNCED[k];
    S[k] = dirty ? merge(r.data[k], S[k], JSON.parse(SYNCED[k])) : r.data[k];
    VER[k] = r.versions[k]; SYNCED[k] = JSON.stringify(r.data[k]);
  });
  if (!$('#modal').innerHTML && !document.activeElement?.matches('input,textarea,select')) rerender();
  else renderNav();
}

/* ---------- Login ---------- */
function showLogin() {
  document.body.innerHTML = `<div class="login"><form class="card" onsubmit="event.preventDefault();doLogin()">
    <div class="brand" style="padding:0 0 18px"><img src="logo.webp" alt=""><div><b>imperial</b><small>Group ERP · CRM</small></div></div>
    <h1>Sign in</h1>
    <label>Email or mobile number<input id="lg" autocomplete="username" required autofocus></label>
    <label>Password<input id="lp" type="password" autocomplete="current-password" required></label>
    <div id="lerr" class="lerr" role="alert"></div>
    <button class="btn p" type="submit">Sign in</button>
    <p class="muted small">Forgot your password? Ask your admin to reset it.</p></form></div>`;
}
async function doLogin() {
  $('#lerr').textContent = '';
  try { await api('/api/login', { login: val('lg'), password: val('lp') }); location.reload(); }
  catch (e) { $('#lerr').textContent = e.message; }
}
async function logout() { await api('/api/logout', {}).catch(() => { }); location.reload(); }
function accountMenu() {
  modal('My account', `<p><b>${esc(me().name)}</b> · ${esc(me().role)}<br><span class="muted small">${esc(me().email || '')} ${esc(me().phone || '')}</span></p>
    <div class="form"><label>Current password<input id="pc" type="password"></label><label>New password<input id="pn2" type="password" placeholder="At least 8 characters"></label></div>`,
    `<button class="btn r" onclick="logout()">Sign out</button><span style="flex:1"></span><button class="btn p" onclick="changePass()">Change password</button>`);
}
async function changePass() {
  try { await api('/api/password', { current: val('pc'), next: val('pn2') }); closeModal(); toast('Password changed'); } catch (e) { toast(e.message); }
}

/* ---------- First run ---------- */
function firstRun() {
  modal('Set up Imperial ERP', `<p>The database is empty. How would you like to start?</p>
    <p class="muted small">Demo data fills every module with sample orders, stock and staff so you can try things out. You can clear it later from Admin.</p>`,
    `<button class="btn" onclick="startData(false)">Start empty</button><button class="btn p" onclick="startData(true)">Load demo data</button>`);
}
async function startData(demo) {
  const d = seed();
  if (demo) {
    await api('/api/demo-users', { users: d.users.filter(u => u.id !== 'U1') }).catch(e => toast(e.message));
    S.users = (await api('/api/state')).users;
    SHARED.forEach(k => S[k] = d[k] ?? (OBJ_KEYS.includes(k) ? {} : []));
    S.workorders = [];
    S.orders.forEach(o => buildPayments(o));
    S.payments.filter(p => p.order === 'SO-2401')[0].status = 'Received';
    const wo = makeWO(S.orders[0]);
    wo.approved = true; wo.approvedBy = 'Nirav'; wo.stage = 2; wo.transport = 'Client 3rd party forwarder'; wo.labelling = 'White label';
    wo.formula = 'F-DM-210-07';
    wo.stageLog = [{ s: 0, by: 'Nirav', at: addDays(today(), -4) }, { s: 1, by: 'Ramesh (operator)', at: addDays(today(), -3) }];
  } else {
    const keep = ['divisions', 'roles', 'modules', 'countries', 'market'];
    SHARED.forEach(k => S[k] = keep.includes(k) ? d[k] : Array.isArray(d[k]) ? [] : {});
    S.modules = d.modules; S.tests = d.tests;
  }
  closeModal(); save(); rerender(); toast(demo ? 'Demo data loaded' : 'Ready. Add your products, vendors and staff to begin.');
}

/* ---------- Helpers ---------- */
const me = () => S.users.find(u => u.id === S.user);
const uname = id => (S.users.find(u => u.id === id) || {}).name || '-';
const prod = id => S.products.find(p => p.id === id) || {};
const rm = code => S.inventory.find(i => i.code === code) || { name: code, unit: '' };
const divName = id => (S.divisions.find(d => d.id === id) || {}).name || 'Group';
const inDiv = r => S.division === 'all' || !r.div || r.div === S.division;
const can = page => { const p = S.roles[me().role] || []; if (S.division !== 'all' && page !== 'dashboard' && page !== 'admin' && !divHas(S.division, page)) return false; return p.includes('*') || p.includes(page); };
const lowStock = () => S.inventory.filter(i => inDiv(i) && i.qty < i.min);
const paidFor = o => S.payments.filter(p => p.order === o && p.status === 'Received').reduce((a, p) => a + p.amount, 0);
const orderTotal = o => o.qty * o.rate;
function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 3200); }
function notify(to, text) { S.notifs.unshift({ to, text, date: today() }); }
function notifyRole(role, text) { S.users.filter(u => u.role === role && u.active !== false).forEach(u => notify(u.id, text)); }
function logA(text) { S.log.unshift({ text, by: me().name, at: new Date().toLocaleString('en-IN') }); }
function divOpts(sel) { return S.divisions.map(d => `<option value="${d.id}" ${d.id === sel ? 'selected' : ''}>${d.name}</option>`).join(''); }
function statusPill(s) {
  const m = { 'Received': 'green', 'Approved': 'green', 'Dispatched': 'green', 'Qualified': 'green', 'Quoted': 'green', 'Done': 'green', 'Invoiced': 'green',
    'Pending': 'amber', 'New': 'amber', 'Awaiting payment': 'amber', 'Paused till approval': 'violet', 'In production': '', 'Contacted': '',
    'Cancelled': 'red', 'Rejected': 'red', 'Lost': 'red', 'Intro sent': 'grey', 'Draft': 'grey', 'Ordered': '' };
  return `<span class="pill ${m[s] ?? ''}">${esc(s)}</span>`;
}
function convert(qty, from, to, density) {
  if (from === to) return qty;
  if (from === 'L' && to === 'kg') return qty * density;
  if (from === 'kg' && to === 'L') return qty / density;
  return qty;
}

/* ---------- Modal ---------- */
function modal(title, body, actions = '') {
  $('#modal').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div class="mh"><b>${title}</b><button class="btn sm" onclick="closeModal()"><i data-lucide="x"></i></button></div>
    <div class="mb">${body}</div>${actions ? `<div class="mf">${actions}</div>` : ''}</div></div>`;
}
function closeModal() { $('#modal').innerHTML = ''; }
const val = id => { const e = document.getElementById(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; };

/* ---------- Navigation ---------- */
const NAV = [
  ['Overview', [['dashboard', 'layout-dashboard', 'Dashboard']]],
  ['Sales & CRM', [['leads', 'target', 'Leads'], ['inquiries', 'mail', 'Inquiries'], ['products', 'flask-conical', 'Products & Pricing'], ['orders', 'file-text', 'Sales Orders / PO'], ['payments', 'wallet', 'Payments']]],
  ['Operations', [['workorders', 'factory', 'Work Orders'], ['inventory', 'package', 'Inventory'], ['procurement', 'shopping-cart', 'Procurement & Vendors'], ['lab', 'microscope', 'Lab / R&D'], ['dispatch', 'truck', 'Dispatch & Invoice'], ['machines', 'settings', 'Machines']]],
  ['People', [['team', 'calendar-days', 'Team & Planner'], ['attendance', 'clock', 'Attendance & HR'], ['training', 'graduation-cap', 'Training & Tests']]],
  ['Insights & Admin', [['market', 'globe', 'Market Intel'], ['admin', 'shield-check', 'Admin & Roles']]]
];
const TITLES = Object.fromEntries(NAV.flatMap(g => g[1]).map(x => [x[0], x[2]]));

function renderNav() {
  const counts = { inventory: lowStock().length, payments: S.payments.filter(p => inDiv(p) && p.status === 'Pending' && p.due < today()).length };
  $('#nav').innerHTML = NAV.map(([g, items]) => {
    const vis = items.filter(i => can(i[0]));
    if (!vis.length) return '';
    return `<div class="grp">${g}</div>` + vis.map(([id, ic, t]) =>
      `<a href="#${id}" class="${S.route.split('/')[0] === id ? 'on' : ''}"><i data-lucide="${ic}"></i>${t}${counts[id] ? `<span class="cnt">${counts[id]}</span>` : ''}</a>`).join('');
  }).join('');
  $('#divSel').innerHTML = `<option value="all">All divisions (Group)</option>` + divOpts(S.division);
  $('#divSel').value = S.division;
  $('#meBtn').innerHTML = `<span class="avatar">${esc(me().name[0])}</span><span class="hide-sm">${esc(me().name)}</span>`;
  const mine = S.notifs.filter(n => n.to === S.user).slice(0, 40);
  $('#ncount').textContent = mine.length || '';
  $('#np').innerHTML = mine.length ? mine.map(n => `<div>${esc(n.text)}<br><span class="muted small">${n.date} · for ${uname(n.to)}</span></div>`).join('') : '<div class="muted">No notifications</div>';
}
function toggleNotif() { $('#np').hidden = !$('#np').hidden; }

function go() {
  S.route = location.hash.slice(1) || 'dashboard';
  const [page, arg] = S.route.split('/');
  $('#side').classList.remove('open');
  $('#np').hidden = true;
  renderNav();
  $('#title').textContent = TITLES[page] || 'Work Order';
  const grp = (NAV.find(g => g[1].some(x => x[0] === page)) || ['Operations'])[0];
  $('#crumb').innerHTML = `Imperial<i data-lucide="chevron-right"></i>${grp}${arg ? `<i data-lucide="chevron-right"></i>${esc(TITLES[page] || '')}` : ''}<i data-lucide="chevron-right"></i>`;
  if (!can(page)) { $('#view').innerHTML = `<div class="alert err"><i data-lucide="lock"></i> Your role (<b>${me().role}</b>) does not have access to this module. Ask the Super Admin to enable it in Admin &amp; Roles.</div>`; return; }
  ($('#view').innerHTML = (PAGES[page] || PAGES.dashboard)(arg));
  save();
}
function rerender() { go(); }
window.addEventListener('hashchange', go);

/* ---------- Pages ---------- */
const PAGES = {};

PAGES.dashboard = () => {
  const orders = S.orders.filter(inDiv), pays = S.payments.filter(inDiv), wos = S.workorders.filter(inDiv);
  const pending = pays.filter(p => p.status === 'Pending').reduce((a, p) => a + (p.currency === 'USD' ? p.amount * 84 : p.amount), 0);
  const low = lowStock();
  const blocked = wos.filter(w => w.stage >= 4 && !w.invoiced);
  const dueM = S.machines.filter(m => addDays(m.last, m.every) <= addDays(today(), 7));
  const leadsBySrc = {}; S.leads.filter(inDiv).forEach(l => leadsBySrc[l.source] = (leadsBySrc[l.source] || 0) + 1);
  const maxL = Math.max(1, ...Object.values(leadsBySrc));
  return `
  <div class="grid g4">
    ${kpi('target', S.leads.filter(inDiv).length, 'Open leads')}
    ${kpi('file-text', orders.length, 'Sales orders')}
    ${kpi('factory', wos.filter(w => w.stage < 5).length, 'Work orders in progress')}
    ${kpi('wallet', inr(pending), 'Payments pending (INR eq.)')}
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><h3>Needs attention</h3>
      ${low.map(i => attn('package', 'red', i.name, `Low stock · ${i.qty} ${i.unit} (min ${i.min})`, '#procurement', 'Raise PO')).join('')}
      ${pays.filter(p => p.status === 'Pending' && p.due < today()).map(p => attn('wallet', 'amber', p.client, `Overdue · ${money(p.amount, p.currency)} since ${p.due}`, '#payments', 'Remind')).join('')}
      ${blocked.map(w => attn('receipt', 'amber', w.id, 'Invoice blocked · dispatch checklist pending', '#workorders/' + w.id, 'Open')).join('')}
      ${dueM.map(m => attn('settings', 'blue', m.name, `Maintenance due ${addDays(m.last, m.every)}`, '#machines', 'View')).join('')}
      ${!low.length && !blocked.length && !dueM.length ? '<span class="muted">All clear</span>' : ''}
    </div>
    <div class="card"><h3>Order-to-cash flow</h3>
      <div class="flow"><span>Lead</span>→<span>Inquiry</span>→<span>Quotation</span>→<span>PO</span>→<span>Payment</span>→<span>Work order</span>→<span>Production</span>→<span>QC</span>→<span>Dispatch</span>→<span>Invoice</span></div>
      <h3 style="margin-top:20px">Leads by source</h3>
      <div class="chart">${Object.entries(leadsBySrc).map(([k, v]) => `<div class="c"><b>${v}</b><i style="height:${v / maxL * 90}px"></i>${k}</div>`).join('')}</div>
    </div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><h3>Production pipeline</h3>${wos.map(w => `<div style="margin-bottom:10px"><a href="#workorders/${w.id}"><b>${w.id}</b></a> · ${w.client} · ${prod(w.productId).name}${stagesBar(w)}</div>`).join('') || '<span class="muted">No work orders</span>'}</div>
    <div class="card"><h3>Team activity today</h3>${teamTable()}</div>
  </div>`;
};
const attn = (ic, tone, title, sub, href, cta) => `<div class="attn"><span class="ai ${tone}"><i data-lucide="${ic}"></i></span><div style="flex:1;min-width:0"><b>${esc(title)}</b><div class="muted small">${sub}</div></div><a class="btn sm" href="${href}">${cta}</a></div>`;
const kpi = (ic, v, l) => `<div class="card kpi"><i class="ic" data-lucide="${ic}"></i><div class="v">${v}</div><div class="l">${l}</div></div>`;

/* Leads */
PAGES.leads = () => {
  const leads = S.leads.filter(inDiv);
  return `<div class="toolbar">
    <button class="btn p" onclick="leadForm()">+ Add lead</button>
    <button class="btn" onclick="fetchLeads()">⤓ Auto-fetch (IndiaMART / TradeIndia)</button>
    <div class="sp"></div><input placeholder="Search…" oninput="filterRows(this,'leadT')">
  </div>
  <div class="tw"><table class="tbl" id="leadT"><tr><th>ID</th><th>Company</th><th>Contact</th><th>Country</th><th>Source</th><th>Need</th><th>Owner</th><th>Status</th><th></th></tr>
  ${leads.map(l => `<tr><td>${l.id}</td><td><b>${esc(l.company)}</b><div class="muted small">${divName(l.div)}</div></td><td>${esc(l.person)}<div class="muted small">${esc(l.phone)}<br>${esc(l.email)}</div></td><td>${esc(l.country)}${countryReq(l.country) ? `<div class="muted small" style="max-width:220px" title="${esc(countryReq(l.country))}">${esc(countryReq(l.country).slice(0, 60))}${countryReq(l.country).length > 60 ? '…' : ''}</div>` : ''}</td><td><span class="pill violet">${l.source}</span></td><td>${esc(l.need)}</td><td>${uname(l.owner)}</td>
  <td><select onchange="setLead('${l.id}',this.value)">${['New', 'Contacted', 'Qualified', 'Lost'].map(s => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
  <td><button class="btn sm" onclick="leadToInq('${l.id}')">→ Inquiry</button></td></tr>`).join('')}</table></div>`;
};
function filterRows(inp, id) { const q = inp.value.toLowerCase(); document.querySelectorAll('#' + id + ' tr:not(:first-child)').forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'); }
function leadForm() {
  modal('New lead', `<div class="form">
    <label>Company<input id="lc"></label><label>Contact person<input id="lp"></label>
    <label>Phone<input id="lph"></label><label>Email<input id="le"></label>
    <label>Country<input id="lco" value="India"></label><label>Source<select id="ls">${['Manual', 'IndiaMART', 'TradeIndia', 'Website', 'Exhibition', 'Reference'].map(s => `<option>${s}</option>`)}</select></label>
    <label>Division<select id="ld">${divOpts(S.division === 'all' ? 'CHEM' : S.division)}</select></label>
    <label>Owner<select id="lo">${S.users.map(u => `<option value="${u.id}">${u.name}</option>`)}</select></label>
    <label class="full">Requirement<input id="ln"></label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveLead()">Save lead</button>`);
}
function saveLead() {
  if (!val('lc')) return toast('Company is required');
  S.leads.unshift({ id: nextNo('L'), div: val('ld'), company: val('lc'), person: val('lp'), phone: val('lph'), email: val('le'), country: val('lco'), source: val('ls'), need: val('ln'), status: 'New', owner: val('lo'), date: today() });
  closeModal(); toast('Lead added'); rerender();
}
function fetchLeads() {
  const pool = [['Al Noor Chemicals', 'Saudi Arabia', 'IndiaMART', 'Scale inhibitor 2 MT'], ['Balaji Agro Inputs', 'India', 'TradeIndia', 'Magnesium thiosulphate 5 KL'], ['Kenya Petro Ltd', 'Kenya', 'IndiaMART', 'Corrosion inhibitor'], ['Sunrise Foods', 'India', 'TradeIndia', 'Flexible pouches 50k']];
  pool.forEach(([c, co, s, n], i) => S.leads.unshift({ id: nextNo('L'), div: n.includes('pouch') ? 'PACK' : n.includes('thiosulphate') ? 'AGRO' : 'CHEM', company: c, person: '—', phone: '+91 9' + Math.floor(100000000 + Math.random() * 899999999), email: 'info@' + c.split(' ')[0].toLowerCase() + '.com', country: co, source: s, need: n, status: 'New', owner: i % 2 ? 'U4' : 'U5', date: today() }));
  logA('Fetched 4 leads from portals'); toast('4 new leads fetched (simulated)'); rerender();
}
function callMe() {
  S.leads.unshift({ id: nextNo('L'), div: 'CHEM', company: 'Visitor via mail button', person: 'Ravi Kumar', phone: '+91 98989 12345', email: 'ravi@example.com', country: 'India', source: 'Call-me button', need: 'Requested a call back', status: 'New', owner: 'U4', date: today() });
  notifyRole('Sales Executive', 'New call-back request from Ravi Kumar'); toast('Call-back request captured'); rerender();
}
function setLead(id, s) { S.leads.find(l => l.id === id).status = s; save(); }
function leadToInq(id) {
  const l = S.leads.find(x => x.id === id);
  inquiryForm({ company: l.company, email: l.email, country: l.country, text: l.need, div: l.div });
}

/* Inquiries */
PAGES.inquiries = () => `<div class="toolbar"><button class="btn p" onclick="inquiryForm()">+ New inquiry (paste mail)</button><div class="sp"></div></div>
  <div class="tw"><table class="tbl"><tr><th>ID</th><th>Date</th><th>Customer</th><th>Inquiry</th><th>Match</th><th>Status</th><th></th></tr>
  ${S.inquiries.filter(inDiv).map(q => `<tr><td>${q.id}</td><td>${q.date}</td><td><b>${esc(q.company)}</b><div class="muted small">${esc(q.email)} · ${esc(q.country)}</div></td><td>${esc(q.text)}</td>
  <td>${q.productId ? `<span class="pill green"><i data-lucide="check"></i> ${prod(q.productId).name}</span>` : '<span class="pill grey">Not in our range</span>'}</td><td>${statusPill(q.status)}</td>
  <td class="row"><button class="btn sm" onclick="showMail('${q.id}')">View mail</button>${q.productId ? `<button class="btn sm p" onclick="orderForm('${q.id}')">Create PO / SO</button>` : ''}</td></tr>`).join('')}</table></div>`;
function inquiryForm(pre = {}) {
  modal('New inquiry', `<div class="form">
    <label>Customer / Company<input id="qc" value="${esc(pre.company || '')}"></label><label>Email<input id="qe" value="${esc(pre.email || '')}"></label>
    <label>Country<input id="qco" value="${esc(pre.country || 'India')}"></label><label>Division<select id="qd">${divOpts(pre.div || 'CHEM')}</select></label>
    <label class="full">Mail / message text<textarea id="qt">${esc(pre.text || '')}</textarea></label>
    <label>Quantity<input id="qq" type="number" value="1000"></label><label>Unit<select id="qu"><option>kg</option><option>L</option><option>pcs</option></select></label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveInquiry()">Run auto filter</button>`);
}
function matchProduct(text) {
  const t = text.toLowerCase();
  return S.products.find(p => p.make && (t.includes(p.name.toLowerCase()) || t.includes(p.code.toLowerCase()) || p.name.toLowerCase().split(' ').filter(w => w.length > 4).every(w => t.includes(w))));
}
function saveInquiry() {
  const p = matchProduct(val('qt'));
  const q = { id: nextNo('INQ'), div: p ? p.div : val('qd'), company: val('qc'), email: val('qe'), country: val('qco'), text: val('qt'), productId: p ? p.id : null, qty: +val('qq'), unit: val('qu'), status: 'Draft', date: today() };
  S.inquiries.unshift(q); closeModal(); showMail(q.id);
}
function mailFor(q) {
  const p = prod(q.productId), exp = q.country !== 'India';
  if (q.productId) return {
    subject: `Quotation: ${p.name} | Imperial`,
    body: `Dear ${q.company} team,\n\nThank you for your inquiry. We manufacture ${p.name} (${p.code}).\n\n• Price: ${exp ? '$' + p.usd + ' / ' + p.unit + ' (FOB Mundra)' : inr(p.price) + ' / ' + p.unit + ' + GST (Ex-works)'}\n• MOQ: ${p.moq} ${p.unit}\n• Packing: 200 L HDPE drums / 1 KL IBC\n• Lead time: 10–12 working days after PO and advance\n• Classification: ${p.haz ? 'HAZARDOUS (UN-classified, shipped with HAZ labels)' : 'Non-hazardous'}\n\nPlease find attached the quotation, terms & conditions and technical datasheet.\n\nWant to talk? Click below and our team will call you back.\n[ Schedule a call ]   [ WhatsApp us ]\n\nRegards,\nSales Team, Imperial`,
    att: ['Quotation.pdf', 'Terms_and_Conditions.pdf', `TDS_${p.code}.pdf`, ...(p.haz ? ['MSDS.pdf'] : [])]
  };
  return {
    subject: 'Introduction: Imperial Group',
    body: `Dear ${q.company} team,\n\nThank you for reaching out. The product you asked about is currently not in our manufacturing range.\n\nImperial is a group of companies based in Halol, Gujarat: Imperial Oilfield Chemicals, Imperial Agro (liquid thiosulphate fertilizers) and Imperial Flexipack (flexible packaging) serving customers across India and export markets. Our range includes oilfield production chemicals, calcium / magnesium / potassium / ammonium thiosulphate fertilizers and flexible packaging.\n\nWe'd be glad to understand your requirement in detail, since we may be able to help with an alternative.\n[ Schedule a call ]   [ WhatsApp us ]\n\nRegards,\nSales Team, Imperial`,
    att: ['Company_Profile.pdf', 'Product_Catalogue.pdf']
  };
}
function showMail(id) {
  const q = S.inquiries.find(x => x.id === id), m = mailFor(q);
  modal(q.productId ? 'Product matched: auto quotation' : 'Not in our range: introduction mail',
    `<div class="muted small">To: ${esc(q.email)}<br>Subject: <b>${esc(m.subject)}</b></div><div class="mail" style="margin-top:8px">${esc(m.body)}</div>
     <div>${m.att.map(a => `<span class="attach"><i data-lucide="paperclip"></i> ${a}</span>`).join('')}</div>`,
    `<button class="btn" onclick="closeModal()">Close</button><button class="btn" onclick="sendSim('${id}','WhatsApp')"><i data-lucide="message-circle"></i> Send on WhatsApp</button><button class="btn p" onclick="sendSim('${id}','Mail')"><i data-lucide="mail"></i> Send mail</button>`);
}
function sendSim(id, ch) {
  const q = S.inquiries.find(x => x.id === id); q.status = q.productId ? 'Quoted' : 'Intro sent';
  logA(`${ch} sent to ${q.company}`); closeModal(); toast(`${ch} sent (simulated). Will go live once the integration is connected.`); rerender();
}

/* Products */
PAGES.products = () => `<div class="toolbar"><button class="btn p" onclick="productForm()">+ Add product</button><div class="sp"></div></div>
  <div class="tw"><table class="tbl"><tr><th>Code</th><th>Product</th><th>Division</th><th>Export name (same serial)</th><th>Unit</th><th>Price ₹</th><th>Price $</th><th>MOQ</th><th>Density</th><th>HAZ</th></tr>
  ${S.products.filter(inDiv).map(p => `<tr><td>${p.code}</td><td><b>${esc(p.name)}</b></td><td>${divName(p.div)}</td><td><input value="${esc(p.alias)}" placeholder="—" onchange="setP('${p.id}','alias',this.value)"></td><td>${p.unit}</td>
  <td><input type="number" style="width:90px" value="${p.price}" onchange="setP('${p.id}','price',+this.value)"></td><td><input type="number" step="0.1" style="width:70px" value="${p.usd}" onchange="setP('${p.id}','usd',+this.value)"></td>
  <td><input type="number" style="width:90px" value="${p.moq}" onchange="setP('${p.id}','moq',+this.value)"></td><td>${p.density}</td>
  <td><input type="checkbox" ${p.haz ? 'checked' : ''} onchange="setP('${p.id}','haz',this.checked)"></td></tr>`).join('')}</table></div>`;
function setP(id, k, v) { S.products.find(p => p.id === id)[k] = v; save(); toast('Saved'); }
function productForm() {
  modal('New product', `<div class="form"><label>Name<input id="pn"></label><label>Code<input id="pc" value="IMP-"></label>
    <label>Division<select id="pd">${divOpts('CHEM')}</select></label><label>Unit<select id="pu"><option>kg</option><option>L</option><option>pcs</option></select></label>
    <label>Price ₹<input id="pp" type="number"></label><label>Price $<input id="pus" type="number" step="0.1"></label>
    <label>MOQ<input id="pm" type="number"></label><label>Density (kg/L)<input id="pde" type="number" step="0.01" value="1"></label>
    <label>Export name<input id="pa"></label><label class="chk"><input type="checkbox" id="ph"> Hazardous</label></div>`,
    `<button class="btn p" onclick="saveProduct()">Save</button>`);
}
function saveProduct() {
  S.products.push({ id: uid('P'), div: val('pd'), name: val('pn'), code: val('pc'), alias: val('pa'), unit: val('pu'), price: +val('pp'), usd: +val('pus'), moq: +val('pm'), density: +val('pde') || 1, haz: val('ph'), make: true });
  closeModal(); rerender();
}

/* Sales orders */
PAGES.orders = () => `<div class="toolbar"><button class="btn p" onclick="orderForm()">+ New sales order</button><div class="sp"></div></div>
  <div class="tw"><table class="tbl"><tr><th>SO</th><th>Client</th><th>Product</th><th>Qty</th><th>Value</th><th>PO</th><th>Payment terms</th><th>Paid</th><th>Status</th><th></th></tr>
  ${S.orders.filter(inDiv).map(o => { const paid = paidFor(o.id), tot = orderTotal(o); const wo = S.workorders.find(w => w.order === o.id);
    return `<tr><td>${o.id}<div class="muted small">${o.date}</div></td><td><b>${esc(o.client)}</b><div class="muted small">${o.export ? '<i data-lucide="globe"></i> Export · ' + o.country + (o.lc ? ' · LC' : '') : '<i data-lucide="map-pin"></i> Local'}</div></td><td>${prod(o.productId).name}</td><td>${o.qty} ${o.unit}</td><td>${money(tot, o.currency)}</td>
    <td>${o.poReceived ? `<span class="pill green">${esc(o.poNo)}</span>` : `<span class="pill amber">No PO · approved by "${esc(o.approvedBy)}"</span>`}</td>
    <td>${o.terms.map(t => t.pct).join(' / ')}</td><td><div class="bar"><i style="width:${Math.min(100, paid / tot * 100)}%"></i></div><span class="small muted">${money(paid, o.currency)}</span></td><td>${statusPill(o.status)}</td>
    <td>${wo ? `<a class="btn sm" href="#workorders/${wo.id}">${wo.id}</a>` : `<button class="btn sm p" onclick="createWO('${o.id}')">Create WO</button>`}</td></tr>`; }).join('')}</table></div>`;
function orderForm(inqId) {
  const q = inqId ? S.inquiries.find(x => x.id === inqId) : {};
  const exp = q.country && q.country !== 'India';
  modal('New sales order (client PO)', `<div class="form">
    <label>Client<input id="oc" value="${esc(q.company || '')}"></label><label>Country<input id="oco" value="${esc(q.country || 'India')}"></label>
    <label>Product<select id="op" onchange="checkUnits()">${S.products.map(p => `<option value="${p.id}" ${p.id === q.productId ? 'selected' : ''}>${p.name} (priced per ${p.unit})</option>`)}</select></label>
    <label>Currency<select id="ocur"><option ${!exp ? 'selected' : ''}>INR</option><option ${exp ? 'selected' : ''}>USD</option></select></label>
    <label>PO quantity<input id="oq" type="number" value="${q.qty || 1000}" oninput="checkUnits()"></label>
    <label>PO unit<select id="ou" onchange="checkUnits()"><option ${q.unit === 'kg' ? 'selected' : ''}>kg</option><option ${q.unit === 'L' ? 'selected' : ''}>L</option><option>pcs</option></select></label>
    <div class="full" id="unitMsg"></div>
    <label>Rate per selected unit<input id="or" type="number" step="0.01"></label><label>Client PO number<input id="opo" placeholder="Leave blank if no PO received"></label>
    <label class="full">Payment terms (custom split, e.g. 50/50, 100, 70/30, 30/70, 30/40/30)<input id="ot" value="50/50" placeholder="30/70"></label>
    <label class="full">Days for each instalment (comma separated)<input id="odays" value="0,30"></label>
    <label class="chk"><input type="checkbox" id="olc" ${exp ? 'checked' : ''}> Letter of credit (export)</label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveOrder('${inqId || ''}')">Save order</button>`);
  checkUnits();
}
function checkUnits() {
  const p = prod(val('op')), u = val('ou'), q = +val('oq');
  const rate = val('ocur') === 'USD' ? p.usd : p.price;
  const el = $('#unitMsg'); if (!el) return;
  if (!$('#or').value || $('#or').dataset.auto) { $('#or').value = rate; $('#or').dataset.auto = 1; }
  if (u !== p.unit && p.unit !== 'pcs' && u !== 'pcs') {
    const c = convert(q, u, p.unit, p.density);
    el.innerHTML = `<div class="alert warn"><i data-lucide="scale"></i> <div><b>Unit mismatch detected:</b> client PO is in <b>${u}</b> but ${p.name} is priced per <b>${p.unit}</b>. ${q} ${u} ≈ <b>${c.toFixed(1)} ${p.unit}</b> (density ${p.density} kg/L).<br>
      <div class="row" style="margin-top:6px"><button class="btn sm" onclick="useUnit('${p.unit}',${c.toFixed(2)})">Convert PO to ${p.unit}</button><button class="btn sm" onclick="useRate(${(rate * (u === 'L' ? p.density : 1 / p.density)).toFixed(2)})">Keep ${u}, convert rate</button></div></div></div>`;
  } else el.innerHTML = q < p.moq ? `<div class="alert warn">Quantity is below the MOQ (${p.moq} ${p.unit})</div>` : '';
}
function useUnit(u, q) { $('#ou').value = u; $('#oq').value = q; checkUnits(); toast('PO converted to ' + u); }
function useRate(r) { $('#or').value = r; delete $('#or').dataset.auto; $('#unitMsg').innerHTML = `<div class="alert ok">Rate converted to ${r} per ${val('ou')}</div>`; }
function saveOrder(inqId) {
  const pcts = val('ot').split('/').map(Number), days = val('odays').split(',').map(Number);
  if (pcts.reduce((a, b) => a + b, 0) !== 100) return toast('Payment split must add up to 100');
  const p = prod(val('op'));
  const o = { id: nextNo('SO'), div: p.div, client: val('oc'), country: val('oco'), export: val('oco') !== 'India', currency: val('ocur'), productId: p.id, qty: +val('oq'), unit: val('ou'), rate: +val('or'), poNo: val('opo'), poReceived: !!val('opo'), approvedBy: '', terms: pcts.map((pct, i) => ({ pct, days: days[i] ?? 0 })), lc: val('olc'), date: today(), status: 'Awaiting payment' };
  const finish = () => { S.orders.unshift(o); buildPayments(o); if (inqId) S.inquiries.find(x => x.id === inqId).status = 'Approved'; closeModal(); toast('Sales order created with ' + o.terms.length + ' payment entries'); location.hash = 'orders'; rerender(); };
  if (!o.poReceived) {
    modal('Client has not sent a PO', `<div class="alert warn">No purchase order was received from <b>${esc(o.client)}</b>. Who is approving this order without a PO? Their name will be recorded as <b>“Approved by”</b>.</div>
      <label class="form"><span>Approved by</span><select id="apb">${S.users.map(u => `<option>${u.name}</option>`)}</select></label>`,
      `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" id="apbOk">Approve without PO</button>`);
    $('#apbOk').onclick = () => { o.approvedBy = val('apb'); finish(); };
  } else finish();
}
function buildPayments(o) {
  const tot = orderTotal(o);
  o.terms.forEach((t, i) => S.payments.push({ id: uid('PAY'), div: o.div, order: o.id, client: o.client, currency: o.currency, label: `Instalment ${i + 1} (${t.pct}%)`, amount: Math.round(tot * t.pct / 100), due: addDays(o.date, t.days), status: 'Pending', reminders: 0 }));
}

/* Payments */
PAGES.payments = () => {
  const ps = S.payments.filter(inDiv);
  const sum = s => ps.filter(p => p.status === s).length;
  return `<div class="grid g4">${kpi('check-circle-2', sum('Received'), 'Received')}${kpi('hourglass', sum('Pending'), 'Pending')}${kpi('pause-circle', sum('Paused till approval'), 'Paused till approval')}${kpi('x-circle', sum('Cancelled'), 'Cancelled')}</div>
  <div class="card" style="margin-top:16px"><h3>Payment schedule<span class="sp"></span><button class="btn sm" onclick="remindAll()"><i data-lucide="bell"></i> Remind overdue</button></h3>
  <div class="tw"><table class="tbl"><tr><th>Order</th><th>Client</th><th>Instalment</th><th>Amount</th><th>Due</th><th>Status</th><th>Reminders</th><th></th></tr>
  ${ps.map(p => `<tr><td>${p.order}</td><td>${esc(p.client)}</td><td>${p.label}</td><td><b>${money(p.amount, p.currency)}</b></td><td>${p.due}${p.status === 'Pending' && p.due < today() ? ' <span class="pill red">Overdue</span>' : ''}</td>
  <td><select onchange="setPay('${p.id}',this.value)">${['Pending', 'Received', 'Paused till approval', 'Cancelled'].map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
  <td>${p.reminders}</td><td><button class="btn sm" onclick="remind('${p.id}')">Remind</button></td></tr>`).join('')}</table></div></div>`;
};
function setPay(id, s) {
  const p = S.payments.find(x => x.id === id); p.status = s;
  if (s === 'Received') { const o = S.orders.find(x => x.id === p.order); if (o && o.status === 'Awaiting payment') o.status = 'Payment received'; notifyRole('Production Head', `Payment received for ${p.order}. Work order can be approved.`); }
  logA(`Payment ${p.label} of ${p.order} → ${s}`); toast('Payment updated'); rerender();
}
function remind(id) { const p = S.payments.find(x => x.id === id); p.reminders++; toast(`Reminder sent to ${p.client} on mail + WhatsApp (simulated)`); rerender(); }
function remindAll() { const od = S.payments.filter(p => inDiv(p) && p.status === 'Pending' && p.due < today()); od.forEach(p => p.reminders++); toast(od.length + ' reminders sent (simulated)'); rerender(); }

/* Work orders */
// Stage kinds drive behaviour: 'start' needs transport fixed, 'stock' deducts raw materials when completed,
// 'qc' records readings, 'ship' needs the CHA for export, 'final' is the dispatched state.
const DEFAULT_FLOW = [
  { name: 'Inventory check', kind: 'start', info: 'Confirm formulation, raw material and packaging before starting.', checks: ['Formulation confirmed (raw material codes)', 'Raw material available / PO raised', 'Packaging material available'] },
  { name: 'Production (layers)', kind: 'stock', info: 'Follow the batch sheet layer by layer.', checks: ['Layer 1: charge base raw materials', 'Layer 2: blending & heating', 'Layer 3: additive dosing', 'Batch sheet signed'] },
  { name: 'QC', kind: 'qc', info: 'Draw samples from top and bottom of the vessel.', checks: ['Sample drawn for QC', 'Lab test report attached', 'QC approved'] },
  { name: 'Packing & labelling', kind: 'pack', info: '', checks: ['Labelling type applied', 'HAZ sticker applied (if hazardous)', 'Drums sealed & weighed'] },
  { name: 'Ready for dispatch', kind: 'ship', info: '', checks: ['Transport confirmed', 'CHA finalised (export)', 'Customer dispatch message sent'] },
  { name: 'Dispatched', kind: 'final', info: '', checks: ['Dispatch photos uploaded', 'LR / BL copy received'] }
];
const flowFor = div => JSON.parse(JSON.stringify((S.workflows || {})[div] || DEFAULT_FLOW));
const flowOf = w => w.flow || DEFAULT_FLOW;
const lastStage = w => flowOf(w).length - 1;
const stageName = w => (flowOf(w)[w.stage] || {}).name || '';
function makeWO(o) {
  const p = prod(o.productId);
  const wo = { id: nextNo('WO'), div: o.div, order: o.id, client: o.client, productId: o.productId, qty: o.qty, unit: o.unit, export: o.export,
    approved: false, approvedBy: '', stage: 0, checks: {}, stageLog: [], operators: {}, transport: '', labelling: '', haz: p.haz, cha: '', hazDone: false, photos: [], invoiced: false,
    formula: (S.formulations.find(f => f.productId === o.productId && f.approved) || {}).batch || '', flow: flowFor(o.div), expected: addDays(today(), 12), qc: [], delivery: null, trackToken: rndToken() };
  S.workorders.unshift(wo); o.status = o.status === 'Awaiting payment' ? 'Awaiting payment' : 'In production';
  return wo;
}
function createWO(oid) { const wo = makeWO(S.orders.find(o => o.id === oid)); toast(wo.id + ' created'); location.hash = 'workorders/' + wo.id; }
const stagesBar = w => `<div class="stages">${flowOf(w).map((s, i) => `<div class="stage ${i < w.stage || (i === lastStage(w) && w.stage === i && w.photos.length) ? 'done' : i === w.stage ? 'cur' : ''}"><span class="dot">${i < w.stage ? '<i data-lucide="check"></i>' : ''}</span>${esc(s.name)}</div>`).join('')}</div>`;

PAGES.workorders = id => {
  if (id) return woDetail(S.workorders.find(w => w.id === id));
  return `<div class="tw"><table class="tbl"><tr><th>WO</th><th>Client</th><th>Product</th><th>Qty</th><th>Approved</th><th>Stage</th><th>Expected</th><th></th></tr>
  ${S.workorders.filter(inDiv).map(w => `<tr><td><b>${w.id}</b><div class="muted small">${w.order}</div></td><td>${esc(w.client)}</td><td>${prod(w.productId).name}${w.haz ? ' <span class="pill red">HAZ</span>' : ''}</td><td>${w.qty} ${w.unit}</td>
  <td>${w.approved ? `<span class="pill green">by ${w.approvedBy}</span>` : '<span class="pill amber">Pending</span>'}</td><td>${esc(stageName(w))}</td><td>${w.expected}</td><td><a class="btn sm p" href="#workorders/${w.id}">Open</a></td></tr>`).join('') || '<tr><td colspan=8 class="muted">Create a work order from a sales order.</td></tr>'}</table></div>`;
};
let woTab = 'overview';
function woDetail(w) {
  if (!w) return 'Not found';
  const o = S.orders.find(x => x.id === w.order), p = prod(w.productId), paid = paidFor(w.order);
  const tabs = [['overview', 'Overview'], ['formula', 'Formulation & inventory'], ['stages', 'Production stages'], ['customer', 'Customer updates'], ['dispatch', 'Dispatch & invoice']];
  let body = '';
  if (woTab === 'overview') body = `
    ${!w.approved ? (advOk(o) ? `<div class="alert ok"><i data-lucide="check-circle-2"></i> Advance received (${money(paid, o.currency)} of ${money(advNeeded(o), o.currency)} required). This work order can be approved.<span style="flex:1"></span><button class="btn g" onclick="approveWO('${w.id}')">Approve & start production</button></div>`
      : `<div class="alert err"><i data-lucide="lock"></i> Approval locked: ${money(paid, o.currency)} received, ${money(advNeeded(o), o.currency)} (${advPct(o)}%) advance needed for ${w.order}. <a href="#payments">Payments</a><span style="flex:1"></span><button class="btn sm" onclick="setAdvance('${o.id}')">Change advance</button></div>`) : `<div class="alert ok">Approved by <b>${w.approvedBy}</b>. Production running.</div>`}
    <div class="form">
      <label>Transport (clarify at work-order stage)<select onchange="setW('${w.id}','transport',this.value)">${['', 'Imperial arranges', 'Client own vehicle', 'Client 3rd party forwarder'].map(s => `<option ${s === w.transport ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Labelling<select onchange="setW('${w.id}','labelling',this.value)">${['', 'Imperial labelling', 'White label'].map(s => `<option ${s === w.labelling ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label>Hazardous?<select onchange="setW('${w.id}','haz',this.value==='Yes')"><option ${w.haz ? 'selected' : ''}>Yes</option><option ${!w.haz ? 'selected' : ''}>No</option></select></label>
      <label>Expected dispatch<input type="date" value="${w.expected}" onchange="setW('${w.id}','expected',this.value)"></label>
    </div>
    <h3 style="margin-top:18px">${w.export ? '<i data-lucide="globe"></i> Export checklist' : '<i data-lucide="map-pin"></i> Local documentation'}</h3>
    ${(w.export ? ['Commercial invoice (USD)', 'Packing list', 'Certificate of origin', 'MSDS', 'Letter of credit documents', 'Shipping bill via CHA', ...(w.haz ? ['DG declaration + HAZ class labels'] : [])] : ['Tax invoice (GST)', 'E-way bill', 'Delivery challan', 'COA', ...(w.haz ? ['TREM card'] : [])]).map(d => `<label class="chk"><input type="checkbox" ${w.checks['doc:' + d] ? 'checked' : ''} onchange="tick('${w.id}','doc:${d}',this.checked)">${d}</label>`).join('')}
    ${w.export && p.alias ? `<div class="alert info" style="margin-top:10px"><i data-lucide="repeat"></i> For transport regulations this shipment goes out as <b>“${esc(p.alias)}”</b> instead of “${esc(p.name)}”. The serial / batch number <b>${w.formula || p.code}</b> stays the same for full traceability.</div>` : ''}
    <button class="btn" style="margin-top:8px" onclick="woConfirmMail('${w.id}')"><i data-lucide="mail"></i> Preview work-order confirmation mail</button>`;
  if (woTab === 'formula') {
    const f = S.formulations.find(x => x.batch === w.formula);
    const qKg = convert(w.qty, w.unit, 'kg', p.density);
    body = `<div class="row" style="margin-bottom:12px"><label class="muted small">Formulation / batch</label><select onchange="setW('${w.id}','formula',this.value)"><option value="">Select…</option>${S.formulations.filter(f => f.productId === w.productId).map(f => `<option ${f.batch === w.formula ? 'selected' : ''} value="${f.batch}">${f.batch} · ${f.version}${f.approved ? ' (approved)' : ''}</option>`).join('')}</select><a class="btn sm" href="#lab">Open Lab</a></div>
    ${f ? `<div class="tw"><table class="tbl"><tr><th>RM code</th><th>%</th><th>Required</th><th>In stock</th><th>On order</th><th>Status</th></tr>
    ${f.items.map(it => { const r = rm(it.code); const need = convert(qKg * it.pct / 100, 'kg', r.unit, 1); const ok = r.qty >= need;
      const onOrd = S.pos.filter(x => x.code === it.code && ['Ordered', 'Awaiting approval'].includes(x.status)).reduce((a, x) => a + x.qty, 0), toBuy = Math.max(0, Math.ceil(need - r.qty - onOrd));
      return `<tr><td><b>${it.code}</b></td><td>${it.pct}%</td><td class="num">${need.toFixed(0)} ${r.unit}</td><td class="num">${r.qty} ${r.unit}</td><td class="num">${onOrd ? onOrd + ' ' + r.unit : '–'}</td><td>${ok ? (r.qty - need < r.min ? '<span class="pill amber">OK, will go below min</span>' : '<span class="pill green">Available</span>') : (toBuy ? `<span class="pill red">Buy ${toBuy} ${r.unit}</span> <button class="btn sm" onclick="quickPO('${it.code}',${Math.ceil(toBuy + r.min)})">Raise PO</button>` : '<span class="pill amber">Short, covered by open PO</span>')}</td></tr>`; }).join('')}</table></div>` : '<div class="alert warn">No formulation linked.</div>'}`;
  }
  if (woTab === 'stages') body = stagesBar(w) + flowOf(w).map((st, i) => `<div class="card stage-card ${i === w.stage ? 'is-cur' : i > w.stage ? 'is-next' : ''}"><h3>${i + 1}. ${esc(st.name)}<span class="sp"></span>${i < w.stage ? '<span class="pill green">Done</span>' : ''}</h3>
      ${st.info ? `<p class="muted small" style="margin:-6px 0 8px">${esc(st.info)}</p>` : ''}
      ${(st.checks || []).map(c => `<label class="chk"><input type="checkbox" ${w.checks[i + ':' + c] ? 'checked' : ''} ${!w.approved ? 'disabled' : ''} onchange="tick('${w.id}',${JSON.stringify(i + ':' + c).replace(/"/g, '&quot;')},this.checked)">${esc(c)}</label>`).join('')}
      ${st.kind === 'qc' ? `<div class="row" style="margin-top:6px"><input id="qcv" placeholder="Manual QC entry e.g. Viscosity 42 cP"><button class="btn sm" onclick="addQC('${w.id}')">Add QC reading</button><button class="btn sm" onclick="coa('${w.id}')"><i data-lucide="file-check-2"></i> Certificate of analysis</button></div>${w.qc.map(q => `<div class="small"><i data-lucide="flask-conical"></i> ${esc(q)}</div>`).join('')}` : ''}
      ${i === w.stage && w.stage < lastStage(w) ? `<div class="row" style="margin-top:8px"><span class="muted small">Done by</span><input id="opr" placeholder="Person / operator" value="${esc(w.operators[i] || '')}"><button class="btn p sm" ${!w.approved ? 'disabled' : ''} onclick="nextStage('${w.id}')">Complete stage →</button></div>` : ''}
      ${w.stageLog.filter(l => l.s === i).map(l => `<div class="muted small"><i data-lucide="check"></i> by ${esc(l.by)} on ${l.at}</div>`).join('')}</div>`).join('');
  if (woTab === 'customer') body = `<div class="form"><label>Expected dispatch date<input id="cd" type="date" value="${w.expected}"></label><label>Reason / message (optional)<input id="cr" placeholder="e.g. waiting for QC retest"></label></div>
    <button class="btn p" style="margin-top:10px" onclick="custMsg('${w.id}')">Generate & send update</button>
    <div id="cmsg" style="margin-top:12px"></div>
    <h3 style="margin-top:16px">Timeline visible to the client</h3>${stagesBar(w)}`;
  if (woTab === 'dispatch') {
    const ok = { photos: w.photos.length > 0, cha: !w.export || !!w.cha, haz: !w.haz || w.hazDone };
    body = `<div class="grid g2"><div>
      <h3>Dispatch checklist (invoice rule)</h3>
      <div class="chk">${ok.photos ? '<i data-lucide="check-circle-2"></i>' : '<i data-lucide="circle"></i>'} Dispatch photos uploaded (${w.photos.length})</div>
      <div class="chk">${ok.cha ? '<i data-lucide="check-circle-2"></i>' : '<i data-lucide="circle"></i>'} CHA finalised ${w.export ? '' : '<span class="muted small">(not needed for local)</span>'}</div>
      <div class="chk">${ok.haz ? '<i data-lucide="check-circle-2"></i>' : '<i data-lucide="circle"></i>'} HAZ labelling done ${w.haz ? '' : '<span class="muted small">(non-hazardous)</span>'}</div>
      ${w.export ? `<label class="form" style="margin-top:8px"><span>CHA name</span><input value="${esc(w.cha)}" onchange="setW('${w.id}','cha',this.value)" placeholder="e.g. Mundra Clearing Agency"></label>` : ''}
      ${w.haz ? `<label class="chk"><input type="checkbox" ${w.hazDone ? 'checked' : ''} onchange="setW('${w.id}','hazDone',this.checked)"> HAZ sticker applied and photo attached in client mail</label><button class="btn sm" style="margin-top:6px" onclick="hazSticker('${w.id}')"><i data-lucide="alert-triangle"></i> Print HAZ sticker</button>` : ''}
      <div style="margin-top:12px">${w.invoiced ? '<div class="alert ok"><i data-lucide="receipt"></i> Invoice generated</div>' : `<button class="btn g" ${ok.photos && ok.cha && ok.haz ? '' : 'disabled'} onclick="invoice('${w.id}')"><i data-lucide="receipt"></i> Generate invoice</button>${ok.photos && ok.cha && ok.haz ? '' : '<div class="muted small" style="margin-top:6px">Locked until every item above is ticked.</div>'}`}</div>
      <h3 style="margin-top:18px">Delivery outcome</h3>
      ${w.delivery ? `<div class="alert ${w.delivery.ok ? 'ok' : 'err'}">${w.delivery.ok ? 'Delivered successfully' : 'Rejected: ' + esc(w.delivery.reason) + ' → Action: ' + w.delivery.action}</div>` :
        `<div class="row"><button class="btn sm g" onclick="deliver('${w.id}',true)">Delivered <i data-lucide="check"></i></button><button class="btn sm r" onclick="deliver('${w.id}',false)">Rejected…</button></div>`}
    </div><div>
      <h3>Dispatch photos</h3><input type="file" accept="image/*" multiple onchange="addPhotos('${w.id}',this.files)">
      <div class="photos" style="margin-top:10px">${w.photos.map(ph => `<div class="photo">${ph.src ? `<img src="${ph.src}">` : '<div class="ph"><i data-lucide="camera"></i></div>'}<div class="c">${ph.date}<br>${esc(w.client)}</div></div>`).join('')}</div>
      
    </div></div>`;
  }
  return `<div class="toolbar"><a class="btn sm" href="#workorders">← All work orders</a><b style="font-size:16px">${w.id}</b><span class="muted">${esc(w.client)} · ${p.name} · ${w.qty} ${w.unit} · ${divName(w.div)}</span>${w.haz ? '<span class="pill red">HAZARDOUS</span>' : ''}${w.export ? '<span class="pill violet">EXPORT</span>' : '<span class="pill">LOCAL</span>'}<span class="sp"></span><button class="btn sm" onclick="copyTrack('${w.id}')"><i data-lucide="link"></i> Copy tracking link</button></div>
    ${stagesBar(w)}
    <div class="card"><div class="tabs">${tabs.map(([k, t]) => `<button class="${woTab === k ? 'on' : ''}" onclick="woTab='${k}';rerender()">${t}</button>`).join('')}</div>${body}</div>`;
}
function setW(id, k, v) { S.workorders.find(w => w.id === id)[k] = v; save(); rerender(); }
function tick(id, k, v) { S.workorders.find(w => w.id === id).checks[k] = v; save(); }
function approveWO(id) {
  const w = S.workorders.find(x => x.id === id);
  if (!advOk(S.orders.find(o => o.id === w.order))) return toast('The required advance has not been received yet'); w.approved = true; w.approvedBy = me().name;
  S.orders.find(o => o.id === w.order).status = 'In production'; notifyRole('Production Head', `${id} approved. Start production.`); logA(id + ' approved'); toast('Work order approved'); rerender();
}
function nextStage(id) {
  const w = S.workorders.find(x => x.id === id);
  const st = flowOf(w)[w.stage] || {};
  const missing = (st.checks || []).filter(c => !w.checks[w.stage + ':' + c]);
  if (missing.length && !confirm(`${missing.length} checklist item(s) not ticked:\n• ${missing.join('\n• ')}\n\nComplete the stage anyway?`)) return;
  if (st.kind === 'ship' && w.export && !w.cha) return toast('Finalise the CHA (Dispatch tab) first');
  if (st.kind === 'start' && !w.transport) { woTab = 'overview'; rerender(); return toast('Clarify transport first (client / 3rd party / Imperial)'); }
  const by = val('opr') || me().name; w.operators[w.stage] = by;
  w.stageLog.push({ s: w.stage, by, at: today() });
  if (st.kind === 'stock') { // auto-deduct raw materials
    const f = S.formulations.find(x => x.batch === w.formula), p = prod(w.productId);
    if (f) f.items.forEach(it => { const r = rm(it.code); if (r.qty !== undefined) r.qty = Math.max(0, Math.round(r.qty - convert(w.qty, w.unit, 'kg', p.density) * it.pct / 100)); });
    const lows = lowStock(); if (lows.length) toast('Stock deducted. ' + lows.length + ' material(s) now below minimum');
  }
  w.stage = Math.min(lastStage(w), w.stage + 1);
  if (w.stage === lastStage(w)) { S.orders.find(o => o.id === w.order).status = 'Dispatched'; w.dispatchedOn = today(); }
  rerender();
}
function addQC(id) { const v = val('qcv'); if (!v) return; S.workorders.find(w => w.id === id).qc.push(v + ' (' + me().name + ')'); rerender(); }
function custMsg(id) {
  const w = S.workorders.find(x => x.id === id), d = val('cd'), r = val('cr'); w.expected = d; w.customerNote = r;
  const txt = `Dear ${w.client},\n\nYour order ${w.order} (${prod(w.productId).name}, ${w.qty} ${w.unit}) is currently at the "${stageName(w)}" stage. The expected dispatch date is ${new Date(d).toDateString()}.${r ? '\nNote: ' + r : ''}\n\nTrack your order live: ${trackUrl(w)}\n\nWe will share dispatch photos and documents as soon as the consignment leaves our plant.\n\nRegards, Imperial`;
  $('#cmsg').innerHTML = `<div class="mail">${esc(txt)}</div>`; save(); toast('Update sent on mail + WhatsApp (simulated)');
}
function trackUrl(w) { if (!w.trackToken) { w.trackToken = rndToken(); save(); } return location.origin + '/track/' + w.trackToken; }
function copyTrack(id) { const u = trackUrl(S.workorders.find(x => x.id === id)); navigator.clipboard?.writeText(u).then(() => toast('Tracking link copied'), () => prompt('Tracking link', u)); }
function woConfirmMail(id) {
  const w = S.workorders.find(x => x.id === id), p = prod(w.productId);
  modal('Work-order confirmation mail', `<div class="mail">${esc(`Dear ${w.client},\n\nWe confirm your order ${w.order} for ${p.name}, ${w.qty} ${w.unit}.\n\n• Transport: ${w.transport || 'to be confirmed'}\n• Labelling: ${w.labelling || 'to be confirmed'}\n• Classification: ${w.haz ? 'Hazardous: HAZ stickers will be applied (photo attached)' : 'Non-hazardous'}\n• Expected dispatch: ${w.expected}${w.labelling === 'White label' ? '\n\nAs this is a WHITE LABEL order, please send us your label artwork (PDF/AI, 100 x 150 mm) at the earliest.' : ''}${w.export && p.alias ? `\n\nNote: due to transportation regulations the product will be declared as "${p.alias}". The serial/batch number ${w.formula} remains the same.` : ''}\n\nRegards, Imperial`)}</div>`, `<button class="btn p" onclick="closeModal();toast('Sent (simulated)')">Send</button>`);
}
function addPhotos(id, files) {
  const w = S.workorders.find(x => x.id === id);
  [...files].forEach(f => { const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const s = 240 / img.width; c.width = 240; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); w.photos.push({ src: c.toDataURL('image/jpeg', .6), date: today() }); save(); rerender(); }; img.src = r.result; }; r.readAsDataURL(f); });
}
function demoPhoto(id) { S.workorders.find(x => x.id === id).photos.push({ src: '', date: today() }); rerender(); }
function invoice(id) { const w = S.workorders.find(x => x.id === id); w.invoiced = true; logA('Invoice generated for ' + id); toast('Invoice generated'); rerender(); }
function deliver(id, ok) {
  const w = S.workorders.find(x => x.id === id);
  if (ok) { w.delivery = { ok: true }; return rerender(); }
  modal('Delivery rejected', `<div class="form"><label class="full">Reason<input id="dr" placeholder="e.g. Drum leakage / spec mismatch"></label>
    <label>What to do now<select id="da"><option>Modify (rework)</option><option>Dump</option><option>Update & resend</option></select></label><label>Images<input type="file" accept="image/*" multiple></label></div>`,
    `<button class="btn p" onclick="(()=>{const w=S.workorders.find(x=>x.id==='${id}');w.delivery={ok:false,reason:val('dr'),action:val('da')};closeModal();rerender()})()">Save</button>`);
}

/* Inventory */
PAGES.inventory = () => {
  const low = lowStock();
  setTimeout(() => { if (low.length && !$('#modal').innerHTML && S.route === 'inventory') poPopup(low); }, 300);
  return `${low.length ? `<div class="alert err"><i data-lucide="package"></i> ${low.length} item(s) are below minimum stock. The PO pop-up keeps appearing until stock is refilled. <span style="flex:1"></span><button class="btn sm" onclick="poPopup(lowStock())">Raise POs</button></div>` : ''}
  <div class="toolbar"><button class="btn p" onclick="rmForm()">+ Inward raw material (allot serial)</button></div>
  <div class="tw"><table class="tbl"><tr><th>Code</th><th>Material</th><th>Division</th><th>Serial / lot</th><th>Stock</th><th>Level</th><th>Min / Max</th><th></th></tr>
  ${S.inventory.filter(inDiv).map(i => `<tr><td>${i.code}</td><td><b>${i.name}</b></td><td>${divName(i.div)}</td><td>${i.serial}</td><td><b>${i.qty}</b> ${i.unit}</td>
  <td style="width:140px"><div class="bar ${i.qty < i.min ? 'low' : ''}"><i style="width:${Math.min(100, i.qty / i.max * 100)}%"></i></div></td><td>${i.min} / ${i.max}</td>
  <td><button class="btn sm" onclick="sticker('${i.code}')"><i data-lucide="tag"></i> Sticker</button></td></tr>`).join('')}</table></div>`;
};
function poPopup(low) {
  modal('Low inventory: raise purchase orders', `<p class="muted">These items are below minimum. Suggested quantity refills them to max stock, using the cheapest approved vendor.</p>
    <div class="tw"><table class="tbl"><tr><th>Material</th><th>Stock</th><th>Suggested</th><th>Best vendor</th><th></th></tr>${low.map(i => { const b = bestVendor(i.code);
      return `<tr><td>${i.name}</td><td>${i.qty} ${i.unit}</td><td>${i.max - i.qty} ${i.unit}</td><td>${b ? b.v.name + ' @ ' + inr(b.rate) : '—'}</td><td><button class="btn sm p" onclick="quickPO('${i.code}',${i.max - i.qty})">Create PO</button></td></tr>`; }).join('')}</table></div>`,
    `<button class="btn" onclick="closeModal()">Remind me later</button>`);
}
function bestVendor(code) {
  return S.vendors.filter(v => v.approved && v.rates[code]).map(v => ({ v, rate: v.rates[code] })).sort((a, b) => a.rate - b.rate)[0];
}
function quickPO(code, qty) {
  const b = bestVendor(code), i = rm(code);
  if (!b) return toast('No approved vendor for ' + code);
  S.pos.unshift({ id: nextNo('PO'), div: i.div, vendor: b.v.id, code, qty, unit: i.unit, rate: b.rate, date: today(), status: poStatus(), by: me().name });
  closeModal(); toast(`PO sent to ${b.v.name} via ${b.v.channel} (simulated)`); rerender();
}
function rmForm() {
  modal('Inward raw material', `<div class="form"><label>Material<select id="ri">${S.inventory.map(i => `<option value="${i.code}">${i.code} · ${i.name}</option>`)}</select></label><label>Quantity<input id="rq" type="number" value="500"></label>
    <label>QA inward test report<select><option>Passed</option><option>Pending</option><option>Failed</option></select></label><label>New serial (auto)<input disabled value="RML-${new Date().getFullYear() % 100}-${String(Math.floor(Math.random() * 9000) + 100).padStart(4, '0')}" id="rs"></label></div>`,
    `<button class="btn p" onclick="(()=>{const i=rm(val('ri'));i.qty+=+val('rq');i.serial=$('#rs').value;const po=S.pos.find(p=>p.code===i.code&&p.status==='Ordered');if(po)po.status='Received';closeModal();toast('Stock updated, serial '+i.serial+' allotted');rerender()})()">Save & print sticker</button>`);
}
function sticker(code) {
  const i = rm(code);
  modal('Raw material sticker', `<div style="border:2px dashed var(--blue-200);border-radius:10px;padding:16px;max-width:320px;margin:auto;text-align:center"><img src="logo.webp" style="height:40px"><div style="font-size:20px;font-weight:700;margin:6px 0">${i.serial}</div><div>${i.code} · ${i.name}</div><div class="muted small">Inward: ${today()}</div><div style="font-family:monospace;letter-spacing:2px;margin-top:8px">║▌║█║▌│║▌║▌█║</div></div>`, `<button class="btn p" onclick="window.print()">Print</button>`);
}

/* Procurement */
PAGES.procurement = () => {
  const codes = Object.keys(S.market).filter(c => inDiv(rm(c)));
  return `<div class="grid g2">
  <div class="card"><h3>Vendor rate comparison vs market</h3><div class="tw"><table class="tbl"><tr><th>Material</th><th>Market ₹</th>${S.vendors.map(v => `<th>${v.name.split(' ')[0]}</th>`).join('')}</tr>
  ${codes.map(c => { const best = bestVendor(c); return `<tr><td>${rm(c).name}<div class="muted small">${c} · stocked in ${rm(c).unit}</div></td><td><input type="number" style="width:70px" value="${S.market[c]}" onchange="S.market['${c}']=+this.value;rerender()"></td>
    ${S.vendors.map(v => { const r = v.rates[c]; if (!r) return '<td class="muted">—</td>'; const mism = v.unit[c] !== rm(c).unit;
      return `<td><b style="color:${best && best.v.id === v.id ? 'var(--green)' : r > S.market[c] ? 'var(--red)' : 'inherit'}">${r}</b>/${v.unit[c]}${mism ? `<div><span class="pill amber" title="Vendor quotes per ${v.unit[c]}, we stock in ${rm(c).unit}">unit mismatch</span></div>` : ''}</td>`; }).join('')}</tr>`; }).join('')}</table></div></div>
  <div class="card"><h3>Vendors<span class="sp"></span><button class="btn sm" onclick="vendorForm()">+ Vendor</button></h3>
  ${S.vendors.map(v => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="flex:1"><b>${v.name}</b> <span class="muted small">${v.city} · PO via ${v.channel}</span><div class="small muted">${S.pos.filter(p => p.vendor === v.id).length} orders · ${inr(S.pos.filter(p => p.vendor === v.id).reduce((a, p) => a + p.qty * p.rate, 0))} total</div></div>
  ${v.approved ? '<span class="pill green">Approved</span>' : `<button class="btn sm g" onclick="S.vendors.find(x=>x.id==='${v.id}').approved=true;toast('Vendor approved');rerender()">Approve</button>`}<button class="btn sm" onclick="vendorHist('${v.id}')">History</button></div>`).join('')}</div></div>
  <div class="card" style="margin-top:16px"><h3>Purchase orders<span class="sp"></span><button class="btn sm p" onclick="poForm()">+ Manual PO</button></h3>
  <div class="tw"><table class="tbl"><tr><th>PO</th><th>Date</th><th>Vendor</th><th>Material</th><th>Qty</th><th>Rate</th><th>Value</th><th>Status</th></tr>
  ${S.pos.map(p => `<tr><td>${p.id}</td><td>${p.date}</td><td>${S.vendors.find(v => v.id === p.vendor).name}</td><td>${rm(p.code).name}</td><td>${p.qty} ${p.unit}</td><td>${inr(p.rate)}</td><td>${inr(p.qty * p.rate)}</td><td>${statusPill(p.status)}</td></tr>`).join('')}</table></div></div>`;
};
function vendorHist(id) {
  const v = S.vendors.find(x => x.id === id), ps = S.pos.filter(p => p.vendor === id);
  modal(v.name + ': order history', ps.length ? `<table class="tbl"><tr><th>PO</th><th>Date</th><th>Material</th><th>Qty</th><th>Rate</th></tr>${ps.map(p => `<tr><td>${p.id}</td><td>${p.date}</td><td>${rm(p.code).name}</td><td>${p.qty} ${p.unit}</td><td>${inr(p.rate)}</td></tr>`).join('')}</table>` : '<span class="muted">No orders yet</span>');
}
function vendorForm() {
  modal('New vendor', `<div class="form"><label>Name<input id="vn"></label><label>City<input id="vc"></label><label>PO channel<select id="vch"><option>Mail</option><option>WhatsApp + Mail</option><option>Manual entry</option></select></label>
    <label>Material<select id="vm">${S.inventory.map(i => `<option value="${i.code}">${i.name}</option>`)}</select></label><label>Rate ₹<input id="vr" type="number"></label><label>Quoted per<select id="vu"><option>kg</option><option>L</option><option>pcs</option></select></label></div>`,
    `<button class="btn p" onclick="(()=>{const m=val('vm');S.vendors.push({id:uid('V'),name:val('vn'),city:val('vc'),channel:val('vch'),approved:false,rates:{[m]:+val('vr')},unit:{[m]:val('vu')}});closeModal();toast('Vendor added. Pending approval');rerender()})()">Save</button>`);
}
function poForm() {
  modal('Manual PO (e.g. Bhavin Packaging)', `<div class="form"><label>Vendor<select id="pv">${S.vendors.filter(v => v.approved).map(v => `<option value="${v.id}">${v.name}</option>`)}</select></label><label>Material<select id="pm2">${S.inventory.map(i => `<option value="${i.code}">${i.name}</option>`)}</select></label>
    <label>Qty<input id="pq" type="number" value="100"></label><label>Rate ₹<input id="pr" type="number" value="100"></label></div>`,
    `<button class="btn p" onclick="(()=>{S.pos.unshift({id:nextNo('PO'),div:rm(val('pm2')).div,vendor:val('pv'),code:val('pm2'),qty:+val('pq'),unit:rm(val('pm2')).unit,rate:+val('pr'),date:today(),by:me().name,status:poStatus()||'Ordered'});closeModal();rerender()})()">Create PO</button>`);
}

/* Lab */
let labQ = '';
PAGES.lab = () => {
  const hits = labQ ? S.formulations.filter(f => (f.batch + f.client + prod(f.productId).name + prod(f.productId).alias).toLowerCase().includes(labQ.toLowerCase())) : S.formulations.filter(inDiv);
  return `<div class="grid g2"><div class="card"><h3>Samples (inward → testing → formulation)<span class="sp"></span><button class="btn sm" onclick="sampleForm()">+ Sample</button></h3>
    ${S.samples.filter(inDiv).map(s => `<div style="margin-bottom:12px"><b>${s.id}</b> · ${esc(s.client)} · ${s.type}<div class="muted small">Received ${s.received} · ${esc(s.tests)}</div>
    <div class="stages">${['Inward (QA)', 'Testing', 'Trial formulations', 'Sent to client', 'Approved'].map((x, i) => `<div class="stage ${i < s.stage ? 'done' : i === s.stage ? 'cur' : ''}"><span class="dot">${i < s.stage ? '<i data-lucide="check"></i>' : ''}</span>${x}${(s.log || [])[i] ? `<div class="muted" style="font-size:10.5px;font-weight:500">${s.log[i].at}</div>` : ''}</div>`).join('')}</div>
    ${sampleExtras(s)}</div>`).join('') || '<div class="empty"><i data-lucide="test-tubes"></i><span>No samples yet</span></div>'}</div>
  <div class="card"><h3>Traceability search</h3><input style="width:100%" placeholder="Batch no, client, product or export name…" value="${esc(labQ)}" onchange="labQ=this.value;rerender()">
    <div class="alert info" style="margin-top:10px">Example: a client approved <b>combination 2 of 4</b> a year ago and now sends a PO for it. Search “Gulf” to find the exact raw-material lots and percentages.</div></div></div>
  <div class="card" style="margin-top:16px"><h3>Formulations (input raw-material codes → output batch / serial)<span class="sp"></span><button class="btn sm p" onclick="formForm()">+ New formulation</button></h3>
  ${hits.map(f => `<div class="card" style="margin-bottom:10px;box-shadow:none"><div class="row"><b>${f.batch}</b><span class="muted">${prod(f.productId).name}${prod(f.productId).alias ? ' / export: ' + prod(f.productId).alias : ''}</span><span class="pill">${f.version}</span>${f.approved ? '<span class="pill green">Client approved</span>' : '<span class="pill grey">Trial</span>'}<span class="sp" style="flex:1"></span><span class="muted small">${esc(f.client)} · ${f.date}</span></div>
    <div class="tw" style="margin-top:8px"><table class="tbl"><tr><th>RM code</th><th>%</th><th>Lot / serial used</th></tr>${f.items.map(i => `<tr><td><b>${i.code}</b></td><td>${i.pct}%</td><td>${i.lot}</td></tr>`).join('')}</table></div>
    ${f.notes ? `<div class="muted small" style="margin-top:6px"><i data-lucide="file-text"></i> ${esc(f.notes)}</div>` : ''}
    <div class="small" style="margin-top:6px">Used in: ${S.workorders.filter(w => w.formula === f.batch).map(w => `<a href="#workorders/${w.id}">${w.id}</a>`).join(', ') || '—'}</div></div>`).join('') || '<span class="muted">No match</span>'}</div>`;
};
function sampleForm() {
  modal('New sample', `<div class="form"><label>Client<input id="sc"></label><label>Type<input id="st" value="Crude oil sample (inward)"></label><label>Company<select id="sd">${divOpts(S.division === 'all' ? 'CHEM' : S.division)}</select></label><label class="full">Initial test results<input id="sr"></label></div>`,
    `<button class="btn p" onclick="(()=>{S.samples.unshift({id:nextNo('SMP'),div:val('sd'),client:val('sc'),type:val('st'),received:today(),stage:0,tests:val('sr'),batches:[],media:[],log:[]});closeModal();rerender()})()">Save</button>`);
}
function formForm() {
  const rows = [0, 1, 2, 3].map(i => `<div class="row" style="margin-bottom:6px"><select id="fc${i}"><option value="">—</option>${S.inventory.map(x => `<option value="${x.code}">${x.code} · ${x.name}</option>`)}</select><input id="fp${i}" type="number" placeholder="%" style="width:80px"></div>`).join('');
  modal('New formulation', `<div class="form"><label>Product<select id="fpr">${S.products.map(p => `<option value="${p.id}">${p.name}</option>`)}</select></label><label>Client<input id="fcl"></label><label>Version<input id="fv" value="Combination 1 of 4"></label><label>Made by<input id="fby" value="${me().name}"></label></div>
    <h3 style="margin-top:14px">Raw material codes</h3>${rows}<label class="form"><span>Notes</span><input id="fn"></label>`,
    `<button class="btn p" onclick="saveForm()">Save & allot batch no.</button>`);
}
function saveForm() {
  const items = [0, 1, 2, 3].filter(i => val('fc' + i)).map(i => ({ code: val('fc' + i), pct: +val('fp' + i), lot: rm(val('fc' + i)).serial }));
  if (items.reduce((a, b) => a + b.pct, 0) !== 100) return toast('Percentages must add up to 100');
  const p = prod(val('fpr')), n = S.formulations.filter(f => f.productId === p.id).length + 1;
  const batch = `F-${p.code.split('-').slice(1).join('-')}-${String(n).padStart(2, '0')}`;
  S.formulations.unshift({ batch, div: p.div, productId: p.id, client: val('fcl'), version: val('fv'), date: today(), approved: false, items, notes: val('fn') + ' · by ' + val('fby') });
  closeModal(); toast('Batch ' + batch + ' allotted'); rerender();
}

/* Dispatch */
PAGES.dispatch = () => {
  const ws = S.workorders.filter(inDiv);
  const all = ws.flatMap(w => w.photos.map(p => ({ ...p, w })));
  const fc = window.dfc || '', fd = window.dfd || '';
  const shown = all.filter(x => (!fc || x.w.client === fc) && (!fd || x.date === fd));
  return `<div class="card"><h3>Invoice gate<span class="sp"></span><span class="muted small">Invoice only after photos + CHA + HAZ labelling</span></h3>
  <div class="tw"><table class="tbl"><tr><th>WO</th><th>Client</th><th>Photos</th><th>CHA</th><th>HAZ</th><th>Invoice</th></tr>
  ${ws.map(w => `<tr><td><a href="#workorders/${w.id}">${w.id}</a></td><td>${esc(w.client)}</td><td>${w.photos.length ? '<i data-lucide="check-circle-2"></i> ' + w.photos.length : '<i data-lucide="circle"></i>'}</td><td>${!w.export ? 'n/a' : w.cha ? '<i data-lucide="check-circle-2"></i> ' + esc(w.cha) : '<i data-lucide="circle"></i>'}</td><td>${!w.haz ? 'n/a' : w.hazDone ? '<i data-lucide="check-circle-2"></i>' : '<i data-lucide="circle"></i>'}</td><td>${w.invoiced ? statusPill('Invoiced') : '<span class="pill grey">Locked</span>'}</td></tr>`).join('')}</table></div></div>
  <div class="card" style="margin-top:16px"><h3>Dispatch photo library</h3>
  <div class="row" style="margin-bottom:12px"><select onchange="window.dfc=this.value;rerender()"><option value="">All clients</option>${[...new Set(ws.map(w => w.client))].map(c => `<option ${c === fc ? 'selected' : ''}>${esc(c)}</option>`)}</select><input type="date" value="${fd}" onchange="window.dfd=this.value;rerender()"><button class="btn sm" onclick="window.dfc='';window.dfd='';rerender()">Clear</button></div>
  <div class="photos">${shown.map(x => `<div class="photo">${x.src ? `<img src="${x.src}">` : '<div class="ph"><i data-lucide="camera"></i></div>'}<div class="c"><b>${x.w.id}</b><br>${esc(x.w.client)}<br>${x.date}</div></div>`).join('') || '<span class="muted">No photos. Upload them from the work order’s Dispatch tab.</span>'}</div></div>`;
};

/* Machines */
PAGES.machines = () => `<div class="tw"><table class="tbl"><tr><th>Machine</th><th>Last service</th><th>Next due</th><th>Avg downtime</th><th>Avg cost</th><th>Log</th><th></th></tr>
  ${S.machines.map(m => { const nd = addDays(m.last, m.every); return `<tr><td><b>${m.name}</b><div class="muted small">every ${m.every} days</div></td><td>${m.last}</td><td>${nd} ${nd <= today() ? '<span class="pill red">Due</span>' : nd <= addDays(today(), 7) ? '<span class="pill amber">This week</span>' : ''}</td><td>${m.avgHrs} h</td><td>${inr(m.avgCost)}</td><td class="small">${m.log.length} entries</td>
  <td><button class="btn sm" onclick="maint('${m.id}')">Log maintenance</button></td></tr>`; }).join('')}</table></div>`;
function maint(id) {
  modal('Log maintenance', `<div class="form"><label>Hours<input id="mh" type="number" value="4"></label><label>Cost ₹<input id="mc" type="number" value="8000"></label><label class="full">Work done<input id="mw"></label></div>`,
    `<button class="btn p" onclick="(()=>{const m=S.machines.find(x=>x.id==='${id}');m.log.push({h:+val('mh'),c:+val('mc'),w:val('mw'),d:today()});m.last=today();const n=m.log.length+1;m.avgHrs=+((m.avgHrs*(n-1)+ +val('mh'))/n).toFixed(1);m.avgCost=Math.round((m.avgCost*(n-1)+ +val('mc'))/n);closeModal();rerender()})()">Save</button>`);
}

/* Team */
function teamTable() {
  return `<table class="tbl"><tr><th>Member</th><th>Calls</th><th>Messages</th><th>Tasks</th></tr>${Object.entries(S.activity).map(([u, a]) => { const ts = S.tasks.filter(t => t.user === u && t.date === today());
    return `<tr><td>${uname(u)}</td><td>${a.calls}/${a.tCalls}<div class="bar"><i style="width:${a.calls / a.tCalls * 100}%"></i></div></td><td>${a.msgs}/${a.tMsgs}<div class="bar"><i style="width:${a.msgs / a.tMsgs * 100}%"></i></div></td><td>${ts.filter(t => t.done).length}/${ts.length}</td></tr>`; }).join('')}</table>`;
}
PAGES.team = () => {
  const mine = S.tasks.filter(t => t.date === today() && (t.user === S.user || ['Super Admin', 'Marketing Head', 'HR'].includes(me().role)));
  const a = S.activity[S.user];
  return `<div class="grid g2"><div class="card"><h3>Day planner: ${today()}<span class="sp"></span><button class="btn sm p" onclick="taskForm()">+ Task</button></h3>
    ${mine.map(t => `<label class="chk"><input type="checkbox" ${t.done ? 'checked' : ''} onchange="S.tasks.find(x=>x.id==='${t.id}').done=this.checked;rerender()"><span style="flex:1">${esc(t.title)} <span class="muted small">· ${uname(t.user)}</span></span>${t.tag ? `<span class="pill violet">@${uname(t.tag)}</span>` : ''}</label>`).join('') || '<span class="muted">No tasks planned. Plan your day.</span>'}</div>
  <div class="card"><h3>My activity counter</h3>${a ? `<div class="row"><div style="flex:1"><div class="kpi"><div class="v">${a.calls}<span class="muted small"> / ${a.tCalls}</span></div><div class="l">Calls</div></div><button class="btn sm" onclick="S.activity['${S.user}'].calls++;rerender()">+1 call</button></div>
    <div style="flex:1"><div class="kpi"><div class="v">${a.msgs}<span class="muted small"> / ${a.tMsgs}</span></div><div class="l">Messages</div></div><button class="btn sm" onclick="S.activity['${S.user}'].msgs++;rerender()">+1 message</button></div></div>` : `<button class="btn sm" onclick="S.activity['${S.user}']={calls:0,msgs:0,tCalls:20,tMsgs:30};rerender()">Start tracking my calls</button>`}</div></div>
  <div class="card" style="margin-top:16px"><h3>Sales · Marketing · Team tracking (live)</h3>${teamTable()}</div>`;
};
function taskForm() {
  modal('New task', `<div class="form"><label class="full">Task<input id="tt"></label><label>Assign to<select id="tu">${S.users.map(u => `<option value="${u.id}" ${u.id === S.user ? 'selected' : ''}>${u.name}</option>`)}</select></label><label>Tag authorised person<select id="tg"><option value="">—</option>${S.users.map(u => `<option value="${u.id}">${u.name}</option>`)}</select></label></div>`,
    `<button class="btn p" onclick="(()=>{const t={id:uid('T'),user:val('tu'),date:today(),title:val('tt'),done:false,tag:val('tg')};S.tasks.push(t);if(t.tag)notify(t.tag,me().name+' tagged you: '+t.title);closeModal();rerender()})()">Save</button>`);
}

/* Attendance & HR */
function otPay(a) {
  const toM = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const extra = Math.max(0, toM(a.out) - toM(a.shiftEnd));
  const paidBlocks = Math.max(0, Math.floor(extra / 30) - 1); // first 30 min unpaid
  return { extra, paidBlocks };
}
PAGES.attendance = () => {
  const isHR = ['Super Admin', 'HR'].includes(me().role);
  const myIn = S.attendance.find(a => a.user === S.user && a.date === today());
  return `<div class="grid g2"><div class="card"><h3>Check in / out (geo-fence + camera)</h3>
    <video id="cam" class="cam" autoplay playsinline muted></video>
    <div class="row" style="margin-top:10px">${!myIn ? `<button class="btn p" onclick="checkIn()">Check in</button>` : !myIn.out ? `<button class="btn g" onclick="checkOut()">Check out</button><span class="muted">Checked in at ${myIn.in}</span>` : `<span class="pill green">Day complete ${myIn.in}–${myIn.out}</span>`}<span id="geo" class="muted small"></span></div>
    <p class="muted small">Allowed only within 100 m of the office / plant, with a live selfie. Rule: the first extra 30 min after the shift is not paid; every further 30-minute block is added to salary.</p></div>
  <div class="card"><h3>Leave requests<span class="sp"></span><button class="btn sm" onclick="leaveForm()">+ Apply</button></h3>
    ${S.leaves.map(l => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span style="flex:1"><b>${uname(l.user)}</b> ${l.from} → ${l.to}<div class="muted small">${esc(l.reason)}</div></span>${statusPill(l.status)}
    ${isHR && l.status === 'Pending' ? `<button class="btn sm g" onclick="S.leaves.find(x=>x.id==='${l.id}').status='Approved';rerender()">Approve</button><button class="btn sm r" onclick="S.leaves.find(x=>x.id==='${l.id}').status='Rejected';rerender()">Reject</button>` : ''}</div>`).join('')}
    <h3 style="margin-top:16px">Holidays<span class="sp"></span>${isHR ? `<button class="btn sm" onclick="(()=>{const n=prompt('Holiday name');const d=prompt('Date (YYYY-MM-DD)',today());if(n&&d){S.holidays.push({name:n,date:d});rerender()}})()">+ Add</button>` : ''}</h3>
    ${S.holidays.map(h => `<div class="small"><i data-lucide="calendar"></i> ${h.date}: ${esc(h.name)}</div>`).join('')}</div></div>
  <div class="card" style="margin-top:16px"><h3>Attendance register & OT</h3><div class="tw"><table class="tbl"><tr><th>Date</th><th>Employee</th><th>In</th><th>Out</th><th>Location</th><th>Selfie</th><th>Extra time</th><th>Paid OT</th><th>OT amount</th></tr>
  ${S.attendance.slice().reverse().map(a => { const o = a.out ? otPay(a) : { extra: 0, paidBlocks: 0 }; const u = S.users.find(x => x.id === a.user) || {}; const rate = (u.salary || 0) / 26 / 9 / 2;
    return `<tr><td>${a.date}</td><td>${uname(a.user)}</td><td>${a.in}</td><td>${a.out || '—'}</td><td>${a.geo}</td><td>${typeof a.photo === 'string' ? `<a href="${esc(a.photo)}" target="_blank" rel="noopener"><img class="selfie" src="${esc(a.photo)}" alt="Selfie"></a>` : a.photo ? '<i data-lucide="camera"></i>' : '—'}</td><td>${o.extra} min</td><td>${o.paidBlocks} × 30 min</td><td>${inr(o.paidBlocks * rate)}</td></tr>`; }).join('')}</table></div></div>`;
};
function startCam() { const v = $('#cam'); if (v && navigator.mediaDevices) navigator.mediaDevices.getUserMedia({ video: true }).then(s => v.srcObject = s).catch(() => {}); }
function hhmm() { return new Date().toTimeString().slice(0, 5); }
function locate(cb) {
  $('#geo').textContent = 'Locating…';
  if (!navigator.geolocation) return cb('Office (demo)');
  navigator.geolocation.getCurrentPosition(p => cb(`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)} (demo: inside fence)`), () => cb('Office (demo, location denied)'), { timeout: 5000 });
}
function checkIn() { locate(g => { S.attendance.push({ user: S.user, date: today(), in: hhmm(), out: '', shiftEnd: '18:30', geo: g, photo: true }); toast('Checked in'); rerender(); }); }
function checkOut() { const a = S.attendance.find(a => a.user === S.user && a.date === today()); a.out = hhmm(); toast('Checked out'); rerender(); }
function leaveForm() {
  modal('Apply for leave', `<div class="form"><label>From<input id="lf" type="date" value="${today()}"></label><label>To<input id="lt" type="date" value="${today()}"></label><label class="full">Reason<input id="lr"></label></div>`,
    `<button class="btn p" onclick="(()=>{S.leaves.unshift({id:uid('LV'),user:S.user,from:val('lf'),to:val('lt'),reason:val('lr'),status:'Pending'});notifyRole('HR',me().name+' applied for leave');closeModal();rerender()})()">Submit to HR</button>`);
}

/* Training */
PAGES.training = () => {
  const interns = S.users.filter(u => u.intern);
  return `<div class="grid g3">${S.modules.map(m => `<div class="card"><h3>${m.title}</h3><div class="muted small">${m.lessons} lessons ${m.audio ? '· <i data-lucide="headphones"></i> audio included' : ''}</div><div class="row" style="margin-top:10px"><button class="btn sm" onclick="toast('Opening module (demo)')">Open</button>${m.audio ? '<button class="btn sm" onclick="toast(\'Playing audio (demo)\')">▶ Audio</button>' : ''}</div></div>`).join('')}</div>
  <div class="grid g2" style="margin-top:16px"><div class="card"><h3>Weekly assessments</h3>
    ${S.tests.map(t => `<div class="row"><span style="flex:1"><b>${t.title}</b><div class="muted small">${t.mins} min · due ${t.due} · camera on, no tab switching, no screenshots</div></span><button class="btn p sm" onclick="startTest('${t.id}')">Start test</button></div>`).join('')}
    <h3 style="margin-top:16px">Results (auditable by the Marketing Head)</h3><table class="tbl"><tr><th>Employee</th><th>Test</th><th>Score</th><th>Proctor flags</th><th>Date</th></tr>${S.results.map(r => `<tr><td>${uname(r.user)}</td><td>${S.tests.find(t => t.id === r.test).title}</td><td><b>${r.score}%</b></td><td>${r.flags ? `<span class="pill red">${r.flags} tab switch</span>` : '<span class="pill green">Clean</span>'}</td><td>${r.date}</td></tr>`).join('')}</table></div>
  <div class="card"><h3>Intern / trainee journey</h3>
    ${interns.map(u => { const d = Math.floor((new Date() - new Date(u.joined)) / 864e5); return `<b>${u.name}</b> <span class="muted small">day ${d}</span>
      <div class="stages">${['Month 1: Test 1 (10–15th)', 'Month 1: Test 2 (month end)', 'Month 2: Modules', 'Month 3: Targets assigned', 'Evaluation'].map((x, i) => { const at = [12, 30, 45, 60, 90][i]; return `<div class="stage ${d > at ? 'done' : d > (i ? [12, 30, 45, 60][i - 1] : 0) ? 'cur' : ''}"><span class="dot">${d > at ? '<i data-lucide="check"></i>' : ''}</span>${x}</div>`; }).join('')}</div>
      <div class="small">Target analysis: calls ${S.activity[u.id]?.calls}/${S.activity[u.id]?.tCalls}. Potential <span class="pill amber">Medium</span>. Follow-ups: 3 pending</div>`; }).join('')}
    <h3 style="margin-top:16px">Staff desk</h3><div class="row"><input id="dq" style="flex:1" placeholder="Ask a doubt…"><button class="btn sm p" onclick="if(val('dq')){notifyRole('Marketing Head','Staff desk: '+me().name+' asked “'+val('dq')+'”');toast('Sent to your mentor');rerender()}">Ask mentor</button></div></div></div>`;
};
let testState = null;
function startTest(id) {
  const t = S.tests.find(x => x.id === id);
  testState = { id, flags: 0, left: t.mins * 60 };
  modal(t.title + ' (proctored)', `<div class="alert warn">Camera on · Switching tabs is recorded · Screenshots disabled · <b id="tleft"></b></div><video id="tcam" class="cam" style="max-height:120px;width:160px;float:right;margin-left:10px" autoplay muted></video>
    ${t.qs.map((q, i) => `<div style="margin-bottom:12px"><b>${i + 1}. ${q.q}</b>${q.o.map((o, j) => `<label class="chk"><input type="radio" name="q${i}" value="${j}">${o}</label>`).join('')}</div>`).join('')}`,
    `<button class="btn p" onclick="submitTest()">Submit</button>`);
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia({ video: true }).then(s => { $('#tcam').srcObject = s; testState.stream = s; }).catch(() => {});
  testState.timer = setInterval(() => { testState.left--; const e = $('#tleft'); if (e) e.textContent = Math.floor(testState.left / 60) + ':' + String(testState.left % 60).padStart(2, '0') + ' left'; if (testState.left <= 0) submitTest(); }, 1000);
}
document.addEventListener('visibilitychange', () => { if (testState && document.hidden) { testState.flags++; toast('Tab switch recorded'); } });
document.addEventListener('keyup', e => { if (testState && e.key === 'PrintScreen') { testState.flags++; toast('Screenshot attempt recorded'); } });
function submitTest() {
  const t = S.tests.find(x => x.id === testState.id);
  const score = Math.round(t.qs.filter((q, i) => +(document.querySelector(`input[name=q${i}]:checked`) || {}).value === q.a).length / t.qs.length * 100);
  clearInterval(testState.timer); testState.stream && testState.stream.getTracks().forEach(x => x.stop());
  S.results.unshift({ user: S.user, test: t.id, score, date: today(), flags: testState.flags }); testState = null;
  closeModal(); toast('Score: ' + score + '%'); rerender();
}

/* Market */
PAGES.market = () => `<div class="toolbar"><button class="btn p" onclick="(()=>{const n=prompt('Country');if(n){S.countries.push({name:n,req:'',demand:''});rerender()}})()">+ Country</button></div>
  <div class="tw"><table class="tbl"><tr><th>Country</th><th>Documentation / requirements</th><th>Product demand</th><th>Clients</th></tr>
  ${S.countries.map((c, i) => `<tr><td><b>${esc(c.name)}</b></td><td><input style="width:100%" value="${esc(c.req)}" onchange="S.countries[${i}].req=this.value;save()"></td><td><input style="width:100%" value="${esc(c.demand)}" onchange="S.countries[${i}].demand=this.value;save()"></td><td>${S.leads.filter(l => l.country === c.name).length + S.orders.filter(o => o.country === c.name).length}</td></tr>`).join('')}</table></div>`;

/* Admin */
PAGES.admin = () => {
  const pages = NAV.flatMap(g => g[1]).map(x => x[0]).filter(p => p !== 'admin');
  return `<div class="grid g2"><div class="card"><h3>Divisions (group companies)</h3>${S.divisions.map((d, i) => `<div class="row" style="margin-bottom:8px"><span class="pill">${d.id}</span><input value="${esc(d.name)}" onchange="S.divisions[${i}].name=this.value;rerender()" style="flex:1"></div>`).join('')}
    <button class="btn sm" onclick="(()=>{const n=prompt('Division name');if(n){S.divisions.push({id:n.slice(0,4).toUpperCase(),name:n});rerender()}})()">+ Division</button>
    <h3 style="margin-top:22px">Modules per company<span class="sp"></span></h3>
    <div class="tw"><table class="tbl"><tr><th>Module</th>${S.divisions.map(d => `<th style="font-size:11px">${esc(d.name)}</th>`).join('')}</tr>
    ${pages.map(p => `<tr><td>${TITLES[p]}</td>${S.divisions.map(d => `<td><input type="checkbox" aria-label="${TITLES[p]} for ${esc(d.name)}" ${divHas(d.id, p) ? 'checked' : ''} onchange="toggleDivModule('${d.id}','${p}',this.checked)"></td>`).join('')}</tr>`).join('')}</table></div></div>
  <div class="card"><h3>Users<span class="sp"></span><button class="btn sm p" onclick="userForm()">+ Add user</button></h3>
    ${S.users.map(u => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)${u.active ? '' : ';opacity:.5'}"><div class="avatar">${esc(u.name[0])}</div><div style="flex:1;min-width:0"><b>${esc(u.name)}</b>${u.intern ? ' <span class="pill grey">Intern</span>' : ''}<div class="muted small">${esc(u.role)} · ${esc(u.email || '')} ${esc(u.phone || '')}</div></div><button class="btn sm" onclick="userForm('${u.id}')">Edit</button></div>`).join('')}</div>
  <div class="card"><h3>Role × feature permissions (Super Admin)</h3><div class="tw"><table class="tbl"><tr><th>Module</th>${Object.keys(S.roles).filter(r => r !== 'Super Admin').map(r => `<th style="font-size:10px">${r}</th>`).join('')}</tr>
    ${pages.map(p => `<tr><td>${TITLES[p]}</td>${Object.keys(S.roles).filter(r => r !== 'Super Admin').map(r => `<td>${permCell(r, p)}</td>`).join('')}</tr>`).join('')}</table></div></div></div>
  <div class="card" style="margin-top:16px"><h3>Audit log</h3>${S.log.slice(0, 15).map(l => `<div class="small">${l.at} · <b>${esc(l.by)}</b>: ${esc(l.text)}</div>`).join('') || '<span class="muted">No activity yet</span>'}</div>`;
};
function togglePerm(r, p, on) { const a = S.roles[r]; if (on && !a.includes(p)) a.push(p); if (!on) S.roles[r] = a.filter(x => x !== p); save(); renderNav(); }
const divHas = (div, page) => !((S.divModules || {})[div] || []).includes(page); // stores switched-OFF modules
function toggleDivModule(div, page, on) {
  S.divModules = S.divModules || {};
  const off = S.divModules[div] || [];
  S.divModules[div] = on ? off.filter(x => x !== page) : [...new Set([...off, page])];
  save(); renderNav();
}
function userForm(id) {
  const u = id ? S.users.find(x => x.id === id) : { name: '', email: '', phone: '', role: 'Sales Executive', salary: 0, intern: false, active: true };
  modal(id ? 'Edit user' : 'Add user', `<div class="form">
    <label>Full name<input id="un" value="${esc(u.name)}"></label>
    <label>Role<select id="ur">${Object.keys(S.roles).map(r => `<option ${r === u.role ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
    <label>Email<input id="ue" type="email" value="${esc(u.email || '')}"></label>
    <label>Mobile number<input id="uph" inputmode="tel" value="${esc(u.phone || '')}"></label>
    <label>Monthly salary ₹<input id="us" type="number" value="${u.salary || 0}"></label>
    <label>${id ? 'New password (leave blank to keep)' : 'Password'}<input id="upw" type="text" placeholder="At least 8 characters"></label>
    <label class="chk"><input type="checkbox" id="ui" ${u.intern ? 'checked' : ''}> Intern / trainee</label>
    ${id ? `<label class="chk"><input type="checkbox" id="ua" ${u.active ? 'checked' : ''}> Active (can sign in)</label>` : ''}</div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveUser('${id || ''}')">Save</button>`);
}
async function saveUser(id) {
  const b = { name: val('un'), role: val('ur'), email: val('ue'), phone: val('uph'), salary: +val('us'), intern: val('ui') };
  if (val('upw')) b.password = val('upw');
  if (id) b.active = val('ua');
  try {
    await api(id ? '/api/users/' + id : '/api/users', b, id ? 'PATCH' : 'POST');
    S.users = (await api('/api/state')).users; closeModal(); toast('User saved'); rerender();
  } catch (e) { toast(e.message); }
}

/* ---------- Icons: render any <i data-lucide> added to the page ---------- */
let iconQueued = false;
new MutationObserver(() => {
  if (iconQueued || !window.lucide) return;
  iconQueued = true;
  queueMicrotask(() => { iconQueued = false; if (document.querySelector('i[data-lucide]')) lucide.createIcons(); });
}).observe(document.body, { childList: true, subtree: true });

/* ---------- Boot ---------- */
const _go = go;
go = function () { _go(); if (S.route === 'attendance') startCam(); };
window.removeEventListener('hashchange', _go); window.addEventListener('hashchange', () => go());
(async () => {
  let empty;
  try { empty = await load(); } catch (e) { return; }
  $('#divSel').onchange = e => { S.division = e.target.value; rerender(); };
  if (empty) {
    if (me().role === 'Super Admin') { const d = seed(); S.divisions = d.divisions; S.roles = d.roles; SHARED.forEach(k => { if (!(k in S)) S[k] = Array.isArray(d[k]) ? [] : {}; }); go(); firstRun(); }
    else $('#view').innerHTML = '<div class="alert info">The system is being set up. Please check back once the admin has finished.</div>';
    return;
  }
  SHARED.forEach(k => { if (!(k in S) || (OBJ_KEYS.includes(k) && Array.isArray(S[k]))) S[k] = OBJ_KEYS.includes(k) ? {} : []; });
  go();
  setInterval(poll, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  window.addEventListener('beforeunload', e => { if (SHARED.some(k => k in S && JSON.stringify(S[k]) !== SYNCED[k])) { flush(); e.preventDefault(); } });
})();
