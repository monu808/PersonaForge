import { 
  Purchases, 
  LogLevel, 
  type CustomerInfo, 
  type Offering, 
  type Package,
  type PurchaseResult,
  PurchasesError
} from '@revenuecat/purchases-js';
import { REVENUECAT_CONFIG } from './config';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private purchases: Purchases | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /**
   * Initialize RevenueCat SDK
   */
  public async initialize(userId: string): Promise<void> {
    try {
      if (this.isInitialized && this.purchases) {
        // If already initialized, just change user
        await this.purchases.changeUser(userId);
        return;
      }

      // Set log level for debugging (remove in production)
      Purchases.setLogLevel(LogLevel.Debug);

      // Configure Purchases
      this.purchases = Purchases.configure(
        REVENUECAT_CONFIG.API_KEY,
        userId
      );

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully for user:', userId);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get current customer info
   */
  public async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.purchases) {
      throw new Error('RevenueCat not initialized');
    }
    return await this.purchases.getCustomerInfo();
  }

  /**
   * Get available offerings
   */
  public async getOfferings(): Promise<{ current: Offering | null; all: Record<string, Offering> }> {
    if (!this.purchases) {
      throw new Error('RevenueCat not initialized');
    }
    return await this.purchases.getOfferings();
  }

  /**
   * Check if user has specific entitlement
   */
  public async hasEntitlement(entitlementId: string): Promise<boolean> {
    if (!this.purchases) {
      return false;
    }
    
    try {
      return await this.purchases.isEntitledTo(entitlementId);
    } catch (error) {
      console.error('Error checking entitlement:', error);
      return false;
    }
  }

  /**
   * Get user's subscription tier
   */
  public async getSubscriptionTier(): Promise<string | null> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeEntitlements = customerInfo.entitlements.active;

      // Check entitlements in order of priority
      if (activeEntitlements[REVENUECAT_CONFIG.ENTITLEMENTS.ENTERPRISE]) {
        return 'enterprise';
      }
      if (activeEntitlements[REVENUECAT_CONFIG.ENTITLEMENTS.CREATOR]) {
        return 'creator';
      }
      if (activeEntitlements[REVENUECAT_CONFIG.ENTITLEMENTS.PRO]) {
        return 'pro';
      }
      if (activeEntitlements[REVENUECAT_CONFIG.ENTITLEMENTS.PREMIUM]) {
        return 'premium';
      }

      return null; // Free tier
    } catch (error) {
      console.error('Error getting subscription tier:', error);
      return null;
    }
  }

  /**
   * Purchase a package
   */
  public async purchasePackage(
    packageToPurchase: Package,
    customerEmail?: string
  ): Promise<PurchaseResult> {
    if (!this.purchases) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const result = await this.purchases.purchase({
        rcPackage: packageToPurchase,
        customerEmail
      });
      
      console.log('Purchase successful:', result);
      return result;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Change user (for when user logs in/out)
   */
  public async changeUser(newUserId: string): Promise<CustomerInfo> {
    if (!this.purchases) {
      throw new Error('RevenueCat not initialized');
    }
    return await this.purchases.changeUser(newUserId);
  }

  /**
   * Get current user ID
   */
  public getCurrentUserId(): string | null {
    if (!this.purchases) {
      return null;
    }
    return this.purchases.getAppUserId();
  }

  /**
   * Set user attributes (for analytics and targeting)
   */
  public async setUserAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.purchases) {
      throw new Error('RevenueCat not initialized');
    }
    await this.purchases.setAttributes(attributes);
  }

  /**
   * Check if user has any active subscription
   */
  public async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Get subscription expiration date
   */
  public async getSubscriptionExpirationDate(): Promise<Date | null> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeEntitlements = Object.values(customerInfo.entitlements.active);
      
      if (activeEntitlements.length === 0) {
        return null;
      }

      // Get the latest expiration date
      let latestExpiration: Date | null = null;
      for (const entitlement of activeEntitlements) {
        if (entitlement.expirationDate) {
          if (!latestExpiration || entitlement.expirationDate > latestExpiration) {
            latestExpiration = entitlement.expirationDate;
          }
        }
      }

      return latestExpiration;
    } catch (error) {
      console.error('Error getting subscription expiration:', error);
      return null;
    }
  }

  /**
   * Check if subscription will renew
   */
  public async willSubscriptionRenew(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeEntitlements = Object.values(customerInfo.entitlements.active);
      
      // Check if any active entitlement will renew
      return activeEntitlements.some(entitlement => entitlement.willRenew);
    } catch (error) {
      console.error('Error checking subscription renewal:', error);
      return false;
    }
  }

  /**
   * Generate anonymous user ID
   */
  public static generateAnonymousUserId(): string {
    return Purchases.generateRevenueCatAnonymousAppUserId();
  }

  /**
   * Handle errors gracefully
   */
  public static handlePurchasesError(error: unknown): string {
    if (error instanceof PurchasesError) {
      switch (error.errorCode) {
        case 'UserCancelledError':
          return 'Purchase was cancelled by user';
        case 'ProductNotAvailableForPurchaseError':
          return 'Product is not available for purchase';
        case 'NetworkError':
          return 'Network error occurred. Please check your connection.';
        case 'PaymentPendingError':
          return 'Payment is pending approval';
        default:
          return error.message || 'An error occurred during purchase';
      }
    }
    return 'An unexpected error occurred';
  }
}
