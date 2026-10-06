# RAITE 2026 - Production VPS Full Backup Playbook

This playbook outlines the exact, step-by-step procedure to create a comprehensive post-event backup of the RAITE 2026 system deployed on your Ubuntu 24.04 LTS VPS (`psitecl.org`).

---

## 📋 What Gets Backed Up
1. **PostgreSQL Database** (Full binary `.dump` + human-readable `.sql` snapshot).
2. **Production Environment Secrets** (`.env`, `.env.production` containing Clerk, Supabase, Google Drive, Resend, and Redis credentials).
3. **Application Source Code & Build State** (Git commits, configuration, scripts, Prisma migrations).
4. **Web Server & SSL Configs** (Nginx virtual host `/etc/nginx/sites-available/psitecl.org` and Let's Encrypt certificates).
5. **Process Manager State** (PM2 process dump and ecosystem configuration).

---

## 🚀 Quick Method: Automated One-Click Backup Script

SSH into your VPS and run the following commands:

```bash
# 1. Switch to root/sudo
sudo su

# 2. Navigate to your app directory
cd /var/www/raite-website

# 3. Create the backup script
cat << 'EOF' > /var/www/raite-website/scripts/vps-backup.sh
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

LATEST_JSON_BACKUP=$(ls -td "${APP_DIR}/backups"/raite_2026_backup_* | head -1)
if [ -d "${LATEST_JSON_BACKUP}" ]; then
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
pm2 save || true
cp ~/.pm2/dump.pm2 "${BACKUP_DIR}/config/pm2_dump.json" 2>/dev/null || true

# 5. Application Code Archive
echo ">>> [5/5] Packaging Application Codebase..."
tar -czvf "${BACKUP_DIR}/raite_source_code.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    -C "${APP_DIR}" .

# Create Compressed Master Archive
cd "${BACKUP_ROOT}"
MASTER_ARCHIVE="raite2026_full_backup_${BACKUP_DATE}.tar.gz"
tar -czvf "${MASTER_ARCHIVE}" "raite2026_snapshot_${BACKUP_DATE}"

echo "=================================================="
echo " ✅ Full Backup Complete!"
echo " Master Archive: ${BACKUP_ROOT}/${MASTER_ARCHIVE}"
echo " Size: $(du -sh ${BACKUP_ROOT}/${MASTER_ARCHIVE} | cut -f1)"
echo "=================================================="
EOF

# 4. Make executable and run
chmod +x /var/www/raite-website/scripts/vps-backup.sh
/var/www/raite-website/scripts/vps-backup.sh
```

---

## 🛠️ Manual Step-by-Step Procedure

If you prefer executing commands individually, follow these phases on your VPS:

### Phase 1: Database Snapshot
```bash
cd /var/www/raite-website

# Run the Prisma backup script to export all 12 tables to JSON
npx tsx scripts/backup-full-database.ts

# Export PostgreSQL SQL dump directly using your direct connection URI
export DIRECT_URL=$(grep "^DIRECT_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
pg_dump "$DIRECT_URL" -F c -b -v -f /root/raite_postgres_backup.dump
pg_dump "$DIRECT_URL" -F p -b -v -f /root/raite_postgres_backup.sql
```

### Phase 2: Configuration & Environment Files
```bash
mkdir -p /root/raite_backup_bundle/config

# Copy .env secrets
cp /var/www/raite-website/.env* /root/raite_backup_bundle/config/
```

### Phase 3: Nginx & SSL Certificates
```bash
mkdir -p /root/raite_backup_bundle/nginx
mkdir -p /root/raite_backup_bundle/ssl

# Nginx virtual host for psitecl.org
cp /etc/nginx/sites-available/psitecl.org /root/raite_backup_bundle/nginx/
cp /etc/nginx/nginx.conf /root/raite_backup_bundle/nginx/

# Let's Encrypt SSL certificates
cp -rL /etc/letsencrypt/live/psitecl.org /root/raite_backup_bundle/ssl/
```

### Phase 4: Application Source Code
```bash
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    -czvf /root/raite_backup_bundle/source_code.tar.gz -C /var/www/raite-website .
```

### Phase 5: Create Compressed Master Bundle
```bash
cd /root
tar -czvf raite2026_vps_master_backup.tar.gz raite_backup_bundle/ raite_postgres_backup.*
```

---

## 💻 How to Download the Backup to Your Local Machine

Run this in **PowerShell** on your local computer to download the complete archive:

```powershell
# In local PowerShell (Replace YOUR_VPS_IP with your actual VPS IP address):
scp root@YOUR_VPS_IP:/root/raite_backups/raite2026_full_backup_*.tar.gz C:\Users\AJ\IAS\Raite_Website\backups\
```

---

## 🔄 Disaster Recovery / Restoration Steps

If you ever need to restore the platform onto a new VPS:

1. **Restore Code**:
   ```bash
   mkdir -p /var/www/raite-website
   tar -xzvf raite_source_code.tar.gz -C /var/www/raite-website
   cp config/.env /var/www/raite-website/.env
   ```

2. **Restore Database**:
   ```bash
   pg_restore -d "$DIRECT_URL" -v db/postgres_full.dump
   # OR
   psql "$DIRECT_URL" -f db/postgres_full.sql
   ```

3. **Restore Nginx & SSL**:
   ```bash
   cp nginx/psitecl.org /etc/nginx/sites-available/
   ln -s /etc/nginx/sites-available/psitecl.org /etc/nginx/sites-enabled/
   nginx -t && systemctl restart nginx
   ```

4. **Rebuild & Start PM2**:
   ```bash
   cd /var/www/raite-website
   yarn install
   npx prisma generate
   NODE_OPTIONS="--max-old-space-size=4096" yarn build
   pm2 start yarn --name "raite-website" -- start
   pm2 save
   ```
