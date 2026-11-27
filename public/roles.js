/* Logins & dashboards: one main login (whole group, every approval), shared company logins locked to their company,
   and team logins. Each opens on a dashboard built from its own flow. Loaded after app.js, features.js, business.js. */

const isMain = () => me().role === 'Super Admin';
const myDivs = () => (me().divs || []).filter(d => S.divisions.some(x => x.id === d));
const coName = id => (S.divisions.find(d => d.id === id) || {}).name || id;

/* ---------- Roles added by this update (added once to an existing system by the main login) ---------- */
const NEW_ROLES = {
  'Company Login': ['dashboard', 'approvals', 'inquiries', 'products', 'orders', 'payments', 'workorders', 'inventory', 'procurement', 'lab', 'dispatch', 'machines', 'attendance'],
  'Purchase & Store': ['dashboard', 'approvals', 'inventory', 'procurement', 'attendance']
};
function migrateRoles() {
  if (!isMain() || !S.roles) return;
  let changed = false;
  Object.entries(NEW_ROLES).forEach(([r, pages]) => { if (!S.roles[r]) { S.roles[r] = pages; changed = true; } });
  Object.keys(S.roles).forEach(r => { const p = S.roles[r]; if (Array.isArray(p) && !p.includes('*') && !p.includes('approvals')) { p.splice(1, 0, 'approvals'); changed = true; } });
  if (changed) save();
}

/* ---------- Navigation: approvals page sits under Overview ---------- */
NAV[0][1].push(['approvals', 'stamp', 'Approvals']);
TITLES.approvals = 'Approvals';

/* ---------- Company lock in the header ---------- */
const _renderNav = renderNav;
renderNav = function () {
  const divs = myDivs();
  if (divs.length && !divs.includes(S.division) && !(divs.length > 1 && S.division === 'all')) S.division = divs.length === 1 ? divs[0] : 'all';
  _renderNav();
  const sel = $('#divSel');
  if (divs.length === 1) { sel.hidden = true; }
  else if (divs.length > 1) { sel.hidden = false; sel.innerHTML = `<option value="all">All my companies</option>` + divs.map(d => `<option value="${d}">${esc(coName(d))}</option>`).join(''); sel.value = S.division; }
  else sel.hidden = false;
  const n = approvalsFor().filter(a => a.mine).length;
  const link = document.querySelector('#nav a[href="#approvals"]');
  if (link && n) link.insertAdjacentHTML('beforeend', `<span class="cnt">${n}</span>`);
  const b = document.querySelector('.brand small');
  if (b) b.textContent = divs.length === 1 ? coName(divs[0]) : isMain() ? 'Main login · whole group' : me().role;
};

const _goRoles = go;
let rolesMigrated = false;
go = function () { if (!rolesMigrated && S.roles) { rolesMigrated = true; migrateRoles(); } _goRoles(); };

/* POs raised by store or company staff wait for the production head (or main login) to approve. */
function poStatus() { return ['Super Admin', 'Production Head'].includes(me().role) ? 'Ordered' : 'Awaiting approval'; }

/* ---------- Approvals: one list, filtered to who can act ---------- */
function approvalsFor() {
  if (!S.workorders) return [];
  const role = me().role, main = isMain(), out = [];
  const add = (a) => out.push({ ...a, mine: main || a.roles.includes(role) });
  S.workorders.filter(inDiv).forEach(w => {
    const o = S.orders.find(x => x.id === w.order);
    if (!w.approved && advOk(o)) add({ type: 'Work order', ic: 'factory', tone: 'blue', div: w.div, title: `${w.id} · ${w.client}`, sub: `Advance received. ${prod(w.productId).name || ''}, ${w.qty} ${w.unit}`, by: 'Sales / Accounts',
      who: w.div === 'PACK' ? 'Bhavin Sir (Flexipack)' : 'Nirav Sir', roles: w.div === 'PACK' ? ['Company Login'] : ['Production Head'], act: `approveWO('${w.id}')`, cta: 'Approve', href: '#workorders/' + w.id });
    if (w.delivery && !w.delivery.ok && !w.delivery.resolved) add({ type: 'Delivery rejected', ic: 'undo-2', tone: 'red', div: w.div, title: `${w.id} · ${w.client}`, sub: `${esc(w.delivery.reason || 'No reason given')} → ${esc(w.delivery.action || '')}`, by: 'Dispatch',
      who: w.div === 'PACK' ? 'Bhavin Sir (Flexipack)' : 'Nirav Sir', roles: w.div === 'PACK' ? ['Company Login'] : ['Production Head'], act: `resolveDelivery('${w.id}')`, cta: 'Confirm action', href: '#workorders/' + w.id });
  });
  (S.payments || []).filter(inDiv).filter(p => p.status === 'Paused till approval').forEach(p => add({ type: 'Payment paused', ic: 'pause-circle', tone: 'amber', div: p.div, title: `${p.order} · ${p.client}`, sub: `${p.label}: ${money(p.amount, p.currency)}`, by: 'Accounts',
    who: 'Main login', roles: [], act: `approvePay('${p.id}')`, cta: 'Release', href: '#payments' }));
  (S.pos || []).filter(inDiv).filter(p => p.status === 'Awaiting approval').forEach(p => { const v = (S.vendors || []).find(x => x.id === p.vendor) || {}; add({ type: 'Purchase order', ic: 'shopping-cart', tone: 'blue', div: p.div, title: `${p.id} · ${esc(v.name || p.vendor)}`, sub: `${rm(p.code).name || p.code} (${p.code}), ${p.qty} ${p.unit} @ ₹${p.rate}${p.by ? ' · raised by ' + esc(p.by) : ''}`, by: 'Purchase & Store',
    who: p.div === 'PACK' ? 'Bhavin Sir (Flexipack)' : 'Nirav Sir', roles: p.div === 'PACK' ? ['Company Login'] : ['Production Head'], act: `approvePO('${p.id}')`, cta: 'Approve PO', href: '#procurement' }); });
  (S.vendors || []).filter(v => !v.approved).forEach(v => add({ type: 'New vendor', ic: 'building-2', tone: 'violet', title: esc(v.name), sub: `${esc(v.city || '')} · ${Object.keys(v.rates || {}).length} materials quoted`, by: 'Purchase & Store',
    who: 'Main login', roles: [], act: `approveVendor('${v.id}')`, cta: 'Approve vendor', href: '#procurement' }));
  (S.inventory || []).filter(inDiv).forEach(i => (i.inward || []).filter(l => l.qa === 'Quarantine').forEach(l => add({ type: 'QA release', ic: 'shield-alert', tone: 'amber', div: i.div, title: `${esc(i.name)} · lot ${esc(l.lot)}`, sub: `${l.qty} ${i.unit} in quarantine since ${l.date}`, by: 'Store',
    who: 'Lab / R&D', roles: ['Lab / R&D'], act: `releaseLot('${i.code}','${l.lot}')`, cta: 'Release lot', href: '#inventory' })));
  (S.leaves || []).filter(l => l.status === 'Pending').forEach(l => add({ type: 'Leave', ic: 'calendar-off', tone: 'grey', title: `${esc(uname(l.user))} · ${l.from} to ${l.to}`, sub: esc(l.reason || ''), by: 'Staff',
    who: 'HR', roles: ['HR'], act: `approveLeave('${l.id}')`, cta: 'Approve', href: '#attendance' }));
  (S.results || []).filter(r => !r.audited).forEach((r, i) => add({ type: 'Test audit', ic: 'clipboard-check', tone: 'violet', title: `${esc(uname(r.user))} · ${esc(((S.tests || []).find(t => t.id === r.test) || {}).title || r.test)}`, sub: `Score ${r.score}%${r.flags ? ` · ${r.flags} proctoring flag${r.flags > 1 ? 's' : ''}` : ''}`, by: 'HR',
    who: 'Jagruti Mam', roles: ['Marketing Head'], act: `auditResult(${S.results.indexOf(r)})`, cta: 'Mark audited', href: '#training' }));
  return out;
}
function resolveDelivery(id) { const w = S.workorders.find(x => x.id === id); w.delivery.resolved = true; w.delivery.resolvedBy = me().name; logA(`${id}: delivery action "${w.delivery.action}" confirmed`); toast('Action confirmed'); save(); rerender(); }
function approvePay(id) { setPay(id, 'Pending'); logA(`Payment ${id} released from approval hold`); toast('Payment released. It is pending again.'); rerender(); }
function approvePO(id) { const p = S.pos.find(x => x.id === id); p.status = 'Ordered'; p.approvedBy = me().name; logA(`${id} approved`); toast(id + ' approved and ordered'); save(); rerender(); }
function approveVendor(id) { const v = S.vendors.find(x => x.id === id); v.approved = true; logA(`Vendor ${v.name} approved`); toast('Vendor approved'); save(); rerender(); }
function approveLeave(id) { const l = S.leaves.find(x => x.id === id); l.status = 'Approved'; notify(l.user, `Your leave ${l.from} to ${l.to} is approved`); toast('Leave approved'); save(); rerender(); }
function auditResult(i) { S.results[i].audited = me().name; toast('Marked as audited'); save(); rerender(); }

const apRow = a => `<div class="attn"><span class="ai ${a.tone}"><i data-lucide="${a.ic}"></i></span><div style="flex:1;min-width:0"><div class="row" style="gap:8px"><b>${a.title}</b><span class="pill grey">${a.type}</span>${a.div && !myDivs().length ? `<span class="pill">${a.div}</span>` : ''}</div><div class="muted small">${a.sub}</div><div class="muted small">Raised by ${a.by} · approver: ${a.who}</div></div>
  <a class="btn sm" href="${a.href}">Open</a>${a.mine ? `<button class="btn sm p" onclick="${a.act}">${a.cta}</button>` : ''}</div>`;
function approvalsCard(limit = 6) {
  const list = approvalsFor().filter(a => a.mine);
  return `<div class="card">${secH('stamp', 'Approvals for you', list.length ? `${list.length} waiting` : 'Nothing waiting', list.length > limit ? `<a class="lnk" href="#approvals">All approvals <i data-lucide="arrow-right"></i></a>` : '')}
    ${list.slice(0, limit).map(apRow).join('') || emptyBox('check-circle-2', 'No approvals waiting for you')}</div>`;
}
PAGES.approvals = () => {
  const all = approvalsFor(), mine = all.filter(a => a.mine), other = all.filter(a => !a.mine);
  const types = [...new Set(mine.map(a => a.type))];
  return `<div class="dash">
    <div class="grid g4">${[['stamp', 'Waiting for you', mine.length], ['factory', 'Work orders', mine.filter(a => a.type === 'Work order').length], ['shopping-cart', 'Purchase orders', mine.filter(a => a.type === 'Purchase order').length], ['shield-alert', 'Other', mine.filter(a => !['Work order', 'Purchase order'].includes(a.type)).length]]
      .map(([ic, l, n]) => `<div class="card kpi3"><div class="kh"><span class="ki"><i data-lucide="${ic}"></i></span><span class="l">${l}</span></div><span class="v">${n}</span></div>`).join('')}</div>
    <div class="card">${secH('stamp', isMain() ? 'Every approval in the group' : 'Waiting for you', isMain() ? 'The main login can act on any of these' : 'Only items you are the approver for')}
      ${types.length ? types.map(t => `<p class="muted small" style="margin:14px 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${t}</p>${mine.filter(a => a.type === t).map(apRow).join('')}`).join('') : emptyBox('check-circle-2', 'All clear. Nothing is waiting for your approval.')}</div>
    ${other.length ? `<div class="card">${secH('eye', 'Waiting for others', 'You can see these but someone else approves them')}${other.map(apRow).join('')}</div>` : ''}
  </div>`;
};

/* ---------- Building blocks ---------- */
const secH = (ic, title, sub, right = '') => `<div class="sh"><span class="si"><i data-lucide="${ic}"></i></span><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><div class="sp"></div>${right}</div>`;
const emptyBox = (ic, t) => `<div class="empty"><i data-lucide="${ic}"></i><span>${t}</span></div>`;
const tile = (href, ic, label, val, foot = '', fmt = '') => `<a class="card kpi3" href="${href}"><div class="kh"><span class="ki"><i data-lucide="${ic}"></i></span><span class="l">${label}</span><i data-lucide="arrow-up-right" class="go"></i></div><span class="v" ${typeof val === 'number' ? `data-count="${val}"${fmt ? ` data-fmt="${fmt}"` : ''}>0` : `>${val}`}</span><span class="kf">${foot}</span></a>`;
const listRow = (ic, tone, title, sub, href, cta) => attn(ic, tone, title, sub, href, cta);
const flowStrip = steps => `<div class="flowstrip">${steps.map(s => `<span>${s}</span>`).join('<i data-lucide="chevron-right"></i>')}</div>`;
function heroBand(eyebrow, title, line, stats, actions = '') {
  return `<section class="hero"><div class="hero-txt"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${line}</p>${actions ? `<div class="row hero-act">${actions}</div>` : ''}</div>
    <div class="hero-stats">${stats.map(([l, v, fmt]) => `<div><span>${l}</span><b ${typeof v === 'number' ? `data-count="${v}"${fmt ? ` data-fmt="${fmt}"` : ''}>0` : `>${v}`}</b></div>`).join('')}</div></section>`;
}
const hi = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const dateLine = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const searchBtn = '<button class="btn ghost" onclick="openPalette()"><i data-lucide="search"></i> Search <kbd>Ctrl K</kbd></button>';
function stageBoard(wos) {
  if (!wos.length) return emptyBox('factory', 'No batches in production');
  return `<div class="tw"><table class="tbl"><tr><th>Work order</th><th>Company</th><th>Product</th><th>Stage</th><th>Operator</th><th>Expected</th></tr>${wos.map(w => {
    const ops = Object.values(w.operators || {}); return `<tr class="click" onclick="location.hash='workorders/${w.id}'"><td><b>${w.id}</b><div class="muted small">${esc(w.client)}</div></td><td><span class="pill grey">${w.div}</span></td><td>${esc(prod(w.productId).name || '')}<div class="muted small">${w.qty} ${w.unit}</div></td>
    <td><span class="pill">${esc(stageName(w))}</span><div class="pb" style="margin-top:6px;width:90px"><i style="width:${(w.stage / Math.max(1, lastStage(w))) * 100}%"></i></div></td><td>${ops.length ? esc(ops[ops.length - 1]) : '<span class="muted">Not set</span>'}</td><td class="num">${w.expected || ''}</td></tr>`; }).join('')}</table></div>`;
}
/* Raw materials short for open (not yet produced) work orders, with what is already on order. */
function shortages() {
  const need = {};
  S.workorders.filter(inDiv).filter(w => w.stage < lastStage(w) && !(flowOf(w).findIndex(x => x.kind === 'stock') > -1 && flowOf(w).findIndex(x => x.kind === 'stock') < w.stage)).forEach(w => {
    const f = S.formulations.find(x => x.batch === w.formula); if (!f) return;
    const p = prod(w.productId), qKg = w.unit === 'kg' ? w.qty : convert(w.qty, w.unit, 'kg', p.density || 1);
    f.items.forEach(it => { const r = rm(it.code); const q = convert(qKg * it.pct / 100, 'kg', r.unit || 'kg', 1); need[it.code] = (need[it.code] || 0) + q; });
  });
  return Object.entries(need).map(([code, q]) => {
    const r = rm(code), ordered = S.pos.filter(p => p.code === code && ['Ordered', 'Awaiting approval'].includes(p.status)).reduce((a, p) => a + p.qty, 0);
    return { code, r, need: Math.ceil(q), have: r.qty || 0, ordered, short: Math.max(0, Math.ceil(q - (r.qty || 0) - ordered)) };
  }).filter(x => x.need > x.have);
}
function shortTable() {
  const s = shortages();
  if (!s.length) return emptyBox('package-check', 'Stock covers every open work order');
  return `<div class="tw"><table class="tbl"><tr><th>Material</th><th>Needed</th><th>In stock</th><th>On order</th><th>To buy</th><th></th></tr>${s.map(x => `<tr><td><b>${x.code}</b></td><td class="num">${x.need} ${x.r.unit}</td><td class="num">${x.have} ${x.r.unit}</td><td class="num">${x.ordered ? x.ordered + ' ' + x.r.unit : '–'}</td>
    <td class="num">${x.short ? `<b style="color:var(--red)">${x.short} ${x.r.unit}</b>` : '<span class="pill green">Covered</span>'}</td><td>${x.short ? `<button class="btn sm" onclick="quickPO('${x.code}',${x.short})">Raise PO</button>` : ''}</td></tr>`).join('')}</table></div>`;
}
function dispatchGate(wos) {
  const list = wos.filter(w => (flowOf(w)[w.stage] || {}).kind === 'ship' || (w.stage === lastStage(w) && !w.invoiced));
  if (!list.length) return emptyBox('truck', 'Nothing at the dispatch stage');
  const ck = (ok, t) => `<span class="pill ${ok ? 'green' : 'amber'}">${t}</span>`;
  return list.map(w => `<div class="attn"><span class="ai ${w.invoiced ? 'blue' : 'amber'}"><i data-lucide="truck"></i></span><div style="flex:1;min-width:0"><b>${w.id} · ${esc(w.client)}</b>
    <div class="row" style="gap:6px;margin-top:4px">${ck((w.photos || []).length, 'Photos')}${ck(w.cha, 'CHA')}${w.haz ? ck(w.hazDone, 'HAZ label') : ''}${ck(w.invoiced, 'Invoice')}</div></div><a class="btn sm" href="#workorders/${w.id}">Open</a></div>`).join('');
}
function pipeline(wos, orders, inq) {
  const floor = wos.filter(w => w.approved && w.stage < lastStage(w));
  const steps = [['Inquiries', inq.filter(q => q.status !== 'Approved').length, '#inquiries'], ['Quoted', inq.filter(q => q.status === 'Quoted').length, '#inquiries'],
    ['Awaiting advance', orders.filter(o => o.status === 'Awaiting payment').length, '#payments'], ['In production', floor.length, '#workorders'],
    ['Ready to ship', wos.filter(w => (flowOf(w)[w.stage] || {}).kind === 'ship').length, '#workorders'], ['Dispatched', wos.filter(w => w.stage === lastStage(w)).length, '#dispatch']];
  const max = Math.max(1, ...steps.map(s => s[1]));
  return `<div class="pipe">${steps.map(([l, n, h], i) => `<a href="${h}" class="pipe-step" style="--d:${i * 60}ms"><span class="pn">${String(i + 1).padStart(2, '0')}</span><span class="pl">${l}</span><b>${n}</b><span class="pb"><i style="width:${n / max * 100}%"></i></span></a>`).join('')}</div>`;
}

/* ---------- Dashboards ---------- */
const groupDashboard = PAGES.dashboard;

function mainDash() {
  const month = today().slice(0, 7);
  const rows = S.divisions.map(d => {
    const o = S.orders.filter(x => x.div === d.id), w = S.workorders.filter(x => x.div === d.id);
    return { d, val: o.filter(x => (x.date || '').startsWith(month)).reduce((a, x) => a + toINR(orderTotal(x), x.currency), 0),
      prodn: w.filter(x => x.approved && x.stage < lastStage(x)).length, ship: w.filter(x => (flowOf(x)[x.stage] || {}).kind === 'ship').length,
      due: S.payments.filter(p => p.div === d.id && p.status === 'Pending').reduce((a, p) => a + toINR(p.amount, p.currency), 0),
      low: S.inventory.filter(i => i.div === d.id && i.qty < i.min).length };
  });
  const comp = `<div class="card">${secH('building-2', 'Companies at a glance', 'This month, side by side')}<div class="tw"><table class="tbl"><tr><th>Company</th><th>Orders this month</th><th>In production</th><th>Ready to ship</th><th>To collect</th><th>Low stock</th></tr>
    ${rows.map(r => `<tr class="click" onclick="S.division='${r.d.id}';location.hash='dashboard';rerender()"><td><b>${esc(r.d.name)}</b><div class="muted small">${r.d.id}</div></td><td class="num">${inrShort(r.val)}</td><td class="num">${r.prodn}</td><td class="num">${r.ship}</td><td class="num">${inrShort(r.due)}</td><td>${r.low ? `<span class="pill red">${r.low}</span>` : '<span class="pill green">OK</span>'}</td></tr>`).join('')}</table></div></div>`;
  const html = groupDashboard();
  // Insert approvals and the company table straight after the headline cards.
  const at = html.indexOf('<div class="card">');
  return html.slice(0, at) + approvalsCard(5) + comp + html.slice(at);
}

function companyDash() {
  const d = S.division, pack = d === 'PACK';
  const orders = S.orders.filter(inDiv), wos = S.workorders.filter(inDiv), inq = S.inquiries.filter(inDiv);
  const open = wos.filter(w => w.stage < lastStage(w)), approve = wos.filter(w => !w.approved && advOk(S.orders.find(o => o.id === w.order)));
  const qcPend = open.filter(w => /qc/i.test(stageName(w))), low = lowStock(), rej = wos.filter(w => w.delivery && !w.delivery.ok);
  setTimeout(() => countUp($('#view')), 0);
  const flow = pack ? ['PO (WhatsApp, mail, manual)', 'Work order', 'Inventory check', 'Layers', 'QC', 'Delivery']
    : d === 'SPC' ? ['Order', 'Work order', 'Inventory check', 'Formulation', 'Layers', 'QC', 'Delivery']
    : ['Inquiry', 'Do we make it?', 'Quote', 'PO', 'Advance', 'Work order', 'Materials', 'Stages', 'QC', 'Dispatch', 'Invoice'];
  return `<div class="dash">
  ${heroBand(coName(d), `${hi()}, ${pack ? 'Bhavin Sir' : esc(coName(d).replace('Imperial ', '')) + ' team'}`, `${approve.length + rej.filter(w => !w.delivery.resolved).length ? `${approve.length + rej.filter(w => !w.delivery.resolved).length} item(s) need action today.` : 'Everything is on track.'}`,
    [['Open work orders', open.length], ['QC pending', qcPend.length], ['Low stock', low.length]], searchBtn + (can('orders') ? `<button class="btn light" onclick="location.hash='orders';setTimeout(orderForm,50)"><i data-lucide="plus"></i> ${pack ? 'Enter PO' : 'New sales order'}</button>` : ''))}
  ${flowStrip(flow)}
  <div class="grid g4 kpis">
    ${pack ? tile('#orders', 'inbox', 'New POs', orders.filter(o => !wos.some(w => w.order === o.id)).length, 'Not yet a work order') : tile('#inquiries', 'mail', 'Open inquiries', inq.filter(q => q.status !== 'Approved').length, `${inq.filter(q => q.status === 'Quoted').length} quoted`)}
    ${tile('#payments', 'hourglass', 'Awaiting advance', orders.filter(o => o.status === 'Awaiting payment').length, 'Work order locked until paid')}
    ${tile('#workorders', 'factory', 'In production', wos.filter(w => w.approved && w.stage < lastStage(w)).length, `${approve.length} ready to approve`)}
    ${pack ? tile('#workorders', 'undo-2', 'Rejected deliveries', rej.length, `${rej.filter(w => !w.delivery.resolved).length} need action`) : tile('#dispatch', 'truck', 'Ready to dispatch', wos.filter(w => (flowOf(w)[w.stage] || {}).kind === 'ship').length, `${wos.filter(w => w.stage === lastStage(w) && !w.invoiced).length} invoice pending`)}
  </div>
  <div class="card">${secH('git-branch', pack ? 'Order flow' : 'Order pipeline', 'This company only')}${pipeline(wos, orders, inq)}</div>
  <div class="card">${secH('layers', pack ? 'Layer stages' : 'Production stages', 'Every open batch, its stage and who is on it', '<a class="lnk" href="#workorders">All work orders <i data-lucide="arrow-right"></i></a>')}${stageBoard(open)}</div>
  <div class="grid g2">
    ${approvalsCard(4)}
    <div class="card">${secH('package-search', 'Materials for open work orders', 'Needed, in stock, on order, to buy')}${shortTable()}</div>
    <div class="card">${secH('truck', pack ? 'Deliveries' : 'Dispatch gate', pack ? 'Success or rejected, with the next action' : 'Invoice unlocks after photos, CHA and HAZ label')}${pack ? (wos.filter(w => w.delivery).map(w => listRow(w.delivery.ok ? 'check-circle-2' : 'undo-2', w.delivery.ok ? 'blue' : 'red', `${w.id} · ${esc(w.client)}`, w.delivery.ok ? 'Delivered' : `Rejected: ${esc(w.delivery.reason || '')} → ${esc(w.delivery.action || '')}`, '#workorders/' + w.id, 'Open')).join('') || emptyBox('truck', 'No deliveries yet')) : dispatchGate(wos)}</div>
    <div class="card">${secH('settings', 'Machines', 'Service due in the next two weeks')}${machineRows()}</div>
  </div></div>`;
}
function machineRows() {
  const m = S.machines.filter(inDiv).map(x => ({ x, due: addDays(x.last, x.every) })).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  return m.map(({ x, due }) => listRow('settings', due <= today() ? 'red' : due <= addDays(today(), 14) ? 'amber' : 'grey', esc(x.name), `Due ${due} · expected ${inr(x.avgCost)}${(x.log || []).length ? ' · last ' + inr(x.log[x.log.length - 1].cost) : ''}`, '#machines', 'View')).join('') || emptyBox('settings', 'No machines added');
}

function productionDash() {
  const wos = S.workorders.filter(inDiv), open = wos.filter(w => w.stage < lastStage(w));
  const approve = approvalsFor().filter(a => a.mine), s = shortages();
  const dueM = S.machines.filter(inDiv).filter(m => addDays(m.last, m.every) <= addDays(today(), 14));
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand(myDivs().length ? myDivs().map(coName).join(' · ') : 'Production', `${hi()}, ${esc(me().name.split(' ')[0])} Sir`, approve.length ? `${approve.length} approval(s) waiting for you.` : 'No approvals waiting.',
    [['Batches running', wos.filter(w => w.approved && w.stage < lastStage(w)).length], ['Materials to buy', s.filter(x => x.short).length], ['Machines due', dueM.length]], searchBtn)}
  ${flowStrip(['Work order approval', 'Materials', 'Formulation (codes)', 'Stages', 'Operator', 'QC', 'Dispatch'])}
  <div class="grid g4 kpis">
    ${tile('#approvals', 'stamp', 'To approve', approve.length, 'Work orders, POs, rejections')}
    ${tile('#workorders', 'factory', 'On the floor', wos.filter(w => w.approved && w.stage < lastStage(w)).length, `${wos.filter(w => (flowOf(w)[w.stage] || {}).kind === 'ship').length} ready to ship`)}
    ${tile('#inventory', 'package', 'Low stock', lowStock().length, `${s.filter(x => x.short).length} needed for orders`)}
    ${tile('#lab', 'microscope', 'Samples in lab', (S.samples || []).filter(inDiv).length, 'Sampling timeline')}
  </div>
  <div class="grid g2">${approvalsCard(5)}<div class="card">${secH('package-search', 'Materials to buy', 'For open work orders, after stock and open POs')}${shortTable()}</div></div>
  <div class="card">${secH('layers', 'Stage board', 'All batches across your companies, with operator', '<a class="lnk" href="#workorders">All work orders <i data-lucide="arrow-right"></i></a>')}${stageBoard(open)}</div>
  <div class="grid g2"><div class="card">${secH('truck', 'Dispatch gate', 'Photos, CHA and HAZ before invoice')}${dispatchGate(wos)}</div><div class="card">${secH('settings', 'Machines', 'Service due, expected and last cost')}${machineRows()}</div></div></div>`;
}

function marketingDash() {
  const head = me().role === 'Marketing Head', leads = S.leads.filter(inDiv), inq = S.inquiries.filter(inDiv);
  const t = today(), newToday = leads.filter(l => (l.date || '') === t || l.status === 'New');
  const src = Object.entries(leads.reduce((a, l) => (a[l.source] = (a[l.source] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]);
  const ctry = Object.entries(leads.reduce((a, l) => (a[l.country || 'Unknown'] = (a[l.country || 'Unknown'] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const act = Object.values(S.activity || {}), calls = act.reduce((a, x) => a + x.calls, 0), tCalls = act.reduce((a, x) => a + x.tCalls, 0);
  const mine = (S.tasks || []).filter(x => x.date === t && (head || x.user === S.user));
  const clicks = leads.filter(l => /call-me|button/i.test(l.source || '')).length;
  const maxS = Math.max(1, ...src.map(s => s[1]));
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand(head ? 'Marketing · whole group' : 'Sales', `${hi()}, ${esc(me().name.split(' ')[0])}${head ? ' Mam' : ''}`, `${newToday.length} new lead(s) to work on today.`,
    [['Quotes sent', inq.filter(q => q.status === 'Quoted').length], ['Intro mails', inq.filter(q => q.status === 'Intro sent').length], ['Calls vs target', `${calls} / ${tCalls}`]], searchBtn + (can('leads') ? '<button class="btn light" onclick="location.hash=\'leads\';setTimeout(leadForm,50)"><i data-lucide="plus"></i> New lead</button>' : ''))}
  ${flowStrip(['Lead', 'Inquiry', 'Do we make it?', 'Quote + T&C + TDS / Intro mail', 'Call or WhatsApp click', 'Follow-up', 'PO'])}
  <div class="grid g4 kpis">
    ${tile('#leads', 'radar', 'New leads', newToday.length, src.slice(0, 2).map(([k, v]) => k + ' ' + v).join(' · ') || 'No leads yet')}
    ${tile('#inquiries', 'mail', 'Inquiries open', inq.filter(q => !['Approved', 'Lost'].includes(q.status)).length, `${inq.filter(q => q.status === 'Draft').length} not replied`)}
    ${tile('#leads', 'mouse-pointer-click', 'Call-button clicks', clicks, 'Leads from mail buttons')}
    ${tile('#team', 'phone', 'Team calls today', calls, `Target ${tCalls}`)}
  </div>
  <div class="grid g2">
    <div class="card">${secH('filter', 'Inquiry filter', 'Do we make the product?')}
      <div class="grid g2" style="gap:12px">${[['check-circle-2', 'We make it', 'Quote, MOQ, T&C, TDS sent', inq.filter(q => q.status === 'Quoted' || q.match).length], ['send', 'We don\'t', 'Intro mail with call option', inq.filter(q => q.status === 'Intro sent').length]]
        .map(([ic, a, b, n]) => `<div class="pipe-step"><span class="pl"><i data-lucide="${ic}"></i> ${a}</span><b>${n}</b><span class="muted small">${b}</span></div>`).join('')}</div></div>
    <div class="card">${secH('bar-chart-3', 'Leads by source', 'Where leads come from')}${src.map(([k, v]) => `<div class="team-row"><div style="flex:1"><div class="row"><b style="flex:1">${esc(k)}</b><span class="muted small">${v}</span></div><div class="bar"><i style="width:${v / maxS * 100}%"></i></div></div></div>`).join('') || emptyBox('radar', 'No leads yet')}</div>
    <div class="card">${secH('globe', 'Leads by country', 'With what each country requires', '<a class="lnk" href="#market">Market intel <i data-lucide="arrow-right"></i></a>')}${ctry.map(([c, n]) => { const r = (S.countries || []).find(x => x.name === c); return listRow('map-pin', 'blue', `${esc(c)} · ${n} lead${n > 1 ? 's' : ''}`, r ? esc(r.req) : 'No requirements noted yet', '#market', 'View'); }).join('') || emptyBox('globe', 'No leads yet')}</div>
    <div class="card">${secH('calendar-check', head ? 'Team planner today' : 'My day', head ? 'Tasks assigned this morning' : 'Tasks for today')}${mine.slice(0, 6).map(x => listRow(x.done ? 'check-circle-2' : 'circle', x.done ? 'blue' : 'grey', esc(x.title), `${esc(uname(x.user))}${x.tag ? ' · tagged ' + esc(uname(x.tag)) : ''}`, '#team', 'Open')).join('') || emptyBox('calendar-check', 'No tasks planned today')}</div>
    ${head ? approvalsCard(4) : ''}
    <div class="card">${secH('users', 'Team today', 'Calls and messages against target')}${teamBars()}</div>
  </div></div>`;
}

function labDash() {
  const smp = (S.samples || []).filter(inDiv), fs = S.formulations.filter(inDiv);
  const q = S.inventory.filter(inDiv).flatMap(i => (i.inward || []).filter(l => l.qa === 'Quarantine'));
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand('Lab · R&D · QA / QC', `${hi()}, ${esc(me().name.split(' ')[0])}`, `${smp.length} sample(s) in progress, ${q.length} lot(s) waiting for QA.`, [['Samples', smp.length], ['QA inward pending', q.length], ['Formulations', fs.length]], searchBtn)}
  ${flowStrip(['Client sample', 'Tests', 'Formulation (codes)', 'Batch number', 'QA inward', 'QC supply'])}
  <div class="grid g2">${approvalsCard(5)}
    <div class="card">${secH('test-tubes', 'Sampling timeline', 'Each sample and its batch numbers', '<a class="lnk" href="#lab">Lab <i data-lucide="arrow-right"></i></a>')}${smp.map(s => listRow('test-tube', 'blue', `${s.id} · ${esc(s.client)}`, `${esc(s.type)} · received ${s.received}${(s.batches || []).length ? ' · ' + s.batches.join(', ') : ''}`, '#lab', 'Open')).join('') || emptyBox('test-tubes', 'No samples in progress')}</div>
    <div class="card">${secH('flask-conical', 'Latest formulations', 'Raw material codes only')}${fs.slice(0, 5).map(f => listRow('flask-conical', f.approved ? 'blue' : 'grey', `${f.batch} · ${esc(f.version || '')}`, f.items.map(i => `${i.code} ${i.pct}%`).join(' · '), '#lab', 'Trace')).join('') || emptyBox('flask-conical', 'No formulations yet')}</div>
    <div class="card">${secH('git-fork', 'Traceability', 'Any batch or raw material code to lots and customers')}<div class="row"><input id="trq" placeholder="e.g. F-DM-210-07 or RM-101" style="flex:1"><button class="btn p" onclick="location.hash='lab';setTimeout(()=>{const i=document.querySelector('#view input[placeholder*=batch], #view input[placeholder*=Batch]');if(i){i.value=val('trq')||'';i.dispatchEvent(new Event('input'))}},120)">Trace</button></div></div>
  </div></div>`;
}

function accountsDash() {
  const ps = S.payments.filter(inDiv), t = today();
  const due7 = ps.filter(p => p.status === 'Pending' && p.due >= t && p.due <= addDays(t, 7)), od = ps.filter(p => p.status === 'Pending' && p.due < t);
  const sum = l => l.reduce((a, p) => a + toINR(p.amount, p.currency), 0);
  const wos = S.workorders.filter(inDiv), ready = wos.filter(w => w.stage === lastStage(w) && !w.invoiced);
  const usd = S.orders.filter(inDiv).filter(o => o.currency === 'USD');
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand('Accounts · whole group', `${hi()}, ${esc(me().name.split(' ')[0])}`, od.length ? `${od.length} payment(s) overdue.` : 'No overdue payments.', [['Due this week', sum(due7), 'inr'], ['Overdue', sum(od), 'inr'], ['Invoices to make', ready.length]], searchBtn + '<button class="btn light" onclick="remindAll()"><i data-lucide="bell"></i> Remind overdue</button>')}
  ${flowStrip(['Payment terms', 'Payment entries', 'Reminders', 'Invoice gate', 'Invoice'])}
  <div class="grid g4 kpis">${tile('#payments', 'calendar-clock', 'Due this week', due7.length, inrShort(sum(due7)))}${tile('#payments', 'alarm-clock', 'Overdue', od.length, inrShort(sum(od)))}${tile('#payments', 'pause-circle', 'Paused till approval', ps.filter(p => p.status === 'Paused till approval').length, 'Waiting for main login')}${tile('#invoices', 'receipt', 'Invoices to make', ready.length, 'After photos, CHA, HAZ')}</div>
  <div class="grid g2">
    <div class="card">${secH('wallet', 'Payment schedule', 'Next payments due')}${ps.filter(p => p.status === 'Pending').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6).map(p => listRow('wallet', p.due < t ? 'red' : 'amber', `${esc(p.client)} · ${money(p.amount, p.currency)}`, `${p.order} · ${p.label} · due ${p.due}`, '#payments', 'Remind')).join('') || emptyBox('wallet', 'Nothing pending')}</div>
    <div class="card">${secH('receipt', 'Invoice gate', 'Dispatched orders and what is missing')}${dispatchGate(wos)}</div>
    <div class="card">${secH('globe', 'Export orders', 'USD and letters of credit')}${usd.map(o => listRow('globe', 'blue', `${o.id} · ${esc(o.client)}`, `${money(orderTotal(o), 'USD')}${o.lc ? ' · LC ' + esc(o.lc) : ''} · ${esc(o.country || '')}`, '#orders', 'Open')).join('') || emptyBox('globe', 'No export orders')}</div>
    <div class="card">${secH('line-chart', 'Collections', 'Payments received, last 6 months')}${(() => { const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); }); return areaChart(months.map(m => sum(ps.filter(p => p.status === 'Received' && (p.due || '').startsWith(m)))), months.map(m => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'short' }))); })()}</div>
  </div></div>`;
}

function storeDash() {
  const low = lowStock(), open = S.pos.filter(inDiv).filter(p => ['Ordered', 'Awaiting approval'].includes(p.status));
  const q = S.inventory.filter(inDiv).flatMap(i => (i.inward || []).filter(l => l.qa === 'Quarantine').map(l => ({ i, l })));
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand('Purchase & Store', `${hi()}, ${esc(me().name.split(' ')[0])}`, low.length ? `${low.length} item(s) below minimum stock.` : 'All stock above minimum.', [['Low stock', low.length], ['Open POs', open.length], ['In QA quarantine', q.length]], searchBtn)}
  ${flowStrip(['Low stock', 'PO popup', 'Vendor choice', 'PO approval', 'Inward + QR', 'QA release'])}
  <div class="grid g2">
    <div class="card">${secH('package', 'Low stock', 'Stays here until stock is full again')}${low.map(i => { const b = bestVendor(i.code); return `<div class="attn"><span class="ai red"><i data-lucide="package"></i></span><div style="flex:1;min-width:0"><b>${esc(i.name)} <span class="muted small">${i.code}</span></b><div class="muted small">${i.qty} ${i.unit} left · min ${i.min} · best vendor ${b ? esc(b.v.name) + ' ₹' + b.rate : 'none'}</div></div><button class="btn sm" onclick="quickPO('${i.code}',${Math.max(0, i.max - i.qty)})">Raise PO</button></div>`; }).join('') || emptyBox('package-check', 'Nothing below minimum')}</div>
    <div class="card">${secH('shopping-cart', 'Open purchase orders', 'Waiting for approval or delivery')}${open.map(p => listRow('shopping-cart', p.status === 'Ordered' ? 'blue' : 'amber', `${p.id} · ${esc(((S.vendors || []).find(v => v.id === p.vendor) || {}).name || '')}`, `${p.code} · ${p.qty} ${p.unit} · ${p.status}`, '#procurement', 'Open')).join('') || emptyBox('shopping-cart', 'No open POs')}</div>
    <div class="card">${secH('shield-alert', 'QA quarantine', 'Lots waiting for lab release')}${q.map(({ i, l }) => listRow('shield-alert', 'amber', `${esc(i.name)} · lot ${esc(l.lot)}`, `${l.qty} ${i.unit} since ${l.date}`, '#inventory', 'View')).join('') || emptyBox('shield-check', 'No lots in quarantine')}</div>
    <div class="card">${secH('trophy', 'Vendor scorecard', 'Price vs market and approval', '<a class="lnk" href="#procurement">All vendors <i data-lucide="arrow-right"></i></a>')}${(S.vendors || []).slice(0, 5).map(v => listRow('building-2', v.approved ? 'blue' : 'amber', esc(v.name), `${esc(v.city || '')} · ${v.approved ? 'Approved' : 'Waiting for approval'} · ${Object.keys(v.rates || {}).length} materials`, '#procurement', 'View')).join('')}</div>
  </div></div>`;
}

function hrDash() {
  const t = today(), present = new Set((S.attendance || []).filter(a => a.date === t).map(a => a.user)), staff = S.users.filter(u => u.active !== false && !u.divs?.length && u.role !== 'Super Admin');
  const lv = (S.leaves || []).filter(l => l.status === 'Pending'), interns = staff.filter(u => u.intern), tests = (S.tests || []).filter(x => x.due >= t);
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand('HR · whole group', `${hi()}, ${esc(me().name.split(' ')[0])}`, lv.length ? `${lv.length} leave request(s) to review.` : 'No leave requests waiting.', [['Present today', `${present.size} / ${staff.length}`], ['Tests coming up', tests.length], ['Interns', interns.length]], searchBtn)}
  ${flowStrip(['Attendance', 'Leave', 'Overtime', 'Holidays', 'Training', 'Tests', 'Interns'])}
  <div class="grid g2">${approvalsCard(5)}
    <div class="card">${secH('map-pin', 'Attendance today', 'Location and selfie check-in')}${staff.slice(0, 8).map(u => { const a = (S.attendance || []).find(x => x.user === u.id && x.date === t); return listRow(a ? 'check-circle-2' : 'circle', a ? 'blue' : 'grey', esc(u.name), a ? `In ${a.in}${a.out ? ' · out ' + a.out : ''} · ${esc(a.geo || '')}` : 'Not checked in', '#attendance', 'View'); }).join('')}</div>
    <div class="card">${secH('graduation-cap', 'Tests coming up', 'Weekly tests for trainees and interns')}${tests.map(x => listRow('clipboard-list', 'blue', esc(x.title), `Due ${x.due} · ${x.mins} min · ${x.qs.length} questions`, '#training', 'Open')).join('') || emptyBox('graduation-cap', 'No tests scheduled')}</div>
    <div class="card">${secH('sprout', 'Interns and trainees', 'Month 1 tests, month 3 targets')}${interns.map(u => { const m = u.joined ? Math.floor((new Date(t) - new Date(u.joined)) / (30 * 864e5)) + 1 : 1; const r = (S.results || []).filter(x => x.user === u.id); return listRow('user', 'blue', esc(u.name), `Month ${m} · ${r.length} test(s) taken${r.length ? ' · last ' + r[r.length - 1].score + '%' : ''}`, '#training', 'Open'); }).join('') || emptyBox('sprout', 'No interns')}</div>
  </div></div>`;
}

function staffDash() {
  const t = today(), mine = (S.tasks || []).filter(x => x.user === S.user && x.date === t), a = (S.activity || {})[S.user] || { calls: 0, msgs: 0, tCalls: 0, tMsgs: 0 };
  const tests = (S.tests || []).filter(x => x.due >= t && !(S.results || []).some(r => r.user === S.user && r.test === x.id));
  setTimeout(() => countUp($('#view')), 0);
  return `<div class="dash">
  ${heroBand(me().role, `${hi()}, ${esc(me().name.split(' ')[0])}`, `${mine.filter(x => !x.done).length} task(s) left today.`, [['Calls', `${a.calls} / ${a.tCalls}`], ['Messages', `${a.msgs} / ${a.tMsgs}`], ['Tests due', tests.length]], searchBtn)}
  <div class="grid g2">
    <div class="card">${secH('calendar-check', 'My day planner', 'Tick off as you go', '<a class="lnk" href="#team">Planner <i data-lucide="arrow-right"></i></a>')}${mine.map(x => listRow(x.done ? 'check-circle-2' : 'circle', x.done ? 'blue' : 'grey', esc(x.title), x.tag ? 'Tagged ' + esc(uname(x.tag)) : 'Today', '#team', 'Open')).join('') || emptyBox('calendar-check', 'Nothing planned yet')}</div>
    <div class="card">${secH('graduation-cap', 'My training', 'Tests and modules')}${tests.map(x => listRow('clipboard-list', 'blue', esc(x.title), `Due ${x.due} · ${x.mins} min`, '#training', 'Start')).join('') || emptyBox('graduation-cap', 'No tests due')}</div>
  </div></div>`;
}

PAGES.dashboard = () => {
  const r = me().role;
  if (isMain()) return mainDash();
  if (r === 'Company Login') return companyDash();
  if (r === 'Production Head') return productionDash();
  if (r === 'Marketing Head' || r === 'Sales Executive') return marketingDash();
  if (r === 'Lab / R&D') return labDash();
  if (r === 'Accounts') return accountsDash();
  if (r === 'Purchase & Store') return storeDash();
  if (r === 'HR') return hrDash();
  return staffDash();
};

/* ---------- Users: company access ---------- */
const _userForm = userForm;
userForm = function (id) {
  _userForm(id);
  const u = id ? S.users.find(x => x.id === id) : { divs: [] };
  const box = document.querySelector('#modal .form');
  if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="full"><span class="small muted" style="font-weight:650">Company access</span>
    <div class="row" style="margin-top:6px">${S.divisions.map(d => `<label class="chk"><input type="checkbox" class="udiv" value="${d.id}" ${(u.divs || []).includes(d.id) ? 'checked' : ''}> ${esc(d.name)}</label>`).join('')}</div>
    <p class="muted small" style="margin:6px 0 0">Leave all unticked for a group-wide login. Tick one company for a company (branch) login.</p></div>`);
};
const _saveUser = saveUser;
saveUser = async function (id) {
  const divs = [...document.querySelectorAll('#modal .udiv:checked')].map(x => x.value);
  const orig = api;
  api = (url, body, method) => orig(url, url.startsWith('/api/users') && body ? { ...body, divs } : body, method);
  try { await _saveUser(id); } finally { api = orig; }
};
