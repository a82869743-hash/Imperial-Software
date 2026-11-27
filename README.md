# Imperial ERP + CRM

Group-wide ERP/CRM for Imperial Oilfield Chemicals, Imperial Agro, Imperial Flexipack and SP Chemicals.
Node.js server + SQLite database. Data is shared live between all staff.

## Run on a computer (Node 20+)

```bash
npm install
ADMIN_PASSWORD=choose-a-strong-one npm start
```

Open http://localhost:3000 and sign in as `admin@imperial.local` with that password.
If `ADMIN_PASSWORD` isn't set, a random password is printed in the console on first start.

On first sign-in the admin chooses **Start empty** or **Load demo data**. Demo staff sign in with their
first name, e.g. `rohan@imperial.demo`, password `imperial-demo`.

## Logins

| Login | Who | Sees |
|---|---|---|
| Main login (Super Admin) | Owner | Every company and section, every approval in the group, all settings |
| Company Login | One shared login per company | Only its own company's orders, stock, production, dispatch and machines |
| Production Head | Nirav Sir | CHEM, AGRO and SPC together |
| Marketing Head, Accounts, HR | Jagruti Mam and teams | Whole group |
| Purchase & Store, Lab / R&D, Sales, interns | Staff | Their own section |

Each login opens on its own dashboard. The **Approvals** page lists what that login approves
(work orders, purchase orders, rejected deliveries, QA release, leave, test audits); the main login sees and can act on all of them.
Company access is set per user in Admin → Users ("Company access"). Leave every company unticked for a group-wide login.
The server enforces the lock: a company login never receives another company's records and cannot save them.

Demo company logins: `chem@`, `agro@`, `spc@`, `flexipack@imperial.demo` (password `imperial-demo`).

## Run with Docker (any server or cloud)

```bash
docker compose up -d --build
```

Edit `ADMIN_PASSWORD` in `docker-compose.yml` first. Data is kept in the `erp-data` volume.
For use over the internet, put it behind HTTPS (e.g. Caddy or Nginx); sessions automatically use secure cookies there.

## Settings (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 3000 | Web port |
| `DATA_DIR` | `./data` | Where the database file lives |
| `ADMIN_EMAIL` / `ADMIN_PHONE` / `ADMIN_PASSWORD` | — | First Super Admin (only used on the very first start) |
| `DEMO_PASSWORD` | `imperial-demo` | Password for demo staff |

## Backups

Copy `data/imperial.db` (or the Docker volume) daily. That single file is the whole database.

## How it works

- **Login:** email or mobile number + password. Sessions last 30 days. 10 wrong tries locks that IP for 15 minutes.
- **Roles:** the Super Admin sets which modules each role sees, and which modules each company uses (Admin page). The server rejects changes a role isn't allowed to make.
- **Live sync:** changes save within a second and other users see them within 15 seconds. If two people edit the same list at once, both edits are kept.
- **Customer tracking:** each work order has a private link (`/track/…`) showing its stage and expected dispatch date, and dispatch photos once dispatched.
- **Mail / WhatsApp:** messages are generated and previewed; sending and receiving connect once the accounts are provided.
