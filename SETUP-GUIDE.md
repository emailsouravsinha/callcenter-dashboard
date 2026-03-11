# 🚀 SaaS Dashboard Setup Guide

## Quick Start

### 1. **Choose Your Database Setup**

#### Option A: AWS Lightsail (Production)
```bash
# 1. Create MySQL database in AWS Lightsail
# 2. Note your connection details
# 3. Update .env.local with your credentials
```

#### Option B: Local MySQL (Development)
```bash
# Install MySQL locally
brew install mysql  # macOS
# or
sudo apt-get install mysql-server  # Linux

# Start MySQL
mysql.server start  # macOS
# or
sudo service mysql start  # Linux
```

---

### 2. **Configure Environment Variables**

Edit `dashboard-project/.env.local`:

```env
# For AWS Lightsail
DB_HOST=ls-xxxxx.czowadgeezqi.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=dbmasteruser
DB_PASSWORD=your-password-here
DB_NAME=callcenter_saas
DB_SSL=true

# For Local Development
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your-local-password
# DB_NAME=callcenter_saas
# DB_SSL=false
```

---

### 3. **Run Database Setup**

#### For SaaS Multi-Tenant (Recommended)
```bash
# Connect to your MySQL database
mysql -h YOUR_HOST -u YOUR_USER -p

# Run the SaaS setup script
source dashboard-project/database-saas-setup.sql
```

#### For Single-Tenant (Simple)
```bash
# If you just want to test without multi-tenancy
source dashboard-project/database-setup.sql
```

---

### 4. **Test Database Connection**

```bash
# Start the dashboard
cd dashboard-project
npm run dev

# Visit the test endpoint
open http://localhost:3001/api/test-db
```

You should see:
```json
{
  "success": true,
  "message": "Database connection successful"
}
```

---

### 5. **View Your Dashboard**

```bash
# Dashboard is running at:
open http://localhost:3001
```

You should see:
- ✅ Real-time KPIs updating every 5 seconds
- ✅ "Live" indicator in top bar
- ✅ Call volume charts
- ✅ Recent calls table
- ✅ Pop-up notifications for new calls

---

## 📊 Database Comparison

### **Single-Tenant** (`database-setup.sql`)
- ✅ Simpler structure
- ✅ Good for testing
- ✅ One organization only
- ❌ Not suitable for SaaS

### **Multi-Tenant SaaS** (`database-saas-setup.sql`)
- ✅ Production-ready
- ✅ Unlimited customers
- ✅ Complete data isolation
- ✅ Subscription billing ready
- ✅ Usage tracking included

---

## 🔐 Security Checklist

### **Before Going Live:**

- [ ] Change all default passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Set up database backups (daily)
- [ ] Configure firewall rules
- [ ] Implement rate limiting
- [ ] Add authentication (JWT/OAuth)
- [ ] Enable audit logging
- [ ] Set up monitoring alerts
- [ ] Review and test data isolation
- [ ] Implement GDPR compliance features

---

## 🎯 Sample Data Included

The setup scripts include sample data:

### **Organizations**
- Acme Corporation (Active)
- TechStart Inc (Trial)

### **Users**
- admin@platform.com (Super Admin)
- john@acme.com (Owner at Acme)
- jane@acme.com (Admin at Acme)
- bob@techstart.io (Owner at TechStart)

### **Sample Calls, Contacts, Appointments**
- 3 calls for Acme Corporation
- 3 contacts with interaction history
- 1 appointment scheduled
- 1 qualified lead
- 1 customer survey

---

## 🛠️ Troubleshooting

### **Connection Failed**
```bash
# Check MySQL is running
mysql --version

# Test connection manually
mysql -h YOUR_HOST -u YOUR_USER -p

# Check firewall allows port 3306
telnet YOUR_HOST 3306
```

### **Permission Denied**
```sql
-- Grant permissions to your user
GRANT ALL PRIVILEGES ON callcenter_saas.* TO 'your_user'@'%';
FLUSH PRIVILEGES;
```

### **SSL Connection Issues**
```env
# Try disabling SSL for local development
DB_SSL=false
```

### **Dashboard Shows Mock Data**
- Database connection failed (check logs)
- Queries are falling back to mock data
- Check `.env.local` configuration
- Verify database has sample data

---

## 📈 Next Steps

### **1. Implement Authentication**
- [ ] Add NextAuth.js or similar
- [ ] Create login/signup pages
- [ ] Implement JWT tokens with organization_id
- [ ] Add password reset flow

### **2. Add Stripe Integration**
- [ ] Create Stripe account
- [ ] Add subscription checkout
- [ ] Implement webhooks
- [ ] Handle payment failures

### **3. Build Admin Panel**
- [ ] Organization management
- [ ] User management
- [ ] Subscription management
- [ ] Usage monitoring

### **4. Deploy to Production**
- [ ] Set up AWS Lightsail database
- [ ] Configure production environment
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and SSL

---

## 📚 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check database connection
curl http://localhost:3001/api/test-db

# View real-time updates
curl http://localhost:3001/api/realtime

# Check dashboard stats
curl http://localhost:3001/api/dashboard/stats
```

---

## 🆘 Need Help?

### **Common Issues:**
1. **Port 3001 already in use**: Change port in `package.json`
2. **Database connection timeout**: Check firewall/security groups
3. **Real-time not working**: Check browser console for errors
4. **Mock data showing**: Database queries are failing

### **Resources:**
- MySQL Documentation: https://dev.mysql.com/doc/
- AWS Lightsail: https://aws.amazon.com/lightsail/
- Next.js Docs: https://nextjs.org/docs

---

**You're all set! Your SaaS dashboard is ready to scale! 🎉**
