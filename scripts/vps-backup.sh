#!/bin/bash
set -e

BACKUP_DATE=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_ROOT="/root/raite_backups"
BACKUP_DIR="${BACKUP_ROOT}/raite2026_snapshot_${BACKUP_DATE}"
APP_DIR="/var/www/raite-website"

echo "=================================================="
echo " Starting RAITE 2026 Full System Backup..."
echo " Target Directory: ${BACKUP_DIR}"
echo "=================================================="

mkdir -p "${BACKUP_DIR}/db"
mkdir -p "${BACKUP_DIR}/config"
mkdir -p "${BACKUP_DIR}/nginx"
mkdir -p "${BACKUP_DIR}/ssl"

# 1. Database Backup via Prisma script (JSON)
echo ">>> [1/5] Dumping Database JSON Snapshot via Prisma..."
cd "${APP_DIR}"
npx tsx scripts/backup-full-database.ts || true

LATEST_JSON_BACKUP=$(ls -td "${APP_DIR}/backups"/raite_2026_backup_* 2>/dev/null | head -1 || true)
if [ -n "${LATEST_JSON_BACKUP}" ] && [ -d "${LATEST_JSON_BACKUP}" ]; then
  cp -r "${LATEST_JSON_BACKUP}" "${BACKUP_DIR}/db/prisma_json_snapshot"
fi

# 2. Database Backup via pg_dump (if DIRECT_URL is set in .env)
echo ">>> [2/5] Creating PostgreSQL pg_dump..."
if [ -f "${APP_DIR}/.env" ]; then
  DIRECT_URL=$(grep "^DIRECT_URL=" "${APP_DIR}/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "${DIRECT_URL}" ]; then
    pg_dump "${DIRECT_URL}" -F c -b -v -f "${BACKUP_DIR}/db/postgres_full.dump" 2>/dev/null || true
    pg_dump "${DIRECT_URL}" -F p -b -v -f "${BACKUP_DIR}/db/postgres_full.sql" 2>/dev/null || true
  fi
fi

# 3. Environment & Configuration Secrets
echo ">>> [3/5] Backing up Environment Variables..."
cp "${APP_DIR}/.env"* "${BACKUP_DIR}/config/" 2>/dev/null || true

# 4. Nginx, SSL & PM2 Configs
echo ">>> [4/5] Backing up Nginx, SSL & PM2 State..."
cp /etc/nginx/sites-available/psitecl.org "${BACKUP_DIR}/nginx/" 2>/dev/null || true
cp /etc/nginx/nginx.conf "${BACKUP_DIR}/nginx/" 2>/dev/null || true
cp -rL /etc/letsencrypt/live/psitecl.org "${BACKUP_DIR}/ssl/" 2>/dev/null || true
pm2 save 2>/dev/null || true
cp ~/.pm2/dump.pm2 "${BACKUP_DIR}/config/pm2_dump.json" 2>/dev/null || true

# 5. Application Code Archive
echo ">>> [5/5] Packaging Application Codebase..."
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    -czvf "${BACKUP_DIR}/raite_source_code.tar.gz" -C "${APP_DIR}" .

# Create Compressed Master Archive
cd "${BACKUP_ROOT}"
MASTER_ARCHIVE="raite2026_full_backup_${BACKUP_DATE}.tar.gz"
tar -czvf "${MASTER_ARCHIVE}" "raite2026_snapshot_${BACKUP_DATE}"

echo "=================================================="
echo " ✅ Full Backup Complete!"
echo " Master Archive: ${BACKUP_ROOT}/${MASTER_ARCHIVE}"
echo " Size: $(du -sh ${BACKUP_ROOT}/${MASTER_ARCHIVE} | cut -f1)"
echo "=================================================="
