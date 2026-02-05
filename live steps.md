
## 🔄 Step 8: Future Updates

### 8.1 Update Code from GitHub
```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Navigate to project
cd /var/www/devbhakti

# Pull latest code
git pull origin master
```

### 8.2 Update Backend
```bash
cd /var/www/devbhakti/devbhakti-backend

# Install new dependencies (if any)
npm install

# Generate Prisma Client (if schema changed)
npx prisma generate

# Run migrations (if any)
npx prisma migrate deploy

# Rebuild
npm run build

# Restart PM2
pm2 restart devbhakti-backend

# Check logs
pm2 logs devbhakti-backend --lines 30
```

### 8.3 Update Frontend
```bash
cd /var/www/devbhakti/devbhakti-frontend

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Reload PM2 (graceful reload)
pm2 reload ecosystem.config.cjs

# Check logs
pm2 logs devbhakti-frontend --lines 30
```

### 8.4 Verify Updates
```bash
# Check PM2 status
pm2 status

# Check application in browser
# Visit your domain or IP
```

---

## 🛠️ Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs                              # All logs
pm2 logs devbhakti-backend           # Backend logs only
pm2 logs devbhakti-frontend          # Frontend logs only
pm2 logs --lines 100                 # Last 100 lines

# Restart processes
pm2 restart devbhakti-backend
pm2 restart devbhakti-frontend
pm2 restart all

# Stop processes
pm2 stop devbhakti-backend
pm2 stop devbhakti-frontend
pm2 stop all

# Delete processes
pm2 delete devbhakti-backend
pm2 delete devbhakti-frontend