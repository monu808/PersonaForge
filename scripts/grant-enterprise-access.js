#!/usr/bin/env node

/**
 * Script to grant enterprise access to a user
 * Usage: node grant-enterprise-access.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use service role key if available
const userEmail = 'Monu80850raj@gmail.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantEnterpriseAccess() {
  try {
    console.log(`🔍 Looking for user with email: ${userEmail}`);
    
    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('profiles') // Assuming you have a profiles table, or check auth.users
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (userError || !users) {
      console.error('❌ User not found:', userError?.message || 'No user found');
      
      // Try to check in auth.users (requires service role key)
      console.log('🔍 Checking auth.users table...');
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Cannot access auth.users:', authError.message);
        console.log('💡 You may need to use the Supabase service role key instead of anon key');
        return;
      }
      
      const user = authUsers.users.find(u => u.email === userEmail);
      if (!user) {
        console.error('❌ User not found in auth.users');
        return;
      }
      
      console.log(`✅ Found user: ${user.id}`);
      await createSubscription(user.id);
      return;
    }

    console.log(`✅ Found user: ${users.id}`);
    await createSubscription(users.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function createSubscription(userId) {
  try {
    console.log('📝 Creating enterprise subscription...');
    
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    // Create or update subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        status: 'active',
        plan_id: 'enterprise',
        current_period_start: now.toISOString(),
        current_period_end: oneYearLater.toISOString(),
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ Error creating subscription:', subError.message);
      return;
    }

    console.log('✅ Enterprise subscription created successfully!');
    console.log(`📅 Valid until: ${oneYearLater.toDateString()}`);
    
    // Initialize usage
    console.log('📊 Initializing usage tracking...');
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const { error: usageError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        personas_created: 0,
        text_to_speech_used: 0,
        voice_clones_created: 0,
        live_conversation_minutes_used: 0,
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (usageError) {
      console.error('⚠️  Warning: Could not initialize usage tracking:', usageError.message);
    } else {
      console.log('✅ Usage tracking initialized');
    }
    
    console.log(`🎉 Enterprise access granted to ${userEmail}!`);
    console.log('🔄 The user may need to refresh their browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Error creating subscription:', error.message);
  }
}

// Run the script
grantEnterpriseAccess();
