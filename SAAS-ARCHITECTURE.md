# 🏢 SaaS Multi-Tenant Architecture

## Overview
This database schema supports a **multi-tenant SaaS** application where multiple organizations (customers) share the same database with complete data isolation.

---

## 📊 Database Structure

### **Total Tables: 13**
- **4 SaaS Core Tables** (Organizations, Plans, Subscriptions, Billing)
- **2 User Management Tables** (Users, Organization-User Links)
- **6 Call Center Tables** (Calls, Contacts, Appointments, Leads, Surveys, Audit Logs)
- **1 Usage Tracking Table** (For billing and limits)

---

## 🔐 Multi-Tenancy Strategy

### **Shared Database with Tenant Isolation**
Every data table includes `organization_id` to ensure:
- ✅ Complete data isolation between customers
- ✅ Cost-effective (one database for all customers)
- ✅ Easy maintenance and updates
- ✅ Efficient resource utilization

### **Security Features**
1. **Row-Level Security**: All queries MUST filter by `organization_id`
2. **Foreign Key Constraints**: Automatic cascade deletes
3. **Indexed Queries**: Fast lookups with composite indexes
4. **Audit Logging**: Track all user actions per organization

---

## 📋 Table Breakdown

### **1. Core SaaS Tables**

#### `organizations` - Your SaaS Customers
```sql
- id, name, slug, domain
- status: active, suspended, cancelled, trial
- trial_ends_at, settings, timezone
```

#### `subscription_plans` - Pricing Tiers
```sql
- name, slug, description
- price_monthly, price_yearly
- features (JSON), limits (JSON)
```

#### `subscriptions` - Active Subscriptions
```sql
- organization_id, plan_id
- status, billing_cycle
- stripe_subscription_id, stripe_customer_id
```

#### `invoices` - Billing History
```sql
- organization_id, subscription_id
- invoice_number, amount, status
- stripe_invoice_id
```

---

### **2. User Management**

#### `users` - All Platform Users
```sql
- email, password_hash
- first_name, last_name, avatar_url
- is_super_admin (platform admin flag)
```

#### `organization_users` - User-Organization Links
```sql
- organization_id, user_id
- role: owner, admin, manager, agent, read_only
- permissions (JSON)
```

**Key Feature**: Users can belong to multiple organizations!

---

### **3. Call Center Data (Tenant Isolated)**

All tables include `organization_id` for data isolation:

#### `calls` - Conversation Records
```sql
- organization_id (TENANT ISOLATION)
- caller_name, caller_phone, caller_email
- duration, status, outcome, sentiment
- transcript, ai_summary, recording_url
```

#### `contacts` - Customer Profiles
```sql
- organization_id (TENANT ISOLATION)
- name, company, phone, email
- total_calls, tags (JSON)
```

#### `appointments` - Bookings
```sql
- organization_id (TENANT ISOLATION)
- call_id, contact_id
- appointment_date, service_type, status
```

#### `leads` - Sales Pipeline
```sql
- organization_id (TENANT ISOLATION)
- call_id, contact_id
- qualification_score, status, interest_level
```

#### `surveys` - Customer Feedback
```sql
- organization_id (TENANT ISOLATION)
- call_id, contact_id
- survey_type (csat, nps), rating, feedback
```

#### `audit_logs` - Security Tracking
```sql
- organization_id (TENANT ISOLATION)
- user_id, action, resource_type
- ip_address, user_agent
```

---

### **4. Usage Tracking**

#### `usage_metrics` - Billing & Limits
```sql
- organization_id
- metric_type: calls, storage_mb, api_requests
- quantity, period_start, period_end
```

**Purpose**: Track usage for:
- Billing overages
- Plan limit enforcement
- Analytics and reporting

---

## 🎯 Sample Subscription Plans

### **Starter Plan** - $29/month
- 1,000 calls/month
- 5 team members
- 5,000 contacts
- Basic analytics

### **Professional Plan** - $99/month
- 10,000 calls/month
- 25 team members
- 50,000 contacts
- Advanced analytics + integrations

### **Enterprise Plan** - $299/month
- Unlimited calls
- Unlimited users
- Unlimited contacts
- White-label + custom AI training

---

## 🔒 Data Isolation Rules

### **Critical Security Requirements**

1. **ALWAYS filter by organization_id**
```sql
-- ✅ CORRECT
SELECT * FROM calls WHERE organization_id = ? AND status = 'answered';

-- ❌ WRONG - Exposes all organizations' data!
SELECT * FROM calls WHERE status = 'answered';
```

2. **Use middleware to inject organization_id**
```typescript
// Every API request must include organization context
const orgId = await getOrganizationFromSession(req);
const calls = await db.query('SELECT * FROM calls WHERE organization_id = ?', [orgId]);
```

3. **Validate organization access**
```typescript
// Check user belongs to organization before any operation
const hasAccess = await checkUserOrganizationAccess(userId, organizationId);
if (!hasAccess) throw new UnauthorizedError();
```

---

## 🚀 Implementation Checklist

### **Backend (API Layer)**
- [ ] Create authentication middleware
- [ ] Add organization context to all requests
- [ ] Implement row-level security in queries
- [ ] Add usage tracking for billing
- [ ] Create subscription management endpoints
- [ ] Implement Stripe integration

### **Frontend (Dashboard)**
- [ ] Organization switcher (for users in multiple orgs)
- [ ] Subscription management UI
- [ ] Usage metrics display
- [ ] Billing/invoice history
- [ ] Team member management
- [ ] Role-based permissions UI

### **Database**
- [x] Multi-tenant schema created
- [ ] Run migration on production
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts

---

## 💡 Key Benefits

### **For You (SaaS Provider)**
✅ Single codebase for all customers
✅ Easy to add new features globally
✅ Centralized monitoring and maintenance
✅ Lower infrastructure costs
✅ Simplified backups and disaster recovery

### **For Your Customers**
✅ Fast onboarding (no separate database setup)
✅ Instant updates and new features
✅ Reliable performance
✅ Secure data isolation
✅ Flexible team management

---

## 📈 Scaling Considerations

### **When to Shard/Split**
Consider separate databases when:
- Single organization uses >50% of resources
- Database size exceeds 100GB
- Specific customer needs custom schema
- Regulatory requirements demand physical isolation

### **Optimization Tips**
1. **Partition large tables** by organization_id
2. **Cache frequently accessed data** (plans, organization settings)
3. **Use read replicas** for analytics queries
4. **Archive old data** (calls older than 1 year)
5. **Monitor slow queries** and add indexes

---

## 🔧 Next Steps

1. **Run the SQL script**: `database-saas-setup.sql`
2. **Update application code** to use organization_id
3. **Implement authentication** with organization context
4. **Add Stripe integration** for payments
5. **Create admin panel** for managing customers
6. **Set up monitoring** and alerts

---

## 📚 Additional Resources

- **Stripe Integration**: For subscription billing
- **JWT Tokens**: Include organization_id in claims
- **Redis Caching**: Cache organization settings
- **Monitoring**: Track per-organization metrics

---

**Your SaaS is now ready to scale! 🚀**
