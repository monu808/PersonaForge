// Subscription Plan Configuration
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    currency: string;
    originalCurrency: string; // For display (₹)
  };
  limits: {
    personas: number;
    textToSpeech: number; // -1 for unlimited
    voiceCloning: number;
    liveConversationMinutes: number;
    monetizationEnabled: boolean;
    eventHosting: boolean;
    automationEnabled: boolean;
  };
  features: string[];
  popular?: boolean;
  enterprise?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: {
      monthly: 0,
      currency: 'INR',
      originalCurrency: '₹'
    },
    limits: {
      personas: 1,
      textToSpeech: 5,
      voiceCloning: 0,
      liveConversationMinutes: 0,
      monetizationEnabled: false,
      eventHosting: false,
      automationEnabled: false
    },
    features: [
      'Access to 1 AI Persona',
      'Up to 5 Text-to-Speech conversions',
      'Basic persona customization',
      'Limited features',
      'Community support'
    ]
  },
  
  premium: {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 199.99,
      currency: 'INR',
      originalCurrency: '₹'
    },
    limits: {
      personas: 3,
      textToSpeech: 20,
      voiceCloning: 3,
      liveConversationMinutes: 30,
      monetizationEnabled: false,
      eventHosting: false,
      automationEnabled: false
    },
    features: [
      'Access to 3 AI Personas',
      '20 Text-to-Speech conversions per month',
      '3 Voice Cloning slots',
      '30 Minutes of Live Conversation',
      'Enhanced persona customization',
      'Priority support'
    ],
    popular: true
  },
  
  creator: {
    id: 'creator',
    name: 'Creator',
    price: {
      monthly: 499.99,
      currency: 'INR',
      originalCurrency: '₹'
    },
    limits: {
      personas: 5,
      textToSpeech: -1, // unlimited
      voiceCloning: 5,
      liveConversationMinutes: 90,
      monetizationEnabled: true,
      eventHosting: true,
      automationEnabled: true
    },
    features: [
      'Access to 5 AI Personas',
      'Unlimited Text-to-Speech',
      '5 Voice Cloning slots',
      '90 Minutes of Live Conversation',
      'Monetization Enabled',
      'Host Events & Schedule Actions',
      'Advanced analytics',
      'API access'
    ]
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 999.99,
      currency: 'INR',
      originalCurrency: '₹'
    },
    limits: {
      personas: -1, // unlimited
      textToSpeech: -1, // unlimited
      voiceCloning: -1, // unlimited
      liveConversationMinutes: -1, // unlimited
      monetizationEnabled: true,
      eventHosting: true,
      automationEnabled: true
    },
    features: [
      'Custom features & limits',
      'Dedicated support & onboarding',
      'Designed for agencies, studios, or businesses',
      'White-label options',
      'Custom integrations',
      'Priority feature requests',
      'SLA guarantee',
      'Custom branding'
    ],
    enterprise: true
  }
};

// Stripe Price IDs (you'll need to create these in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  premium_monthly: 'price_premium_monthly_inr', // Replace with actual Stripe price ID
  premium_yearly: 'price_premium_yearly_inr',   // Replace with actual Stripe price ID
  creator_monthly: 'price_creator_monthly_inr',  // Replace with actual Stripe price ID
  creator_yearly: 'price_creator_yearly_inr',    // Replace with actual Stripe price ID
  enterprise_monthly: 'price_enterprise_monthly_inr', // Replace with actual Stripe price ID
  enterprise_yearly: 'price_enterprise_yearly_inr'    // Replace with actual Stripe price ID
};

// Helper functions
export function getUserPlan(subscriptionStatus?: string, planId?: string): SubscriptionPlan {
  if (!subscriptionStatus || subscriptionStatus === 'inactive' || !planId) {
    return SUBSCRIPTION_PLANS.free;
  }
  
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
}

export function canUserPerformAction(
  userPlan: SubscriptionPlan,
  action: keyof SubscriptionPlan['limits'],
  currentUsage?: number
): boolean {
  const limit = userPlan.limits[action];
  
  // Handle boolean flags
  if (typeof limit === 'boolean') {
    return limit;
  }
  
  // Handle unlimited (-1)
  if (limit === -1) {
    return true;
  }
  
  // Handle numeric limits
  if (typeof limit === 'number' && typeof currentUsage === 'number') {
    return currentUsage < limit;
  }
  
  return limit > 0;
}

export function formatPrice(amount: number, currency: string = '₹'): string {
  if (amount === 0) {
    return 'Free';
  }
  
  return `${currency}${amount.toFixed(2)}`;
}

export function getPlanUpgradeMessage(_currentPlan: string, requiredFeature: string): string {
  const messages = {
    personas: "You've reached your persona limit. Upgrade to create more AI personas.",
    textToSpeech: "You've reached your text-to-speech limit. Upgrade for more conversions.",
    voiceCloning: "Voice cloning is not available in your current plan. Upgrade to clone voices.",
    liveConversationMinutes: "You've used all your live conversation minutes. Upgrade for more.",
    monetizationEnabled: "Monetization features require a Creator plan or higher.",
    eventHosting: "Event hosting requires a Creator plan or higher.",
    automationEnabled: "Automation features require a Creator plan or higher."
  };  
  // Note: _currentPlan parameter kept for future use/compatibility
  return messages[requiredFeature as keyof typeof messages] || 
         "This feature requires a higher plan. Please upgrade to continue.";
}

export default SUBSCRIPTION_PLANS;
