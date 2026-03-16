#!/usr/bin/env node

/**
 * Setup script to add demo users to the database
 * Usage: node setup-users.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
};

async function setupUsers() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database');

    // Create organizations if they don't exist
    console.log('\nSetting up organizations...');
    
    await connection.execute(
      `INSERT IGNORE INTO organizations (id, name, slug, status) 
       VALUES (1, 'Acme Corporation', 'acme', 'active')`
    );
    console.log('✓ Acme Corporation organization created');

    await connection.execute(
      `INSERT IGNORE INTO organizations (id, name, slug, status) 
       VALUES (2, 'TechStart Inc', 'techstart', 'active')`
    );
    console.log('✓ TechStart Inc organization created');

    // Create users
    console.log('\nSetting up users...');
    
    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, email_verified) 
       VALUES (1, 'john@acme.com', 'demo_password_hash', 'John', 'Doe', TRUE)`
    );
    console.log('✓ User john@acme.com created');

    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, email_verified) 
       VALUES (2, 'bob@techstart.com', 'demo_password_hash', 'Bob', 'Smith', TRUE)`
    );
    console.log('✓ User bob@techstart.com created');

    // Link users to organizations
    console.log('\nLinking users to organizations...');
    
    await connection.execute(
      `INSERT IGNORE INTO organization_users (user_id, organization_id, role, is_active) 
       VALUES (1, 1, 'owner', TRUE)`
    );
    console.log('✓ john@acme.com linked to Acme Corporation as owner');

    await connection.execute(
      `INSERT IGNORE INTO organization_users (user_id, organization_id, role, is_active) 
       VALUES (2, 2, 'admin', TRUE)`
    );
    console.log('✓ bob@techstart.com linked to TechStart Inc as admin');

    console.log('\n✓ Setup complete!');
    console.log('\nDemo credentials:');
    console.log('  Email: john@acme.com (Acme Corporation - Owner)');
    console.log('  Email: bob@techstart.com (TechStart Inc - Admin)');
    console.log('  Password: any password (demo mode)');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupUsers();
