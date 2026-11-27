# Imperial ERP + CRM: Project Handover

This document sums up everything discussed and built so far, so the next person can pick the project up without the original chat.

---

## 1. The client

**Imperial group**, a chemicals business at Baska, Halol, Panchmahal, Gujarat (website: imperialagro.in). It runs as one group with these companies (called "divisions" in the app):

| Code | Company | What it does |
|---|---|---|
| CHEM | Imperial Oilfield Chemicals Pvt Ltd | Oilfield chemicals (demulsifiers, scale inhibitors, etc.) |
| AGRO | Imperial Agro | Liquid thiosulphate fertilizers |
| PACK | Imperial Flexipack Pvt Ltd | Flexible packaging |
| SPC | SP Chemicals | Confirmed as part of the group |

**People:**
- **Nirav Sir**: production head
- **Jagruti Mam**: marketing head; also audits training and test results
- **Bhavin Sir**: head of Imperial Flexipack

---

## 2. What the client asked for

A complete ERP + CRM covering sales through dispatch, HR and training, run for all companies from one place.

**Sales & CRM**
- **Leads:** a lead finder and lead sources (IndiaMART, TradeIndia, website, exhibitions).
- **Inquiry auto-filter:**
  - If we make the product, reply with MOQ, price, quotation, T&C and TDS.
  - If we don't, send an introduction mail.
- One-click call and WhatsApp buttons in mails.
- Country-specific requirements linked to leads.
- **Sales orders:**
  - Custom payment splits.
  - Payment statuses: received, paused till approval, pending, cancelled.
  - An "approved by" popup when the client sends no PO.
  - USD and letter of credit for export.
- **Unit mismatches:** detect kg vs L mismatches and keep units consistent throughout.

**Production**
- A work order is approved only after the part payment (advance) is received.
- Customisable production stages for each company.
- A live tracking link for the customer.
- Expected-dispatch reminders sent to the customer as a sentence.
- Transport is decided at the work-order stage.
- White label or Imperial labelling, with a confirmation mail.
- **HAZ sticker:** generated and customisable, with their current sticker as the default.
- **Dispatch:**
  - Dispatch photos with filters.
  - Invoice allowed only after photos + CHA + HAZ labelling are done.
  - Separate documents for local and export.
- **Export:** the product name changes but the serial/batch number stays the same.
- The app records who made each batch.
- **Formulations and samples:**
  - Formulations use raw material codes only.
  - A sampling timeline with batch numbers.
- Lab QA/QC.

**Inventory & purchase**
- Raw-material serial numbers with printable QR codes that stay the same for each product.
- Low-stock alert, automatic stock deduction, and a PO popup until stock is full again.
- Raw-material traceability. Example: "combination 2 of 4, reordered a year later".
- Vendor comparison on price and on-time delivery, plus vendor approval.
- Machine maintenance reminders with expected cost vs last cost.

**People**
- Attendance with geofence + camera.
- Leave requests approved by HR; holidays.
- **Overtime rule:** the first extra 30 minutes are unpaid; every further 30-minute block is paid.
- Marketing team tracking: daily planner, tagging, call/message counts.
- **Training (built by HR):**
  - Modules with recorded audio, videos and YouTube links.
  - Weekly tests, proctored and timed: no screenshots, no tab switching, camera on.
- **Interns:** 2 tests in month 1, targets from month 3, evaluation and feedback the trainee can see.
- Staff desk for questions to a mentor.
- Role-based access with a Super Admin.

---

## 3. Decisions already made by the client / owner

**Design**
- Colours from the logo: blue and white, no dark or weird colours.
- **Manrope** font everywhere.
- Proper line icons (Lucide). **No "kiddish" emojis.**
- Subtle, airy spacing, no clutter, clean formatting.
- The client chose to **keep the original light blue/white design**. The Claude Design screens were not used.
- They asked for it to be interactive and dynamic, inspired by Awwwards/Dribbble-style dashboards.

**Platform**
- A web app for now; a mobile app later.
- Hosting is to be decided later.

**Login**
- Email **or** mobile number, plus a password.

**Companies & modules**
- Every module is available for every company; the admin can switch modules on or off per company.

**WhatsApp & email**
- **Two-way:** send and receive/reply.
- **One WhatsApp number per company and per team/role.**
- Email will mostly be **Google Workspace** (not set up yet).

**Flexipack POs**
- Arrive by WhatsApp and email; Bhavin Sir can also enter them manually.

**Payments**
- The default split must be settable, with different defaults for export.
- It changes per client anyway, so each order is editable.
- The advance needed before production differs per order/client.

**Invoices**
- Created **by this ERP**, not Tally or any other software.

**Set inside the ERP by the client's own staff** (not given to us):
- Sales targets
- Machines and service schedules
- Vendors and rates
- Minimum stock levels (auto-deduction plus a reminder at the minimum)
- Attendance locations
- Role permissions (the Super Admin decides who can do what)

**Working approach**
- Build every feature as a configurable setting with sensible defaults rather than waiting for the client's answers.
- The only things truly blocked are the WhatsApp/email connection and hosting.

---

## 4. Questions still open with the client

These were sent on WhatsApp. The questions the owner already answered (above) were removed. **Still waiting on:**

**Jagruti Mam**
- Approve the wording of the customer messages. Each can be edited in Settings → Message templates:
  1. Quotation reply
  2. Introduction mail
  3. Order confirmation
  4. Status update
  5. Dispatch message
  6. Payment reminder
  7. White label artwork request
  8. Export name note
- Should messages send automatically, or only after someone checks and presses Send?
- Who and which number should the call/WhatsApp buttons in mails connect to?
- Documents: standard T&C, company profile, catalogue, and TDS/MSDS for each product.
- Lead portals in use, and whether there is login access to them.
- Who approves an order when the client sends no PO?
- Export details: currency (USD only?), port (FOB Mundra?), and when a letter of credit is used.

**Nirav Sir**
- Production stages and checklists for CHEM, AGRO and SPC.
- Who records the operator for each batch?
- Batch number and raw-material serial formats.
- QC tests and pass limits for each product; who signs the COA.
- A photo of the current HAZ sticker; which products are hazardous, with UN numbers and classes.
- Is incoming raw material tested before use, and who releases it?
- Who approves vendors and POs?
- Transporter and CHA (export).
- Documents needed for local vs export orders.
- Which dispatch photos are needed.

**Bhavin Sir**
- What a Flexipack PO contains.
- The packaging production stages.
- The WhatsApp number and email for receiving POs.

**Accounts**
- GSTIN, PAN, address and bank details for each company.
- A sample of their current invoice and its numbering.
- Whether e-invoicing (IRN) and e-way bills are needed.

**HR**
- Shift timings and grace period.
- Overtime rate.
- Leave policy.
- 2026–27 holiday list.
- Test day and pass mark.
- Intern targets from month 3, and who evaluates interns.

**Management**
- Staff list (name, mobile, email, role, company).
- Super Admin(s).
- WhatsApp numbers for each company and role.
- Who sets up Google Workspace, and which email IDs to create.

---

## 5. What has been built

### Tech stack
- **Backend:** Node 20 + Express 4.21.2 + better-sqlite3 11.7.0, in [server.js](server.js).
- **Frontend:** a vanilla JavaScript single-page app with hash routing (`#page/arg`), rendered with template literals. There is no build step.
- **External libraries:**
  - Lucide icons (`lucide@0.460.0`, from jsdelivr)
  - `qrcode-generator@1.4.4` (cdnjs)
  - Manrope (Google Fonts)
- **Database:** SQLite at `data/imperial.db`.
- **Docker:** Dockerfile + docker-compose (the data volume is `/data`).

### Files

| File | Purpose |
|---|---|
| `server.js` | Login/sessions, data API, permissions, number series, uploads, public tracking |
| `public/index.html` | App shell. Load order: app.js → features.js → business.js (`?v=N` cache-busting) |
| `public/app.js` | Core: data sync, login, all base pages (leads, inquiries, products, orders, payments, work orders, inventory, procurement, lab, dispatch, machines, team, attendance, training, market, admin) |
| `public/features.js` | Overrides and additions to app.js: numbering, uploads, message templates, Settings page (stages, templates, HAZ), QR and HAZ stickers, inward QA quarantine and expiry, traceability, COA, vendor scorecard, machine reminders, HR training builder, new dashboard, Ctrl+K search, page animations |
| `public/business.js` | Overrides and additions: company/GST settings, WhatsApp/email per company and team, payment defaults, advance per order, GST invoices, view/edit permissions, geofenced attendance, staff targets |
| `public/track.html` | Public customer order-tracking page (link: `/track/<token>`) |
| `public/styles.css` | All styles. The design tokens are in `:root` at the top. |
| `README.md` | How to run, Docker, environment variables, backups |
| `ROADMAP.md` | Earlier roadmap and decisions |
| `.claude/launch.json` | Dev preview config (port 3000, ADMIN_PASSWORD `admin-test-123`) |

### How the data works
- **Server tables:**
  - `kv`: one JSON value per data key (orders, workorders, inventory, …), with a version number.
  - `users`
  - `sessions`
  - `counters`: document numbers
- **Sync:**
  - The client holds everything in a global `S`.
  - Changed keys are sent with `PUT /api/data/:key` and the version they were based on.
  - A stale version returns 409. The client then merges item by item (by id/code/batch) and retries.
  - The client polls `/api/changes` every 15 seconds.
- **Permissions** (`MODULE_KEYS` in server.js):
  - Each module may write only certain data keys. Shared keys (notifications, tasks, attendance…) are writable by everyone.
  - Modules marked "view only" for a role (stored in `roleView`) are refused on the server.
  - Super Admin can do everything.
  - Salaries are hidden except from Super Admin, HR, Accounts and the user themselves.
- **Document numbers:** `/api/reserve` hands out numbers in blocks (WO, SO, INQ, PO, L, SMP), always above the highest number already in the data.
  - Invoices use their own series per company and financial year with no gaps, e.g. `CHEM/26-27/0001`.
- **Uploads:** `POST /api/upload` accepts images, video, audio and PDF up to 200 MB, saved to `data/uploads/`.
  - Files are served only to signed-in users, or, for dispatch photos, through a valid tracking link.
- **Login:** scrypt password hashes, an httpOnly cookie lasting 30 days, and a limit of 10 login attempts per 15 minutes per IP.

### Feature summary (all working)
- **Dashboard:**
  - Greeting with the number of items needing attention.
  - Animated headline numbers: orders this month, money to collect / overdue, production floor, open leads.
  - A clickable order pipeline.
  - Attention list, 6-month collections chart, next dispatches, team progress.
- **Ctrl+K search** across pages, orders, clients, products, materials and batches.
- **Settings tabs:**
  - Production stages per company: add, reorder, checklists, stage types.
  - Message templates with `{placeholders}`.
  - Company & GST.
  - WhatsApp & email.
  - Payments & tax.
  - HAZ sticker.
- **Sales:**
  - Leads, inquiries (auto quote or intro mail).
  - Products, including HSN, GST % and UN number.
  - Sales orders with unit-mismatch detection, a no-PO approval popup, custom splits and advance %.
  - Payments and reminders.
- **Work orders:**
  - Approval locked until the advance is received.
  - Configurable stages with checklists.
  - Stock deducted at the production stage, with the raw-material lots used recorded.
  - QC readings and COA.
  - HAZ sticker, transport, labelling.
  - Customer update messages and a live tracking link.
  - Dispatch photos, CHA.
  - Invoice gate.
- **Invoices:**
  - GST tax invoice: CGST+SGST within Gujarat, IGST for other states, and an export LUT option.
  - Amount in words, bank details, print/PDF, cancel with a reason.
  - IRN and e-way bill numbers are entered by hand.
- **Inventory:**
  - QR stickers that never change for each material/product; scanning opens the item.
  - Inward stock with QA quarantine and release, expiry warnings.
  - Low-stock PO prompt.
- **Lab:** samples, formulations, and forward/backward traceability (lot → batch → customer).
- **Procurement:** vendor scorecard (on-time % + price vs market), open POs, mark as received.
- **Machines:** service countdown, expected vs last cost, reminders to the production head.
- **Team:** day planner, tagging, call/message counters that reset daily, targets set by managers.
- **Attendance:**
  - HR-set locations with radius, shift times, selfie on/off.
  - Leave requests, holidays.
  - Overtime calculation using the 30-minute rule.
- **Training:**
  - HR builds modules: text, recorded or uploaded audio, video, PDF, YouTube.
  - Tests are typed as plain text with `*` marking the correct answer, are timed, and run full-screen with the camera.
  - Tab switches and copy attempts are recorded.
  - Intern journey and feedback.
- **Admin:**
  - Companies, modules per company, users (email/phone + password).
  - Role × module permissions: No access / View / Edit.
  - Audit log.

---

## 6. How to run

```bash
npm install
```

```bash
ADMIN_PASSWORD=choose-a-strong-one node server.js
```

Open http://localhost:3000.
- **First sign-in:** `admin@imperial.local` with the ADMIN_PASSWORD you set. If none is set, a random password is printed in the console.
- **First-run screen:** choose a blank start or demo data.
  - Demo staff log in as `firstname@imperial.demo` / `imperial-demo`.
  - Demo users can only be created while there are no orders.
- **Docker:** `docker compose up -d`. Change `ADMIN_PASSWORD` in docker-compose.yml first.
- **Back up** the `data/` folder: the database plus uploads.
- **Delete the local `data/` folder before real use.** It contains test orders and invoices made during development.

---

## 7. Not done yet / next steps

1. **WhatsApp + email connection (two-way).**
   - Needs WhatsApp Business API numbers (one per company/role) and Google Workspace.
   - Today, messages show as "queued". The numbers and emails are already stored in Settings → WhatsApp & email.
2. **Hosting + domain.** Not decided.
3. **Mobile app.** Planned for later; the web app works on phones meanwhile.
4. **E-invoice (IRN) / e-way bill automation.** Needs a GST provider (GSP) account; typed in manually for now.
5. **Real-device checks.** The attendance selfie camera, the training audio recorder and photo uploads were not tested on a phone or laptop camera; the test browser blocks the camera and microphone. Geofencing was tested with a simulated location.
6. **Lead portal auto-fetch** (IndiaMART/TradeIndia) is still simulated. It needs their API access.
7. **Load the client's real data** once the answers in section 4 arrive: stages, templates, company GST details, products with HSN/UN numbers, staff, vendors, machines.

### Known quirks
- Work order and sales order numbers may skip a few (block reservation). Invoice numbers never skip.
- If a role has Orders set to "View" but can edit Payments, marking a payment received still updates the order's status (by design).
- Browsers cache scripts. After changing a JS/CSS file, bump `?v=N` in `public/index.html`.

---

## 8. Conversation timeline (short)

1. The owner shared meeting notes, the logo and imperialagro.in; asked for research, a roadmap and a mockup.
2. Design feedback: Manrope, no emojis, line icons, airy spacing, no clutter. A mockup was published.
3. The owner sent the second detailed requirements list and asked for a fully working, deployable build (not a demo).
4. Questions were answered: hosting later, email/phone login, all modules with admin switches, two-way WhatsApp/email, Flexipack PO intake. The client chose to keep the original design.
5. Agreed approach: build with configurable defaults instead of waiting for answers.
6. Built the server, sync, auth, permissions, tracking, numbering and uploads, plus all core modules.
7. Researched chemical-industry ERPs (Odoo, NetSuite, BatchMaster, dashboard design guides). This led to adding lot traceability, COA, QA quarantine, expiry warnings, a vendor scorecard, the new dashboard and search.
8. Wrote the WhatsApp question list for the client; the owner answered part of it (section 3).
9. Built everything from those answers: GST invoices, per-order advances, payment defaults, channels per company and role, view/edit permissions, geofenced attendance, staff targets.
10. Tested end to end on a fresh database. Fixed a number-clash bug and a first-number-after-login bug.


---

## 9. Update: work done in the Claude Code session (Nov 2026)

Branch: `claude/modest-rubin-pzxg8x`. Run locally: `npm install && ADMIN_PASSWORD=... npm start`. Deploy: see DEPLOY.md.

**Logins (decided with the owner)**
- One main login (Super Admin): every company, every approval. Who holds it is not decided yet.
- One **shared** login per company (Company Login role, locked to one company): CHEM, AGRO, SPC, PACK (Flexipack = Bhavin Sir).
- Nirav Sir (Production Head) covers CHEM + AGRO + SPC. Marketing (Jagruti Mam), Accounts and HR are group-wide.
- Company lock is enforced on the server (`users.divs`, `scopeValue` / `mergeScoped` in server.js). Set in Admin → Users → Company access.

**Files added**
- `public/roles.js`: per-role dashboards, Approvals page (`approvalsFor`), PO approval step (`poStatus`), company switch lock.
- `public/ui.js`: page header on every page (`PAGE_INFO`), markup polish, new sign-in screen.
- `public/connect.js` + `public/connect.html`: call / WhatsApp buttons in inquiry mails → `/connect/<token>` → new lead + notification. Also country requirements, sample timeline/media/batch numbers, intern test plans (`internPlans` key) with reminders.
- `deploy/` (Caddyfile, systemd unit, off-site backup script), `.env.example`, `DEPLOY.md`.

**Design**: Manrope, blue/white, Lucide icons. Styles are layered at the end of `styles.css` (v2 refresh, v3 page shell). Owner asked to keep tick boxes, stage checklists and graphs as they are.

**Server additions**: trust proxy, CSP + security headers, `/healthz`, daily DB backups (`DATA_DIR/backups`, `BACKUP_KEEP`), graceful shutdown, `/api/connect`.

**Phase status**
- Phase 1 (gaps): done.
- Phase 2 (go live): deploy setup ready and tested with Docker + Caddy on localhost. Needs a server + domain, real client data, phone testing.
- Phase 3 (WhatsApp Business API, Google Workspace mail, Flexipack PO intake, IndiaMART/TradeIndia): waiting on accounts.
- Phase 4 (e-invoice/e-way bill, mobile app): later.

**Demo logins** (password `imperial-demo`): chem@, agro@, spc@, flexipack@, nirav@, jagruti@, mahesh@ (Accounts), vikram@ (Store), kunal@ (Lab), hetal@ (HR), priya@ (intern), all `@imperial.demo`.

**Remember**: bump `?v=N` in `public/index.html` after changing JS/CSS.
