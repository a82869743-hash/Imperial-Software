# Imperial ERP + CRM — Roadmap & Implementation Plan

Group-wide system for the Imperial group (Baska, Halol, Panchmahal, Gujarat). Each record carries a division tag. Users with access can see everything, or switch to one division. The admin can rename or add divisions.

| Division | What it does | Source |
|---|---|---|
| Imperial Oilfield Chemicals Pvt Ltd | Oilfield chemicals (crude oil demulsifiers etc.); the lab/crude-oil work in the meeting notes | MCA listing, registered at Baska, Halol (est. 2008) |
| Imperial Agro | Liquid thiosulphate fertilizers (Ca, Mg, K, ammonium, ammonium polysulfide); ~2,500 MT/month; exports to Australia, Kenya, Brazil, UAE, SE Asia | imperialagro.in |
| Imperial Flexipack Pvt Ltd | Flexible packaging; registered c/o Imperial Oilfield Chemicals (est. 2017) | MCA listing |
| SP Chemicals | Named in the meeting notes; an "S.P. Chemicals" sits next door at Baska, but its link to the group isn't confirmed | Needs confirmation |

## Decisions so far
- **Design:** keep the original light blue/white Manrope design (not the Claude Design screens).
- **Login:** email or mobile number + password. Admin creates the accounts.
- **Companies:** every module is available to every company; the admin switches modules per company.
- **WhatsApp & email:** two-way. The system sends and also receives/replies (inquiries come in automatically).
- **Flexipack POs:** sent over WhatsApp and mail; Bhavin sir can also enter orders by hand.
- **Hosting:** not decided yet. The app ships as Docker so it can run on the cloud, a VPS or an office server.

## Phase 0: Clickable mockup (done)
A single-page app with no backend, made to demo and close the deal. Data lives in the browser (`localStorage`), there is a "Reset demo data" button, and mail and WhatsApp are simulated (the message preview is shown, nothing is sent).

## Core flow (the backbone)
```
Lead → Inquiry → (auto filter: we make it?) → Quotation/MOQ/TDS mail
     → Customer PO (or "Approved by" override) → Payment terms (custom split)
     → Work Order (only after partial payment) → Inventory check / formulation
     → Production stages (checklist + operator) → QC → Dispatch (photos, CHA, HAZ)
     → Invoice (gated) → Payment reminders
```

## Modules
| # | Module | Key rules from the meeting |
|---|--------|---------------------------|
| 1 | Dashboard | KPIs, alerts (low stock, pending payments, blocked invoices) |
| 2 | Leads | Sources: IndiaMART, TradeIndia, website, manual. One-click "Call me / WhatsApp" capture |
| 3 | Inquiries | Product match → MOQ, price, quotation, T&C, TDS. No match → intro mail with call CTA |
| 4 | Products & Pricing | Editable price per kg/L, MOQ, density, hazardous flag, export alias name |
| 5 | Sales Orders (PO) | Litre↔kg mismatch detection using density. No PO → popup "Approved by ___". Custom payment split (50/50, 70/30, 100, any) |
| 6 | Payments | Schedule entries: x amount, x days, x client. Status: received / paused till approval / pending / cancelled. Reminders. USD + LC for export |
| 7 | Work Orders | Approval only after part payment. Transport (own / client / 3rd party), labelling (white label / Imperial), HAZ, export checklist, formulation (raw material codes), inventory check, stage timeline with operator, QC, customer dispatch message |
| 8 | Inventory | Raw material serials, low-stock alert, auto-deduct on production, PO popup until restocked |
| 9 | Procurement & Vendors | Fixed vendors, rate comparison vs market, unit mismatch, vendor approval, order history. Packaging vendors (one through WhatsApp/mail PO, one by manual entry) |
| 10 | Lab / R&D | Samples → trials → formulation + batch/serial. Full raw material traceability. Export name change keeps the same serial. QA (inward) / QC (supply) reports |
| 11 | Dispatch & Invoice | Photos filtered by date/client. Invoice only when photos, CHA and HAZ label are all done |
| 12 | Machines | Average maintenance time and cost, schedule |
| 13 | Team & Tasks | Day planner, call/message targets, tagging + notifications for the authorised person |
| 14 | HR & Attendance | Geo-fenced, camera check-in. Leaves (HR approves). OT rule: the first extra 30 min is unpaid, each further 30 min is paid. Holidays |
| 15 | Training | Modules + audio, weekly timed proctored tests, intern schedule (2 tests in month 1, targets from month 3), evaluation |
| 16 | Admin | Super admin, role × feature permission matrix, divisions |
| 17 | Market Intel | Client country → requirements / demand notes |

## Later phases (production build)
1. **Backend**: Node/NestJS or Django + PostgreSQL, real auth/RBAC, file storage (S3) for photos and documents.
2. **Integrations**: IndiaMART/TradeIndia lead APIs, Gmail/SMTP inbox parsing, WhatsApp Business API, Google Maps geofence.
3. **Documents**: PDF generation for quotation, PI, invoice, export docs (local vs export templates).
4. **Mobile**: PWA for attendance, dispatch photos and the shop-floor stage updates.
5. **Proctoring**: tab-switch detection, camera, fullscreen lock for tests.

## Open questions for Imperial
1. Exact division names, and which divisions share inventory or vendors?
2. Is GST / e-invoice integration needed in phase 1?
3. Who approves vendors, work orders and POs? (Need the approval chain per division.)
4. Batch / serial number format?
5. Geofence radius and office locations?
