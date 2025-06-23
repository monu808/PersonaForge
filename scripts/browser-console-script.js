/**
 * Simple script to grant enterprise access
 * Run this in the browser console on your app, or create an admin endpoint
 */

// Step 1: Get the user ID
async function findUserId(email) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Please login as admin first');
    return;
  }
  
  // This requires admin access - you might need to implement this differently
  console.log(`Looking for user with email: ${email}`);
  return null; // You'll need to get this from your admin panel or database
}

// Step 2: Grant enterprise access (run this with the user ID)
async function grantEnterpriseAccess(userId) {
  if (!userId) {
    console.error('User ID is required');
    return;
  }

  try {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    // Create enterprise subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        status: 'active',
        plan_id: 'enterprise',
        current_period_start: now.toISOString(),
        current_period_end: oneYearLater.toISOString(),
        updated_at: now.toISOString()
      });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('✅ Enterprise access granted!');
    console.log('Valid until:', oneYearLater.toDateString());

    // Initialize usage
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    await supabase
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
      });

    console.log('✅ Usage tracking initialized');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage:
// 1. First find the user ID manually from Supabase dashboard (auth.users table)
// 2. Then run: grantEnterpriseAccess('USER_ID_HERE')

console.log('Enterprise access script loaded');
console.log('Usage: grantEnterpriseAccess("USER_ID_HERE")');
