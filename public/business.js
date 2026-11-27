/* Imperial ERP: company & GST details, WhatsApp/email per company and team, payment defaults and advances,
   GST invoices, view/edit permissions, geofenced attendance and staff targets. Loaded after features.js. */

/* ---------- Company details, WhatsApp/email channels, payment defaults ---------- */
const ST = () => (S.settings && !Array.isArray(S.settings) ? S.settings : (S.settings = {}));
const coCfg = div => Object.assign({ legal: divName(div), gstin: '', pan: '', addr: 'Baska, Halol, Panchmahal, Gujarat 389350', state: 'Gujarat', stateCode: '24', phone: '', email: '', bank: '', acc: '', ifsc: '', prefix: div, lut: '' }, (ST().companies || {})[div] || {});
function setCo(div, k, v) { const s = ST(); s.companies = { ...(s.companies || {}), [div]: { ...coCfg(div), [k]: String(v).trim() } }; save(); }
const CH_ROLES = ['Sales', 'Accounts', 'Production', 'Dispatch', 'Purchase', 'HR'];
const chCfg = (div, role) => (((ST().channels || {})[div] || {})[role]) || {};
function setCh(div, role, k, v) { const s = ST(); s.channels = s.channels || {}; s.channels[div] = s.channels[div] || {}; s.channels[div][role] = { ...chCfg(div, role), [k]: v.trim() }; save(); }
const waFor = (div, role = 'Sales') => chCfg(div, role).wa || chCfg(div, 'Sales').wa || coCfg(div).phone || '';
const mailOf = (div, role = 'Sales') => chCfg(div, role).email || chCfg(div, 'Sales').email || coCfg(div).email || '';
const waLink = n => { const d = String(n).replace(/\D/g, ''); return d ? `${n} (https://wa.me/${d.length === 10 ? '91' + d : d})` : 'our sales team'; };
const payDef = exp => Object.assign(exp ? { split: '30/70', days: '0,45', adv: 30 } : { split: '50/50', days: '0,30', adv: 50 }, (ST().payDefaults || {})[exp ? 'export' : 'local'] || {});
function setPayDef(kind, k, v) { const s = ST(); s.payDefaults = { ...(s.payDefaults || {}), [kind]: { ...payDef(kind === 'export'), [k]: k === 'adv' ? +v : v.trim() } }; save(); }
const GST_STATES = '01 Jammu and Kashmir|02 Himachal Pradesh|03 Punjab|04 Chandigarh|05 Uttarakhand|06 Haryana|07 Delhi|08 Rajasthan|09 Uttar Pradesh|10 Bihar|11 Sikkim|12 Arunachal Pradesh|13 Nagaland|14 Manipur|15 Mizoram|16 Tripura|17 Meghalaya|18 Assam|19 West Bengal|20 Jharkhand|21 Odisha|22 Chhattisgarh|23 Madhya Pradesh|24 Gujarat|26 Dadra and Nagar Haveli and Daman and Diu|27 Maharashtra|29 Karnataka|30 Goa|31 Lakshadweep|32 Kerala|33 Tamil Nadu|34 Puducherry|35 Andaman and Nicobar Islands|36 Telangana|37 Andhra Pradesh|38 Ladakh|96 Outside India (export)'.split('|');
const stateOpts = sel => GST_STATES.map(s => `<option value="${s}" ${s === sel ? 'selected' : ''}>${s}</option>`).join('');
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function companyTab() {
  const f = (d, k, label, cls = '') => `<label class="${cls}">${label}<input value="${esc(coCfg(d)[k])}" onchange="setCo('${d}','${k}',this.value)"></label>`;
  return `<p class="muted small">Printed on invoices, quotations and certificates. Each company has its own GST registration and invoice series.</p>
  <div class="grid g2">${S.divisions.map(d => `<div class="card flat"><h3>${esc(d.name)}</h3><div class="form">
    ${f(d.id, 'legal', 'Legal name', 'full')}${f(d.id, 'gstin', 'GSTIN')}${f(d.id, 'pan', 'PAN')}${f(d.id, 'addr', 'Registered address', 'full')}
    <label>State<select onchange="setCo('${d.id}','state',this.value.slice(3));setCo('${d.id}','stateCode',this.value.slice(0,2))">${stateOpts(coCfg(d.id).stateCode + ' ' + coCfg(d.id).state)}</select></label>${f(d.id, 'prefix', 'Invoice prefix')}
    ${f(d.id, 'phone', 'Phone')}${f(d.id, 'email', 'Email')}${f(d.id, 'bank', 'Bank name')}${f(d.id, 'acc', 'Account number')}${f(d.id, 'ifsc', 'IFSC')}${f(d.id, 'lut', 'LUT / bond no. (export)')}
  </div></div>`).join('')}</div>`;
}
function channelTab() {
  return `<p class="muted small">One WhatsApp number and email for each company and team. Customer messages use the number of the team that sends them; if a team has none, the Sales number is used. Sending and receiving starts once WhatsApp Business API and Google Workspace are connected.</p>
  ${S.divisions.map(d => `<div class="card flat" style="margin-bottom:14px"><h3>${esc(d.name)}</h3><div class="tw"><table class="tbl"><tr><th>Team</th><th>WhatsApp number</th><th>Email</th></tr>
    ${CH_ROLES.map(r => `<tr><td><b>${r}</b></td><td><input placeholder="+91 98xxx xxxxx" value="${esc(chCfg(d.id, r).wa || '')}" onchange="setCh('${d.id}','${r}','wa',this.value)"></td><td><input type="email" placeholder="${r.toLowerCase()}@company.com" value="${esc(chCfg(d.id, r).email || '')}" onchange="setCh('${d.id}','${r}','email',this.value)"></td></tr>`).join('')}</table></div></div>`).join('')}`;
}
function payTab() {
  const box = (kind, title) => { const d = payDef(kind === 'export'); return `<div class="card flat"><h3>${title}</h3><div class="form">
    <label class="full">Payment split (%)<input value="${esc(d.split)}" onchange="setPayDef('${kind}','split',this.value)" placeholder="30/70"></label>
    <label class="full">Days after order for each instalment<input value="${esc(d.days)}" onchange="setPayDef('${kind}','days',this.value)" placeholder="0,30"></label>
    <label class="full">Advance needed before production (%)<input type="number" min="0" max="100" value="${d.adv}" onchange="setPayDef('${kind}','adv',this.value)"></label></div></div>`; };
  return `<p class="muted small">These are only starting values. Every sales order can have its own split and advance.</p>
  <div class="grid g2">${box('local', 'Local orders')}${box('export', 'Export orders')}</div>
  <div class="card flat" style="margin-top:14px"><h3>Tax & currency</h3><div class="form"><label>Default GST rate (%)<input type="number" value="${ST().gst ?? 18}" onchange="ST().gst=+this.value;save()"></label>
    <label>USD to INR (for dashboard totals)<input type="number" step="0.01" value="${ST().usd || 84}" onchange="ST().usd=+this.value;save()"></label></div>
    <p class="muted small">HSN code and GST rate for each product are set on the Products page.</p></div>`;
}
const _pagesProductsB = PAGES.products;
PAGES.products = () => _pagesProductsB().replace('<th>UN no.</th>', '<th>UN no.</th><th>HSN</th><th>GST %</th>')
  .replace(/(onchange="setP\('([^']+)','un',this\.value\)"><\/td>)/g, (m, all, id) => { const p = prod(id);
    return `${all}<td><input style="width:80px" placeholder="3824" value="${esc(p.hsn || '')}" onchange="setP('${id}','hsn',this.value)"></td><td><input style="width:60px" type="number" value="${p.gst ?? ST().gst ?? 18}" onchange="setP('${id}','gst',+this.value)"></td>`; });

/* ---------- Sales order: default split, advance and billing details ---------- */
const advPct = o => o.advancePct ?? (o.terms?.[0]?.pct ?? 0);
const advNeeded = o => Math.round(orderTotal(o) * advPct(o) / 100);
const advOk = o => !o || paidFor(o.id) >= advNeeded(o);
function setAdvance(oid) {
  const o = S.orders.find(x => x.id === oid);
  modal('Advance for ' + oid, `<label class="form"><span>Advance needed before production (%)</span><input id="advp" type="number" min="0" max="100" value="${advPct(o)}"></label>
    <p class="muted small">Order value ${money(orderTotal(o), o.currency)}. Set 0 to allow production without an advance.</p>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveAdvance('${oid}')">Save</button>`);
}
function saveAdvance(oid) {
  const v = +val('advp');
  if (!(v >= 0 && v <= 100)) return toast('Enter a value from 0 to 100');
  S.orders.find(x => x.id === oid).advancePct = v; logA(`Advance for ${oid} set to ${v}%`); closeModal(); rerender();
}
const _orderForm = orderForm;
orderForm = function (inqId) {
  _orderForm(inqId);
  $('#odays').closest('label').insertAdjacentHTML('afterend', `<label>Advance before production (%)<input id="oadv" type="number" min="0" max="100"></label><label>Buyer GSTIN<input id="ogst" placeholder="24ABCDE1234F1Z5"></label>
    <label class="full">Billing address<input id="oaddr"></label><label class="full">Place of supply (state)<select id="ostate">${stateOpts('24 Gujarat')}</select></label>`);
  const apply = () => { const exp = val('oco').trim() !== 'India', d = payDef(exp); $('#ot').value = d.split; $('#odays').value = d.days; $('#oadv').value = d.adv; if (exp) $('#ostate').value = '96 Outside India (export)'; };
  $('#oco').addEventListener('change', apply); apply();
};
let pendingOrderExtra = null;
const _saveOrder = saveOrder;
saveOrder = function (inqId) {
  const a = +val('oadv');
  if (!(a >= 0 && a <= 100)) return toast('Advance must be between 0 and 100%');
  const g = val('ogst').trim().toUpperCase();
  if (g && !GSTIN_RE.test(g)) return toast('GSTIN looks wrong. It should be 15 characters, e.g. 24ABCDE1234F1Z5');
  pendingOrderExtra = { advancePct: a, gstin: g, addr: val('oaddr').trim(), state: val('ostate') };
  _saveOrder(inqId);
};
const _buildPayments = buildPayments;
buildPayments = function (o) { if (pendingOrderExtra) { Object.assign(o, pendingOrderExtra); pendingOrderExtra = null; } _buildPayments(o); };

/* ---------- GST invoices ---------- */
NAV[1][1].splice(5, 0, ['invoices', 'receipt', 'Invoices']);
TITLES.invoices = 'Invoices';
const fyOf = d => { const y = +d.slice(2, 4), m = +d.slice(5, 7), a = m >= 4 ? y : y - 1; return [String(a).padStart(2, '0'), String(a + 1).padStart(2, '0')]; };
function numWords(n) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = x => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');
  const three = x => (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + two(x % 100);
  if (!n) return 'Zero';
  const out = [], cr = Math.floor(n / 1e7), lk = Math.floor(n / 1e5) % 100, th = Math.floor(n / 1000) % 100, rest = n % 1000;
  if (cr) out.push(numWords(cr) + ' Crore'); if (lk) out.push(two(lk) + ' Lakh'); if (th) out.push(two(th) + ' Thousand'); if (rest) out.push(three(rest));
  return out.join(' ');
}
const amtWords = (v, cur) => { const w = Math.floor(v), f = Math.round((v - w) * 100); return cur === 'USD' ? `US Dollars ${numWords(w)}${f ? ' and ' + numWords(f) + ' Cents' : ''} Only` : `Rupees ${numWords(w)}${f ? ' and ' + numWords(f) + ' Paise' : ''} Only`; };
const r2 = x => Math.round(x * 100) / 100;
function invCalc(f) {
  const taxable = r2(f.qty * f.rate), co = coCfg(f.div);
  let cgst = 0, sgst = 0, igst = 0;
  if (!(f.export && f.lut)) { const t = taxable * f.gstPct / 100; if (!f.export && f.state.slice(0, 2) === co.stateCode) { cgst = r2(t / 2); sgst = r2(t / 2); } else igst = r2(t); }
  const raw = taxable + cgst + sgst + igst, total = f.currency === 'USD' ? r2(raw) : Math.round(raw);
  return { taxable, cgst, sgst, igst, round: r2(total - raw), total };
}
function invoice(id) {
  const w = S.workorders.find(x => x.id === id), o = S.orders.find(x => x.id === w.order) || {}, p = prod(w.productId);
  const qty = o.unit === w.unit ? w.qty : (o.qty || w.qty), unit = o.unit || w.unit;
  modal('Generate tax invoice · ' + id, `<div class="form">
    <label>Invoice date<input id="ivd" type="date" value="${today()}"></label><label>Bill from<select id="ivdiv">${S.divisions.map(d => `<option value="${d.id}" ${d.id === w.div ? 'selected' : ''}>${esc(d.name)}</option>`)}</select></label>
    <label class="full">Buyer<input id="ivc" value="${esc(w.client)}"></label><label class="full">Billing address<input id="iva" value="${esc(o.addr || '')}"></label>
    <label>Buyer GSTIN<input id="ivg" value="${esc(o.gstin || '')}" placeholder="Blank if unregistered"></label><label>Place of supply<select id="ivs">${stateOpts(o.state || (w.export ? '96 Outside India (export)' : '24 Gujarat'))}</select></label>
    <label class="full">Description<input id="ivdesc" value="${esc((w.export && p.alias ? p.alias : p.name) + ' · Batch ' + (w.batchNo || w.formula || ''))}"></label>
    <label>HSN code<input id="ivh" value="${esc(p.hsn || '')}" placeholder="e.g. 3824"></label><label>GST %<input id="ivp" type="number" value="${p.gst ?? ST().gst ?? 18}"></label>
    <label>Quantity<input id="ivq" type="number" step="any" value="${qty}"></label><label>Unit<input id="ivu" value="${esc(unit)}"></label>
    <label>Rate<input id="ivr" type="number" step="any" value="${o.rate || 0}"></label><label>Currency<select id="ivcur"><option ${o.currency !== 'USD' ? 'selected' : ''}>INR</option><option ${o.currency === 'USD' ? 'selected' : ''}>USD</option></select></label>
    ${w.export ? '<label class="chk full"><input type="checkbox" id="ivlut" checked> Export under LUT (without payment of IGST)</label>' : ''}
    <label>Transport / vehicle no.<input id="ivv" value="${esc(w.transport || '')}"></label><label>E-way bill no.<input id="ive" placeholder="Optional"></label>
    <label class="full">IRN (e-invoice, if applicable)<input id="ivirn" placeholder="Optional"></label></div>
    <p class="muted small">The number is given when you save: one series per company per financial year (April–March).</p>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" id="ivsave" onclick="saveInvoice('${id}')">Save invoice</button>`);
}
async function saveInvoice(woId) {
  const w = S.workorders.find(x => x.id === woId);
  const f = { div: val('ivdiv'), client: val('ivc').trim(), addr: val('iva').trim(), gstin: val('ivg').trim().toUpperCase(), state: val('ivs'), desc: val('ivdesc').trim(), hsn: val('ivh').trim(),
    gstPct: +val('ivp'), qty: +val('ivq'), unit: val('ivu').trim(), rate: +val('ivr'), currency: val('ivcur'), export: !!w.export, lut: !!val('ivlut'), vehicle: val('ivv').trim(), eway: val('ive').trim(), irn: val('ivirn').trim(), date: val('ivd') };
  if (!f.client || !(f.qty > 0) || !(f.rate > 0)) return toast('Buyer, quantity and rate are required');
  if (f.gstin && !GSTIN_RE.test(f.gstin)) return toast('Buyer GSTIN looks wrong (15 characters)');
  if (!f.hsn) return toast('Enter the HSN code');
  $('#ivsave').disabled = true;
  const [a, b] = fyOf(f.date), series = `INV-${f.div}-${a}${b}`;
  const r = await api('/api/reserve', { prefix: series, count: 1 }).catch(e => { toast(e.message || 'Could not get an invoice number'); });
  if (!r) { $('#ivsave').disabled = false; return; }
  const no = `${coCfg(f.div).prefix}/${a}-${b}/${String(r.from).padStart(4, '0')}`;
  S.invoices.unshift({ id: no, wo: w.id, order: w.order, ...f, ...invCalc(f), status: 'Issued', by: me().name, at: new Date().toISOString() });
  w.invoiced = true; w.invoiceNo = no;
  logA('Invoice ' + no + ' generated for ' + w.id); closeModal(); save(); rerender(); viewInvoice(no);
}
function invoiceHTML(v) {
  const co = coCfg(v.div);
  const fmt = x => v.currency === 'USD' ? '$' + x.toFixed(2) : '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const taxRows = [v.cgst && ['CGST @ ' + v.gstPct / 2 + '%', v.cgst], v.sgst && ['SGST @ ' + v.gstPct / 2 + '%', v.sgst], v.igst && ['IGST @ ' + v.gstPct + '%', v.igst], v.round && ['Round off', v.round]].filter(Boolean);
  return `<div class="doc inv"><div class="row" style="align-items:flex-start"><img src="logo.webp" alt="" style="height:44px"><div style="flex:1"><b style="font-size:17px">${esc(co.legal)}</b><div class="small">${esc(co.addr)}<br>GSTIN ${esc(co.gstin || '—')} · PAN ${esc(co.pan || '—')} · ${esc(co.state)} (${co.stateCode})${co.phone ? '<br>' + esc(co.phone) : ''}${co.email ? ' · ' + esc(co.email) : ''}</div></div>
    <div style="text-align:right"><b style="font-size:16px">${v.export ? 'EXPORT INVOICE' : 'TAX INVOICE'}</b><div class="small">No. <b>${esc(v.id)}</b><br>Date ${v.date}</div>${v.status === 'Cancelled' ? '<span class="pill red">CANCELLED</span>' : ''}</div></div>
    <div class="grid g2" style="margin-top:14px;gap:12px"><div class="inv-box"><span class="muted small">Bill to</span><b>${esc(v.client)}</b><div class="small">${esc(v.addr || '')}<br>${v.gstin ? 'GSTIN ' + esc(v.gstin) + '<br>' : ''}Place of supply: ${esc(v.state)}</div></div>
    <div class="inv-box small"><span class="muted small">Details</span>Order ${esc(v.order || '')} · Work order ${esc(v.wo || '')}${v.vehicle ? '<br>Transport: ' + esc(v.vehicle) : ''}${v.eway ? '<br>E-way bill: ' + esc(v.eway) : ''}${v.irn ? '<br>IRN: ' + esc(v.irn) : ''}</div></div>
    <table class="tbl" style="margin-top:14px"><tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th style="text-align:right">Taxable value</th></tr>
      <tr><td>1</td><td>${esc(v.desc)}</td><td>${esc(v.hsn)}</td><td>${v.qty} ${esc(v.unit)}</td><td>${fmt(v.rate)}</td><td style="text-align:right">${fmt(v.taxable)}</td></tr>
      ${taxRows.map(([l, x]) => `<tr><td></td><td colspan="4" style="text-align:right">${l}</td><td style="text-align:right">${fmt(x)}</td></tr>`).join('')}
      <tr><td></td><td colspan="4" style="text-align:right"><b>Total</b></td><td style="text-align:right"><b>${fmt(v.total)}</b></td></tr></table>
    <p class="small"><b>Amount in words:</b> ${amtWords(v.total, v.currency)}</p>
    ${v.export && v.lut ? `<p class="small">Supply meant for export under LUT${co.lut ? ' no. ' + esc(co.lut) : ''} without payment of IGST.</p>` : ''}
    ${v.status === 'Cancelled' ? `<p class="small" style="color:var(--red)">Cancelled by ${esc(v.cancelledBy)}: ${esc(v.cancelReason)}</p>` : ''}
    <div class="row" style="align-items:flex-end;margin-top:18px"><div class="small" style="flex:1">${co.bank ? `<b>Bank details</b><br>${esc(co.bank)} · A/c ${esc(co.acc)} · IFSC ${esc(co.ifsc)}<br>` : ''}<span class="muted">Subject to Halol jurisdiction. This is a computer-generated invoice.</span></div>
    <div class="small" style="text-align:center;min-width:180px">For ${esc(co.legal)}<br><br><br>Authorised signatory</div></div></div>`;
}
function viewInvoice(no) {
  const v = S.invoices.find(x => x.id === no);
  modal('Invoice ' + esc(no), `<div id="printArea">${invoiceHTML(v)}</div>`,
    `${v.status !== 'Cancelled' && can('invoices') && canEdit('invoices') ? `<button class="btn r" onclick="cancelInvoice('${esc(no)}')">Cancel invoice</button><span class="sp"></span>` : ''}<button class="btn" onclick="closeModal()">Close</button><button class="btn p" onclick="printArea()"><i data-lucide="printer"></i> Print / PDF</button>`);
}
function cancelInvoice(no) {
  const why = prompt('Reason for cancelling invoice ' + no + '?');
  if (!why) return;
  const v = S.invoices.find(x => x.id === no); v.status = 'Cancelled'; v.cancelReason = why; v.cancelledBy = me().name;
  const w = S.workorders.find(x => x.id === v.wo); if (w) { w.invoiced = false; w.invoiceNo = ''; }
  logA(`Invoice ${no} cancelled: ${why}`); closeModal(); save(); rerender();
}
let invQ = '';
PAGES.invoices = () => {
  const all = (S.invoices || []).filter(inDiv), month = today().slice(0, 7);
  const mon = all.filter(v => v.status !== 'Cancelled' && v.date.startsWith(month));
  const shown = all.filter(v => !invQ || (v.id + ' ' + v.client + ' ' + v.wo).toLowerCase().includes(invQ.toLowerCase()));
  const ready = S.workorders.filter(w => inDiv(w) && w.stage === lastStage(w) && !w.invoiced);
  const tax = v => v.cgst + v.sgst + v.igst;
  const gate = w => ({ photos: w.photos.length > 0, cha: !w.export || !!w.cha, haz: !w.haz || w.hazDone });
  return `<div class="grid g4">${kpi('receipt', mon.length, 'Invoices this month')}${kpi('indian-rupee', inrShort(mon.reduce((a, v) => a + toINR(v.total, v.currency), 0)), 'Billed this month')}${kpi('landmark', inrShort(mon.reduce((a, v) => a + toINR(tax(v), v.currency), 0)), 'GST this month')}${kpi('hourglass', ready.length, 'Dispatched, not invoiced')}</div>
  ${ready.length ? `<div class="card" style="margin-top:16px"><h3>Ready to invoice</h3>${ready.map(w => { const g = gate(w), ok = g.photos && g.cha && g.haz;
    return attnBtn('receipt', ok ? 'blue' : 'amber', `${w.id} · ${w.client}`, ok ? `${esc(prod(w.productId).name)} · ${w.qty} ${w.unit}` : 'Missing: ' + [!g.photos && 'dispatch photos', !g.cha && 'CHA', !g.haz && 'HAZ labelling'].filter(Boolean).join(', '), ok ? `invoice('${w.id}')` : `location.hash='workorders/${w.id}'`, ok ? 'Invoice' : 'Open'); }).join('')}</div>` : ''}
  <div class="card" style="margin-top:16px"><div class="row" style="margin-bottom:12px"><h3 style="margin:0;flex:1">All invoices</h3><input data-ro-ok placeholder="Search number, client, WO" value="${esc(invQ)}" onchange="invQ=this.value;rerender()"></div>
  <div class="tw"><table class="tbl"><tr><th>Invoice</th><th>Date</th><th>Client</th><th>Company</th><th style="text-align:right">Taxable</th><th style="text-align:right">GST</th><th style="text-align:right">Total</th><th>Status</th></tr>
  ${shown.map(v => `<tr class="click" onclick="viewInvoice('${esc(v.id)}')"><td><b>${esc(v.id)}</b><div class="muted small">${v.wo}</div></td><td>${v.date}</td><td>${esc(v.client)}</td><td>${esc(divName(v.div))}</td><td style="text-align:right">${money(v.taxable, v.currency)}</td><td style="text-align:right">${money(tax(v), v.currency)}</td><td style="text-align:right"><b>${money(v.total, v.currency)}</b></td><td>${v.status === 'Cancelled' ? '<span class="pill red">Cancelled</span>' : '<span class="pill green">Issued</span>'}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">No invoices yet. They are created from a dispatched work order.</td></tr>'}</table></div></div>`;
};

/* ---------- Permissions: no access / view only / edit, per role and module ---------- */
const canEdit = page => me().role === 'Super Admin' || !((S.roleView || {})[me().role] || []).includes(page);
function permCell(r, p) {
  const v = !S.roles[r].includes(p) ? 'none' : ((S.roleView || {})[r] || []).includes(p) ? 'view' : 'edit';
  return `<select class="perm ${v}" aria-label="${esc(r)}: ${TITLES[p]}" onchange="setPerm('${r}','${p}',this.value)"><option value="none" ${v === 'none' ? 'selected' : ''}>No access</option><option value="view" ${v === 'view' ? 'selected' : ''}>View</option><option value="edit" ${v === 'edit' ? 'selected' : ''}>Edit</option></select>`;
}
function setPerm(r, p, v) {
  togglePerm(r, p, v !== 'none');
  if (!S.roleView || Array.isArray(S.roleView)) S.roleView = {};
  const ro = (S.roleView[r] || []).filter(x => x !== p); if (v === 'view') ro.push(p); S.roleView[r] = ro;
  logA(`${r}: ${TITLES[p]} → ${v === 'none' ? 'no access' : v}`); save(); rerender();
}
function lockView() {
  const page = S.route.split('/')[0];
  if (page === 'dashboard' || canEdit(page) || !can(page)) return;
  const v = $('#view');
  v.querySelectorAll('input,select,textarea,button').forEach(e => { if (!e.closest('.tabs,.seg,[data-ro-ok]')) e.disabled = true; });
  v.insertAdjacentHTML('afterbegin', '<div class="alert warn ro-note"><i data-lucide="eye"></i> You can view this module but not change it. Ask the Super Admin for edit access.</div>');
}

/* ---------- Attendance: geofenced locations, shift times, selfie ---------- */
const attCfg = () => Object.assign({ fences: [], shiftStart: '09:30', shiftEnd: '18:30', selfie: true }, ST().attendance || {});
function setAtt(k, v) { ST().attendance = { ...attCfg(), [k]: v }; save(); rerender(); }
const distM = (a, b, c, d) => { const t = x => x * Math.PI / 180, h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2; return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h))); };
function fenceForm() {
  modal('Add attendance location', `<div class="form"><label class="full">Name<input id="fn" placeholder="Baska plant"></label><label>Latitude<input id="fla" type="number" step="any"></label><label>Longitude<input id="flo" type="number" step="any"></label>
    <label>Allowed radius (metres)<input id="fr" type="number" value="200"></label><div class="full"><button type="button" class="btn sm" onclick="hereFence()"><i data-lucide="locate-fixed"></i> Use my current location</button>
    <p class="muted small">Or copy the coordinates from Google Maps (right-click the spot).</p></div></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveFence()">Save location</button>`);
}
function hereFence() {
  if (!navigator.geolocation) return toast('Location not available on this device');
  navigator.geolocation.getCurrentPosition(p => { $('#fla').value = p.coords.latitude.toFixed(6); $('#flo').value = p.coords.longitude.toFixed(6); }, () => toast('Location not available'), { enableHighAccuracy: true, timeout: 8000 });
}
function saveFence() {
  const f = { name: val('fn').trim(), lat: +val('fla'), lng: +val('flo'), r: +val('fr') || 200 };
  if (!f.name || !val('fla') || !val('flo') || Math.abs(f.lat) > 90 || Math.abs(f.lng) > 180) return toast('Enter a name and valid coordinates');
  closeModal(); setAtt('fences', [...attCfg().fences, f]);
}
function delFence(i) { if (confirm('Remove this location?')) setAtt('fences', attCfg().fences.filter((_, j) => j !== i)); }
const _pagesAttendance = PAGES.attendance;
PAGES.attendance = () => {
  const c = attCfg();
  const html = _pagesAttendance().replace('Allowed only within 100 m of the office / plant, with a live selfie.', c.fences.length ? `Allowed only at ${c.fences.map(f => `${esc(f.name)} (within ${f.r} m)`).join(', ')}${c.selfie ? ', with a live selfie' : ''}. Shift ${c.shiftStart}–${c.shiftEnd}.` : 'No attendance locations set yet, so check-in works from anywhere.');
  return html + (isHR() ? `<div class="card" style="margin-top:16px"><h3>Attendance settings<span class="sp"></span><button class="btn sm p" onclick="fenceForm()">+ Add location</button></h3>
    ${c.fences.map((f, i) => `<div class="attn"><span class="ai blue"><i data-lucide="map-pin"></i></span><div style="flex:1"><b>${esc(f.name)}</b><div class="muted small">${f.lat}, ${f.lng} · within ${f.r} m</div></div><a class="btn sm" target="_blank" rel="noopener" href="https://maps.google.com/?q=${f.lat},${f.lng}">Map</a><button class="btn sm r icon" aria-label="Remove location" onclick="delFence(${i})"><i data-lucide="trash-2"></i></button></div>`).join('') || '<p class="muted small">Add the office and plant so staff can only check in there.</p>'}
    <div class="form" style="margin-top:12px"><label>Shift starts<input type="time" value="${c.shiftStart}" onchange="setAtt('shiftStart',this.value)"></label><label>Shift ends<input type="time" value="${c.shiftEnd}" onchange="setAtt('shiftEnd',this.value)"></label>
    <label class="chk full"><input type="checkbox" ${c.selfie ? 'checked' : ''} onchange="setAtt('selfie',this.checked)"> Require a live selfie to check in</label></div></div>` : '');
};
async function grabSelfie() {
  const v = $('#cam');
  if (!v || !v.srcObject || !v.videoWidth) return null;
  const c = Object.assign(document.createElement('canvas'), { width: v.videoWidth, height: v.videoHeight });
  c.getContext('2d').drawImage(v, 0, 0);
  return uploadFile(await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8)));
}
checkIn = function () {
  const c = attCfg();
  $('#geo').textContent = 'Locating…';
  const done = async (geo, pos) => {
    let photo = null;
    if (c.selfie) { try { photo = await grabSelfie(); } catch (e) { } if (!photo) { $('#geo').textContent = ''; return toast('A selfie is needed. Allow camera access and try again.'); } }
    S.attendance.push({ user: S.user, date: today(), in: hhmm(), out: '', shiftStart: c.shiftStart, shiftEnd: c.shiftEnd, geo, pos, photo: photo || false });
    toast('Checked in'); save(); rerender();
  };
  if (!navigator.geolocation) { $('#geo').textContent = ''; return c.fences.length ? toast('This device cannot share its location') : done('Location not available'); }
  navigator.geolocation.getCurrentPosition(p => {
    const { latitude: la, longitude: lo, accuracy } = p.coords;
    if (!c.fences.length) return done(`${la.toFixed(5)}, ${lo.toFixed(5)}`, [la, lo]);
    const near = c.fences.map(f => ({ f, d: distM(la, lo, f.lat, f.lng) })).sort((a, b) => a.d - b.d)[0];
    if (near.d > near.f.r + Math.min(accuracy || 0, 100)) { $('#geo').textContent = ''; return toast(`You are ${near.d} m from ${near.f.name}. Check-in is allowed within ${near.f.r} m.`); }
    done(`${near.f.name} (${near.d} m)`, [la, lo]);
  }, () => { $('#geo').textContent = ''; c.fences.length ? toast('Allow location access to check in') : done('Location not shared'); }, { enableHighAccuracy: true, timeout: 10000 });
};

/* ---------- Team targets (set by managers) and daily counters ---------- */
const isManager = () => ['Super Admin', 'Marketing Head', 'HR'].includes(me().role);
function targetForm(u) {
  const a = S.activity[u] || { tCalls: 20, tMsgs: 30 };
  modal('Daily targets · ' + esc(uname(u)), `<div class="form"><label>Calls per day<input id="tgc" type="number" min="0" value="${a.tCalls}"></label><label>Messages per day<input id="tgm" type="number" min="0" value="${a.tMsgs}"></label></div>`,
    `${S.activity[u] ? `<button class="btn r" onclick="stopTracking('${u}')">Stop tracking</button><span class="sp"></span>` : ''}<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="saveTargets('${u}')">Save targets</button>`);
}
function saveTargets(u) {
  const a = S.activity[u] || (S.activity[u] = { calls: 0, msgs: 0, date: today() });
  a.tCalls = Math.max(0, +val('tgc')); a.tMsgs = Math.max(0, +val('tgm')); logA('Daily targets set for ' + uname(u)); closeModal(); rerender();
}
function stopTracking(u) { delete S.activity[u]; closeModal(); rerender(); }
teamTable = function () {
  const rows = Object.entries(S.activity).filter(([u]) => S.users.some(x => x.id === u));
  const pct = (x, t) => Math.min(100, t ? x / t * 100 : 0);
  const untracked = S.users.filter(u => u.active !== false && !S.activity[u.id]);
  return `<table class="tbl"><tr><th>Member</th><th>Calls today</th><th>Messages today</th><th>Tasks</th><th>Calls, 7 days</th>${isManager() ? '<th></th>' : ''}</tr>${rows.map(([u, a]) => { const ts = S.tasks.filter(t => t.user === u && t.date === today());
    const wk = Object.entries(a.hist || {}).filter(([d]) => d >= addDays(today(), -7)).reduce((s, [, h]) => s + h.calls, 0) + a.calls;
    return `<tr><td>${esc(uname(u))}</td><td>${a.calls}/${a.tCalls}<div class="bar"><i style="width:${pct(a.calls, a.tCalls)}%"></i></div></td><td>${a.msgs}/${a.tMsgs}<div class="bar"><i style="width:${pct(a.msgs, a.tMsgs)}%"></i></div></td><td>${ts.filter(t => t.done).length}/${ts.length}</td><td>${wk}</td>${isManager() ? `<td><button class="btn sm" onclick="targetForm('${u}')">Targets</button></td>` : ''}</tr>`; }).join('')}</table>
  ${isManager() && untracked.length ? `<div class="row" style="margin-top:12px"><select id="addT" aria-label="Team member">${untracked.map(u => `<option value="${u.id}">${esc(u.name)}</option>`)}</select><button class="btn sm" onclick="targetForm(val('addT'))">+ Set targets</button></div>` : ''}`;
};
function rollActivity() {
  Object.values(S.activity || {}).forEach(a => {
    if (!a.date) a.date = today();
    if (a.date !== today()) { a.hist = Object.fromEntries(Object.entries({ ...(a.hist || {}), [a.date]: { calls: a.calls, msgs: a.msgs } }).sort().slice(-60)); a.calls = 0; a.msgs = 0; a.date = today(); }
  });
}

/* ---------- Boot hooks ---------- */
// Numbers reserved before demo or imported data arrived could clash with it, so take a fresh block afterwards.
const _startData = startData;
startData = async function (demo) { const r = await _startData(demo); await flush(); Object.keys(NO_POOL).forEach(k => { NO_POOL[k] = []; refillNo(k); }); return r; };
function migrate() {
  if (me().role !== 'Super Admin' || ST().mig1) return;
  if (S.roles.Accounts && !S.roles.Accounts.includes('invoices')) S.roles.Accounts.push('invoices');
  const spc = S.divisions.find(d => d.id === 'SPC'); if (spc && /to confirm/i.test(spc.name)) spc.name = 'SP Chemicals';
  ST().mig1 = 1;
}
const _goB = go;
go = function () {
  if (S && S.user && me()) { if (!Array.isArray(S.invoices)) S.invoices = []; migrate(); rollActivity(); }
  _goB(); lockView();
};
// Keep a few document numbers ready once signed in, so a new record never waits for (or misses) the server.
let refilling = false;
setInterval(async () => {
  if (refilling || !S || !S.user || !S.users || !me()) return;
  refilling = true;
  try { for (const p of ['WO', 'SO', 'INQ', 'PO', 'L', 'SMP']) if ((NO_POOL[p] || []).length < 4) await refillNo(p); } finally { refilling = false; }
}, 1500);
