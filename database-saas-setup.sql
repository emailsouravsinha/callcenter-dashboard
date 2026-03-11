-- ============================================================================
-- CALL CENTER AI - SAAS MULTI-TENANT DATABASE SCHEMA
-- Complete multi-tenant architecture with data isolation
-- ============================================================================

CREATE DATABASE IF NOT EXISTS callcenter_saas;
USE callcenter_saas;

-- ============================================================================
-- CORE SAAS TABLES (Multi-Tenancy)
-- ============================================================================

-- 1. ORGANIZATIONS TABLE - Your SaaS customers/tenants
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    status ENUM('active', 'suspended', 'cancelled', 'trial') DEFAULT 'trial',
    trial_ends_at TIMESTAMP NULL,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_status (status),
    INDEX idx_org_slug (slug)
);

-- 2. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSON,
    limits JSON, -- {max_calls: 1000, max_users: 5, max_contacts: 10000}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_plan_slug (slug)
);

-- 3. SUBSCRIPTIONS TABLE - Links organizations to plans
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'past_due', 'trialing') DEFAULT 'trialing',
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
    current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_sub_org (organization_id),
    INDEX idx_sub_status (status)
);

-- 4. INVOICES TABLE - Billing history
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    subscription_id INT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'open', 'paid', 'void', 'uncollectible') DEFAULT 'open',
    due_date DATE,
    paid_at TIMESTAMP NULL,
    stripe_invoice_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    INDEX idx_invoice_org (organization_id),
    INDEX idx_invoice_status (status)
);

-- ============================================================================
-- USER MANAGEMENT (Multi-Tenant)
-- ============================================================================

-- 5. USERS TABLE - All users across all organizations
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    is_super_admin BOOLEAN DEFAULT FALSE, -- Platform admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email)
);

-- 6. ORGANIZATION_USERS TABLE - Links users to organizations with roles
CREATE TABLE IF NOT EXISTS organization_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'manager', 'agent', 'read_only') DEFAULT 'agent',
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    invited_by INT,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP NULL,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_org_user (organization_id, user_id),
    INDEX idx_org_users_org (organization_id),
    INDEX idx_org_users_user (user_id),
    INDEX idx_org_users_role (role)
);

-- ============================================================================
-- CALL CENTER DATA (Multi-Tenant with organization_id)
-- ============================================================================

-- 7. CALLS TABLE - Main conversation data (TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- TENANT ISOLATION
    caller_name VARCHAR(255),
    caller_phone VARCHAR(50),
    caller_email VARCHAR(255),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration TIME NULL,
    status ENUM('answered', 'missed', 'abandoned', 'transferred') DEFAULT 'answered',
    outcome ENUM('appointment_booked', 'lead_qualified', 'info_only', 'complaint', 'voicemail', 'transferred') DEFAULT 'info_only',
    transcript TEXT,
    ai_summary TEXT,
    sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    intent VARCHAR(100),
    topic_tags JSON,
    first_contact_resolution BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_calls_org (organization_id),
    INDEX idx_calls_status (organization_id, status),
    INDEX idx_calls_outcome (organization_id, outcome),
    INDEX idx_calls_date (organization_id, created_at),
    INDEX idx_calls_phone (organization_id, caller_phone)
);

-- 8. CONTACTS TABLE - Customer profiles (TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- TENANT ISOLATION
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    tags JSON,
    first_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_calls INT DEFAULT 0,
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_phone (organization_id, phone),
    INDEX idx_contacts_org (organization_id),
    INDEX idx_contacts_email (organization_id, email),
    INDEX idx_contacts_status (organization_id, status)
);

-- 9. APPOINTMENTS TABLE - Booking management (TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- TENANT ISOLATION
    call_id INT,
    contact_id INT,
    appointment_date DATETIME NOT NULL,
    service_type VARCHAR(255),
    status ENUM('scheduled', 'confirmed', 'cancelled', 'no_show', 'completed') DEFAULT 'scheduled',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_appointments_org (organization_id),
    INDEX idx_appointments_date (organization_id, appointment_date),
    INDEX idx_appointments_status (organization_id, status)
);

-- 10. LEADS TABLE - Lead tracking (TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- TENANT ISOLATION
    call_id INT,
    contact_id INT,
    source VARCHAR(100) DEFAULT 'phone_call',
    qualification_score INT DEFAULT 0,
    status ENUM('new', 'qualified', 'unqualified', 'converted', 'lost') DEFAULT 'new',
    interest_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_leads_org (organization_id),
    INDEX idx_leads_status (organization_id, status),
    INDEX idx_leads_follow_up (organization_id, follow_up_date)
);

-- 11. SURVEYS TABLE - CSAT/NPS feedback (TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- TENANT ISOLATION
    call_id INT,
    contact_id INT,
    survey_type ENUM('csat', 'nps', 'feedback') DEFAULT 'csat',
    rating INT,
    feedback TEXT,
    sent_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_surveys_org (organization_id),
    INDEX idx_surveys_type (organization_id, survey_type),
    INDEX idx_surveys_rating (organization_id, rating)
);

-- 12. AUDIT_LOGS TABLE - Security tracking (TENANT ISOLATED)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL, -- TENANT ISOLATION
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_org (organization_id),
    INDEX idx_audit_user (organization_id, user_id),
    INDEX idx_audit_date (organization_id, created_at)
);

-- ============================================================================
-- USAGE TRACKING (For billing and limits)
-- ============================================================================

-- 13. USAGE_METRICS TABLE - Track usage for billing
CREATE TABLE IF NOT EXISTS usage_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    metric_type ENUM('calls', 'storage_mb', 'api_requests', 'transcription_minutes') NOT NULL,
    quantity INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_usage_org (organization_id),
    INDEX idx_usage_period (organization_id, period_start, period_end)
);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Sample subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
('Starter', 'starter', 'Perfect for small teams', 29.00, 290.00, 
 '["Up to 1,000 calls/month", "5 team members", "Basic analytics", "Email support"]',
 '{"max_calls": 1000, "max_users": 5, "max_contacts": 5000}'),
('Professional', 'professional', 'For growing businesses', 99.00, 990.00,
 '["Up to 10,000 calls/month", "25 team members", "Advanced analytics", "Priority support", "Custom integrations"]',
 '{"max_calls": 10000, "max_users": 25, "max_contacts": 50000}'),
('Enterprise', 'enterprise', 'Unlimited scale', 299.00, 2990.00,
 '["Unlimited calls", "Unlimited users", "White-label", "Dedicated support", "Custom AI training"]',
 '{"max_calls": -1, "max_users": -1, "max_contacts": -1}');

-- Sample organization (Customer 1)
INSERT INTO organizations (name, slug, domain, status, trial_ends_at) VALUES
('Acme Corporation', 'acme-corp', 'acme.com', 'active', DATE_ADD(NOW(), INTERVAL 14 DAY)),
('TechStart Inc', 'techstart', 'techstart.io', 'trial', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Sample subscription for Acme
INSERT INTO subscriptions (organization_id, plan_id, status, billing_cycle, current_period_end) VALUES
(1, 2, 'active', 'monthly', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(2, 1, 'trialing', 'monthly', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Sample users
INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_super_admin) VALUES
('admin@platform.com', '$2b$10$example_hash', 'Platform', 'Admin', TRUE, TRUE),
('john@acme.com', '$2b$10$example_hash', 'John', 'Doe', TRUE, FALSE),
('jane@acme.com', '$2b$10$example_hash', 'Jane', 'Smith', TRUE, FALSE),
('bob@techstart.io', '$2b$10$example_hash', 'Bob', 'Wilson', TRUE, FALSE);

-- Link users to organizations
INSERT INTO organization_users (organization_id, user_id, role, is_active, joined_at) VALUES
(1, 2, 'owner', TRUE, NOW()),
(1, 3, 'admin', TRUE, NOW()),
(2, 4, 'owner', TRUE, NOW());

-- Sample contacts for Acme (organization_id = 1)
INSERT INTO contacts (organization_id, name, company, phone, email, status) VALUES
(1, 'Sarah Johnson', 'TechCorp Solutions', '+1-555-123-4567', 'sarah@techcorp.com', 'active'),
(1, 'Mike Chen', 'Global Manufacturing', '+1-555-987-6543', 'mike@globalmanuf.com', 'active'),
(1, 'Jennifer Davis', 'FinanceFlow Ltd', '+1-555-234-5678', 'jennifer@financeflow.com', 'active');

-- Sample calls for Acme (organization_id = 1)
INSERT INTO calls (organization_id, caller_name, caller_phone, caller_email, start_time, end_time, duration, status, outcome, sentiment, intent, first_contact_resolution) VALUES
(1, 'Sarah Johnson', '+1-555-123-4567', 'sarah@techcorp.com', NOW() - INTERVAL 2 MINUTE, NOW(), '00:04:32', 'answered', 'appointment_booked', 'positive', 'Schedule Service', TRUE),
(1, 'Mike Chen', '+1-555-987-6543', 'mike@globalmanuf.com', NOW() - INTERVAL 8 MINUTE, NOW() - INTERVAL 6 MINUTE, '00:02:15', 'answered', 'info_only', 'neutral', 'Product Inquiry', TRUE),
(1, 'Jennifer Davis', '+1-555-234-5678', 'jennifer@financeflow.com', NOW() - INTERVAL 23 MINUTE, NOW() - INTERVAL 17 MINUTE, '00:06:18', 'answered', 'lead_qualified', 'positive', 'Sales Inquiry', TRUE);

-- Sample appointments for Acme
INSERT INTO appointments (organization_id, call_id, contact_id, appointment_date, service_type, status) VALUES
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Technical Consultation', 'scheduled');

-- Sample leads for Acme
INSERT INTO leads (organization_id, call_id, contact_id, source, qualification_score, status, interest_level) VALUES
(1, 3, 3, 'phone_call', 85, 'qualified', 'high');

-- Sample surveys for Acme
INSERT INTO surveys (organization_id, call_id, contact_id, survey_type, rating, feedback, completed_at) VALUES
(1, 1, 1, 'csat', 5, 'Excellent service!', NOW() - INTERVAL 1 HOUR);

-- ============================================================================
-- SHOW CREATED TABLES
-- ============================================================================

SHOW TABLES;

SELECT 'Database setup complete! Multi-tenant SaaS architecture ready.' as Status;