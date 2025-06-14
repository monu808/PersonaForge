import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type CustomerInfo, type Offering } from '@revenuecat/purchases-js';
import { RevenueCatService } from './service';
import { useAuth } from '../context/auth-context';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from './config';

interface SubscriptionContextType {
  // Customer Info
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Subscription Status
  isSubscribed: boolean;
  subscriptionTier: string | null;
  subscriptionTierInfo: SubscriptionTier | null;
  expirationDate: Date | null;
  willRenew: boolean;
  
  // Offerings
  offerings: { current: Offering | null; all: Record<string, Offering> } | null;
  
  // Methods
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (packageToPurchase: any, customerEmail?: string) => Promise<any>;
  hasEntitlement: (entitlementId: string) => boolean;
  getFeatureLimit: (feature: string) => number | 'unlimited';
  canAccessFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<{ current: Offering | null; all: Record<string, Offering> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [willRenew, setWillRenew] = useState(false);

  const revenueCatService = RevenueCatService.getInstance();
  // Initialize RevenueCat when user changes
  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Special override for premium user
        if (user.email === 'monu80850raj@gmail.com') {
          // Grant enterprise-level access to this specific user
          setSubscriptionTier('enterprise');
          setExpirationDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // 1 year from now
          setWillRenew(true);          setCustomerInfo({
            entitlements: {
              active: {
                'enterprise': { isActive: true },
                'premium_features': { isActive: true },
                'all_features': { isActive: true }
              },
              all: {}
            },
            activeSubscriptions: new Set(['enterprise']),
            allPurchaseDates: {},
            allExpirationDates: {},
            latestExpirationDate: null,
            originalPurchaseDate: new Date(),
            requestDate: new Date(),
            firstSeen: new Date(),
            originalApplicationVersion: null,
            managementURL: null,
            allPurchaseDatesMillis: {},
            allExpirationDatesMillis: {},
            nonSubscriptionTransactions: []
          } as any);
          setIsLoading(false);
          return;
        }

        // Initialize RevenueCat with user ID
        await revenueCatService.initialize(user.id);

        // Load customer info and offerings
        await Promise.all([
          loadCustomerInfo(),
          loadOfferings()
        ]);

      } catch (err) {
        console.error('Failed to initialize RevenueCat:', err);
        setError('Failed to load subscription information');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, [user?.id, user?.email]);

  const loadCustomerInfo = async () => {
    try {
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);

      // Update subscription tier
      const tier = await revenueCatService.getSubscriptionTier();
      setSubscriptionTier(tier);

      // Update expiration date
      const expiration = await revenueCatService.getSubscriptionExpirationDate();
      setExpirationDate(expiration);

      // Update renewal status
      const renewal = await revenueCatService.willSubscriptionRenew();
      setWillRenew(renewal);

    } catch (err) {
      console.error('Failed to load customer info:', err);
      throw err;
    }
  };

  const loadOfferings = async () => {
    try {
      const offeringsData = await revenueCatService.getOfferings();
      setOfferings(offeringsData);
    } catch (err) {
      console.error('Failed to load offerings:', err);
      // Non-critical error, don't throw
    }
  };

  const refreshCustomerInfo = async () => {
    setIsLoading(true);
    try {
      await loadCustomerInfo();
      setError(null);
    } catch (err) {
      setError('Failed to refresh subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (packageToPurchase: any, customerEmail?: string) => {
    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase, customerEmail);
      
      // Refresh customer info after successful purchase
      await loadCustomerInfo();
      
      return result;
    } catch (err) {
      const errorMessage = RevenueCatService.handlePurchasesError(err);
      throw new Error(errorMessage);
    }
  };

  const hasEntitlement = (entitlementId: string): boolean => {
    if (!customerInfo) return false;
    return entitlementId in customerInfo.entitlements.active;
  };
  // Get subscription tier information
  const subscriptionTierInfo = subscriptionTier 
    ? SUBSCRIPTION_TIERS.find(tier => tier.id === subscriptionTier) || null 
    : null;

  const isSubscribed = subscriptionTier !== null || user?.email === 'monu80850raj@gmail.com';
  // Feature access control
  const getFeatureLimit = (feature: string): number | 'unlimited' => {
    // Special override for premium user
    if (user?.email === 'monu80850raj@gmail.com') {
      return 'unlimited';
    }

    switch (subscriptionTier) {
      case 'premium':
        switch (feature) {
          case 'personas': return 5;
          case 'voice_cloning': return 10;
          case 'video_generation': return 20;
          default: return 0;
        }
      case 'pro':
        switch (feature) {
          case 'personas': return 25;
          case 'voice_cloning': return 50;
          case 'video_generation': return 100;
          default: return 0;
        }
      case 'creator':
        switch (feature) {
          case 'personas': return 100;
          case 'voice_cloning': return 200;
          case 'video_generation': return 500;
          default: return 0;
        }
      case 'enterprise':
        return 'unlimited';
      default:
        // Free tier limits
        switch (feature) {
          case 'personas': return 1;
          case 'voice_cloning': return 0;
          case 'video_generation': return 5;
          default: return 0;
        }
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    // Special override for premium user - grant access to all features
    if (user?.email === 'monu80850raj@gmail.com') {
      return true;
    }

    switch (feature) {
      case 'basic_persona_creation':
        return true; // Available to all users
      case 'voice_cloning':
        return isSubscribed;
      case 'hd_video_generation':
        return subscriptionTier === 'pro' || subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      case '4k_video_generation':
        return subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      case 'api_access':
        return subscriptionTier === 'pro' || subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      case 'commercial_usage':
        return subscriptionTier === 'pro' || subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      case 'team_collaboration':
        return subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      case 'white_label':
        return subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      case 'on_premise_deployment':
        return subscriptionTier === 'enterprise';
      case 'neurovia_access':
        return isSubscribed;
      case 'premium_neurovia_features':
        return subscriptionTier === 'creator' || subscriptionTier === 'enterprise';
      default:
        return false;
    }
  };

  const value: SubscriptionContextType = {
    customerInfo,
    isLoading,
    error,
    isSubscribed,
    subscriptionTier,
    subscriptionTierInfo,
    expirationDate,
    willRenew,
    offerings,
    refreshCustomerInfo,
    purchasePackage,
    hasEntitlement,
    getFeatureLimit,
    canAccessFeature
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
