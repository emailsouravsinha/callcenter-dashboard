-- Call Center AI Dashboard Database Setup
-- Complete schema for call center analytics and management

-- Create database
CREATE DATABASE IF NOT EXISTS callcenter_ai;
USE callcenter_ai;

-- 1. CALLS TABLE - Main conversation data
CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_calls_status (status),
    INDEX idx_calls_outcome (outcome),
    INDEX idx_calls_sentiment (sentiment),
    INDEX idx_calls_date (DATE(created_at)),
    INDEX idx_calls_phone (caller_phone)
);

-- 2. CONTACTS TABLE - Customer profiles
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    
    UNIQUE KEY unique_phone (phone),
    INDEX idx_contacts_email (email),
    INDEX idx_contacts_company (company),
    INDEX idx_contacts_status (status)
);

-- 3. APPOINTMENTS TABLE - Booking management
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    call_id INT,
    contact_id INT,
    appointment_date DATETIME NOT NULL,
    service_type VARCHAR(255),
    status ENUM('scheduled', 'confirmed', 'cancelled', 'no_show', 'completed') DEFAULT 'scheduled',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_appointments_date (appointment_date),
    INDEX idx_appointments_status (status)
);

-- 4. LEADS TABLE - Lead tracking
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_leads_status (status),
    INDEX idx_leads_qualification (qualification_score),
    INDEX idx_leads_follow_up (follow_up_date)
);

-- 5. USERS TABLE - Dashboard users with roles
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin', 'manager', 'agent', 'read_only') DEFAULT 'read_only',
    permissions JSON,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_role (role),
    INDEX idx_users_active (active)
);

-- 6. AUDIT_LOGS TABLE - Security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_date (DATE(created_at))
);

-- 7. SURVEYS TABLE - CSAT/NPS feedback
CREATE TABLE IF NOT EXISTS surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    call_id INT,
    contact_id INT,
    survey_type ENUM('csat', 'nps', 'feedback') DEFAULT 'csat',
    rating INT,
    feedback TEXT,
    sent_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX idx_surveys_type (survey_type),
    INDEX idx_surveys_rating (rating),
    INDEX idx_surveys_date (DATE(created_at))
);

-- INSERT SAMPLE DATA FOR TESTING

-- Sample contacts
INSERT INTO contacts (name, company, phone, email, status) VALUES
('Sarah Johnson', 'TechCorp Solutions', '+1-555-123-4567', 'sarah@techcorp.com', 'active'),
('Mike Chen', 'Global Manufacturing', '+1-555-987-6543', 'mike@globalmanuf.com', 'active'),
('Jennifer Davis', 'FinanceFlow Ltd', '+1-555-234-5678', 'jennifer@financeflow.com', 'active'),
('Robert Wilson', 'RetailChain Corp', '+1-555-345-6789', 'robert@retailchain.com', 'active'),
('Unknown Caller', NULL, '+1-555-456-7890', NULL, 'active');

-- Sample calls
INSERT INTO calls (caller_name, caller_phone, caller_email, start_time, end_time, duration, status, outcome, sentiment, intent, first_contact_resolution) VALUES
('Sarah Johnson', '+1-555-123-4567', 'sarah@techcorp.com', NOW() - INTERVAL 2 MINUTE, NOW(), '00:04:32', 'answered', 'appointment_booked', 'positive', 'Schedule Service', TRUE),
('Mike Chen', '+1-555-987-6543', 'mike@globalmanuf.com', NOW() - INTERVAL 8 MINUTE, NOW() - INTERVAL 6 MINUTE, '00:02:15', 'answered', 'info_only', 'neutral', 'Product Inquiry', TRUE),
('Unknown Caller', '+1-555-456-7890', NULL, NOW() - INTERVAL 15 MINUTE, NULL, NULL, 'missed', 'voicemail', 'neutral', 'Unknown', FALSE),
('Jennifer Davis', '+1-555-234-5678', 'jennifer@financeflow.com', NOW() - INTERVAL 23 MINUTE, NOW() - INTERVAL 17 MINUTE, '00:06:18', 'answered', 'lead_qualified', 'positive', 'Sales Inquiry', TRUE),
('Robert Wilson', '+1-555-345-6789', 'robert@retailchain.com', NOW() - INTERVAL 31 MINUTE, NOW() - INTERVAL 28 MINUTE, '00:03:42', 'answered', 'complaint', 'negative', 'Support Request', TRUE);

-- Sample appointments
INSERT INTO appointments (call_id, contact_id, appointment_date, service_type, status) VALUES
(1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Technical Consultation', 'scheduled'),
(4, 3, DATE_ADD(NOW(), INTERVAL 5 DAY), 'Sales Meeting', 'confirmed');

-- Sample leads
INSERT INTO leads (call_id, contact_id, source, qualification_score, status, interest_level) VALUES
(4, 3, 'phone_call', 85, 'qualified', 'high'),
(2, 2, 'phone_call', 60, 'qualified', 'medium'),
(1, 1, 'phone_call', 90, 'converted', 'high');

-- Sample users
INSERT INTO users (name, email, password_hash, role, active) VALUES
('John Doe', 'admin@callcenter.com', '$2b$10$example_hash', 'admin', TRUE),
('Jane Smith', 'manager@callcenter.com', '$2b$10$example_hash', 'manager', TRUE),
('Agent One', 'agent1@callcenter.com', '$2b$10$example_hash', 'agent', TRUE),
('Viewer User', 'viewer@callcenter.com', '$2b$10$example_hash', 'read_only', TRUE);

-- Sample surveys
INSERT INTO surveys (call_id, contact_id, survey_type, rating, feedback, completed_at) VALUES
(1, 1, 'csat', 5, 'Excellent service, very helpful AI assistant!', NOW() - INTERVAL 1 HOUR),
(4, 3, 'csat', 4, 'Good experience, quick response time.', NOW() - INTERVAL 30 MINUTE),
(2, 2, 'nps', 8, 'Would recommend to others.', NOW() - INTERVAL 15 MINUTE);

-- Update contact call counts
UPDATE contacts SET total_calls = (
    SELECT COUNT(*) FROM calls WHERE calls.caller_phone = contacts.phone
);

-- Show created tables
SHOW TABLES;

-- Show table structures
DESCRIBE calls;
DESCRIBE contacts;
DESCRIBE appointments;