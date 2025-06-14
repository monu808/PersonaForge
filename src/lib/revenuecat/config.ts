// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
  // You'll need to get these from your RevenueCat dashboard
  API_KEY: import.meta.env.VITE_REVENUECAT_API_KEY || 'your_revenuecat_api_key_here',
  
  // Entitlement identifiers (configure these in RevenueCat dashboard)
  ENTITLEMENTS: {
    PREMIUM: 'premium',
    PRO: 'pro',
    CREATOR: 'creator',
    ENTERPRISE: 'enterprise'
  },
  
  // Product identifiers (configure these in RevenueCat dashboard and your payment provider)
  PRODUCTS: {
    MONTHLY_PREMIUM: 'premium_monthly',
    YEARLY_PREMIUM: 'premium_yearly',
    MONTHLY_PRO: 'pro_monthly',
    YEARLY_PRO: 'pro_yearly',
    MONTHLY_CREATOR: 'creator_monthly',
    YEARLY_CREATOR: 'creator_yearly',
    MONTHLY_ENTERPRISE: 'enterprise_monthly',
    YEARLY_ENTERPRISE: 'enterprise_yearly'
  },
  
  // Offering identifiers (organize products in RevenueCat dashboard)
  OFFERINGS: {
    DEFAULT: 'default',
    PREMIUM_TIER: 'premium_tier',
    PROFESSIONAL_TIER: 'professional_tier',
    CREATOR_TIER: 'creator_tier',
    ENTERPRISE_TIER: 'enterprise_tier'
  }
} as const;

// Subscription tier definitions
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  features: string[];
  entitlement: string;
  monthlyProductId: string;
  yearlyProductId: string;
  popular?: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'Perfect for individual creators',
    features: [
      'Create up to 5 AI personas',
      'Basic voice cloning',
      'Standard video generation',
      'Email support',
      'Access to Neurovia platform'
    ],
    entitlement: REVENUECAT_CONFIG.ENTITLEMENTS.PREMIUM,
    monthlyProductId: REVENUECAT_CONFIG.PRODUCTS.MONTHLY_PREMIUM,
    yearlyProductId: REVENUECAT_CONFIG.PRODUCTS.YEARLY_PREMIUM
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professional content creators',
    features: [
      'Create up to 25 AI personas',
      'Advanced voice cloning with emotional range',
      'HD video generation',
      'Priority support',
      'Commercial usage rights',
      'API access',
      'Advanced Neurovia features'
    ],
    entitlement: REVENUECAT_CONFIG.ENTITLEMENTS.PRO,
    monthlyProductId: REVENUECAT_CONFIG.PRODUCTS.MONTHLY_PRO,
    yearlyProductId: REVENUECAT_CONFIG.PRODUCTS.YEARLY_PRO,
    popular: true
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'For content creation teams',
    features: [
      'Create up to 100 AI personas',
      'Premium voice cloning with custom training',
      '4K video generation',
      'Team collaboration tools',
      'White-label options',
      'Advanced API access',
      'Premium Neurovia experiences',
      'Custom integrations'
    ],
    entitlement: REVENUECAT_CONFIG.ENTITLEMENTS.CREATOR,
    monthlyProductId: REVENUECAT_CONFIG.PRODUCTS.MONTHLY_CREATOR,
    yearlyProductId: REVENUECAT_CONFIG.PRODUCTS.YEARLY_CREATOR
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    features: [
      'Unlimited AI personas',
      'Enterprise-grade voice cloning',
      'Custom video generation models',
      'Dedicated support team',
      'On-premise deployment options',
      'Custom API development',
      'Enterprise Neurovia platform',
      'Advanced security & compliance',
      'Custom training & onboarding'
    ],
    entitlement: REVENUECAT_CONFIG.ENTITLEMENTS.ENTERPRISE,
    monthlyProductId: REVENUECAT_CONFIG.PRODUCTS.MONTHLY_ENTERPRISE,
    yearlyProductId: REVENUECAT_CONFIG.PRODUCTS.YEARLY_ENTERPRISE
  }
];
