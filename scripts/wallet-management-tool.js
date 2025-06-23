// Wallet Connection Management Tool
// Run this in your browser console on your app or in a Node.js environment

// Configuration
const WALLET_ADDRESS = 'YOUR_WALLET_ADDRESS_HERE'; // Replace with actual wallet address
const TARGET_EMAILS = [
  'monu80850raj@gmail.com',
  'narendrasinghchouhan2022@vitbhopal.ac.in', 
  'rmonu3605@gmail.com'
];

// Initialize Supabase client (make sure you're on your app page or import supabase)
// const { supabase } = window; // If running in browser console on your app
// OR import supabase if running in Node.js

async function investigateWalletConnections() {
  console.log('🔍 Investigating wallet connections...');
  
  try {
    // Get user data for target emails
    const { data: users, error } = await supabase
      .from('auth.users')
      .select('id, email, wallet_address, raw_user_meta_data')
      .in('email', TARGET_EMAILS);

    if (error) throw error;

    console.log('📊 Current wallet connections:');
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`  - Wallet Address: ${user.wallet_address || 'None'}`);
      console.log(`  - Metadata Wallet: ${user.raw_user_meta_data?.wallet_address || 'None'}`);
      console.log(`  - User ID: ${user.id}`);
      console.log('---');
    });

    return users;
  } catch (error) {
    console.error('❌ Error investigating wallet connections:', error);
    return null;
  }
}

async function removeWalletFromUser(email) {
  console.log(`🗑️ Removing wallet from ${email}...`);
  
  try {
    const { error } = await supabase
      .from('auth.users')
      .update({ wallet_address: null })
      .eq('email', email);

    if (error) throw error;
    
    console.log(`✅ Successfully removed wallet from ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing wallet from ${email}:`, error);
    return false;
  }
}

async function assignWalletToUser(email, walletAddress) {
  console.log(`🔗 Assigning wallet ${walletAddress} to ${email}...`);
  
  try {
    const { error } = await supabase
      .from('auth.users')
      .update({ wallet_address: walletAddress })
      .eq('email', email);

    if (error) throw error;
    
    console.log(`✅ Successfully assigned wallet to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error assigning wallet to ${email}:`, error);
    return false;
  }
}

async function fixWalletConnections() {
  console.log('🔧 Starting wallet connection fix...');
  
  // Step 1: Investigate current state
  const users = await investigateWalletConnections();
  if (!users) return;

  // Step 2: Remove wallet from narendrasinghchouhan2022@vitbhopal.ac.in
  const narendraUser = users.find(u => u.email === 'narendrasinghchouhan2022@vitbhopal.ac.in');
  if (narendraUser && narendraUser.wallet_address) {
    console.log('🎯 Removing wallet from narendrasinghchouhan2022@vitbhopal.ac.in...');
    await removeWalletFromUser('narendrasinghchouhan2022@vitbhopal.ac.in');
  }

  // Step 3: Ensure wallet is connected to monu80850raj@gmail.com
  const monuUser = users.find(u => u.email === 'monu80850raj@gmail.com');
  if (monuUser && !monuUser.wallet_address && WALLET_ADDRESS !== 'YOUR_WALLET_ADDRESS_HERE') {
    console.log('🎯 Assigning wallet to monu80850raj@gmail.com...');
    await assignWalletToUser('monu80850raj@gmail.com', WALLET_ADDRESS);
  }

  // Step 4: Add wallet to rmonu3605@gmail.com if needed
  const rmonu3605User = users.find(u => u.email === 'rmonu3605@gmail.com');
  if (rmonu3605User && !rmonu3605User.wallet_address && WALLET_ADDRESS !== 'YOUR_WALLET_ADDRESS_HERE') {
    const addToRmonu = confirm('Do you want to add the wallet to rmonu3605@gmail.com as well?');
    if (addToRmonu) {
      console.log('🎯 Assigning wallet to rmonu3605@gmail.com...');
      await assignWalletToUser('rmonu3605@gmail.com', WALLET_ADDRESS);
    }
  }

  // Step 5: Verify final state
  console.log('🔍 Final verification...');
  await investigateWalletConnections();
  
  console.log('✅ Wallet connection fix completed!');
}

// Helper functions you can run individually
window.walletTools = {
  investigate: investigateWalletConnections,
  removeWallet: removeWalletFromUser,
  assignWallet: assignWalletToUser,
  fixAll: fixWalletConnections
};

console.log(`
🛠️ Wallet Connection Management Tool Loaded!

Available commands:
- walletTools.investigate() - Check current wallet connections
- walletTools.removeWallet('email') - Remove wallet from specific user
- walletTools.assignWallet('email', 'wallet_address') - Assign wallet to user
- walletTools.fixAll() - Run complete fix process

⚠️ IMPORTANT: Update WALLET_ADDRESS variable before running fixes!
`);

// Uncomment to run investigation immediately
// investigateWalletConnections();
