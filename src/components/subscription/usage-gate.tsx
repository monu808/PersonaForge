import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Star, Crown } from 'lucide-react';
import SubscriptionService from '@/lib/subscription/service';
import { Link } from 'react-router-dom';

interface UsageGateProps {
  action: 'personas' | 'textToSpeech' | 'voiceCloning' | 'liveConversationMinutes' | 'monetizationEnabled' | 'eventHosting' | 'automationEnabled';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const UsageGate: React.FC<UsageGateProps> = ({
  action,
  children,
  fallback,
  showUpgradePrompt = true,
  className = ''
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    checkAccess();
  }, [action]);

  const checkAccess = async () => {
    try {
      setIsLoading(true);
      const permission = await SubscriptionService.canPerformAction(action);
      const { plan } = await SubscriptionService.getUserSubscription();
      
      setHasAccess(permission.allowed);
      setReason(permission.reason || '');
      setCurrentPlan(plan.id);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureName = (action: string) => {
    const names = {
      personas: 'Persona Creation',
      textToSpeech: 'Text-to-Speech',
      voiceCloning: 'Voice Cloning',
      liveConversationMinutes: 'Live Conversation',
      monetizationEnabled: 'Monetization',
      eventHosting: 'Event Hosting',
      automationEnabled: 'Automation'
    };
    return names[action as keyof typeof names] || action;
  };

  const getRequiredPlan = (action: string) => {
    const requirements = {
      personas: currentPlan === 'free' ? 'premium' : null,
      textToSpeech: currentPlan === 'free' ? 'premium' : null,
      voiceCloning: 'premium',
      liveConversationMinutes: 'premium',
      monetizationEnabled: 'creator',
      eventHosting: 'creator',
      automationEnabled: 'creator'
    };
    return requirements[action as keyof typeof requirements];
  };

  const getPlanInfo = (plan: string) => {
    const plans = {
      premium: { name: 'Premium', icon: Star, color: 'blue', price: '₹199.99' },
      creator: { name: 'Creator', icon: Crown, color: 'purple', price: '₹499.99' },
      enterprise: { name: 'Enterprise', icon: Crown, color: 'gray', price: '₹999.99' }
    };
    return plans[plan as keyof typeof plans] || plans.premium;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredPlan = getRequiredPlan(action);
  const planInfo = requiredPlan ? getPlanInfo(requiredPlan) : null;
  const Icon = planInfo?.icon || Lock;

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gray-200 rounded-full">
                <Icon className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {getFeatureName(action)} Restricted
            </h3>
            
            <p className="text-gray-600 mb-4">
              {reason || `This feature requires a higher subscription plan.`}
            </p>

            {planInfo && requiredPlan !== 'enterprise' && (
              <div className="mb-4">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Requires {planInfo.name} Plan - {planInfo.price}/month
                </Badge>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {requiredPlan === 'enterprise' ? (
                <Button asChild className="bg-gray-800 hover:bg-gray-900">
                  <Link to="/pricing">Contact Sales</Link>
                </Button>
              ) : (
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link to="/pricing">Upgrade Plan</Link>
                </Button>
              )}
              
              <Button variant="outline" asChild>
                <Link to="/pricing">View All Plans</Link>
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageGate;
