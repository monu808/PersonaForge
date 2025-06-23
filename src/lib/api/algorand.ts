import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';
import { supabase } from '../auth';
// Enhanced Nodely integration
import { 
  algodClient, 
  indexerClient, 
  getEnhancedAccountInfo,
  getServicePaymentHistory,
  uploadToIPFS,
  getNetworkMetrics,
  nodelyConfig 
} from './nodely-enhanced';

// Nodely API configuration (using your API credit: BOLThieppgjvg512)
// Enhanced with your 2-month subscription features:
// - 6000 req/s per key (vs 60 req/s free tier)
// - 500 req/s per IP (vs 60 req/s free tier)
// - 99.995% SLA with reimbursement
// - Unlimited IPFS Gateway access
// - Enhanced analytics and archival data
const ALGORAND_SERVER = 'https://testnet-api.algonode.cloud';
const ALGORAND_PORT = '';
const ALGORAND_TOKEN = '';

// Use enhanced client from nodely-enhanced.ts
// const algodClient = new algosdk.Algodv2(ALGORAND_TOKEN, ALGORAND_SERVER, ALGORAND_PORT);

// Initialize Pera Wallet with proper configuration
const peraWallet = new PeraWalletConnect({
  chainId: 416002, // Use 416001 for mainnet, 416002 for testnet
  shouldShowSignTxnToast: true,
  compactMode: false
});

// Initialize wallet connection on load
let isWalletInitialized = false;

async function initializeWallet() {
  if (!isWalletInitialized) {
    try {
      // Reconnect to any existing session
      await peraWallet.reconnectSession();
      isWalletInitialized = true;
      console.log('PeraWallet initialized successfully');
    } catch (error) {
      console.log('No existing wallet session to reconnect:', error);
      isWalletInitialized = true; // Mark as initialized even if no session
    }
  }
}

// Call initialization immediately
initializeWallet();

export interface PersonaService {
  id: string; // UUID as string
  persona_id: string; // UUID as string
  service_name: string;
  description: string;
  price_algo: number; // Price in ALGO
  price_usd: number; // Price in USD for display
  service_type: 'consultation' | 'content_creation' | 'voice_message' | 'video_call' | 'custom';
  duration_minutes?: number;
  creator_wallet: string;
  created_at: string;
  is_active: boolean;
  // New delivery fields
  delivery_content?: string; // For text content or instructions
  delivery_url?: string; // For video/image URLs
  file_type?: string; // File type for media services
  auto_delivery?: boolean; // Whether content is delivered automatically
}

export interface PaymentRequest {
  service_id: string;
  buyer_wallet: string;
  amount_algo: number;
  persona_name: string;
  service_name: string;
}

export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
}

/**
 * Connect to Pera Wallet
 */
export async function connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    // Ensure wallet is initialized
    await initializeWallet();
    
    console.log('Attempting to connect to PeraWallet...');
    const accounts = await peraWallet.connect();
    
    if (accounts && accounts.length > 0) {
      const address = accounts[0];
      console.log('Wallet connected successfully:', address);
      
      // Store wallet connection in database for current user
      await storeWalletConnection(address);
      
      return {
        success: true,
        address: address
      };
    } else {
      return {
        success: false,
        error: 'No accounts found'
      };
    }
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect wallet'
    };
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  try {
    await peraWallet.disconnect();
    
    // Remove wallet connection from database for current user
    await removeWalletConnection();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

/**
 * Get connected wallet address
 */
export async function getConnectedWallet(): Promise<string | null> {
  return await getUserWalletAddress();
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  const address = await getUserWalletAddress();
  return address !== null;
}

/**
 * Get account balance in ALGO
 */
export async function getAccountBalance(address: string): Promise<{ balance: number; error?: string }> {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    const balance = Number(accountInfo.amount) / 1000000; // Convert microAlgos to ALGO
    
    return { balance };
  } catch (error) {
    console.error('Error getting account balance:', error);
    return {
      balance: 0,
      error: error instanceof Error ? error.message : 'Failed to get balance'
    };
  }
}

/**
 * Create a payment transaction for a persona service
 */
export async function createPaymentTransaction(
  fromAddress: string,
  toAddress: string,
  amountAlgo: number,
  note: string
): Promise<{ txn?: algosdk.Transaction; error?: string }> {
  try {
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert ALGO to microAlgos
    const amountMicroAlgos = Math.round(amountAlgo * 1000000);    // Create payment transaction
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: fromAddress,
      receiver: toAddress,
      amount: amountMicroAlgos,
      note: new Uint8Array(Buffer.from(note)),
      suggestedParams: suggestedParams,
    });

    return { txn };
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create transaction'
    };
  }
}

/**
 * Process payment for a persona service
 */
export async function processServicePayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
  try {
    const connectedWallet = await getConnectedWallet();
    
    if (!connectedWallet) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    // Create payment note with service details
    const note = JSON.stringify({
      type: 'persona_service_payment',
      service_id: paymentRequest.service_id,
      persona_name: paymentRequest.persona_name,
      service_name: paymentRequest.service_name,
      timestamp: new Date().toISOString()
    });

    // Create payment transaction
    const { txn, error: txnError } = await createPaymentTransaction(
      connectedWallet,
      paymentRequest.buyer_wallet, // This should be the service creator's wallet
      paymentRequest.amount_algo,
      note
    );

    if (txnError || !txn) {
      return {
        success: false,
        error: txnError || 'Failed to create transaction'
      };
    }    // Sign transaction with Pera Wallet
    console.log('Requesting transaction signature from Pera Wallet...');
    const txnsToSign = [{
      txn: txn,
      signers: [connectedWallet],
      stxn: undefined
    }];
    
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);
    
    if (!signedTxns || signedTxns.length === 0) {
      console.error('No signed transactions returned from Pera Wallet');
      return {
        success: false,
        error: 'Transaction not signed - please check your Pera Wallet'
      };
    }

    console.log('Transaction signed successfully, submitting to network...');
    
    // Submit transaction to the network
    const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
    const txId = response.txid;

    console.log('Transaction submitted with ID:', txId);

    // Wait for transaction confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    if (confirmedTxn && confirmedTxn.confirmedRound) {
      console.log('Transaction confirmed in round:', confirmedTxn.confirmedRound);
      return {
        success: true,
        transaction_id: txId
      };
    } else {
      return {
        success: false,
        error: 'Transaction not confirmed'
      };
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    };
  }
}

/**
 * Pay for a persona service
 */
export async function payForService(paymentRequest: PaymentRequest): Promise<PaymentResult> {
  try {
    console.log('payForService called with:', paymentRequest);
    
    const { service_id, buyer_wallet, amount_algo, persona_name, service_name } = paymentRequest;
    
    // Get service details to get seller wallet
    console.log('Fetching service details for service_id:', service_id);
    const { getPersonaService } = await import('./persona-services');
    const { data: serviceData } = await getPersonaService(service_id);
    
    console.log('Service data:', serviceData);
    
    if (!serviceData) {
      console.error('Service not found for ID:', service_id);
      return {
        success: false,
        error: 'Service not found'
      };
    }
    
    const sellerWallet = serviceData.creator_wallet || 'ALGORAND_FOUNDATION';
    console.log('Seller wallet:', sellerWallet);
    console.log('Buyer wallet:', buyer_wallet);
    console.log('Amount:', amount_algo, 'ALGO');
    
    const note = `Payment for ${service_name} from ${persona_name}`;
    
    // Create payment transaction
    console.log('Creating payment transaction...');
    const { txn, error: txnError } = await createPaymentTransaction(
      buyer_wallet,
      sellerWallet,
      amount_algo,
      note
    );

    if (txnError || !txn) {
      console.error('Failed to create transaction:', txnError);
      return {
        success: false,
        error: txnError || 'Failed to create transaction'
      };
    }    console.log('Transaction created successfully, now signing with wallet...');
      // Ensure wallet is initialized before signing
    await initializeWallet();
    
    // Sign transaction with Pera Wallet
    const connectedWallet = await getConnectedWallet();
    if (!connectedWallet) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    const txnsToSign = [{
      txn: txn,
      signers: [connectedWallet]
    }];
    
    console.log('Requesting signature from Pera Wallet...');
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);
    
    if (!signedTxns || signedTxns.length === 0) {
      console.error('No signed transactions returned');
      return {
        success: false,
        error: 'Transaction not signed - please check your Pera Wallet'
      };
    }

    console.log('Transaction signed, submitting to network...');
    
    // Submit transaction
    const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
    const txId = response.txid;
    
    console.log('Transaction submitted with ID:', txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    if (confirmedTxn && confirmedTxn.confirmedRound) {
      console.log('Transaction confirmed, recording purchase...');
      
      // Record the purchase in the database
      await recordServicePurchase({
        service_id,
        buyer_wallet,
        seller_wallet: sellerWallet,
        amount_algo,
        transaction_id: txId
      });
      
      return {
        success: true,
        transaction_id: txId
      };
    } else {
      return {
        success: false,
        error: 'Transaction not confirmed'
      };
    }

  } catch (error: any) {
    console.error('Error in payForService:', error);
    
    if (error?.message && error.message.includes('cancelled')) {
      return {
        success: false,
        error: 'Transaction was cancelled by user'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign or send transaction'
    };
  }
}

/**
 * Record a service purchase in the database and grant access
 */
async function recordServicePurchase(purchaseData: {
  service_id: string;
  buyer_wallet: string;
  seller_wallet: string;
  amount_algo: number;
  transaction_id: string;
}): Promise<void> {
  try {
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import('../auth');
    
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate a unique ID for this purchase
    const purchaseId = crypto.randomUUID();
    
    let insertData: any = {
      id: purchaseId,
      service_id: purchaseData.service_id,
      buyer_wallet: purchaseData.buyer_wallet,
      seller_wallet: purchaseData.seller_wallet,
      amount_algo: purchaseData.amount_algo,
      amount_usd: purchaseData.amount_algo * 0.25, // Approximate USD value
      transaction_id: purchaseData.transaction_id,
      status: 'completed'
    };

    console.log('Recording purchase with data:', insertData);

    // Try with buyer_id first
    let { error } = await supabase
      .from('service_purchases')
      .insert({
        ...insertData,
        buyer_id: user.id
      });

    // If buyer_id column doesn't exist, try without it
    if (error && error.message?.includes('buyer_id')) {
      console.log('buyer_id column not found, inserting without it');
      const result = await supabase
        .from('service_purchases')
        .insert(insertData);
      error = result.error;
    }

    if (error) {
      console.error('Failed to record purchase in database:', error);
      // Don't throw here as the payment was successful
      return;
    }

    console.log('Purchase recorded successfully, now granting access...');

    // Get service details to grant access to the persona
    const { getPersonaService } = await import('./persona-services');
    const { data: serviceData } = await getPersonaService(purchaseData.service_id);
    
    if (serviceData) {
      // Grant access to the persona and service
      await grantUserAccess({
        user_id: user.id,
        persona_id: serviceData.persona_id,
        service_id: purchaseData.service_id,
        purchase_id: purchaseId
      });

      // Create service delivery record if it's an auto-delivery service
      if (serviceData.auto_delivery) {
        await createServiceDelivery({
          purchase_id: purchaseId,
          user_id: user.id,
          service_id: purchaseData.service_id,
          service_data: serviceData
        });
      }
    }

    console.log('Access granted and delivery processed successfully');
  } catch (error) {
    console.error('Error recording purchase:', error);
    // Don't throw here as the payment was successful
  }
}

/**
 * Grant user access to a purchased persona/service
 */
async function grantUserAccess(accessData: {
  user_id: string;
  persona_id: string;
  service_id: string;
  purchase_id: string;
}): Promise<void> {
  try {
    const { supabase } = await import('../auth');
    
    console.log('Attempting to grant user access to database...');
    
    const { error } = await supabase
      .from('user_persona_access')
      .insert({
        user_id: accessData.user_id,
        persona_id: accessData.persona_id,
        service_id: accessData.service_id,
        purchase_id: accessData.purchase_id,
        access_type: 'full'
      });

    if (error) {
      console.error('Failed to grant user access:', error);
      console.log('Falling back to localStorage for access tracking...');
      
      // Fallback to localStorage
      try {
        const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
        const newAccess = {
          id: Date.now().toString(),
          user_id: accessData.user_id,
          persona_id: accessData.persona_id,
          service_id: accessData.service_id,
          purchase_id: accessData.purchase_id,
          access_type: 'full',
          access_granted_at: new Date().toISOString()
        };
        
        existingAccess.push(newAccess);
        localStorage.setItem('userPersonaAccess', JSON.stringify(existingAccess));
        console.log('Access saved to localStorage successfully');
      } catch (storageError) {
        console.error('Failed to save access to localStorage:', storageError);
      }
    } else {
      console.log('User access granted successfully');
    }
  } catch (error) {
    console.error('Error granting user access:', error);
    
    // Fallback to localStorage on any error
    try {
      const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
      const newAccess = {
        id: Date.now().toString(),
        user_id: accessData.user_id,
        persona_id: accessData.persona_id,
        service_id: accessData.service_id,
        purchase_id: accessData.purchase_id,
        access_type: 'full',
        access_granted_at: new Date().toISOString()
      };
      
      existingAccess.push(newAccess);
      localStorage.setItem('userPersonaAccess', JSON.stringify(existingAccess));
      console.log('Access saved to localStorage as fallback');
    } catch (storageError) {
      console.error('Failed to save access to localStorage:', storageError);
    }
  }
}

/**
 * Create service delivery record
 */
async function createServiceDelivery(deliveryData: {
  purchase_id: string;
  user_id: string;
  service_id: string;
  service_data: PersonaService;
}): Promise<void> {
  try {
    const { supabase } = await import('../auth');
    
    const deliveryRecord = {
      purchase_id: deliveryData.purchase_id,
      user_id: deliveryData.user_id,
      service_id: deliveryData.service_id,
      delivery_type: deliveryData.service_data.auto_delivery ? 'automatic' : 'manual',
      content_url: deliveryData.service_data.delivery_url,
      content_text: deliveryData.service_data.delivery_content,
      delivery_status: 'delivered',
      delivered_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('service_deliveries')
      .insert(deliveryRecord);

    if (error) {
      console.error('Failed to create service delivery:', error);
    } else {
      console.log('Service delivery created successfully');
    }
  } catch (error) {
    console.error('Error creating service delivery:', error);
  }
}

/**
 * Get current ALGO to USD exchange rate (mock implementation)
 * In production, you would fetch this from a real API
 */
export async function getAlgoToUsdRate(): Promise<number> {
  try {
    // Mock rate - in production, fetch from CoinGecko or similar API
    return 0.25; // 1 ALGO = $0.25 USD (example rate)
  } catch (error) {
    console.error('Error getting ALGO rate:', error);
    return 0.25; // Fallback rate
  }
}

/**
 * Convert USD to ALGO amount
 */
export async function convertUsdToAlgo(usdAmount: number): Promise<number> {
  const rate = await getAlgoToUsdRate();
  return usdAmount / rate;
}

/**
 * Convert ALGO to USD amount
 */
export async function convertAlgoToUsd(algoAmount: number): Promise<number> {
  const rate = await getAlgoToUsdRate();
  return algoAmount * rate;
}

// Wallet connection management functions
async function storeWalletConnection(walletAddress: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Update user's wallet address in the database (users table, not profiles)
    const { error } = await supabase
      .from('users')
      .update({
        wallet_address: walletAddress
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error storing wallet connection:', error);
      throw error;
    } else {
      console.log('Wallet connection stored successfully in database for user:', user.id);
      // Remove localStorage fallback - we only use database now
    }
  } catch (error) {
    console.error('Error in storeWalletConnection:', error);
    throw error;
  }
}

async function removeWalletConnection(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Remove wallet address from database (users table, not profiles)
    const { error } = await supabase
      .from('users')
      .update({
        wallet_address: null
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error removing wallet connection:', error);
    } else {
      console.log('Wallet connection removed successfully from database for user:', user.id);
    }

    // Clean up any localStorage entries (for migration purposes)
    localStorage.removeItem(`algorand_wallet_${user.id}`);
    localStorage.removeItem('algorand_wallet');
  } catch (error) {
    console.error('Error in removeWalletConnection:', error);
  }
}

async function getUserWalletAddress(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Get wallet address from database (users table, not profiles)
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    if (!error && data?.wallet_address) {
      console.log('Retrieved wallet from database for user:', user.id, 'address:', data.wallet_address);
      return data.wallet_address;
    }

    console.log('No wallet found in database for user:', user.id);
    return null;
  } catch (error) {
    console.error('Error getting user wallet address:', error);
    return null;
  }
}

// Function to clear wallet connections when user signs out
export async function clearWalletConnectionsOnSignOut(): Promise<void> {
  try {
    // Clear all wallet-related localStorage items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('algorand_wallet')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Cleared wallet connections on sign out');
  } catch (error) {
    console.error('Error clearing wallet connections:', error);
  }
}

// Function to initialize wallet connection from database
export async function initializeWalletFromDatabase(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found for wallet initialization');
      return null;
    }

    const walletAddress = await getUserWalletAddress();
    if (walletAddress) {
      console.log('Wallet found in database for user:', user.id, 'address:', walletAddress);
      return walletAddress;
    }

    console.log('No wallet connection found in database for user:', user.id);
    return null;
  } catch (error) {
    console.error('Error initializing wallet from database:', error);
    return null;
  }
}
