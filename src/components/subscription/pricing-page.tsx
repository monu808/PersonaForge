import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscription/plans';
import SubscriptionService from '@/lib/subscription/service';
import { 
  Star, 
  Crown, 
  Building2, 
  Sparkles
} from 'lucide-react';

interface PricingPageProps {
  className?: string;
}

const PricingPage: React.FC<PricingPageProps> = ({ className = '' }) => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS.free);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { plan } = await SubscriptionService.getUserSubscription();
      const usage = await SubscriptionService.getUsageWithLimits();
      setCurrentPlan(plan);
      setUsageData(usage);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierIcon = (planId: string) => {
    switch (planId) {
      case 'premium': return <Star className="h-6 w-6 text-blue-500" />;
      case 'creator': return <Crown className="h-6 w-6 text-purple-500" />;
      case 'enterprise': return <Building2 className="h-6 w-6 text-gray-500" />;
      default: return <Sparkles className="h-6 w-6 text-gray-400" />;
    }
  };
  const handleUpgrade = (planId: string) => {
    if (planId === 'enterprise') {
      // For enterprise, show contact form or redirect
      alert('Please contact our sales team for Enterprise pricing and setup.');
      return;
    }
    // For other plans, this would integrate with Stripe
    alert(`Upgrade to ${planId} plan - Stripe integration pending`);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₹${price.toFixed(2)}`;
  };

  const plans = [
    SUBSCRIPTION_PLANS.free,
    SUBSCRIPTION_PLANS.premium,
    SUBSCRIPTION_PLANS.creator,
    SUBSCRIPTION_PLANS.enterprise
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock the full potential of AI persona creation with our flexible pricing plans.
            </p>
          </motion.div>
        </div>

        {/* Current Plan Info */}
        {currentPlan.id !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTierIcon(currentPlan.id)}
                    <div>
                      <h3 className="text-xl font-bold">Current Plan: {currentPlan.name}</h3>
                      <p className="text-purple-100">
                        {formatPrice(currentPlan.price.monthly)}/month
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`relative h-full transition-all duration-300 hover:shadow-2xl ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-lg transform scale-105' : 'hover:shadow-lg'
              } ${currentPlan.id === plan.id ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    {getTierIcon(plan.id)}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price.monthly)}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-gray-500 ml-2">/month</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {feature.includes('No ') || feature.includes('disabled') ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full">
                              ✗
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    {currentPlan.id === plan.id ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : plan.id === 'free' ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        Free Forever
                      </Button>
                    ) : plan.enterprise ? (
                      <Button
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Contact Sales
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Usage Stats */}
        {usageData && currentPlan.id !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-16"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Your Usage This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{usageData.usage?.personas_created || 0}</div>
                    <div className="text-sm text-gray-600">Personas Created</div>
                    <div className="text-xs text-gray-500">
                      of {currentPlan.limits.personas === -1 ? '∞' : currentPlan.limits.personas}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{usageData.usage?.text_to_speech_used || 0}</div>
                    <div className="text-sm text-gray-600">TTS Generations</div>
                    <div className="text-xs text-gray-500">
                      of {currentPlan.limits.textToSpeech === -1 ? '∞' : currentPlan.limits.textToSpeech}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{usageData.usage?.voice_clones_created || 0}</div>
                    <div className="text-sm text-gray-600">Voice Clones</div>
                    <div className="text-xs text-gray-500">
                      of {currentPlan.limits.voiceCloning === -1 ? '∞' : currentPlan.limits.voiceCloning}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{usageData.usage?.live_conversation_minutes_used || 0}</div>
                    <div className="text-sm text-gray-600">Live Minutes</div>
                    <div className="text-xs text-gray-500">
                      of {currentPlan.limits.liveConversationMinutes === -1 ? '∞' : currentPlan.limits.liveConversationMinutes}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help Choosing?
              </h3>
              <p className="text-gray-600 mb-6">
                Our team is here to help you find the perfect plan for your needs.
              </p>
              <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
