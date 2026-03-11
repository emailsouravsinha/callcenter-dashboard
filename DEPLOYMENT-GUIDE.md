# Call Center Dashboard - Deployment Guide

Complete step-by-step guide to build, deploy, and test your multi-tenant call center dashboard.

---

## Prerequisites

- Node.js 18+ installed
- MySQL database (AWS Lightsail or local)
- Database already set up with `database-saas-setup.sql`

---

## Step 1: Configure Environment Variables (2 minutes)

### On Your Local Machine:

```bash
cd dashboard-project

# Edit .env.local with your database credentials
nano .env.local
```

Update these values:
```env
DB_HOST=your-actual-database-host.com
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=callcenter_saas
DB_SSL=true
ORGANIZATION_ID=1
```

**Important:** 
- `DB_NAME` must be `callcenter_saas` (the multi-tenant database)
- `ORGANIZATION_ID` determines which organization's data you see (1 = Acme Corporation, 2 = TechStart Inc)

---

## Step 2: Install Dependencies (3 minutes)

```bash
# Make sure you're in dashboard-project directory
cd dashboard-project

# Install all npm packages
npm install

# This will install:
# - Next.js 16.1.1
# - React 19.2.3
# - Tailwind CSS 3
# - Recharts (for charts)
# - mysql2 (database driver)
```

---

## Step 3: Test Database Connection (1 minute)

```bash
# Test if the database connection works
npm run dev

# Open browser to http://localhost:3001
# Check the terminal for any database connection errors
```

If you see errors like "Cannot connect to database", verify:
- Database host is accessible
- Credentials are correct
- Database `callcenter_saas` exists
- Firewall allows port 3306

---

## Step 4: Build for Production (2 minutes)

```bash
# Stop dev server (Ctrl+C)

# Build the production version
npm run build

# This creates optimized production files in .next folder
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (7/7)
✓ Finalizing page optimization
```

---

## Step 5: Test Production Build Locally (1 minute)

```bash
# Start production server locally
npm start

# Open browser to http://localhost:3001
```

You should see:
- Dashboard with KPIs (Total Calls, Answer Rate, etc.)
- Call volume charts
- Recent calls table
- Real-time connection indicator

---

## Step 6: Deploy to Remote Server

### Option A: Deploy to Your Remote Server (Recommended)

#### 6.1 Copy Files to Server

```bash
# From your local machine
# Replace USER and SERVER with your details

# Copy entire dashboard-project folder
scp -r dashboard-project USER@SERVER:/path/to/deployment/

# Or use rsync (better for updates)
rsync -avz --exclude 'node_modules' --exclude '.next' \
  dashboard-project/ USER@SERVER:/path/to/deployment/dashboard-project/
```

#### 6.2 Install on Server

```bash
# SSH into your server
ssh USER@SERVER

# Navigate to dashboard directory
cd /path/to/deployment/dashboard-project

# Install dependencies
npm install

# Build for production
npm run build
```

#### 6.3 Set Up Environment Variables on Server

```bash
# Edit .env.local on server
nano .env.local

# Add your production database credentials
```

#### 6.4 Start with PM2 (Process Manager)

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the dashboard
pm2 start npm --name "dashboard" -- start

# Or specify port
pm2 start npm --name "dashboard" -- start -- -p 3001

# Save PM2 configuration
pm2 save

# Set up auto-restart on server reboot
pm2 startup
# Follow the command it gives you

# Check status
pm2 status

# View logs
pm2 logs dashboard

# Monitor in real-time
pm2 monit
```

### Option B: Deploy with Docker

```bash
# Build Docker image
docker build -t callcenter-dashboard .

# Run container
docker run -d \
  --name dashboard \
  -p 3001:3000 \
  --env-file .env.local \
  callcenter-dashboard

# Check logs
docker logs -f dashboard
```

---

## Step 7: Set Up Reverse Proxy (Optional but Recommended)

If you want to access via domain name (e.g., dashboard.yourcompany.com):

### Using Nginx:

```nginx
server {
    listen 80;
    server_name dashboard.yourcompany.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Using Nginx Proxy Manager (GUI):

1. Add new proxy host
2. Domain: `dashboard.yourcompany.com`
3. Forward to: `localhost:3001`
4. Enable SSL with Let's Encrypt

---

## Step 8: Testing Checklist

### 8.1 Basic Functionality

- [ ] Dashboard loads without errors
- [ ] KPI cards show data (Total Calls, Answer Rate, etc.)
- [ ] Call volume chart displays
- [ ] Recent calls table shows call records
- [ ] Real-time indicator shows "Connected"

### 8.2 Data Verification

```bash
# Check if data is showing from correct organization
# In browser console (F12):
console.log('Organization ID:', process.env.NEXT_PUBLIC_ORGANIZATION_ID || 1);

# Or check database directly:
mysql -h YOUR_HOST -u YOUR_USER -p -D callcenter_saas -e \
  "SELECT COUNT(*) as total_calls FROM calls WHERE organization_id = 1;"
```

### 8.3 Real-Time Updates

1. Make a test call to your Twilio number
2. Watch the dashboard - new call should appear within 5 seconds
3. Check if KPIs update automatically
4. Verify notification popup appears for new calls

### 8.4 Multi-Tenant Isolation

```bash
# Test with different organization IDs
# Stop the dashboard
pm2 stop dashboard

# Edit .env.local
nano .env.local
# Change ORGANIZATION_ID=2

# Restart
pm2 restart dashboard

# Verify you see different data (TechStart Inc instead of Acme Corp)
```

---

## Step 9: Monitoring and Maintenance

### Check Application Logs

```bash
# PM2 logs
pm2 logs dashboard

# Last 100 lines
pm2 logs dashboard --lines 100

# Only errors
pm2 logs dashboard --err
```

### Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# Check memory usage
pm2 show dashboard
```

### Restart Dashboard

```bash
# Restart after code changes
pm2 restart dashboard

# Reload without downtime
pm2 reload dashboard

# Stop dashboard
pm2 stop dashboard

# Start dashboard
pm2 start dashboard
```

---

## Step 10: Troubleshooting

### Issue: Dashboard shows "No data available"

**Solution:**
1. Check database connection in logs
2. Verify `ORGANIZATION_ID` matches data in database
3. Run query to check if data exists:
```sql
SELECT COUNT(*) FROM calls WHERE organization_id = 1;
```

### Issue: "Cannot connect to database"

**Solution:**
1. Verify database credentials in `.env.local`
2. Check if database server is running
3. Test connection:
```bash
mysql -h YOUR_HOST -u YOUR_USER -p -D callcenter_saas -e "SELECT 1;"
```
4. Check firewall allows port 3306

### Issue: Real-time updates not working

**Solution:**
1. Check if `/api/realtime` endpoint is accessible
2. Open browser console (F12) and look for errors
3. Verify Server-Sent Events (SSE) connection:
```javascript
// In browser console
fetch('/api/realtime').then(r => console.log(r.status))
```

### Issue: Port 3001 already in use

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use different port
pm2 start npm --name "dashboard" -- start -- -p 3002
```

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Check for type errors
npm run build

# If errors persist, check:
# 1. Node.js version (should be 18+)
node --version

# 2. Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

---

## Step 11: Accessing the Dashboard

### Local Development:
```
http://localhost:3001
```

### Production (Direct IP):
```
http://YOUR_SERVER_IP:3001
```

### Production (With Domain):
```
https://dashboard.yourcompany.com
```

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server (port 3001)

# Production
npm run build            # Build for production
npm start                # Start production server

# PM2 Management
pm2 start npm --name dashboard -- start
pm2 stop dashboard
pm2 restart dashboard
pm2 logs dashboard
pm2 monit
pm2 delete dashboard

# Database Queries
mysql -h HOST -u USER -p -D callcenter_saas -e "SELECT COUNT(*) FROM calls;"
mysql -h HOST -u USER -p -D callcenter_saas -e "SELECT * FROM calls ORDER BY created_at DESC LIMIT 5;"
```

---

## Security Checklist

- [ ] `.env.local` is NOT committed to git (check `.gitignore`)
- [ ] Database password is strong
- [ ] Database only allows connections from your server IP
- [ ] Dashboard is behind HTTPS (use Let's Encrypt)
- [ ] Firewall only allows necessary ports (80, 443, 3001)
- [ ] Regular database backups are configured

---

## Next Steps

1. **Add Authentication** - Implement login system for dashboard users
2. **Create Admin Panel** - Manage organizations, users, subscriptions
3. **Add More Features**:
   - Export calls to CSV
   - Advanced filtering
   - Call recording playback
   - Analytics reports
4. **Set Up Monitoring** - Use tools like Datadog, New Relic, or Grafana
5. **Configure Alerts** - Get notified of system issues

---

## Support

If you encounter issues:
1. Check logs: `pm2 logs dashboard`
2. Verify database connection
3. Check firewall settings
4. Review this guide's troubleshooting section

Your dashboard is now ready to monitor your AI call center! 🎉
