# Trivia Party - Production Deployment Plan

## Overview
Deploy Trivia Party to Ubuntu 18 server at trivia.azabab.com with:
- PocketBase x64 Linux binary running on port 8090
- React frontend served from pb_public/
- Systemd service for auto-start/restart
- Nginx reverse proxy with SSL
- Deployment scripts for future updates

## Prerequisites
- Server: Ubuntu 18 with nginx and certbot installed
- SSH: root@<server-ip> with key at ~/.ssh/id_rsa
- Domain: trivia.azabab.com DNS pointing to server IP

---

## Phase 1: Server Setup & PocketBase Installation

### 1.1 Download and Install PocketBase Binary
```bash
# On server
cd /root
mkdir -p pocketbase/trivia
cd pocketbase/trivia
wget https://github.com/pocketbase/pocketbase/releases/download/v0.30.3/pocketbase_0.30.3_linux_amd64.zip
unzip pocketbase_0.30.3_linux_amd64.zip
chmod +x pocketbase
rm pocketbase_0.30.3_linux_amd64.zip
```

### 1.2 Create Directory Structure
```bash
cd /root/pocketbase/trivia
mkdir -p pb_migrations pb_public pb_data/storage
```

---

## Phase 2: Deploy Application Files

### 2.1 Build Frontend Locally
```bash
# On local machine
cd ~/dev/trivia-party
pnpm run build  # Outputs to dist/
```

### 2.2 Copy Files to Server
```bash
# Copy frontend build to pb_public
rsync -avz --delete dist/ root@<server-ip>:/root/pocketbase/trivia/pb_public/

# Copy migrations
rsync -avz pb_migrations/ root@<server-ip>:/root/pocketbase/trivia/pb_migrations/

# Copy questions data and import script
scp questions.tsv root@<server-ip>:/root/pocketbase/trivia/
scp scripts/import-questions-efficient.js root@<server-ip>:/root/pocketbase/trivia/
```

**Note:** No environment configuration needed! The frontend auto-detects the PocketBase URL at runtime based on the current hostname and protocol.

---

## Phase 3: Initialize Database

### 3.1 Start PocketBase Temporarily (First Run)
```bash
cd /root/pocketbase/trivia
./pocketbase serve --http=0.0.0.0:8090
# Migrations will run automatically
# Ctrl+C after server starts successfully
```

### 3.2 Create Superuser
```bash
./pocketbase superuser upsert admin@example.com <strong-password>
```

### 3.3 Import Questions Data
```bash
cd /root/pocketbase/trivia

# Install Node.js if not present
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Run import with environment variables
POCKETBASE_URL=http://localhost:8090 \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=<strong-password> \
node import-questions-efficient.js
```

---

## Phase 4: Configure Systemd Service

### 4.1 Create Service File
Create `/etc/systemd/system/pocketbase.service`:
```ini
[Unit]
Description=Trivia Party
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/root/pocketbase/trivia
ExecStart=/root/pocketbase/trivia/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 4.2 Enable and Start Service
```bash
systemctl daemon-reload
systemctl enable pocketbase
systemctl start pocketbase
systemctl status pocketbase  # Verify running
```

---

## Phase 5: Configure Nginx

### 5.1 Create Nginx Site Configuration
Create `/etc/nginx/sites-available/trivia.azabab.com`:
```nginx
server {
    listen 80;
    server_name trivia.azabab.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Enable Site and Test Config
```bash
ln -s /etc/nginx/sites-available/trivia.azabab.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Phase 6: Configure SSL with Let's Encrypt

### 6.1 Install/Update Certbot (if needed)
```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate
```bash
certbot --nginx -d trivia.azabab.com --non-interactive --agree-tos --email <your-email>
```
This automatically:
- Obtains certificate
- Updates nginx config to use SSL
- Sets up auto-renewal

### 6.3 Verify Auto-Renewal
```bash
certbot renew --dry-run
systemctl list-timers | grep certbot  # Check renewal timer
```

---

## Phase 7: Create Local Deployment Scripts

### 7.1 Create `scripts/deploy-frontend.sh`
```bash
#!/bin/bash
set -e

SERVER="root@<server-ip>"
REMOTE_PATH="/root/pocketbase/trivia"

echo "Building frontend..."
pnpm run build

echo "Deploying to server..."
rsync -avz --delete dist/ $SERVER:$REMOTE_PATH/pb_public/

echo "Frontend deployed successfully!"
echo "Visit https://trivia.azabab.com"
```

### 7.2 Create `scripts/deploy-migrations.sh`
```bash
#!/bin/bash
set -e

SERVER="root@<server-ip>"
REMOTE_PATH="/root/pocketbase/trivia"

echo "Deploying migrations..."
rsync -avz pb_migrations/ $SERVER:$REMOTE_PATH/pb_migrations/

echo "Restarting PocketBase to apply migrations..."
ssh $SERVER "systemctl restart pocketbase"

echo "Waiting for service to restart..."
sleep 3

ssh $SERVER "systemctl status pocketbase"

echo "Migrations deployed successfully!"
```

### 7.3 Create `scripts/deploy-full.sh`
```bash
#!/bin/bash
set -e

echo "=== Full Deployment ==="
echo "1. Building and deploying frontend..."
./scripts/deploy-frontend.sh

echo ""
echo "2. Deploying migrations..."
./scripts/deploy-migrations.sh

echo ""
echo "=== Deployment Complete ==="
```

### 7.4 Make Scripts Executable
```bash
chmod +x scripts/deploy-*.sh
```

---

## Phase 8: Verification & Testing

### 8.1 Service Health Checks
```bash
# On server
systemctl status pocketbase
journalctl -u pocketbase -n 50  # Check logs
curl http://localhost:8090/_/  # Admin panel
```

### 8.2 Nginx & SSL Checks
```bash
curl -I https://trivia.azabab.com  # Should return 200 OK
openssl s_client -connect trivia.azabab.com:443 -servername trivia.azabab.com
```

### 8.3 Application Functionality
- Visit https://trivia.azabab.com (should load React app)
- Visit https://trivia.azabab.com/_/ (admin panel)
- Test authentication (login/signup)
- Create test game and verify database operations
- Check that questions loaded (should have ~60K questions)

---

## Post-Deployment Configuration

### Database Backups (Recommended)
```bash
# Add to crontab on server
0 2 * * * /root/pocketbase/trivia/pocketbase backup /root/backups
```

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Deploy frontend only | `./scripts/deploy-frontend.sh` |
| Deploy migrations only | `./scripts/deploy-migrations.sh` |
| Full deployment | `./scripts/deploy-full.sh` |
| Check service status | `ssh root@<server-ip> systemctl status pocketbase` |
| View logs | `ssh root@<server-ip> journalctl -u pocketbase -f` |
| Restart service | `ssh root@<server-ip> systemctl restart pocketbase` |

---

## Success Criteria
- ✅ PocketBase running on port 8090, auto-starts on boot
- ✅ Frontend accessible at https://trivia.azabab.com
- ✅ SSL certificate active with auto-renewal configured
- ✅ ~60K questions imported and queryable
- ✅ Database migrations applied successfully
- ✅ Deployment scripts ready for future updates
- ✅ Service restarts automatically on crash

---

## Troubleshooting

### PocketBase Won't Start
```bash
journalctl -u pocketbase -n 100  # Check logs
# Common issues: port already in use, permissions, missing migrations
```

### SSL Certificate Issues
```bash
certbot certificates  # Check certificate status
certbot renew --dry-run  # Test renewal
```

### Frontend Not Loading
```bash
# Check nginx is proxying correctly
curl -I http://localhost:8090
# Check pb_public has files
ls -la /root/pocketbase/trivia/pb_public/
```

### Questions Not Importing
```bash
# Check Node.js is installed
node --version
# Verify PocketBase is running
curl http://localhost:8090/api/health
# Check admin credentials match
```

---

## Architecture Notes

### File Structure on Server
```
/root/pocketbase/trivia/
├── pocketbase              # Binary executable
├── pb_migrations/          # Database migrations (auto-applied on start)
├── pb_public/              # Static frontend files (served by PocketBase)
├── pb_data/
│   ├── data.db            # SQLite database
│   ├── auxiliary.db       # Auxiliary database
│   └── storage/           # User uploads
├── questions.tsv          # Question import data
└── import-questions-efficient.js  # Import script
```

### How It Works
1. **PocketBase** runs as systemd service, serves both API (port 8090) and static files
2. **Nginx** reverse proxies HTTPS traffic to PocketBase on localhost:8090
3. **Frontend** built with Vite, copied to `pb_public/`, served by PocketBase
4. **Migrations** in `pb_migrations/` apply automatically when PocketBase starts
5. **SSL** handled by Let's Encrypt with automatic renewal via certbot
6. **Deployment** uses rsync to sync build output and migrations, then restarts service

### Security Considerations
- PocketBase only listens on 127.0.0.1 (not exposed directly to internet)
- All external traffic goes through nginx with SSL
- Admin panel accessible at `/_/` (consider restricting via nginx if needed)
- Database backups recommended (cron job suggested above)
- Strong admin password required
- SSH key authentication in use
