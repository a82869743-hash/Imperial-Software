/* Mail buttons and country requirements (Phase 1). Loaded after features.js and business.js. */
const countryReq = c => ((S.countries || []).find(x => x.name && c && x.name.toLowerCase() === String(c).toLowerCase()) || {}).req || '';

/* Every inquiry mail gets a private link with "Call me back" and "WhatsApp us" buttons.
   A click opens a short form; what the client sends becomes a new lead and notifies marketing. */
function connectLink(q, action) {
  const p = prod(q.productId), div = p.div || q.div || (S.division === 'all' ? 'CHEM' : S.division);
  if (!q.connect) { q.connect = { token: rndToken(), div }; save(); }
  const wa = String(waFor(div) || '').replace(/\D/g, '');
  const waFull = wa ? (wa.length === 10 ? '91' + wa : wa) : '';
  if (q.connect.wa !== waFull) { q.connect.wa = waFull; save(); }
  return `${location.origin}/connect/${q.connect.token}${action === 'wa' ? '?a=wa' : ''}`;
}
const _mailForConnect = mailFor;
mailFor = function (q) {
  const m = _mailForConnect(q);
  m.body += `\n\nRequest a call back: ${connectLink(q, 'call')}\nMessage us on WhatsApp: ${connectLink(q, 'wa')}`;
  return m;
};
const _showMailConnect = showMail;
showMail = function (id) {
  _showMailConnect(id);
  const q = S.inquiries.find(x => x.id === id), mb = document.querySelector('#modal .mb');
  if (!q || !mb) return;
  const req = countryReq(q.country);
  mb.insertAdjacentHTML('beforeend', `<div class="mail-cta"><span class="muted small">Buttons in the mail</span><div class="row">
      <a class="btn p" href="${connectLink(q, 'call')}" target="_blank" rel="noopener"><i data-lucide="phone-call"></i> Request a call back</a>
      <a class="btn" href="${connectLink(q, 'wa')}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i> WhatsApp us</a></div>
      <p class="muted small" style="margin:0">When the client clicks either button and sends their number, a new lead appears in Leads and marketing is notified.</p></div>
    ${req ? `<div class="alert info" style="margin-top:12px"><i data-lucide="globe"></i><span class="amsg"><b>${esc(q.country)} requires:</b> ${esc(req)}</span></div>` : ''}`);
};

/* Samples: dated timeline, batch numbers for production, photos and videos. */
const SAMPLE_STEPS = ['Inward (QA)', 'Testing', 'Trial formulations', 'Sent to client', 'Approved'];
function sampleExtras(s) {
  const media = s.media || [];
  return `<div class="smp-x">
    <div class="row" style="gap:6px">${(s.batches || []).map(b => `<span class="pill">${esc(b)}</span>`).join('') || '<span class="muted small">No batch number yet</span>'}</div>
    ${media.length ? `<div class="smp-media">${media.map(m => m.type === 'video' ? `<video src="${m.src}" controls preload="metadata"></video>` : `<a href="${m.src}" target="_blank" rel="noopener"><img src="${m.src}" alt="Sample photo"></a>`).join('')}</div>` : ''}
    ${s.notes ? `<p class="muted small" style="margin:0">${esc(s.notes)}</p>` : ''}
    <div class="row" style="gap:6px">
      ${s.stage < SAMPLE_STEPS.length ? `<button class="btn sm p" onclick="advanceSample('${s.id}')"><i data-lucide="arrow-right"></i> Move to ${SAMPLE_STEPS[s.stage + 1] || 'done'}</button>` : '<span class="pill green">Approved by client</span>'}
      <button class="btn sm" onclick="sampleBatch('${s.id}')"><i data-lucide="hash"></i> Add batch number</button>
      <label class="btn sm"><i data-lucide="image-plus"></i> Photos / videos<input type="file" accept="image/*,video/*" multiple hidden onchange="sampleMedia('${s.id}',this.files)"></label>
      <button class="btn sm" onclick="sampleNote('${s.id}')"><i data-lucide="notebook-pen"></i> Details</button>
    </div></div>`;
}
function advanceSample(id) {
  const s = S.samples.find(x => x.id === id); s.log = s.log || [];
  s.log[s.stage] = { at: today(), by: me().name }; s.stage = Math.min(SAMPLE_STEPS.length, s.stage + 1);
  logA(`${id} moved to ${SAMPLE_STEPS[s.stage] || 'approved'}`); save(); rerender();
}
function sampleBatch(id) {
  const s = S.samples.find(x => x.id === id);
  modal('Batch number for production', `<div class="form"><label class="full">Batch / serial number<input id="sbn" placeholder="e.g. F-HS-404-02" list="sbl"><datalist id="sbl">${S.formulations.map(f => `<option value="${esc(f.batch)}">`).join('')}</datalist></label>
    <p class="muted small full" style="margin:0">Use the formulation batch number. Production works from this number, and it stays the same if the product is renamed for export.</p></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="(()=>{const v=val('sbn').trim();if(!v)return;const s=S.samples.find(x=>x.id==='${id}');s.batches=[...new Set([...(s.batches||[]),v])];notifyRole('Production Head','Batch '+v+' assigned to sample ${id} ('+s.client+')');closeModal();save();rerender()})()">Save</button>`);
}
async function sampleMedia(id, files) {
  const s = S.samples.find(x => x.id === id); s.media = s.media || [];
  for (const f of files) {
    try { const url = await uploadFile(f); s.media.push({ src: url, type: f.type.startsWith('video') ? 'video' : 'image', date: today() }); }
    catch (e) { toast(e.message || 'Upload failed'); }
  }
  save(); rerender(); toast('Added to sample ' + id);
}
function sampleNote(id) {
  const s = S.samples.find(x => x.id === id);
  modal('Sample details', `<div class="form"><label class="full">Test results<input id="snt" value="${esc(s.tests || '')}"></label><label class="full">Details for production<textarea id="snn">${esc(s.notes || '')}</textarea></label></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="(()=>{const s=S.samples.find(x=>x.id==='${id}');s.tests=val('snt');s.notes=val('snn');closeModal();save();rerender()})()">Save</button>`);
}

/* Interns: HR schedules the two month-1 tests (around the 10th–15th and at month end).
   The intern and HR are reminded the day before; results show next to each test. */
const planOf = u => {
  const p = (S.internPlans || {})[u.id] || {}, j = u.joined || today();
  return { t1: { date: addDays(j, 12), test: '', ...(p.t1 || {}) }, t2: { date: addDays(j, 30), test: '', ...(p.t2 || {}) } };
};
function internTests(u) {
  const p = planOf(u), hr = typeof isHR === 'function' ? isHR() : me().role === 'HR';
  const slot = (k, label) => {
    const x = p[k], t = (S.tests || []).find(t => t.id === x.test), r = t && (S.results || []).find(r => r.user === u.id && r.test === t.id && (r.date || '') >= addDays(x.date, -2));
    const state = r ? `<span class="pill ${r.score >= 70 ? 'green' : 'amber'}">Scored ${r.score}%</span>` : x.date < today() ? '<span class="pill red">Missed</span>' : x.date === today() ? '<span class="pill amber">Today</span>' : '<span class="pill grey">Scheduled</span>';
    return `<div class="itest"><i data-lucide="clipboard-list"></i><div style="flex:1;min-width:0"><b>${label}</b><div class="muted small">${x.date} · ${t ? esc(t.title) : 'Test not chosen yet'}</div></div>${state}
      ${hr ? `<button class="btn sm" onclick="planForm('${u.id}','${k}')">Schedule</button>` : ''}</div>`;
  };
  return `<div class="itests">${slot('t1', 'Month 1 · Test 1')}${slot('t2', 'Month 1 · Test 2')}</div>`;
}
function planForm(uid_, k) {
  const u = S.users.find(x => x.id === uid_), x = planOf(u)[k];
  modal(`${k === 't1' ? 'Test 1' : 'Test 2'} for ${esc(u.name)}`, `<div class="form"><label>Date<input type="date" id="pd" value="${x.date}"></label>
    <label>Test<select id="pt"><option value="">Choose a test</option>${(S.tests || []).map(t => `<option value="${t.id}" ${t.id === x.test ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></label>
    <p class="muted small full" style="margin:0">Suggested: Test 1 between the 10th and 15th of the first month, Test 2 at the end of the first month. ${esc(u.name)} and HR are reminded the day before.</p></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn p" onclick="savePlan('${uid_}','${k}')">Save</button>`);
}
function savePlan(uid_, k) {
  S.internPlans = S.internPlans || {};
  const cur = S.internPlans[uid_] || {};
  S.internPlans[uid_] = { ...cur, [k]: { date: val('pd'), test: val('pt'), reminded: '' } };
  notify(uid_, `${k === 't1' ? 'Test 1' : 'Test 2'} is scheduled for ${val('pd')}`);
  closeModal(); save(); rerender(); toast('Test scheduled');
}
/* Reminders: sent once, the day before, by whoever from HR or the main login opens the app. */
function internReminders() {
  if (!S.users || !(me().role === 'HR' || me().role === 'Super Admin')) return;
  let changed = false; const tmr = addDays(today(), 1);
  S.users.filter(u => u.intern && u.active !== false).forEach(u => {
    const p = planOf(u);
    ['t1', 't2'].forEach(k => {
      if (p[k].date !== tmr || p[k].reminded === tmr) return;
      const msg = `Reminder: ${k === 't1' ? 'Test 1' : 'Test 2'} for ${u.name} is tomorrow (${tmr})`;
      notify(u.id, msg); S.users.filter(x => x.role === 'HR').forEach(h => notify(h.id, msg));
      S.internPlans = S.internPlans || {}; S.internPlans[u.id] = { ...(S.internPlans[u.id] || {}), [k]: { ...p[k], reminded: tmr } }; changed = true;
    });
  });
  if (changed) save();
}
setTimeout(function waitBoot() { if (S && S.users && S.tests) internReminders(); else setTimeout(waitBoot, 1000); }, 1500);
