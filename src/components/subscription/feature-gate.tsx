import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSubscription } from '@/lib/revenuecat/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Star, Zap, Crown } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  requiredTier?: string;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredTier = 'premium',
  children,
  fallbackComponent,
  showUpgradePrompt = true,
  className = ''
}) => {
  const { canAccessFeature, subscriptionTier, isSubscribed } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const hasAccess = canAccessFeature(feature);

  const getTierInfo = (tier: string) => {
    const tiers = {
      premium: { name: 'Premium', icon: Star, color: 'blue' },
      pro: { name: 'Pro', icon: Zap, color: 'purple' },
      creator: { name: 'Creator', icon: Crown, color: 'orange' },
      enterprise: { name: 'Enterprise', icon: Crown, color: 'gray' }
    };
    return tiers[tier as keyof typeof tiers] || tiers.premium;
  };

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  if (fallbackComponent) {
    return <div className={className}>{fallbackComponent}</div>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const tierInfo = getTierInfo(requiredTier);
  const TierIcon = tierInfo.icon;

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className={`w-16 h-16 mx-auto rounded-full bg-${tierInfo.color}-100 flex items-center justify-center`}>
              <Lock className={`h-8 w-8 text-${tierInfo.color}-600`} />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Premium Feature
              </h3>
              <p className="text-gray-600">
                This feature requires a {tierInfo.name} subscription or higher.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <TierIcon className="h-3 w-3" />
                {tierInfo.name}+ Required
              </Badge>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowPaywall(true)}
                className="w-full"
              >
                {isSubscribed ? 'Upgrade Plan' : 'Start Free Trial'}
              </Button>
              
              <p className="text-xs text-gray-500">
                7-day free trial • Cancel anytime
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Paywall would be rendered here */}
      {showPaywall && (
        <div>
          {/* PaywallComponent would be imported and used here */}
          {/* <PaywallComponent 
            isOpen={showPaywall} 
            onClose={() => setShowPaywall(false)}
            selectedTier={requiredTier}
          /> */}
        </div>
      )}
    </div>
  );
};

export default FeatureGate;
