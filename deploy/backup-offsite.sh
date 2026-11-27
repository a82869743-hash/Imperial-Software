#!/usr/bin/env bash
# Copy the newest backups and all uploads out of the Docker volume to a folder you sync off the server
# (e.g. with rclone to Google Drive). Run daily from cron:  0 2 * * * /opt/imperial/deploy/backup-offsite.sh /backups
set -euo pipefail
DEST="${1:?usage: backup-offsite.sh /path/to/folder}"
mkdir -p "$DEST"
docker compose -f "$(dirname "$0")/../docker-compose.yml" cp erp:/data/backups "$DEST/"
docker compose -f "$(dirname "$0")/../docker-compose.yml" cp erp:/data/uploads "$DEST/"
echo "Copied backups and uploads to $DEST"
