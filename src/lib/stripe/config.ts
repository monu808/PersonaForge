import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.');
}

// Create Stripe instance
export const stripePromise = loadStripe(stripePublishableKey || '');

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  // Test mode configuration
  options: {
    // Enable test mode if using test keys
    testMode: stripePublishableKey?.startsWith('pk_test_'),
  },
  // Common Elements styling
  elementsOptions: {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
      rules: {
        '.Input': {
          borderColor: '#d1d5db',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        '.Input:focus': {
          borderColor: '#2563eb',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
        },
        '.Label': {
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
        },
      },
    },
  },
  // Payment method types to enable
  paymentMethodTypes: [
    'card',
    'apple_pay',
    'google_pay',
    'link',
  ],
};

// Subscription price mapping (these should match your Stripe price IDs)
export const SUBSCRIPTION_PRICES = {
  premium_monthly: 'price_premium_monthly_id',
  premium_yearly: 'price_premium_yearly_id',
  pro_monthly: 'price_pro_monthly_id',
  pro_yearly: 'price_pro_yearly_id',
  creator_monthly: 'price_creator_monthly_id',
  creator_yearly: 'price_creator_yearly_id',
  enterprise_monthly: 'price_enterprise_monthly_id',
  enterprise_yearly: 'price_enterprise_yearly_id',
};

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  premium: {
    name: 'Premium',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    priceIds: {
      monthly: SUBSCRIPTION_PRICES.premium_monthly,
      yearly: SUBSCRIPTION_PRICES.premium_yearly,
    },
    features: [
      '5 AI Personas',
      'Basic Voice Cloning',
      'Standard Support',
      '10GB Storage',
    ],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    priceIds: {
      monthly: SUBSCRIPTION_PRICES.pro_monthly,
      yearly: SUBSCRIPTION_PRICES.pro_yearly,
    },
    features: [
      '25 AI Personas',
      'Advanced Voice Cloning',
      'Priority Support',
      '50GB Storage',
      'API Access',
    ],
  },
  creator: {
    name: 'Creator',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    priceIds: {
      monthly: SUBSCRIPTION_PRICES.creator_monthly,
      yearly: SUBSCRIPTION_PRICES.creator_yearly,
    },
    features: [
      '100 AI Personas',
      'Premium Voice Cloning',
      'Team Collaboration',
      '200GB Storage',
      'Full API Access',
      'Custom Integrations',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    priceIds: {
      monthly: SUBSCRIPTION_PRICES.enterprise_monthly,
      yearly: SUBSCRIPTION_PRICES.enterprise_yearly,
    },
    features: [
      'Unlimited AI Personas',
      'Enterprise Voice Cloning',
      'Dedicated Support',
      'Unlimited Storage',
      'Priority API Access',
      'Custom Integrations',
      'SLA Guarantee',
    ],
  },
};
