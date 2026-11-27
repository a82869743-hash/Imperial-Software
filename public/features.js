/* Imperial ERP: configurable workflows & templates, QR/HAZ stickers, traceability & COA, vendor scoring,
   machine reminders, HR training builder, file uploads, server numbering, new dashboard and command palette.
   Loaded after app.js; overrides some of its pages and functions. */

/* ---------- Document numbers (reserved in blocks from the server) ---------- */
const NO_POOL = {};
async function refillNo(prefix) {
  const r = await api('/api/reserve', { prefix, count: 10 }).catch(() => null);
  if (r) NO_POOL[prefix] = (NO_POOL[prefix] || []).concat(Array.from({ length: r.count }, (_, i) => r.from + i));
}
function nextNo(prefix) {
  const pool = NO_POOL[prefix] || (NO_POOL[prefix] = []);
  if (pool.length < 4) refillNo(prefix);
  const n = pool.shift();
  return prefix + '-' + (n ?? ('T' + Date.now().toString(36).toUpperCase())); // offline fallback stays unique
}

/* ---------- File uploads ---------- */
async function shrinkImage(file, max = 1600) {
  if (!file.type.startsWith('image/')) return file;
  const img = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * s), height: Math.round(img.height * s) });
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
}
async function uploadFile(file) {
  const body = await shrinkImage(file);
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': body.type || file.type }, body, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Upload failed');
  return j.url;
}
async function addPhotos(id, files) {
  const w = S.workorders.find(x => x.id === id);
  toast('Uploading ' + files.length + ' photo(s)…');
  for (const f of files) {
    try { w.photos.push({ src: await uploadFile(f), date: today(), by: me().name }); } catch (e) { toast(e.message); }
  }
  save(); rerender();
}

/* ---------- Message templates ---------- */
const DEFAULT_TEMPLATES = {
  quote: { name: 'Quotation reply (we make it)', text: 'Dear {client},\n\nThank you for your inquiry. We manufacture {product} ({code}).\n\n• Price: {price}\n• MOQ: {moq}\n• Packing: 200 L HDPE drums / 1 KL IBC\n• Lead time: 10–12 working days after PO and advance\n• Classification: {hazard}\n\nPlease find attached the quotation, terms & conditions and technical datasheet.\n\nWant to talk? Use the buttons below and our team will get back to you.\nCall or WhatsApp us: {wa}\nEmail: {mail}\n\nRegards,\nSales Team, {company}' },
  intro: { name: 'Introduction (not in our range)', text: 'Dear {client},\n\nThank you for reaching out. The product you asked about is currently not in our manufacturing range.\n\nImperial is a group of companies based in Halol, Gujarat: Imperial Oilfield Chemicals, Imperial Agro (liquid thiosulphate fertilizers) and Imperial Flexipack (flexible packaging).\n\nWe would be glad to understand your requirement; we may be able to help with an alternative.\nCall or WhatsApp us: {wa}\nEmail: {mail}\n\nRegards,\nSales Team, Imperial' },
  confirm: { name: 'Work order confirmation', text: 'Dear {client},\n\nWe confirm your order {order} for {product}, {qty}.\n\n• Transport: {transport}\n• Labelling: {labelling}\n• Classification: {hazard}\n• Expected dispatch: {expected}\n{whitelabel}{exportnote}\nRegards, {company}' },
  update: { name: 'Order status update', text: 'Dear {client},\n\nYour order {order} ({product}, {qty}) is currently at the "{stage}" stage. The expected dispatch date is {expected}.{note}\n\nTrack your order live: {link}\n\nRegards, {company}' },
  dispatch: { name: 'Dispatch message', text: 'Dear {client},\n\nYour order {order} ({product}, {qty}) was dispatched on {date}. Dispatch photos and documents are available here: {link}\n\nRegards, {company}' },
  payment: { name: 'Payment reminder', text: 'Dear {client},\n\nThis is a gentle reminder that {amount} ({label}) for order {order} was due on {due}. Kindly arrange the payment at the earliest.\n\nRegards, Accounts, {company}' },
  whitelabel: { name: 'White label artwork request', text: '\nAs this is a WHITE LABEL order, please send us your label artwork (PDF/AI, 100 x 150 mm) at the earliest.\n' },
  exportname: { name: 'Export name change note', text: '\nNote: due to transportation regulations the product will be declared as "{alias}". The serial/batch number {batch} remains the same.\n' }
};
const tpl = (key, vars) => ((S.templates || {})[key]?.text ?? DEFAULT_TEMPLATES[key].text).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
const companyOf = div => divName(div) || 'Imperial';

function mailFor(q) {
  const p = prod(q.productId), exp = q.country !== 'India';
  if (q.productId) return {
    subject: `Quotation: ${p.name} | ${companyOf(p.div)}`,
    body: tpl('quote', { client: q.company, product: p.name, code: p.code, moq: p.moq + ' ' + p.unit, company: companyOf(p.div),
      price: exp ? '$' + p.usd + ' / ' + p.unit + ' (FOB Mundra)' : inr(p.price) + ' / ' + p.unit + ' + GST (Ex-works)',
      hazard: p.haz ? 'HAZARDOUS (shipped with HAZ labels)' : 'Non-hazardous', wa: waLink(waFor(p.div)), mail: mailOf(p.div) || 'our sales team' }),
    att: ['Quotation.pdf', 'Terms_and_Conditions.pdf', `TDS_${p.code}.pdf`, ...(p.haz ? ['MSDS.pdf'] : [])]
  };
  return { subject: 'Introduction: Imperial Group', body: tpl('intro', { client: q.company, wa: waLink(waFor(S.division === 'all' ? 'CHEM' : S.division)), mail: mailOf(S.division === 'all' ? 'CHEM' : S.division) || 'our sales team' }), att: ['Company_Profile.pdf', 'Product_Catalogue.pdf'] };
}
function woVars(w) {
  const p = prod(w.productId);
  return { client: w.client, order: w.order, product: p.name, qty: w.qty + ' ' + w.unit, transport: w.transport || 'to be confirmed', labelling: w.labelling || 'to be confirmed',
    hazard: w.haz ? 'Hazardous: HAZ stickers will be applied (photo attached)' : 'Non-hazardous', expected: w.expected, stage: stageName(w), company: companyOf(w.div),
    link: trackUrl(w), date: w.dispatchedOn || today(), alias: p.alias, batch: w.formula,
    whitelabel: w.labelling === 'White label' ? tpl('whitelabel', {}) : '', exportnote: w.export && p.alias ? tpl('exportname', { alias: p.alias, batch: w.formula }) : '', note: w.customerNote ? '\nNote: ' + w.customerNote : '', wa: waLink(waFor(w.div, 'Dispatch')), mail: mailOf(w.div, 'Dispatch') };
}
function custMsg(id) {
  const w = S.workorders.find(x => x.id === id); w.expected = val('cd'); w.customerNote = val('cr');
  $('#cmsg').innerHTML = `<div class="mail">${esc(tpl(w.stage === lastStage(w) ? 'dispatch' : 'update', woVars(w)))}</div>`; save(); toast('Update queued for mail + WhatsApp');
}
function woConfirmMail(id) {
  const w = S.workorders.find(x => x.id === id);
  modal('Work-order confirmation mail', `<div class="mail">${esc(tpl('confirm', woVars(w)))}</div>`, `<button class="btn p" onclick="closeModal();toast('Queued for sending')">Send</button>`);
}
function remind(id) {
  const p = S.payments.find(x => x.id === id);
  modal('Payment reminder', `<div class="mail">${esc(tpl('payment', { client: p.client, amount: money(p.amount, p.currency), label: p.label, order: p.order, due: p.due, company: companyOf(p.div), wa: waLink(waFor(p.div, 'Accounts')), mail: mailOf(p.div, 'Accounts') }))}</div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="S.payments.find(x=>x.id==='${id}').reminders++;closeModal();toast('Reminder queued for mail + WhatsApp');rerender()">Send reminder</button>`);
}

/* ---------- Settings page: workflows, templates, HAZ sticker ---------- */
NAV[4][1].splice(1, 0, ['settings', 'sliders-horizontal', 'Settings']);
TITLES.settings = 'Settings';
let setTab = 'flow', flowDiv = null;
const KINDS = { '': 'Normal step', start: 'Start (transport must be fixed)', stock: 'Production (deducts stock)', qc: 'Quality check (readings + COA)', pack: 'Packing & labels', ship: 'Ready to ship (CHA for export)', final: 'Dispatched (last step)' };
PAGES.settings = () => {
  flowDiv = flowDiv || S.divisions[0]?.id;
  const tabs = [['flow', 'Production stages'], ['tpl', 'Message templates'], ['company', 'Company & GST'], ['channels', 'WhatsApp & email'], ['pay', 'Payments & tax'], ['haz', 'HAZ sticker']];
  let body = '';
  if (setTab === 'flow') {
    const fl = (S.workflows || {})[flowDiv] || DEFAULT_FLOW;
    body = `<div class="toolbar"><div class="seg">${S.divisions.map(d => `<button class="${d.id === flowDiv ? 'on' : ''}" onclick="flowDiv='${d.id}';rerender()">${esc(d.name)}</button>`).join('')}</div><span class="sp"></span>
      <button class="btn sm" onclick="resetFlow()">Reset to default</button><button class="btn sm p" onclick="editStage(-1)">+ Add stage</button></div>
      <p class="muted small" style="margin-top:-6px">New work orders for ${esc(divName(flowDiv))} follow these stages. Orders already running keep the stages they started with.</p>
      <ol class="flow-list">${fl.map((st, i) => `<li class="flow-item"><span class="fi-n">${i + 1}</span><div style="flex:1;min-width:0"><b>${esc(st.name)}</b> <span class="pill grey">${KINDS[st.kind || '']}</span>
        <div class="muted small">${(st.checks || []).length} checklist items${st.info ? ' · ' + esc(st.info) : ''}</div></div>
        <div class="row" style="gap:4px"><button class="btn sm icon" aria-label="Move up" ${i ? '' : 'disabled'} onclick="moveStage(${i},-1)"><i data-lucide="arrow-up"></i></button><button class="btn sm icon" aria-label="Move down" ${i < fl.length - 1 ? '' : 'disabled'} onclick="moveStage(${i},1)"><i data-lucide="arrow-down"></i></button><button class="btn sm" onclick="editStage(${i})">Edit</button><button class="btn sm r icon" aria-label="Delete stage" onclick="delStage(${i})"><i data-lucide="trash-2"></i></button></div></li>`).join('')}</ol>`;
  }
  if (setTab === 'tpl') body = `<p class="muted small">Use placeholders in curly brackets. They are filled in automatically: {client} {order} {product} {code} {qty} {price} {moq} {hazard} {expected} {stage} {link} {transport} {labelling} {amount} {due} {company} {wa} {mail}</p>
    <div class="grid g2">${Object.entries(DEFAULT_TEMPLATES).map(([k, d]) => `<div class="card flat"><h3>${d.name}<span class="sp"></span>${(S.templates || {})[k] ? `<button class="btn sm" onclick="delete S.templates['${k}'];save();rerender()">Reset</button>` : ''}</h3>
      <textarea rows="9" onchange="S.templates=S.templates||{};S.templates['${k}']={text:this.value};save();toast('Template saved')">${esc(((S.templates || {})[k] || d).text)}</textarea></div>`).join('')}</div>`;
  if (setTab === 'company') body = companyTab();
  if (setTab === 'channels') body = channelTab();
  if (setTab === 'pay') body = payTab();
  if (setTab === 'haz') {
    const h = hazCfg();
    body = `<div class="grid g2"><div class="form" style="align-content:start">
      <label>Default hazard class<select onchange="setHaz('cls',this.value)">${Object.keys(HAZ_CLASSES).map(c => `<option value="${c}" ${c === h.cls ? 'selected' : ''}>${c} · ${HAZ_CLASSES[c].name}</option>`).join('')}</select></label>
      <label>Signal word<select onchange="setHaz('signal',this.value)">${['DANGER', 'WARNING'].map(x => `<option ${x === h.signal ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="full">Emergency contact<input value="${esc(h.phone)}" onchange="setHaz('phone',this.value)"></label>
      <label class="full">Upload your current sticker (used instead of the generated one)<input type="file" accept="image/*" onchange="hazUpload(this.files[0])"></label>
      ${h.image ? `<div class="full row"><span class="pill green">Custom sticker in use</span><button class="btn sm r" onclick="setHaz('image','')">Remove</button></div>` : ''}
      <p class="muted small full">Each product can override the class and UN number on the Products page.</p></div>
      <div>${hazLabelHTML({ name: 'Crude Oil Demulsifier', un: 'UN 1993', cls: h.cls, batch: 'F-DM-210-07', client: 'Sample client' })}</div></div>`;
  }
  return `<div class="card"><div class="tabs">${tabs.map(([k, t]) => `<button class="${setTab === k ? 'on' : ''}" onclick="setTab='${k}';rerender()">${t}</button>`).join('')}</div>${body}</div>`;
};
function curFlow() { S.workflows = S.workflows || {}; return S.workflows[flowDiv] || (S.workflows[flowDiv] = JSON.parse(JSON.stringify(DEFAULT_FLOW))); }
function moveStage(i, d) { const f = curFlow(); [f[i], f[i + d]] = [f[i + d], f[i]]; save(); rerender(); }
function delStage(i) { const f = curFlow(); if (f.length < 2) return toast('Keep at least one stage'); if (confirm('Delete stage "' + f[i].name + '"?')) { f.splice(i, 1); save(); rerender(); } }
function resetFlow() { if (confirm('Reset stages for ' + divName(flowDiv) + ' to the default?')) { delete S.workflows[flowDiv]; save(); rerender(); } }
function editStage(i) {
  const st = i < 0 ? { name: '', kind: '', info: '', checks: [] } : curFlow()[i];
  modal(i < 0 ? 'Add stage' : 'Edit stage', `<div class="form">
    <label>Stage name<input id="sn" value="${esc(st.name)}"></label>
    <label>Type<select id="sk">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${k === (st.kind || '') ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="full">Instructions for the team<input id="si" value="${esc(st.info || '')}"></label>
    <label class="full">Checklist (one item per line)<textarea id="sc" rows="6">${esc((st.checks || []).join('\n'))}</textarea></label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveStage(${i})">Save stage</button>`);
}
function saveStage(i) {
  if (!val('sn').trim()) return toast('Give the stage a name');
  const st = { name: val('sn').trim(), kind: val('sk'), info: val('si').trim(), checks: val('sc').split('\n').map(x => x.trim()).filter(Boolean) };
  const f = curFlow();
  if (i < 0) { const last = f[f.length - 1]; f.splice(last && last.kind === 'final' ? f.length - 1 : f.length, 0, st); } else f[i] = st;
  closeModal(); save(); rerender();
}

/* ---------- HAZ sticker ---------- */
const HAZ_CLASSES = {
  '3': { name: 'Flammable liquid', color: '#d92d20', fg: '#fff', sym: 'flame' },
  '6.1': { name: 'Toxic', color: '#ffffff', fg: '#111', sym: 'skull' },
  '8': { name: 'Corrosive', color: '#ffffff', fg: '#111', sym: 'corrosive', split: true },
  '9': { name: 'Miscellaneous', color: '#ffffff', fg: '#111', sym: 'stripes' },
  '5.1': { name: 'Oxidizer', color: '#f5c518', fg: '#111', sym: 'flame' }
};
const hazCfg = () => Object.assign({ cls: '3', signal: 'DANGER', phone: '+91 98256 79393', image: '' }, (S.settings || {}).haz || {});
function setHaz(k, v) { S.settings = S.settings || {}; S.settings.haz = { ...hazCfg(), [k]: v }; save(); rerender(); }
async function hazUpload(f) { if (!f) return; try { setHaz('image', await uploadFile(f)); toast('Sticker uploaded'); } catch (e) { toast(e.message); } }
function hazDiamond(cls) {
  const c = HAZ_CLASSES[cls] || HAZ_CLASSES['9'];
  const sym = { flame: '<path d="M50 22c6 10 14 14 14 26a14 14 0 0 1-28 0c0-7 4-10 6-15 1 5 3 7 5 7 0-6-2-11 3-18z" fill="currentColor"/>',
    skull: '<circle cx="50" cy="38" r="12" fill="currentColor"/><path d="M36 56l28 12M64 56L36 68" stroke="currentColor" stroke-width="5"/>',
    corrosive: '<path d="M30 30h14l-3 10M56 30h14l-3 10" stroke="currentColor" stroke-width="4" fill="none"/><rect x="28" y="46" width="44" height="6" fill="currentColor"/>',
    stripes: '<path d="M30 20v28M38 20v28M46 20v28M54 20v28M62 20v28M70 20v28" stroke="currentColor" stroke-width="4"/>' }[c.sym];
  return `<svg viewBox="0 0 100 100" width="150" height="150" role="img" aria-label="Hazard class ${cls}" style="color:${c.fg}">
    <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" fill="${c.color}" stroke="#111" stroke-width="2"/>
    ${c.split ? '<path d="M10 50 50 90 90 50z" fill="#111"/>' : ''}${sym}
    <text x="50" y="84" text-anchor="middle" font-size="11" font-weight="800" fill="${c.split ? '#fff' : c.fg}" font-family="Manrope,sans-serif">${cls}</text></svg>`;
}
function hazLabelHTML(d) {
  const h = hazCfg();
  if (h.image) return `<div class="sticker haz"><img src="${esc(h.image)}" alt="HAZ sticker" style="max-width:100%"><div class="small" style="margin-top:6px"><b>${esc(d.name)}</b> · Batch ${esc(d.batch)}</div></div>`;
  return `<div class="sticker haz"><div class="row" style="gap:16px;align-items:center;flex-wrap:nowrap">${hazDiamond(d.cls || h.cls)}<div>
    <div class="haz-signal">${esc(h.signal)}</div><div style="font-size:18px;font-weight:800">${esc(d.name)}</div><div>${esc(d.un || 'UN —')} · Class ${esc(d.cls || h.cls)}</div>
    <div class="small">Batch <b>${esc(d.batch || '—')}</b></div><div class="small muted">Emergency: ${esc(h.phone)}</div></div></div></div>`;
}
function hazSticker(woId) {
  const w = S.workorders.find(x => x.id === woId), p = prod(w.productId);
  const name = w.export && p.alias ? p.alias : p.name;
  modal('HAZ sticker', `<div id="printArea">${hazLabelHTML({ name, un: p.un, cls: p.hazClass, batch: w.formula, client: w.client })}</div>`,
    `<button class="btn" onclick="closeModal()">Close</button><button class="btn p" onclick="printArea()"><i data-lucide="printer"></i> Print</button>`);
}
function printArea() {
  const win = window.open('', '_blank', 'width=600,height=700');
  win.document.write(`<!doctype html><title>Print</title><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="styles.css"><body style="background:#fff;padding:20px">${$('#printArea').innerHTML}<script>setTimeout(()=>print(),400)<\/script></body>`);
  win.document.close();
}

/* ---------- QR stickers (one permanent code per material / product) ---------- */
function qrOf(item) { if (!item.qr) { item.qr = rndToken().slice(0, 12); save(); } return item.qr; }
function qrSVG(text, size = 150) {
  if (!window.qrcode) return '<div class="muted small">QR library not loaded</div>';
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: Math.max(2, Math.floor(size / q.getModuleCount())), margin: 2, scalable: true }).replace('<svg ', `<svg width="${size}" height="${size}" role="img" aria-label="QR code" `);
}
function sticker(code) {
  const i = rm(code), id = qrOf(i);
  modal('Raw material sticker', `<div id="printArea"><div class="sticker qr">${qrSVG(location.origin + '/#inventory/qr-' + id)}<div>
    <img src="logo.webp" alt="" style="height:28px"><div style="font-size:20px;font-weight:800;margin:6px 0 2px">${esc(i.code)}</div>
    <div>${esc(i.name)}</div><div class="small">Lot <b>${esc(i.serial)}</b></div><div class="small muted">QR ${id} · ${today()}</div></div></div></div>
    <p class="muted small">This QR code stays the same for ${esc(i.code)} every time it is printed. Scanning it opens the material in the ERP.</p>`,
    `<button class="btn" onclick="closeModal()">Close</button><button class="btn p" onclick="printArea()"><i data-lucide="printer"></i> Print</button>`);
}
function productSticker(id) {
  const p = prod(id), q = qrOf(p);
  modal('Product label', `<div id="printArea"><div class="sticker qr">${qrSVG(location.origin + '/#inventory/qr-' + q)}<div>
    <img src="logo.webp" alt="" style="height:28px"><div style="font-size:18px;font-weight:800;margin:6px 0 2px">${esc(p.name)}</div><div>${esc(p.code)}</div>
    ${p.haz ? '<div class="pill red" style="margin-top:6px">HAZARDOUS</div>' : ''}</div></div></div>`,
    `<button class="btn" onclick="closeModal()">Close</button><button class="btn p" onclick="printArea()"><i data-lucide="printer"></i> Print</button>`);
}
const scanPage = q => {
  const i = S.inventory.find(x => x.qr === q), p = S.products.find(x => x.qr === q);
  if (i) { const used = S.workorders.filter(w => (w.lotsUsed || []).some(l => l.code === i.code));
    return `<div class="card"><h3>${esc(i.code)} · ${esc(i.name)}</h3><div class="grid g4">${kpi('package', i.qty + ' ' + i.unit, 'In stock')}${kpi('tag', esc(i.serial), 'Current lot')}${kpi('arrow-down', i.min, 'Minimum')}${kpi('factory', used.length, 'Work orders used in')}</div>
    <div class="row" style="margin-top:16px"><a class="btn" href="#inventory">Inventory</a><button class="btn" onclick="sticker('${i.code}')">Reprint sticker</button></div></div>`; }
  if (p) return `<div class="card"><h3>${esc(p.name)}</h3><p>${esc(p.code)} · ${divName(p.div)} · MOQ ${p.moq} ${p.unit}</p><a class="btn" href="#products">Products</a></div>`;
  return '<div class="alert err">This QR code is not linked to any material.</div>';
};
const _pagesProducts = PAGES.products;
PAGES.products = () => _pagesProducts().replace(/<th>HAZ<\/th><\/tr>/, '<th>HAZ</th><th>UN no.</th><th></th></tr>')
  .replace(/onchange="setP\('([^']+)','haz',this\.checked\)"><\/td><\/tr>/g, (m, id) => { const p = prod(id);
    return `${m.slice(0, -10)}</td><td><input style="width:90px" placeholder="UN 1993" value="${esc(p.un || '')}" onchange="setP('${id}','un',this.value)"></td><td><button class="btn sm icon" aria-label="Print label" onclick="productSticker('${id}')"><i data-lucide="qr-code"></i></button></td></tr>`; });

/* ---------- Inward with QA quarantine, expiry and lot ---------- */
function rmForm() {
  const lot = 'RML-' + new Date().getFullYear() % 100 + '-' + String(Date.now() % 100000).padStart(5, '0');
  modal('Inward raw material', `<div class="form"><label>Material<select id="ri">${S.inventory.map(i => `<option value="${i.code}">${i.code} · ${esc(i.name)}</option>`)}</select></label><label>Quantity<input id="rq" type="number" value="500"></label>
    <label>QA inward test<select id="rqa"><option>Passed</option><option>Pending (quarantine)</option><option>Failed</option></select></label><label>Expiry date<input id="rx" type="date" value="${addDays(today(), 365)}"></label>
    <label>Supplier COA received<select id="rcoa"><option>Yes</option><option>No</option></select></label><label>New lot (auto)<input disabled value="${lot}" id="rs"></label></div>`,
    `<button class="btn p" onclick="saveInward()">Save & print sticker</button>`);
}
function saveInward() {
  const i = rm(val('ri')), q = +val('rq'), qa = val('rqa');
  if (qa === 'Failed') { closeModal(); toast('Lot rejected. Stock not added.'); logA(`Inward lot of ${i.code} failed QA`); return rerender(); }
  i.inward = i.inward || [];
  i.inward.unshift({ lot: $('#rs').value, qty: q, date: today(), expiry: val('rx'), qa: qa.startsWith('Passed') ? 'Released' : 'Quarantine', coa: val('rcoa') === 'Yes', by: me().name });
  if (qa.startsWith('Passed')) { i.qty += q; i.serial = $('#rs').value; }
  const po = S.pos.find(p => p.code === i.code && p.status === 'Ordered');
  if (po) { po.status = 'Received'; po.receivedOn = today(); }
  closeModal(); save(); sticker(i.code); toast(qa.startsWith('Passed') ? 'Stock added. Lot ' + $('#rs')?.value : 'Lot held in quarantine until QA release');
}
function releaseLot(code, lot) {
  const i = rm(code), l = (i.inward || []).find(x => x.lot === lot);
  l.qa = 'Released'; i.qty += l.qty; i.serial = l.lot; logA(`Lot ${lot} released by QA`); save(); rerender();
}
const _pagesInventory = PAGES.inventory;
PAGES.inventory = arg => {
  if (arg && arg.startsWith('qr-')) return scanPage(arg.slice(3));
  const q = S.inventory.filter(inDiv).flatMap(i => (i.inward || []).filter(l => l.qa === 'Quarantine').map(l => ({ i, l })));
  const exp = S.inventory.filter(inDiv).flatMap(i => (i.inward || []).filter(l => l.qa === 'Released' && l.expiry && l.expiry <= addDays(today(), 30)).map(l => ({ i, l })));
  return (q.length || exp.length ? `<div class="card" style="margin-bottom:16px"><h3>Quality hold & expiry</h3>
    ${q.map(({ i, l }) => attnBtn('shield-alert', 'amber', `${i.name} · lot ${l.lot}`, `${l.qty} ${i.unit} in quarantine since ${l.date}`, `releaseLot('${i.code}','${l.lot}')`, 'QA release')).join('')}
    ${exp.map(({ i, l }) => attnBtn('calendar-x', 'red', `${i.name} · lot ${l.lot}`, `Expires ${l.expiry}. Use this lot first.`, `location.hash='inventory'`, 'OK')).join('')}</div>` : '') + _pagesInventory();
};
const attnBtn = (ic, tone, title, sub, onclick, cta) => `<div class="attn"><span class="ai ${tone}"><i data-lucide="${ic}"></i></span><div style="flex:1;min-width:0"><b>${esc(title)}</b><div class="muted small">${sub}</div></div><button class="btn sm" onclick="${onclick}">${cta}</button></div>`;

/* ---------- Traceability (lots → batches → customers) & COA ---------- */
const _nextStage = nextStage;
nextStage = function (id) {
  const w = S.workorders.find(x => x.id === id), st = flowOf(w)[w.stage] || {};
  if (st.kind === 'stock') {
    const f = S.formulations.find(x => x.batch === w.formula), p = prod(w.productId);
    if (f) w.lotsUsed = f.items.map(it => ({ code: it.code, lot: rm(it.code).serial, qty: Math.round(convert(w.qty, w.unit, 'kg', p.density) * it.pct / 100) }));
    w.batchNo = w.batchNo || (w.formula || 'B') + '/' + w.id;
  }
  _nextStage(id);
};
let traceQ = '';
function traceResult(q) {
  if (!q) return '';
  const Q = q.toLowerCase();
  const back = S.workorders.filter(w => [w.id, w.batchNo, w.formula, w.order].some(x => (x || '').toLowerCase() === Q));
  const fwd = S.workorders.filter(w => (w.lotsUsed || []).some(l => l.lot.toLowerCase() === Q || l.code.toLowerCase() === Q))
    .concat(S.formulations.filter(f => f.items.some(i => i.lot.toLowerCase() === Q)).map(f => ({ formulaOnly: f })));
  if (!back.length && !fwd.length) return '<div class="alert warn">Nothing found for this number.</div>';
  return `${back.map(w => `<div class="trace"><div class="trace-col"><span class="muted small">Raw material lots</span>${(w.lotsUsed || (S.formulations.find(f => f.batch === w.formula)?.items || [])).map(l => `<div class="trace-node">${esc(l.code)} · ${esc(l.lot)}${l.qty ? ` · ${l.qty} kg` : ''}</div>`).join('') || '<div class="muted small">Not produced yet</div>'}</div>
      <i data-lucide="arrow-right" class="trace-arrow"></i><div class="trace-col"><span class="muted small">Batch</span><div class="trace-node main">${esc(w.batchNo || w.formula || w.id)}<div class="small muted">${esc(prod(w.productId).name)}</div></div></div>
      <i data-lucide="arrow-right" class="trace-arrow"></i><div class="trace-col"><span class="muted small">Customer</span><div class="trace-node">${esc(w.client)}<div class="small muted">${w.order} · ${esc(stageName(w))}</div></div></div></div>`).join('')}
    ${fwd.length ? `<h4>Where this lot went</h4>${fwd.map(x => x.formulaOnly ? `<div class="attn"><span class="ai blue"><i data-lucide="flask-conical"></i></span><div style="flex:1"><b>Formulation ${esc(x.formulaOnly.batch)}</b><div class="muted small">${esc(x.formulaOnly.client)} · ${esc(x.formulaOnly.version)}</div></div></div>`
      : `<div class="attn"><span class="ai blue"><i data-lucide="truck"></i></span><div style="flex:1"><b>${esc(x.client)}</b><div class="muted small">${x.id} · batch ${esc(x.batchNo || x.formula)} · ${esc(stageName(x))}</div></div><a class="btn sm" href="#workorders/${x.id}">Open</a></div>`).join('')}` : ''}`;
}
const _pagesLab = PAGES.lab;
PAGES.lab = () => `<div class="card" style="margin-bottom:16px"><h3>Trace a batch or lot</h3>
  <form data-ro-ok class="row" onsubmit="event.preventDefault();traceQ=val('tq');rerender()"><input id="tq" style="flex:1;min-width:220px" placeholder="Raw material lot (RML-…), batch, work order or SO number" value="${esc(traceQ)}"><button class="btn p">Trace</button></form>
  <div style="margin-top:14px">${traceResult(traceQ)}</div></div>` + _pagesLab();
function coa(woId) {
  const w = S.workorders.find(x => x.id === woId), p = prod(w.productId);
  modal('Certificate of analysis', `<div id="printArea"><div class="doc"><div class="row"><img src="logo.webp" alt="" style="height:36px"><b style="font-size:18px">${esc(companyOf(w.div))}</b><span class="sp"></span><b>CERTIFICATE OF ANALYSIS</b></div>
    <table class="tbl" style="margin-top:14px"><tr><td>Product</td><td><b>${esc(w.export && p.alias ? p.alias : p.name)}</b></td><td>Batch no.</td><td><b>${esc(w.batchNo || w.formula)}</b></td></tr>
    <tr><td>Customer</td><td>${esc(w.client)}</td><td>Order</td><td>${w.order}</td></tr><tr><td>Quantity</td><td>${w.qty} ${w.unit}</td><td>Date</td><td>${today()}</td></tr></table>
    <h4>Test results</h4><table class="tbl"><tr><th>Parameter</th><th>Result</th></tr>${w.qc.map(r => { const m = r.match(/^(.*?)[\s:]+([\d.,]+.*?)( \(.*\))?$/); return `<tr><td>${esc(m ? m[1] : r)}</td><td>${esc(m ? m[2] : '')}</td></tr>`; }).join('') || '<tr><td colspan="2" class="muted">Add QC readings first</td></tr>'}</table>
    <p class="small" style="margin-top:18px">Checked by: ${esc(w.operators[w.flow ? w.flow.findIndex(s => s.kind === 'qc') : 2] || me().name)} &nbsp; · &nbsp; Approved by: ____________</p></div></div>`,
    `<button class="btn" onclick="closeModal()">Close</button><button class="btn p" onclick="printArea()"><i data-lucide="printer"></i> Print</button>`);
}

/* ---------- Vendor scorecard (price vs market + on-time delivery) ---------- */
const VENDOR_LEAD_DAYS = 7;
const _quickPO = quickPO;
quickPO = function (code, qty) { _quickPO(code, qty); const po = S.pos[0]; if (po && !po.promised) { po.promised = addDays(today(), VENDOR_LEAD_DAYS); save(); } };
function vendorScore(v) {
  const pos = S.pos.filter(p => p.vendor === v.id);
  const done = pos.filter(p => p.status === 'Received' && p.promised && p.receivedOn);
  const onTime = done.length ? Math.round(done.filter(p => p.receivedOn <= p.promised).length / done.length * 100) : null;
  const diffs = Object.entries(v.rates).filter(([c]) => S.market[c]).map(([c, r]) => (r - S.market[c]) / S.market[c] * 100);
  const price = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;
  const score = Math.round(((onTime ?? 80) * 0.5) + (Math.max(0, Math.min(100, 50 - (price ?? 0) * 5)) * 0.5));
  return { orders: pos.length, onTime, price, score, open: pos.filter(p => p.status === 'Ordered') };
}
function receivePO(id) { const po = S.pos.find(p => p.id === id); po.status = 'Received'; po.receivedOn = today(); const i = rm(po.code); if (i.qty !== undefined) i.qty += convert(po.qty, po.unit, i.unit, 1); logA(`${id} received`); save(); rerender(); }
const _pagesProcurement = PAGES.procurement;
PAGES.procurement = () => {
  const rows = S.vendors.map(v => ({ v, s: vendorScore(v) })).sort((a, b) => b.s.score - a.s.score);
  const open = S.pos.filter(p => p.status === 'Ordered');
  return `<div class="grid g2" style="margin-bottom:16px"><div class="card"><h3>Vendor scorecard</h3><div class="tw"><table class="tbl"><tr><th>Vendor</th><th>Score</th><th>On time</th><th>Price vs market</th><th>Orders</th></tr>
    ${rows.map(({ v, s }, n) => `<tr><td><b>${esc(v.name)}</b>${n === 0 ? ' <span class="pill green">Best</span>' : ''}${v.approved ? '' : ' <span class="pill amber">Unapproved</span>'}</td><td><div class="score"><div class="bar"><i style="width:${s.score}%"></i></div><b>${s.score}</b></div></td>
    <td>${s.onTime == null ? '<span class="muted">No data</span>' : s.onTime + '%'}</td><td>${s.price == null ? '—' : `<span style="color:${s.price > 0 ? 'var(--red)' : 'var(--green)'}">${s.price > 0 ? '+' : ''}${s.price.toFixed(1)}%</span>`}</td><td>${s.orders}</td></tr>`).join('')}</table></div>
    <p class="muted small">Score = half on-time delivery, half price against the market rate you enter. On-time is measured from each PO's promised date to when it is received.</p></div>
    <div class="card"><h3>Open purchase orders</h3>${open.map(p => attnBtn('shopping-cart', p.promised && p.promised < today() ? 'red' : 'blue', `${p.id} · ${rm(p.code).name}`, `${S.vendors.find(v => v.id === p.vendor)?.name} · ${p.qty} ${p.unit} · ${p.promised ? 'promised ' + p.promised : 'no date'}${p.promised && p.promised < today() ? ' · LATE' : ''}`, `receivePO('${p.id}')`, 'Received')).join('') || '<span class="muted">No open POs</span>'}</div></div>` + _pagesProcurement();
};

/* ---------- Machines: reminders with expected vs last cost ---------- */
PAGES.machines = () => {
  const rows = S.machines.map(m => { const nd = addDays(m.last, m.every); const days = Math.round((new Date(nd) - new Date(today())) / 864e5); const last = m.log[m.log.length - 1]; return { m, nd, days, last }; }).sort((a, b) => a.days - b.days);
  return `<div class="toolbar"><button class="btn p" onclick="machineForm()">+ Add machine</button></div>
  <div class="grid g3">${rows.map(({ m, nd, days, last }) => `<div class="card machine ${days < 0 ? 'due' : days <= (m.remind ?? 7) ? 'soon' : ''}">
    <div class="row"><b style="flex:1">${esc(m.name)}</b>${days < 0 ? `<span class="pill red">${-days} days overdue</span>` : days <= (m.remind ?? 7) ? `<span class="pill amber">In ${days} days</span>` : `<span class="pill grey">In ${days} days</span>`}</div>
    <div class="ring" style="--p:${Math.max(0, Math.min(100, 100 - days / m.every * 100))}"><span>${Math.max(0, days)}<small>days</small></span></div>
    <dl class="kv"><dt>Next service</dt><dd>${nd}</dd><dt>Expected cost</dt><dd>${inr(m.avgCost)}</dd><dt>Last time</dt><dd>${last ? inr(last.c) + ' · ' + last.d : 'No history yet'}</dd><dt>Avg downtime</dt><dd>${m.avgHrs} h</dd></dl>
    <button class="btn sm" onclick="maint('${m.id}')">Log maintenance</button></div>`).join('')}</div>`;
};
function machineForm() {
  modal('Add machine', `<div class="form"><label class="full">Machine name<input id="mn"></label><label>Last serviced<input id="ml" type="date" value="${today()}"></label><label>Service every (days)<input id="me" type="number" value="60"></label>
    <label>Average service cost ₹<input id="mc2" type="number" value="10000"></label><label>Average downtime (hours)<input id="mh2" type="number" value="4"></label><label>Remind me (days before)<input id="mr" type="number" value="7"></label></div>`,
    `<button class="btn p" onclick="S.machines.push({id:uid('M'),name:val('mn'),last:val('ml'),every:+val('me'),avgCost:+val('mc2'),avgHrs:+val('mh2'),remind:+val('mr'),log:[]});closeModal();rerender()">Save</button>`);
}
function machineReminders() {
  const sent = (S.settings || {}).mreminded || {};
  S.machines.forEach(m => {
    const nd = addDays(m.last, m.every), key = m.id + nd;
    if (nd <= addDays(today(), m.remind ?? 7) && !sent[key]) {
      const last = m.log[m.log.length - 1];
      notifyRole('Production Head', `${m.name} service due ${nd}. Expected ${inr(m.avgCost)}${last ? ', last time ' + inr(last.c) : ''}.`);
      S.settings = S.settings || {}; S.settings.mreminded = { ...sent, [key]: 1 };
    }
  });
}

/* ---------- Training builder (HR) ---------- */
let trainOpen = null;
const ytId = u => (u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
const isHR = () => ['Super Admin', 'HR'].includes(me().role);
PAGES.training = () => {
  if (trainOpen) return trainingModule(S.modules.find(m => m.id === trainOpen));
  const myTests = S.tests.filter(t => isHR() || !t.for || t.for === 'all' || (t.for === 'interns' && me().intern));
  const interns = S.users.filter(u => u.intern);
  return `<div class="toolbar"><h3 style="margin:0">Training modules</h3><span class="sp"></span>${isHR() ? '<button class="btn p" onclick="moduleForm()">+ New module</button>' : ''}</div>
  <div class="grid g3">${S.modules.map(m => { const ls = m.items || []; return `<button data-ro-ok class="card mod-card" onclick="trainOpen='${m.id}';rerender()"><span class="ai blue"><i data-lucide="book-open"></i></span><b>${esc(m.title)}</b>
    <span class="muted small">${ls.length || m.lessons || 0} lessons${ls.some(l => l.type === 'audio') || m.audio ? ' · audio' : ''}${ls.some(l => l.type === 'video' || l.type === 'youtube') ? ' · video' : ''}</span></button>`; }).join('') || '<p class="muted">No modules yet.</p>'}</div>
  <div class="grid g2" style="margin-top:20px"><div class="card"><h3>Assessments<span class="sp"></span>${isHR() ? '<button class="btn sm p" onclick="testForm()">+ New test</button>' : ''}</h3>
    ${myTests.map(t => { const done = S.results.find(r => r.user === S.user && r.test === t.id); return `<div class="attn"><span class="ai ${done ? 'green' : 'blue'}"><i data-lucide="${done ? 'check' : 'clipboard-list'}"></i></span><div style="flex:1;min-width:0"><b>${esc(t.title)}</b><div class="muted small">${t.mins} min · ${t.qs.length} questions · due ${t.due}${t.for === 'interns' ? ' · interns' : ''}</div></div>
      ${done ? `<span class="pill green">${done.score}%</span>` : `<button class="btn sm p" onclick="startTest('${t.id}')">Start</button>`}${isHR() ? `<button class="btn sm icon r" aria-label="Delete test" onclick="if(confirm('Delete test?')){S.tests=S.tests.filter(x=>x.id!=='${t.id}');rerender()}"><i data-lucide="trash-2"></i></button>` : ''}</div>`; }).join('') || '<p class="muted">No tests scheduled.</p>'}
    <p class="muted small" style="margin-top:10px">Tests run full-screen with the camera on. Tab switches and screenshot attempts are recorded.</p></div>
  <div class="card"><h3>Results${['Super Admin', 'HR', 'Marketing Head'].includes(me().role) ? '' : ' (mine)'}</h3><div class="tw"><table class="tbl"><tr><th>Employee</th><th>Test</th><th>Score</th><th>Flags</th><th>Date</th></tr>
    ${S.results.filter(r => ['Super Admin', 'HR', 'Marketing Head'].includes(me().role) || r.user === S.user).map(r => `<tr><td>${uname(r.user)}</td><td>${esc(S.tests.find(t => t.id === r.test)?.title || 'Deleted test')}</td><td><b>${r.score}%</b></td><td>${r.flags ? `<span class="pill red">${r.flags} flagged</span>` : '<span class="pill green">Clean</span>'}</td><td>${r.date}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No results yet</td></tr>'}</table></div></div></div>
  ${interns.length ? `<div class="card" style="margin-top:20px"><h3>Intern & trainee journey</h3>${interns.map(internRow).join('')}</div>` : ''}
  <div class="card" style="margin-top:20px"><h3>Staff desk</h3><div class="row"><input id="dq" style="flex:1" placeholder="Ask your mentor a question"><button class="btn sm p" onclick="if(val('dq')){notifyRole('Marketing Head','Staff desk: '+me().name+' asked “'+val('dq')+'”');toast('Sent to your mentor');rerender()}">Ask mentor</button></div></div>`;
};
function internRow(u) {
  const d = Math.floor((new Date() - new Date(u.joined)) / 864e5), a = S.activity[u.id] || {};
  const res = S.results.filter(r => r.user === u.id), avg = res.length ? Math.round(res.reduce((x, r) => x + r.score, 0) / res.length) : null;
  const rate = a.tCalls ? a.calls / a.tCalls : 0;
  const steps = [['Test 1', 15], ['Test 2', 30], ['Modules', 60], ['Targets', 90], ['Evaluation', 120]];
  const fb = (S.settings?.feedback || {})[u.id] || '';
  return `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div class="row"><b>${esc(u.name)}</b><span class="muted small">day ${d}</span><span class="sp"></span>
    <span class="pill ${avg == null ? 'grey' : avg >= 70 ? 'green' : 'amber'}">Tests ${avg == null ? '—' : avg + '%'}</span><span class="pill ${rate >= .7 ? 'green' : rate >= .4 ? 'amber' : 'red'}">Follow-ups ${Math.round(rate * 100)}%</span>
    ${isHR() || me().role === 'Marketing Head' ? `<button class="btn sm" onclick="feedbackForm('${u.id}')">Feedback</button>` : ''}</div>
    <div class="stages">${steps.map(([s, at], i) => `<div class="stage ${d > at ? 'done' : d > (i ? steps[i - 1][1] : 0) ? 'cur' : ''}"><span class="dot">${d > at ? '<i data-lucide="check"></i>' : ''}</span>${s}</div>`).join('')}</div>
    ${fb ? `<div class="small"><b>Feedback:</b> ${esc(fb)}</div>` : ''}</div>`;
}
function feedbackForm(uid_) {
  modal('Feedback for ' + esc(uname(uid_)), `<label class="form"><span>Scope of improvement and feedback (the trainee can see this)</span><textarea id="fbt" rows="5">${esc((S.settings?.feedback || {})[uid_] || '')}</textarea></label>`,
    `<button class="btn p" onclick="S.settings=S.settings||{};S.settings.feedback={...(S.settings.feedback||{}),'${uid_}':val('fbt')};notify('${uid_}','New feedback from '+me().name);closeModal();rerender()">Save</button>`);
}
function trainingModule(m) {
  if (!m) { trainOpen = null; return PAGES.training(); }
  const items = m.items || [];
  return `<div class="toolbar"><button data-ro-ok class="btn sm" onclick="trainOpen=null;rerender()">← All modules</button><b style="font-size:17px">${esc(m.title)}</b><span class="sp"></span>
    ${isHR() ? `<button class="btn sm" onclick="lessonForm('${m.id}')">+ Add lesson</button><button class="btn sm r" onclick="if(confirm('Delete this module?')){S.modules=S.modules.filter(x=>x.id!=='${m.id}');trainOpen=null;rerender()}">Delete</button>` : ''}</div>
    ${m.desc ? `<p class="muted">${esc(m.desc)}</p>` : ''}
    <div class="lessons">${items.map((l, i) => `<div class="card lesson"><div class="row"><span class="fi-n">${i + 1}</span><b style="flex:1">${esc(l.title)}</b>${isHR() ? `<button class="btn sm icon r" aria-label="Remove lesson" onclick="S.modules.find(x=>x.id==='${m.id}').items.splice(${i},1);rerender()"><i data-lucide="x"></i></button>` : ''}</div>
      ${l.text ? `<p style="white-space:pre-wrap">${esc(l.text)}</p>` : ''}
      ${l.type === 'audio' ? `<audio controls preload="none" src="${esc(l.url)}"></audio>` : ''}
      ${l.type === 'video' ? `<video controls preload="metadata" src="${esc(l.url)}" style="width:100%;max-height:420px;border-radius:12px;background:#000"></video>` : ''}
      ${l.type === 'youtube' && ytId(l.url) ? `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${ytId(l.url)}" title="${esc(l.title)}" allowfullscreen loading="lazy"></iframe></div>` : ''}
      ${l.type === 'link' || l.type === 'pdf' ? `<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener"><i data-lucide="external-link"></i> Open ${l.type === 'pdf' ? 'document' : 'link'}</a>` : ''}</div>`).join('') || `<div class="card muted">No lessons yet.${isHR() ? ' Add text, recorded audio, videos, PDFs or YouTube links.' : ''}</div>`}</div>`;
}
function moduleForm() {
  modal('New training module', `<div class="form"><label class="full">Title<input id="mt"></label><label class="full">Short description<input id="md"></label></div>`,
    `<button class="btn p" onclick="if(val('mt')){const id=uid('TM');S.modules.push({id,title:val('mt'),desc:val('md'),items:[]});trainOpen=id;closeModal();rerender()}">Create</button>`);
}
let recorder = null, recChunks = [];
function lessonForm(mid) {
  modal('Add lesson', `<div class="form"><label class="full">Lesson title<input id="lt2"></label>
    <label class="full">Type<select id="ltype" onchange="document.querySelectorAll('[data-for]').forEach(e=>e.hidden=!e.dataset.for.split(' ').includes(this.value))">
      <option value="text">Text only</option><option value="audio">Record or upload audio</option><option value="video">Upload video</option><option value="pdf">Upload PDF</option><option value="youtube">YouTube link</option><option value="link">Other link</option></select></label>
    <label class="full">Notes / content<textarea id="ltext" rows="4"></textarea></label>
    <div class="full" data-for="audio" hidden><div class="row"><button type="button" class="btn sm" id="recBtn" onclick="toggleRec()"><i data-lucide="mic"></i> Start recording</button><span id="recState" class="muted small"></span></div></div>
    <label class="full" data-for="audio video pdf" hidden>Upload file<input id="lfile" type="file" accept="audio/*,video/*,application/pdf"></label>
    <label class="full" data-for="youtube link" hidden>Link<input id="lurl" placeholder="https://"></label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" id="lsave" onclick="saveLesson('${mid}')">Add lesson</button>`);
}
async function toggleRec() {
  if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recChunks = []; recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => recChunks.push(e.data);
    recorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); recorder.blob = new Blob(recChunks, { type: recorder.mimeType.split(';')[0] }); $('#recState').textContent = 'Recorded ' + Math.round(recorder.blob.size / 1024) + ' KB'; $('#recBtn').innerHTML = '<i data-lucide="mic"></i> Record again'; };
    recorder.start(); $('#recState').textContent = 'Recording…'; $('#recBtn').innerHTML = '<i data-lucide="square"></i> Stop';
  } catch (e) { toast('Microphone not available. Upload an audio file instead.'); }
}
async function saveLesson(mid) {
  const type = val('ltype'), l = { title: val('lt2') || 'Lesson', type, text: val('ltext') };
  try {
    $('#lsave').disabled = true;
    if (type === 'audio' && recorder?.blob) l.url = await uploadFile(recorder.blob);
    else if (['audio', 'video', 'pdf'].includes(type)) { const f = $('#lfile').files[0]; if (!f) throw new Error('Choose a file or record audio'); l.url = await uploadFile(f); }
    if (['youtube', 'link'].includes(type)) { l.url = val('lurl'); if (!/^https?:\/\//.test(l.url)) throw new Error('Enter a full link starting with https://'); }
    const m = S.modules.find(x => x.id === mid); (m.items = m.items || []).push(l); recorder = null;
    closeModal(); rerender(); toast('Lesson added');
  } catch (e) { toast(e.message); $('#lsave').disabled = false; }
}
function testForm() {
  modal('New assessment', `<div class="form"><label class="full">Title<input id="tt2" value="Weekly test"></label><label>Based on module<select id="tm2">${S.modules.map(m => `<option value="${m.id}">${esc(m.title)}</option>`)}</select></label>
    <label>For<select id="tf2"><option value="all">Everyone</option><option value="interns">Interns & trainees</option></select></label><label>Duration (minutes)<input id="td2" type="number" value="10"></label><label>Due date<input id="tdue" type="date" value="${addDays(today(), 7)}"></label>
    <label class="full">Questions<textarea id="tq2" rows="9" placeholder="One question per block. Mark the correct option with *&#10;&#10;Which product separates water from crude oil?&#10;Scale inhibitor&#10;*Crude oil demulsifier&#10;Bio stimulant"></textarea></label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveTest()">Publish test</button>`);
}
function saveTest() {
  const qs = val('tq2').split(/\n\s*\n/).map(b => b.split('\n').map(x => x.trim()).filter(Boolean)).filter(b => b.length >= 3).map(([q, ...o]) => ({ q, o: o.map(x => x.replace(/^\*/, '')), a: Math.max(0, o.findIndex(x => x.startsWith('*'))) }));
  if (!qs.length) return toast('Add at least one question with 2+ options');
  S.tests.push({ id: uid('TS'), module: val('tm2'), title: val('tt2'), mins: +val('td2') || 10, due: val('tdue'), for: val('tf2'), qs });
  notifyRole('Sales Executive', 'New assessment: ' + val('tt2') + ' due ' + val('tdue'));
  closeModal(); rerender(); toast('Test published');
}
const _startTest = startTest;
startTest = function (id) { _startTest(id); document.documentElement.requestFullscreen?.().catch(() => { }); };
const _submitTest = submitTest;
submitTest = function () { _submitTest(); if (document.fullscreenElement) document.exitFullscreen?.(); };
document.addEventListener('fullscreenchange', () => { if (testState && !document.fullscreenElement) { testState.flags++; toast('Left full screen: recorded'); } });
document.addEventListener('contextmenu', e => { if (testState) e.preventDefault(); });
document.addEventListener('copy', e => { if (testState) { e.preventDefault(); testState.flags++; } });

/* ---------- Dashboard ---------- */
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, fmt = el.dataset.fmt, t0 = performance.now(), dur = 700;
    const f = v => fmt === 'inr' ? inrShort(v) : Math.round(v).toLocaleString('en-IN');
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = f(end * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
const inrShort = n => n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1) + ' L' : inr(n);
const toINR = (a, c) => c === 'USD' ? a * ((S.settings || {}).usd || 84) : a;
function areaChart(vals, labels) {
  const W = 560, H = 170, P = 8, max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [P + i * (W - 2 * P) / Math.max(1, vals.length - 1), H - 26 - (v / max) * (H - 50)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="area" role="img" aria-label="Collections by month">
    <defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity=".22"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>
    ${[0.25, 0.5, 0.75].map(f => `<line x1="0" x2="${W}" y1="${(H - 26) - f * (H - 50)}" y2="${(H - 26) - f * (H - 50)}" stroke="var(--line)" stroke-dasharray="3 5"/>`).join('')}
    <path d="${line} L${pts[pts.length - 1][0]} ${H - 26} L${pts[0][0]} ${H - 26}Z" fill="url(#ag)"/><path d="${line}" fill="none" stroke="var(--blue)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="draw"/>
    ${pts.map((p, i) => `<g class="pt"><circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff" stroke="var(--blue)" stroke-width="2"/><title>${labels[i]}: ${inrShort(vals[i])}</title></g><text x="${p[0]}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)">${labels[i]}</text>`).join('')}</svg>`;
}
function spark(vals) {
  const max = Math.max(1, ...vals);
  return `<div class="spark">${vals.map((v, i) => `<i style="height:${Math.max(6, v / max * 100)}%;${i === vals.length - 1 ? 'background:var(--blue)' : ''}"></i>`).join('')}</div>`;
}
PAGES.dashboard = () => {
  const orders = S.orders.filter(inDiv), pays = S.payments.filter(inDiv), wos = S.workorders.filter(inDiv), inq = S.inquiries.filter(inDiv), leads = S.leads.filter(inDiv);
  const month = today().slice(0, 7);
  const monthVal = orders.filter(o => (o.date || '').startsWith(month)).reduce((a, o) => a + toINR(orderTotal(o), o.currency), 0);
  const weeks = [...Array(7)].map((_, i) => { const from = addDays(today(), -7 * (7 - i)), to = addDays(today(), -7 * (6 - i)); return orders.filter(o => o.date > from && o.date <= to).reduce((a, o) => a + toINR(orderTotal(o), o.currency), 0); });
  const pending = pays.filter(p => p.status === 'Pending'), overdue = pending.filter(p => p.due < today());
  const toCollect = pending.reduce((a, p) => a + toINR(p.amount, p.currency), 0), od = overdue.reduce((a, p) => a + toINR(p.amount, p.currency), 0);
  const floor = wos.filter(w => w.approved && w.stage < lastStage(w));
  const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); });
  const coll = months.map(m => pays.filter(p => p.status === 'Received' && (p.due || '').startsWith(m)).reduce((a, p) => a + toINR(p.amount, p.currency), 0));
  const pipe = [['Inquiries', inq.filter(q => q.status !== 'Approved').length, '#inquiries'], ['Quoted', inq.filter(q => q.status === 'Quoted').length, '#inquiries'],
    ['Awaiting payment', orders.filter(o => o.status === 'Awaiting payment').length, '#payments'], ['In production', floor.length, '#workorders'],
    ['Ready to ship', wos.filter(w => (flowOf(w)[w.stage] || {}).kind === 'ship').length, '#workorders'], ['Dispatched', wos.filter(w => w.stage === lastStage(w)).length, '#dispatch']];
  const low = lowStock(), toApprove = wos.filter(w => !w.approved && advOk(S.orders.find(o => o.id === w.order))), dueM = S.machines.filter(m => addDays(m.last, m.every) <= addDays(today(), m.remind ?? 7));
  const blocked = wos.filter(w => w.stage === lastStage(w) && !w.invoiced);
  const att = [
    ...toApprove.map(w => attn('factory', 'blue', `${w.id} ready to approve`, `${esc(w.client)} has paid ${money(paidFor(w.order), S.orders.find(o => o.id === w.order)?.currency)}`, '#workorders/' + w.id, 'Review')),
    ...low.map(i => attn('package', 'red', `${i.name} is low`, `${i.qty} ${i.unit} left · minimum ${i.min}`, '#inventory', 'Raise PO')),
    ...overdue.map(p => attn('wallet', 'amber', `Overdue · ${p.client}`, `${money(p.amount, p.currency)} · due ${p.due}`, '#payments', 'Remind')),
    ...blocked.map(w => attn('receipt', 'amber', `${w.id} invoice pending`, 'Dispatch photos, CHA or HAZ label missing', '#workorders/' + w.id, 'Open')),
    ...dueM.map(m => attn('settings', 'grey', `${m.name} service`, `Due ${addDays(m.last, m.every)} · est. ${inr(m.avgCost)}`, '#machines', 'View'))];
  const hr = new Date().getHours(), hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const ship = wos.filter(w => w.stage < lastStage(w)).sort((a, b) => (a.expected || '').localeCompare(b.expected || '')).slice(0, 5);
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  <div class="hello"><div><h2>${hello}, ${esc(me().name.split(' ')[0])}</h2><p class="muted">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}${att.length ? ` · ${att.length} thing${att.length > 1 ? 's' : ''} need${att.length > 1 ? '' : 's'} your attention` : ' · all clear'}</p></div>
    <div class="row"><button class="btn" onclick="openPalette()"><i data-lucide="search"></i> Search <kbd>Ctrl K</kbd></button>${can('orders') ? '<button class="btn p" onclick="location.hash=\'orders\';setTimeout(orderForm,50)"><i data-lucide="plus"></i> New sales order</button>' : ''}</div></div>
  <div class="grid g4 kpis">
    <a class="card kpi2" href="#orders"><span class="l">Orders this month</span><span class="v" data-count="${monthVal}" data-fmt="inr">0</span>${spark(weeks)}</a>
    <a class="card kpi2" href="#payments"><span class="l">To collect</span><span class="v" data-count="${toCollect}" data-fmt="inr">0</span><div class="split"><i style="width:${toCollect ? (toCollect - od) / toCollect * 100 : 0}%"></i><i class="od" style="width:${toCollect ? od / toCollect * 100 : 0}%"></i></div><span class="small ${od ? 'warn-t' : 'muted'}">${od ? inrShort(od) + ' overdue' : 'Nothing overdue'}</span></a>
    <a class="card kpi2" href="#workorders"><span class="l">On the production floor</span><span class="v" data-count="${floor.length}">0</span><span class="small muted">${wos.filter(w => (flowOf(w)[w.stage] || {}).kind === 'ship').length} ready to ship</span></a>
    <a class="card kpi2" href="#inquiries"><span class="l">Open leads & inquiries</span><span class="v" data-count="${leads.filter(l => l.status === 'New').length + inq.filter(q => q.status === 'Draft').length}">0</span><span class="small muted">${Object.entries(leads.reduce((a, l) => (a[l.source] = (a[l.source] || 0) + 1, a), {})).slice(0, 3).map(([k, v]) => k + ' ' + v).join(' · ') || 'No leads yet'}</span></a>
  </div>
  <div class="card"><div class="row" style="margin-bottom:14px"><h3 style="margin:0;flex:1">Order pipeline</h3><span class="muted small">Click a step to open it</span></div>
    <div class="pipe">${pipe.map(([l, n, h], i) => `<a href="${h}" class="pipe-step" style="--d:${i * 60}ms"><span class="muted small">${l}</span><b>${n}</b></a>`).join('')}</div></div>
  <div class="grid g2">
    <div class="card"><h3>Needs your attention</h3>${att.slice(0, 6).join('') || '<div class="empty"><i data-lucide="check-circle-2"></i><span>All clear. Nothing waiting on you.</span></div>'}${att.length > 6 ? `<p class="muted small">+${att.length - 6} more</p>` : ''}</div>
    <div class="card"><div class="row"><h3 style="flex:1">Collections</h3><span class="muted small">Last 6 months</span></div>${areaChart(coll, months.map(m => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'short' })))}</div>
    <div class="card"><div class="row"><h3 style="flex:1">Next dispatches</h3><a class="small" href="#workorders">All work orders</a></div>
      ${ship.length ? `<div class="tw"><table class="tbl"><tr><th>Order</th><th>Client</th><th>Stage</th><th>Date</th></tr>${ship.map(w => `<tr class="click" onclick="location.hash='workorders/${w.id}'"><td><b>${w.id}</b></td><td>${esc(w.client)}<div class="muted small">${esc(prod(w.productId).name)} · ${w.qty} ${w.unit}</div></td><td><span class="pill">${esc(stageName(w))}</span></td><td>${w.expected}</td></tr>`).join('')}</table></div>` : '<div class="empty"><i data-lucide="truck"></i><span>No work orders in progress</span></div>'}</div>
    <div class="card"><h3>Team today</h3>${teamBars()}</div>
  </div></div>`;
};
function teamBars() {
  const rows = Object.entries(S.activity).filter(([u]) => S.users.some(x => x.id === u));
  if (!rows.length) return '<div class="empty"><i data-lucide="users"></i><span>No call targets set yet</span></div>';
  return rows.map(([u, a]) => `<div class="team-row"><span class="avatar">${esc(uname(u)[0])}</span><div style="flex:1;min-width:0"><div class="row"><b style="flex:1">${esc(uname(u))}</b><span class="muted small">${a.calls}/${a.tCalls} calls · ${a.msgs}/${a.tMsgs} msgs</span></div>
    <div class="bar"><i style="width:${Math.min(100, a.calls / (a.tCalls || 1) * 100)}%"></i></div></div></div>`).join('');
}

/* ---------- Command palette (Ctrl/Cmd + K) ---------- */
function paletteItems(q) {
  const Q = q.toLowerCase(), out = [];
  NAV.flatMap(g => g[1]).filter(([id]) => can(id)).forEach(([id, ic, t]) => out.push({ ic, t, s: 'Page', h: '#' + id }));
  S.workorders.forEach(w => out.push({ ic: 'factory', t: `${w.id} · ${w.client}`, s: `${prod(w.productId).name} · ${stageName(w)}`, h: '#workorders/' + w.id }));
  S.orders.forEach(o => out.push({ ic: 'file-text', t: `${o.id} · ${o.client}`, s: 'Sales order · ' + o.status, h: '#orders' }));
  S.leads.forEach(l => out.push({ ic: 'target', t: l.company, s: 'Lead · ' + l.source, h: '#leads' }));
  S.products.forEach(p => out.push({ ic: 'flask-conical', t: p.name, s: 'Product · ' + p.code, h: '#products' }));
  S.inventory.forEach(i => out.push({ ic: 'package', t: i.name, s: `${i.code} · ${i.qty} ${i.unit}`, h: '#inventory' }));
  S.formulations.forEach(f => out.push({ ic: 'microscope', t: f.batch, s: 'Formulation · ' + f.client, h: '#lab' }));
  return (Q ? out.filter(x => (x.t + ' ' + x.s).toLowerCase().includes(Q)) : out.filter(x => x.s === 'Page')).slice(0, 9);
}
let palSel = 0;
function openPalette() {
  $('#modal').innerHTML = `<div class="modal-bg pal-bg" onclick="if(event.target===this)closeModal()"><div class="palette" role="dialog" aria-label="Search">
    <div class="pal-in"><i data-lucide="search"></i><input id="palq" placeholder="Search pages, orders, clients, batches…" autocomplete="off" oninput="palSel=0;drawPal()" onkeydown="palKey(event)"></div><div id="palr"></div></div></div>`;
  drawPal(); $('#palq').focus();
}
function drawPal() {
  const it = paletteItems(val('palq'));
  $('#palr').innerHTML = it.map((x, i) => `<a href="${x.h}" class="pal-item ${i === palSel ? 'on' : ''}" onclick="closeModal()"><i data-lucide="${x.ic}"></i><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span></a>`).join('') || '<div class="muted" style="padding:16px">No matches</div>';
}
function palKey(e) {
  const n = $('#palr').querySelectorAll('.pal-item').length;
  if (e.key === 'ArrowDown') { palSel = Math.min(n - 1, palSel + 1); drawPal(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { palSel = Math.max(0, palSel - 1); drawPal(); e.preventDefault(); }
  if (e.key === 'Enter') { const a = $('#palr').querySelectorAll('.pal-item')[palSel]; if (a) { location.hash = a.getAttribute('href'); closeModal(); } }
  if (e.key === 'Escape') closeModal();
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && S && !testState) { e.preventDefault(); openPalette(); }
  if (e.key === 'Escape' && $('#modal').innerHTML && !testState) closeModal();
});

/* ---------- Page transition + periodic jobs ---------- */
const _goF = go;
go = function () {
  _goF();
  const v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  if (S.route.startsWith('dashboard') && me().role !== 'Sales Executive') machineReminders();
};
