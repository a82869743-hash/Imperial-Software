/* Page shell: gives every page the same header (icon, title, one-line purpose, actions) and tidies
   the rendered markup so all pages share one look. Runs after each page renders. Loaded last. */

const PAGE_INFO = {
  approvals: 'Everything waiting for a decision, and who approves it',
  leads: 'Every enquiry source in one list, from first contact to inquiry',
  inquiries: 'Client mails filtered by whether we make the product, with quote or intro reply',
  products: 'Prices, MOQ, units, density and export names for every product',
  orders: 'Client POs with unit checks, payment terms and work order status',
  payments: 'Instalments by client and due date, with reminders',
  invoices: 'GST tax invoices, numbered per company and financial year',
  workorders: 'Production orders from approval to dispatch',
  inventory: 'Raw materials and packing stock, with lots, QR stickers and minimum levels',
  procurement: 'Vendor scorecard, rate comparison against market and purchase orders',
  lab: 'Samples, formulations by raw material code, and full traceability',
  dispatch: 'Invoice gate and dispatch photo library',
  machines: 'Service schedule with expected and last cost',
  team: 'Day planner, tagging and call and message targets',
  attendance: 'Check in and out, leave, holidays and overtime',
  training: 'Modules, timed tests, intern journey and staff desk',
  market: 'What each country requires and what it buys',
  settings: 'Production stages, message templates, company, channels, payments and HAZ sticker',
  admin: 'Companies, users, company access and role permissions'
};

const navIcon = page => (NAV.flatMap(g => g[1]).find(x => x[0] === page) || [])[1] || 'circle';
const navGroup = page => (NAV.find(g => g[1].some(x => x[0] === page)) || ['Operations'])[0];

function pageShell() {
  const view = $('#view'), [page, arg] = S.route.split('/');
  const detail = page === 'workorders' && arg;
  document.body.classList.toggle('has-phead', page !== 'dashboard');
  if (detail) $('#title').textContent = arg;
  if (page === 'dashboard' || detail || !view.firstElementChild || view.querySelector(':scope > .phead')) return polish(view);
  const head = document.createElement('div');
  head.className = 'phead';
  head.innerHTML = `<span class="phi"><i data-lucide="${detail ? 'factory' : navIcon(page)}"></i></span>
    <div class="pht"><span class="eyebrow">${esc(navGroup(page))}</span><h2>${detail ? esc(arg) : esc(TITLES[page] || '')}</h2>${detail ? '' : `<p>${esc(PAGE_INFO[page] || '')}</p>`}</div>
    <div class="pha"></div>`;
  // Lift the page's leading action buttons and toolbars into the header.
  const acts = head.querySelector('.pha');
  if (!detail) {
    for (const el of [...view.children]) {
      if (el.matches('.card, .grid, .tw, .dash, .tabs, table, .stages')) break;
      if (el.matches('button.btn, a.btn') || (el.matches('.toolbar, .row') && !el.querySelector('h1, h2, h3, h4, .card, table'))) acts.appendChild(el);
    }
  }
  view.prepend(head);
  polish(view);
}

/* Small markup fixes applied to every page. */
function polish(root) {
  // "+ Add", "→ Inquiry", "← Back" typed as text become proper icons.
  root.querySelectorAll('.btn, .lnk').forEach(b => {
    const t = b.firstChild;
    if (t && t.nodeType === 3) {
      const m = t.textContent.match(/^\s*([+←→])\s*/);
      if (m) { t.textContent = t.textContent.slice(m[0].length); b.insertAdjacentHTML('afterbegin', `<i data-lucide="${{ '+': 'plus', '←': 'arrow-left', '→': 'arrow-right' }[m[1]]}"></i>`); }
    }
  });
  // Alerts: keep the message as one flowing line, with the icon and any buttons beside it.
  root.querySelectorAll('.alert').forEach(a => {
    if (a.querySelector(':scope > .amsg')) return;
    const span = document.createElement('span'); span.className = 'amsg';
    [...a.childNodes].forEach(n => { if (!(n.nodeType === 1 && (n.matches('svg, i[data-lucide], .btn, button') ))) span.appendChild(n); });
    const firstIcon = a.querySelector(':scope > svg, :scope > i[data-lucide]');
    firstIcon ? firstIcon.after(span) : a.prepend(span);
  });
  // Tables that hold editable fields get the light inline-edit style.
  root.querySelectorAll('.tbl').forEach(t => { if (t.querySelector('td input:not([type=checkbox]), td select')) t.classList.add('edit'); });
}

const _goUi = go;
go = function () { _goUi(); pageShell(); };

/* Login screen: same brand treatment as the app. */
showLogin = function () {
  document.body.innerHTML = `<div class="login"><div class="login-side"><div class="brand"><span class="mark"><img src="logo.webp" alt=""></span><div><b>Imperial</b><small>Group ERP &amp; CRM</small></div></div>
    <h2>One system for the whole Imperial group</h2><p>Sales, production, lab, stock, dispatch, accounts and people, for Imperial Oilfield Chemicals, Imperial Agro, SP Chemicals and Imperial Flexipack.</p>
    <ul><li><i data-lucide="factory"></i>Work orders from inquiry to dispatch</li><li><i data-lucide="git-fork"></i>Raw material traceability</li><li><i data-lucide="stamp"></i>Approvals in one inbox</li></ul></div>
    <form class="card" onsubmit="event.preventDefault();doLogin()">
    <h1>Sign in</h1><p class="muted" style="margin:-6px 0 6px">Use your email or mobile number.</p>
    <label>Email or mobile number<input id="lg" autocomplete="username" required autofocus></label>
    <label>Password<input id="lp" type="password" autocomplete="current-password" required></label>
    <div id="lerr" class="lerr" role="alert"></div>
    <button class="btn p" type="submit">Sign in <i data-lucide="arrow-right"></i></button>
    <p class="muted small">Forgot your password? Ask your admin to reset it.</p></form></div>`;
  if (window.lucide) lucide.createIcons();
};
