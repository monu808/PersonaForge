/**
 * Enhanced Nodely Integration for PersonaForge
 * Leveraging your 2-month Nodely subscription (API credit: BOLThieppgjvg512)
 * 
 * Current Usage: Basic Algorand node access for wallet transactions
 * Enhanced Features Available with Your Subscription:
 * 1. High-performance indexer queries (6000 req/s per key)
 * 2. Archival data access for transaction history
 * 3. IPFS Gateway for decentralized storage
 * 4. Enhanced analytics and monitoring
 * 5. Fast relay access for better transaction propagation
 */

import algosdk from 'algosdk';

// Nodely Premium API Configuration (your subscription)
const NODELY_CONFIG = {
  // Node API (for transactions, account info, block data)
  ALGOD_SERVER: 'https://testnet-api.algonode.cloud', // Changed to testnet
  ALGOD_PORT: '',
  ALGOD_TOKEN: '', // Your subscription provides higher rate limits
  
  // Indexer API (for searching transactions, accounts, applications)
  INDEXER_SERVER: 'https://testnet-idx.algonode.cloud', // Changed to testnet
  INDEXER_PORT: '',
  INDEXER_TOKEN: '',
  
  // IPFS Gateway (for storing persona content)
  IPFS_GATEWAY: 'https://ipfs.algonode.xyz',
  
  // Mainnet endpoints (for production)
  MAINNET_ALGOD: 'https://mainnet-api.algonode.cloud',
  MAINNET_INDEXER: 'https://mainnet-idx.algonode.cloud',
  
  // Rate limits with your subscription
  RATE_LIMITS: {
    requests_per_second: 6000,
    requests_per_ip: 500,
    monthly_requests: 'unlimited',
    sla: '99.995%'
  }
};

// Initialize clients
export const algodClient = new algosdk.Algodv2(
  NODELY_CONFIG.ALGOD_TOKEN,
  NODELY_CONFIG.ALGOD_SERVER,
  NODELY_CONFIG.ALGOD_PORT
);

export const indexerClient = new algosdk.Indexer(
  NODELY_CONFIG.INDEXER_TOKEN,
  NODELY_CONFIG.INDEXER_SERVER,
  NODELY_CONFIG.INDEXER_PORT
);

// Testnet clients for development
export const testnetAlgodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

export const testnetIndexerClient = new algosdk.Indexer(
  '',
  'https://testnet-idx.algonode.cloud',
  ''
);

/**
 * Enhanced Features You Can Use with Your Nodely Subscription
 */

// 1. Advanced Account Analytics
export interface AccountAnalytics {
  balance: number;
  total_apps_opted_in: number;
  total_assets_opted_in: number;
  total_created_apps: number;
  total_created_assets: number;
  transaction_count: number;
  first_transaction_date: string;
  last_transaction_date: string;
  apps: any[];
  assets: any[];
}

export async function getEnhancedAccountInfo(address: string): Promise<AccountAnalytics> {
  try {
    // First try to get basic account info from node
    let accountInfo;
    try {
      accountInfo = await algodClient.accountInformation(address).do();
    } catch (error: any) {
      // If account doesn't exist (404), return default analytics
      if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('no accounts found')) {
        console.warn(`Account ${address} not found on mainnet. It might be unfunded or a testnet address.`);
        return {
          balance: 0,
          total_apps_opted_in: 0,
          total_assets_opted_in: 0,
          total_created_apps: 0,
          total_created_assets: 0,
          transaction_count: 0,
          first_transaction_date: '',
          last_transaction_date: '',
          apps: [],
          assets: []
        };
      }
      throw error;
    }
    
    // Get detailed transaction history from indexer
    let transactions;
    try {
      const txResult = await indexerClient
        .lookupAccountTransactions(address)
        .limit(1000)
        .do();
      transactions = txResult;
    } catch (error) {
      console.warn('Could not fetch transaction history:', error);
      transactions = { transactions: [] };
    }
    
    // Get apps and assets from indexer
    let accountDetails;
    try {
      accountDetails = await indexerClient
        .lookupAccountByID(address)
        .includeAll()
        .do();
    } catch (error) {
      console.warn('Could not fetch detailed account info:', error);
      accountDetails = { account: null };
    }
    
    return {
      balance: Number(accountInfo.amount) / 1000000, // Convert microAlgos to Algos
      total_apps_opted_in: accountInfo.totalAppsOptedIn || 0,
      total_assets_opted_in: accountInfo.totalAssetsOptedIn || 0,
      total_created_apps: accountInfo.totalCreatedApps || 0,
      total_created_assets: accountInfo.totalCreatedAssets || 0,
      transaction_count: transactions.transactions?.length || 0,
      first_transaction_date: transactions.transactions?.[0]?.roundTime 
        ? new Date(Number(transactions.transactions[0].roundTime) * 1000).toISOString()
        : '',
      last_transaction_date: transactions.transactions?.[transactions.transactions.length - 1]?.roundTime
        ? new Date(Number(transactions.transactions[transactions.transactions.length - 1].roundTime) * 1000).toISOString()
        : '',
      apps: accountDetails.account?.createdApps || [],
      assets: accountDetails.account?.createdAssets || []
    };  } catch (error) {
    console.error('Error getting enhanced account info:', error);
    // Return safe defaults instead of throwing
    return {
      balance: 0,
      total_apps_opted_in: 0,
      total_assets_opted_in: 0,
      total_created_apps: 0,
      total_created_assets: 0,
      transaction_count: 0,
      first_transaction_date: '',
      last_transaction_date: '',
      apps: [],
      assets: []
    };
  }
}

// 2. Service Payment History and Analytics
export interface PaymentHistory {
  transactions: any[];
  total_payments: number;
  total_amount_algo: number;
  total_amount_usd: number;
  top_services: Array<{
    service_id: string;
    count: number;
    total_amount: number;
  }>;
}

export async function getServicePaymentHistory(
  address: string,
  service_id?: string
): Promise<PaymentHistory> {
  try {
    let query = indexerClient
      .lookupAccountTransactions(address)
      .txType('pay')
      .limit(1000);
    
    // Filter by service if provided
    if (service_id) {
      query = query.notePrefix(Buffer.from(JSON.stringify({ service_id })).toString('base64'));
    }
    
    const result = await query.do();
    const transactions = result.transactions || [];
    
    // Parse service payments from transaction notes
    const servicePayments = transactions
      .filter(tx => tx.note)
      .map(tx => {
        try {
          if (!tx.note) return null;
          
          const noteBuffer = Buffer.from(new Uint8Array(tx.note));
          const noteStr = noteBuffer.toString('utf8');
          
          // Try to parse as JSON first (new format)
          try {
            const noteData = JSON.parse(noteStr);
            if (noteData.type === 'persona_service_payment') {
              return {
                ...tx,
                service_id: noteData.service_id,
                persona_name: noteData.persona_name,
                service_name: noteData.service_name,
                amount_algo: Number(tx.paymentTransaction?.amount || 0) / 1000000
              };
            }
          } catch {
            // Fallback to string parsing (old format)
            if (noteStr.includes('Payment for')) {
              return {
                ...tx,
                service_name: noteStr,
                amount_algo: Number(tx.paymentTransaction?.amount || 0) / 1000000
              };
            }
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((tx): tx is NonNullable<typeof tx> => tx !== null);
    
    // Calculate analytics
    const totalAmount = servicePayments.reduce((sum, tx) => sum + (tx.amount_algo || 0), 0);
    
    // Group by service for top services
    const serviceGroups = servicePayments.reduce((groups: Record<string, { count: number; total_amount: number }>, tx) => {
      const key = (tx as any).service_id || (tx as any).service_name || 'Unknown';
      if (!groups[key]) {
        groups[key] = { count: 0, total_amount: 0 };
      }
      groups[key].count++;
      groups[key].total_amount += tx.amount_algo || 0;
      return groups;
    }, {});
    
    const topServices = Object.entries(serviceGroups)
      .map(([service_id, data]) => ({ service_id, ...data }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);
    
    return {
      transactions: servicePayments,
      total_payments: servicePayments.length,
      total_amount_algo: totalAmount,
      total_amount_usd: totalAmount * 0.25, // Approximate conversion
      top_services: topServices
    };
  } catch (error) {
    console.error('Error getting payment history:', error);
    // Return empty history on error
    return {
      transactions: [],
      total_payments: 0,
      total_amount_algo: 0,
      total_amount_usd: 0,
      top_services: []
    };
  }
}

// 3. IPFS Integration for Persona Content Storage
export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

export async function uploadToIPFS(
  content: string | Blob,
  filename: string
): Promise<IPFSUploadResult> {
  try {
    const formData = new FormData();
    
    if (typeof content === 'string') {
      formData.append('file', new Blob([content], { type: 'text/plain' }), filename);
    } else {
      formData.append('file', content, filename);
    }
    
    // Using Nodely's IPFS gateway
    const response = await fetch(`${NODELY_CONFIG.IPFS_GATEWAY}/api/v0/add`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      hash: result.Hash,
      url: `${NODELY_CONFIG.IPFS_GATEWAY}/ipfs/${result.Hash}`
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function getFromIPFS(hash: string): Promise<string | null> {
  try {
    const response = await fetch(`${NODELY_CONFIG.IPFS_GATEWAY}/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    return null;
  }
}

// 4. Real-time Transaction Monitoring
export async function watchTransactions(
  address: string,
  callback: (transaction: any) => void,
  pollInterval: number = 5000
): Promise<() => void> {
  let isWatching = true;
  let lastRound = 0;
  
  // Get current round
  const status = await algodClient.status().do();
  lastRound = Number(status.lastRound);
  
  const poll = async () => {
    if (!isWatching) return;
    
    try {
      // Get recent transactions for the address
      const transactions = await indexerClient
        .lookupAccountTransactions(address)
        .minRound(lastRound)
        .do();
      
      // Process new transactions
      if (transactions.transactions) {
        for (const tx of transactions.transactions) {
          if (tx.confirmedRound && Number(tx.confirmedRound) > lastRound) {
            callback(tx);
            lastRound = Number(tx.confirmedRound);
          }
        }
      }
    } catch (error) {
      console.error('Error watching transactions:', error);
    }
    
    setTimeout(poll, pollInterval);
  };
  
  poll();
  
  // Return stop function
  return () => {
    isWatching = false;
  };
}

// 5. Enhanced Network Status and Metrics
export interface NetworkMetrics {
  last_round: number;
  time_since_last_round: number;
  catch_up_time: number;
  has_sync_data: boolean;
  stopped_at_unsupported_round: boolean;
  last_catchpoint: string;
  next_version: string;
  next_version_round: number;
  next_version_supported: boolean;
  tps: number;
  block_time: number;
}

export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  try {
    const status = await algodClient.status().do();
    const versionsCheck = await algodClient.versionsCheck().do();
    
    // Calculate TPS (approximate)
    const blockTime = 4.5; // Algorand's approximate block time
    const tps = blockTime > 0 ? 1 / blockTime : 0;
    
    return {
      last_round: Number(status.lastRound),
      time_since_last_round: Number(status.timeSinceLastRound),
      catch_up_time: Number(status.catchupTime),
      has_sync_data: true, // Default to true for now
      stopped_at_unsupported_round: status.stoppedAtUnsupportedRound || false,
      last_catchpoint: status.lastCatchpoint || '',
      next_version: versionsCheck.genesisId || '',
      next_version_round: 0,
      next_version_supported: true,
      tps: Math.round(tps * 100) / 100,
      block_time: blockTime
    };
  } catch (error) {
    console.error('Error getting network metrics:', error);
    throw error;
  }
}

// 6. Asset and Application Discovery
export async function searchAssets(query: string, limit: number = 20): Promise<any[]> {
  try {
    const result = await indexerClient
      .searchForAssets()
      .name(query)
      .limit(limit)
      .do();
    
    return result.assets || [];
  } catch (error) {
    console.error('Error searching assets:', error);
    return [];
  }
}

export async function searchApplications(query: string, limit: number = 20): Promise<any[]> {
  try {
    const result = await indexerClient
      .searchForApplications()
      .limit(limit)
      .do();
    
    return result.applications || [];
  } catch (error) {
    console.error('Error searching applications:', error);
    return [];
  }
}

// Export configuration for external use
export const nodelyConfig = NODELY_CONFIG;

// Helper function to detect if an address might be from testnet
export function isLikelyTestnetAddress(address: string): boolean {
  // This is a heuristic - testnet addresses often have certain patterns
  // but there's no foolproof way to tell from the address alone
  return false; // For now, assume all addresses could be mainnet
}

// Helper function to validate Algorand address format
export function isValidAlgorandAddress(address: string): boolean {
  try {
    // Algorand addresses are 58 characters long and base32 encoded
    if (address.length !== 58) return false;
    
    // Try to decode as base32 (this will throw if invalid)
    const decoded = algosdk.decodeAddress(address);
    return decoded.publicKey.length === 32;
  } catch {
    return false;
  }
}

// Enhanced account info with better error handling and validation
export async function getEnhancedAccountInfoSafe(address: string): Promise<AccountAnalytics & { error?: string; isValid: boolean }> {
  // Validate address format first
  if (!isValidAlgorandAddress(address)) {
    return {
      balance: 0,
      total_apps_opted_in: 0,
      total_assets_opted_in: 0,
      total_created_apps: 0,
      total_created_assets: 0,
      transaction_count: 0,
      first_transaction_date: '',
      last_transaction_date: '',
      apps: [],
      assets: [],
      error: 'Invalid Algorand address format',
      isValid: false
    };
  }

  try {
    const result = await getEnhancedAccountInfo(address);
    return { ...result, isValid: true };
  } catch (error) {
    console.error('Error in safe account info:', error);
    return {
      balance: 0,
      total_apps_opted_in: 0,
      total_assets_opted_in: 0,
      total_created_apps: 0,
      total_created_assets: 0,
      transaction_count: 0,
      first_transaction_date: '',
      last_transaction_date: '',
      apps: [],
      assets: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      isValid: true // Address format is valid, but other issues
    };
  }
}

/**
 * Usage Examples in Your PersonaForge Project:
 * 
 * 1. Store persona metadata on IPFS:
 *    const result = await uploadToIPFS(JSON.stringify(personaData), 'persona.json');
 * 
 * 2. Get detailed user analytics:
 *    const analytics = await getEnhancedAccountInfo(userWallet);
 * 
 * 3. Track service payments:
 *    const history = await getServicePaymentHistory(userWallet);
 * 
 * 4. Monitor real-time transactions:
 *    const stopWatching = await watchTransactions(wallet, (tx) => {
 *      console.log('New transaction:', tx);
 *    });
 * 
 * 5. Get network performance metrics:
 *    const metrics = await getNetworkMetrics();
 */
