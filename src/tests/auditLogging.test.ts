/**
 * Audit Logging Test Script
 * 
 * This script tests the audit logging functionality to verify that the RLS policy
 * issue has been fixed. It attempts to delete a user and ensures that the audit
 * logging works correctly without violating RLS policies.
 */

import { AdminService } from '../services/adminService';
import { AuditService } from '../services/auditService';
import { supabase } from '../integrations/supabase/client';

// Test user ID to delete (replace with an actual test user ID)
const TEST_USER_ID = 'test-user-id';
// Admin user ID performing the deletion
const ADMIN_USER_ID = 'admin-user-id';

async function testUserDeletion() {
  console.log('Starting audit logging test...');
  
  try {
    // First, check if the test user exists
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', TEST_USER_ID)
      .single();
    
    if (getUserError || !user) {
      console.log(`Test user ${TEST_USER_ID} not found. Please create a test user first.`);
      return;
    }
    
    console.log(`Found test user: ${user.email}`);
    
    // Test direct audit logging
    try {
      console.log('Testing direct audit logging...');
      const auditLog = await AuditService.logAuditEvent(
        ADMIN_USER_ID,
        'delete',
        'users',
        TEST_USER_ID,
        { email: user.email, role: user.role },
        null,
        user.client_id
      );
      
      console.log('Direct audit logging successful:', auditLog.id);
    } catch (auditError) {
      console.error('Direct audit logging failed:', auditError);
    }
    
    // Test user deletion with audit logging
    try {
      console.log('Testing user deletion with audit logging...');
      await AdminService.deleteUser(TEST_USER_ID, ADMIN_USER_ID);
      console.log('User deletion with audit logging successful!');
    } catch (deleteError) {
      console.error('User deletion failed:', deleteError);
    }
    
    console.log('Test completed.');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testUserDeletion();
