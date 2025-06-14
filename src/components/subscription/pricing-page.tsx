import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/lib/revenuecat/context';
import { SUBSCRIPTION_TIERS as STRIPE_TIERS } from '@/lib/stripe/config';
import PaywallComponent from './paywall';
import StripeCheckout from '@/components/stripe/stripe-checkout';
import { 
  Star, 
  Zap, 
  Crown, 
  Building2, 
  Check, 
  ArrowRight,
  Sparkles,
  CreditCard
} from 'lucide-react';

interface PricingPageProps {
  className?: string;
}

const PricingPage: React.FC<PricingPageProps> = ({ className = '' }) => {
  const { subscriptionTier, isSubscribed } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [checkoutData, setCheckoutData] = useState<{
    priceId: string;
    planName: string;
    amount: number;
    billingCycle: 'monthly' | 'yearly';
  } | null>(null);
  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'premium': return <Star className="h-6 w-6" />;
      case 'pro': return <Zap className="h-6 w-6" />;
      case 'creator': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Building2 className="h-6 w-6" />;
      default: return <Sparkles className="h-6 w-6" />;
    }
  };

  const handleGetStarted = (tierId: string) => {
    setSelectedTier(tierId);
    setShowPaywall(true);
  };

  const handleCheckout = (priceId: string, planName: string, amount: number, billingCycle: 'monthly' | 'yearly') => {
    setCheckoutData({ priceId, planName, amount, billingCycle });
    setShowPaywall(false);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (subscriptionId: string) => {
    setShowCheckout(false);
    setCheckoutData(null);
    // Could redirect to success page or show success message
    window.location.href = `/payment/success?subscription_id=${subscriptionId}`;
  };

  const handleCheckoutError = (error: string) => {
    console.error('Checkout error:', error);
    // Could show error message to user
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

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Choose the Perfect Plan for Your Needs
          </h1>
          <p className="text-xl text-gray-600">
            Unlock the full potential of AI persona creation with our flexible pricing plans.
            Start with a 7-day free trial on any plan.
          </p>
        </motion.div>
      </div>      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {Object.entries(STRIPE_TIERS).map(([tierKey, tier], index) => {
          const prices = getPrice(tierKey);
          const isCurrentTier = subscriptionTier === tierKey;
          const isPopular = tierKey === 'pro'; // Mark Pro as popular

          return (
            <motion.div
              key={tierKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >              <Card 
                className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  isPopular ? 'border-primary-200 shadow-lg ring-2 ring-primary-100' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary-600 text-white px-4 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center flex-shrink-0">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                    tierKey === 'premium' ? 'bg-blue-100 text-blue-600' :
                    tierKey === 'pro' ? 'bg-purple-100 text-purple-600' :
                    tierKey === 'creator' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getTierIcon(tierKey)}
                  </div>
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  
                  <div className="mt-6">
                    <div className="text-4xl font-bold text-gray-900">
                      {prices.yearly}
                    </div>
                    <div className="text-sm text-gray-600">per year</div>
                    <div className="text-xs text-green-600 font-medium">
                      Save {prices.discount} vs monthly
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {prices.monthly}/month billed monthly
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow flex flex-col">
                  <ul className="space-y-3 mb-8 flex-grow">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>                  <Button
                    className={`w-full ${
                      isPopular 
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : ''
                    }`}
                    variant={isPopular ? 'default' : 'outline'}
                    disabled={isCurrentTier}
                    onClick={() => handleGetStarted(tierKey)}
                  >
                    {isCurrentTier ? (
                      'Current Plan'
                    ) : isSubscribed ? (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Upgrade to {tier.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Compare Plans & Features
          </h2>
          <p className="text-gray-600">
            See what's included in each plan to find the perfect fit for your needs.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-6 font-semibold text-gray-900">Features</th>
                    {Object.entries(STRIPE_TIERS).map(([tierKey, tier]) => (
                      <th key={tierKey} className="text-center p-6 font-semibold text-gray-900">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Personas', values: ['5', '25', '100', 'Unlimited'] },
                    { feature: 'Voice Cloning', values: ['Basic', 'Advanced', 'Premium', 'Enterprise'] },
                    { feature: 'Video Quality', values: ['Standard', 'HD', '4K', 'Custom'] },
                    { feature: 'API Access', values: ['❌', '✅', '✅', '✅'] },
                    { feature: 'Commercial Usage', values: ['❌', '✅', '✅', '✅'] },
                    { feature: 'Team Collaboration', values: ['❌', '❌', '✅', '✅'] },
                    { feature: 'Priority Support', values: ['❌', '✅', '✅', 'Dedicated'] },
                    { feature: 'Custom Integrations', values: ['❌', '❌', '✅', '✅'] }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">{row.feature}</td>
                      {row.values.map((value, valueIndex) => (
                        <td key={valueIndex} className="p-6 text-center text-gray-600">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="max-w-4xl mx-auto mt-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              q: "Can I change plans anytime?",
              a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, and at the next billing cycle for downgrades."
            },
            {
              q: "Is there a free trial?",
              a: "Yes! All paid plans come with a 7-day free trial. No credit card required to start."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, PayPal, and other payment methods through our secure payment provider Stripe."
            },
            {
              q: "Can I cancel anytime?",
              a: "Absolutely. You can cancel your subscription at any time through your account settings or billing portal. No cancellation fees."
            }
          ].map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center mt-16 p-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl text-white"
      >
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Content Creation?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of creators who are already using PersonaForge to bring their ideas to life.
        </p>
        <Button 
          size="lg" 
          variant="secondary"
          onClick={() => handleGetStarted('pro')}
          className="bg-white text-primary-600 hover:bg-gray-100"
        >
          Start Your Free Trial Today
        </Button>
      </motion.div>      {/* Paywall Modal */}
      <PaywallComponent
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        selectedTier={selectedTier}
        onSuccess={() => setShowPaywall(false)}
        onCheckout={handleCheckout}
      />

      {/* Stripe Checkout Modal */}
      {showCheckout && checkoutData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StripeCheckout
              priceId={checkoutData.priceId}
              planName={checkoutData.planName}
              amount={checkoutData.amount}
              billingCycle={checkoutData.billingCycle}
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              onCancel={() => {
                setShowCheckout(false);
                setCheckoutData(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
