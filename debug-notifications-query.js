const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import database function
const { query } = require('./lib/database');

async function debugNotificationsQuery() {
  console.log('🔍 Debugging notifications query...');
  
  try {
    // Test basic database connection
    console.log('\n1. Testing basic database connection...');
    const testQuery = await query('SELECT 1 as test');
    console.log('✅ Database connection successful:', testQuery);
    
    // Test notifications table structure
    console.log('\n2. Checking notifications table structure...');
    const tableStructure = await query('DESCRIBE notifications');
    console.log('✅ Notifications table structure:');
    tableStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Test the exact query from the API
    console.log('\n3. Testing the exact query from notifications API...');
    const userId = 1; // admin user ID
    
    const sql = `
      SELECT n.*, 
             CASE 
               WHEN n.reference_type = 'equipment' THEN e.name
               WHEN n.reference_type = 'service_order' THEN so.number
               ELSE NULL
             END as related_name
      FROM notifications n
      LEFT JOIN equipment e ON n.reference_type = 'equipment' AND n.reference_id = e.id
      LEFT JOIN service_orders so ON n.reference_type = 'service_order' AND n.reference_id = so.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC LIMIT 50
    `;
    
    console.log('Query:', sql);
    console.log('Parameters:', [userId]);
    
    const notifications = await query(sql, [userId]);
    console.log('✅ Query executed successfully!');
    console.log('Result:', notifications);
    
    // Test count query
    console.log('\n4. Testing count query...');
    const countResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    console.log('✅ Count query successful:', countResult);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
}

debugNotificationsQuery();