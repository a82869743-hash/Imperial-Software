# Deploying Imperial ERP

The app is one Node.js server with a SQLite database. Everything it stores (database, uploaded photos and files,
daily backups) lives in one data folder. In production it runs in Docker behind Caddy, which gets and renews the
HTTPS certificate on its own.

## What you need

- A Linux server (VPS or office machine) with **2 GB RAM, 1–2 vCPU, 40 GB disk**. Ubuntu 22.04 or 24.04 is a good default.
  Any provider works: DigitalOcean, AWS Lightsail, Hetzner, a Hostinger VPS, or a machine in the office.
- A domain or subdomain for the app, e.g. `erp.imperialagro.in`.
- Ports **80** and **443** open to the internet. Caddy uses port 80 to prove you own the domain.

## Option A: Docker (recommended)

1. **Point the domain at the server.** In your DNS, add an `A` record for `erp.imperialagro.in` with the server's IP address.
2. **Install Docker** on the server:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Copy the app to the server**, e.g. into `/opt/imperial`, using `git clone` or by uploading the folder.
4. **Create the settings file:**
   ```bash
   cd /opt/imperial
   cp .env.example .env
   nano .env
   ```
   Set `DOMAIN`, `ADMIN_EMAIL` and a long `ADMIN_PASSWORD`. The admin details are used only on the very first start.
5. **Start it:**
   ```bash
   docker compose up -d --build
   ```
6. Open `https://erp.imperialagro.in`. It can take up to a minute the first time while the certificate is issued.
   Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then choose **Start empty**.

### Updating to a new version

```bash
cd /opt/imperial
git pull
docker compose up -d --build
```

Data is kept in the `erp-data` Docker volume, so updates and restarts never touch it.

### Checking that it runs

```bash
docker compose ps
docker compose logs -f erp
```

`https://your-domain/healthz` returns `{"ok":true}` when the app and database are healthy.

## Option B: without Docker

For a server where Docker isn't wanted. Needs Node.js 20 or newer.

```bash
sudo useradd --system --home /opt/imperial-erp imperial
sudo mkdir -p /opt/imperial-erp /var/lib/imperial-erp
# copy the app into /opt/imperial-erp, then:
cd /opt/imperial-erp && sudo npm ci --omit=dev
sudo cp .env.example .env && sudo nano .env        # set ADMIN_EMAIL / ADMIN_PASSWORD
sudo chown -R imperial:imperial /opt/imperial-erp /var/lib/imperial-erp
sudo cp deploy/imperial-erp.service /etc/systemd/system/
sudo systemctl enable --now imperial-erp
```

The app then listens on port 3000. Put Caddy or Nginx in front of it for HTTPS. With Caddy, the
`deploy/Caddyfile` works as is if you change `erp:3000` to `localhost:3000`.

## Backups

- **Automatic:** a copy of the database is written every day to `backups/` inside the data folder.
  The last 14 days are kept; change this with `BACKUP_KEEP` in `.env`.
- **Off the server (do this):** copy the backups and uploaded files somewhere else every night, so a lost server
  doesn't lose data:
  ```bash
  crontab -e
  # add:
  0 2 * * * /opt/imperial/deploy/backup-offsite.sh /opt/imperial-backups
  ```
  Then sync `/opt/imperial-backups` to Google Drive or similar, for example with `rclone`.

### Restoring a backup

```bash
docker compose stop erp
docker compose cp ./imperial-2026-11-27.db erp:/data/imperial.db
docker compose start erp
```

## Security notes

- Sign-in sessions use secure, HTTP-only cookies over HTTPS. After 10 wrong passwords an address is locked for 15 minutes.
- Each company login only ever receives its own company's data. The server enforces this.
- The client-facing pages (`/track/…` for order tracking, `/connect/…` for the call and WhatsApp buttons) open
  only with a private random link. The connect page is limited to 10 requests per hour from each address.
- Don't choose **Load demo data** on the live system. Demo staff share one known password.

## Before going live

- [ ] `.env` has a long `ADMIN_PASSWORD`; the admin changes it after the first sign-in (account menu).
- [ ] Settings → Company & GST: GSTIN, PAN, address and bank details for each company.
- [ ] Settings → WhatsApp & email: the numbers and addresses the mail buttons should connect to.
- [ ] Admin → Users: create the company logins (tick one company under Company access) and the team logins.
- [ ] Attendance → settings: office and plant locations with radius, and shift times.
- [ ] Off-server backup cron job is set up.
- [ ] Test on a phone: selfie check-in, location, dispatch photo upload, training audio recording.
