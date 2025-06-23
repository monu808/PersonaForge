import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/lib/revenuecat/context';
import { SUBSCRIPTION_TIERS } from '@/lib/revenuecat/config';
import { stripeService } from '@/lib/stripe/service';
import { SUBSCRIPTION_TIERS as STRIPE_TIERS } from '@/lib/stripe/config';
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  Building2, 
  Loader2, 
  AlertCircle,
  Sparkles,
  X,
  CreditCard
} from 'lucide-react';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: string;
  onSuccess?: () => void;
  onCheckout?: (priceId: string, planName: string, amount: number, billingCycle: 'monthly' | 'yearly') => void;
}

const PaywallComponent: React.FC<PaywallProps> = ({ 
  isOpen, 
  onClose, 
  selectedTier,
  onSuccess,
  onCheckout 
}) => {
  const { 
    subscriptionTier: currentTier,
    isLoading: subscriptionLoading
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string>(selectedTier || 'pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTier) {
      setSelectedPlan(selectedTier);
    }
  }, [selectedTier]);
  const handlePurchase = async (tier: string) => {
    const tierConfig = Object.values(STRIPE_TIERS).find(t => 
      t.name.toLowerCase() === tier || 
      tier === t.name.toLowerCase().replace(' ', '')
    );
    
    if (!tierConfig) {
      setError('Invalid subscription tier');
      return;
    }

    setPurchaseLoading(tier);
    setError(null);

    try {
      const priceId = tierConfig.priceIds[billingCycle];
      const amount = billingCycle === 'yearly' ? tierConfig.yearlyPrice : tierConfig.monthlyPrice;
      
      if (onCheckout) {
        // Use custom checkout handler (for Stripe Elements integration)
        onCheckout(priceId, tierConfig.name, amount, billingCycle);
      } else {
        // Use Stripe Checkout (redirect to hosted checkout)
        const session = await stripeService.createCheckoutSession(priceId);
        
        if (session) {
          await stripeService.redirectToCheckout(session.sessionId);
        } else {
          throw new Error('Failed to create checkout session');
        }
      }
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'premium': return <Star className="h-6 w-6" />;
      case 'pro': return <Zap className="h-6 w-6" />;
      case 'creator': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Building2 className="h-6 w-6" />;
      default: return <Sparkles className="h-6 w-6" />;
    }
  };
  const getPrice = (tier: string): { monthly: string; yearly: string; discount?: string } => {
    const tierConfig = Object.values(STRIPE_TIERS).find(t => 
      t.name.toLowerCase() === tier || 
      tier === t.name.toLowerCase().replace(' ', '')
    );
    
    if (!tierConfig) {
      return { monthly: '$0', yearly: '$0' };
    }

    const yearlyDiscount = Math.round((1 - (tierConfig.yearlyPrice / (tierConfig.monthlyPrice * 12))) * 100);
    
    return {
      monthly: `$${tierConfig.monthlyPrice.toFixed(2)}`,
      yearly: `$${tierConfig.yearlyPrice.toFixed(2)}`,
      discount: yearlyDiscount > 0 ? `${yearlyDiscount}%` : undefined
    };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-2">Unlock the full potential of PersonaForge</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Billing Toggle */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                    Save 17%
                  </Badge>
                </button>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="p-6">
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <span className="ml-3 text-gray-600">Loading plans...</span>
              </div>            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(STRIPE_TIERS).map(([tierKey, tier], index) => {
                  const prices = getPrice(tierKey);
                  const isCurrentTier = currentTier === tierKey;
                  const isSelected = selectedPlan === tierKey;
                  const isLoading = purchaseLoading === tierKey;
                  const isPopular = tierKey === 'pro'; // Mark Pro as popular

                  return (
                    <motion.div
                      key={tierKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl ${
                          isSelected ? 'ring-2 ring-primary-500 shadow-lg' : ''
                        } ${isPopular ? 'border-primary-200' : ''}`}
                        onClick={() => setSelectedPlan(tierKey)}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary-600 text-white px-3 py-1">
                              Most Popular
                            </Badge>
                          </div>
                        )}

                        {isCurrentTier && (
                          <div className="absolute -top-3 right-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Current Plan
                            </Badge>
                          </div>
                        )}

                        <CardHeader className="text-center pb-4">
                          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                            tierKey === 'premium' ? 'bg-blue-100 text-blue-600' :
                            tierKey === 'pro' ? 'bg-purple-100 text-purple-600' :
                            tierKey === 'creator' ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {getTierIcon(tierKey)}
                          </div>
                          <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                          
                          <div className="mt-4">
                            <div className="text-3xl font-bold text-gray-900">
                              {billingCycle === 'yearly' ? prices.yearly : prices.monthly}
                            </div>
                            <div className="text-sm text-gray-600">
                              per {billingCycle === 'yearly' ? 'year' : 'month'}
                            </div>
                            {billingCycle === 'yearly' && prices.discount && (
                              <div className="text-sm text-green-600 font-medium">
                                Save {prices.discount}
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <ul className="space-y-3 mb-6">
                            {tier.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button
                            className="w-full"
                            variant={isSelected ? 'default' : 'outline'}
                            disabled={isCurrentTier || isLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isCurrentTier) {
                                handlePurchase(tierKey);
                              }
                            }}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                              </>
                            ) : isCurrentTier ? (
                              'Current Plan'
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Subscribe to {tier.name}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}              </div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
              >
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-700">{error}</span>
              </motion.div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>All plans include a 7-day free trial. Cancel anytime.</p>
              <p>Secure payment powered by Stripe. Your payment information is encrypted and secure.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaywallComponent;