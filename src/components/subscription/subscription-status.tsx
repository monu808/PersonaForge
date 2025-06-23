import React from 'react';
import { motion } from 'framer-motion';
import { useSubscription } from '@/lib/revenuecat/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Calendar, 
  TrendingUp, 
  Settings, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
  onManage?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ onUpgrade, onManage }) => {
  const {
    isSubscribed,
    subscriptionTier,
    subscriptionTierInfo,
    expirationDate,
    willRenew,
    customerInfo,
    isLoading,
    getFeatureLimit,
    canAccessFeature
  } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading subscription status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isSubscribed) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <AlertCircle className="h-5 w-5 mr-2" />
            Free Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-4">
            You're currently on the free plan with limited features.
          </p>
          <div className="space-y-2 mb-4">            <div className="flex justify-between text-sm">
              <span>Personas Created</span>
              <span>0 / {getFeatureLimit('personas')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
          <Button onClick={onUpgrade} className="w-full">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getDaysUntilExpiration = () => {
    if (!expirationDate) return null;
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center text-green-800">
              <Crown className="h-5 w-5 mr-2" />
              {subscriptionTierInfo?.name || 'Premium'} Plan
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            {subscriptionTierInfo?.description || 'You have access to premium features.'}
          </p>

          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <div>
                <div className="text-sm font-medium">
                  {expirationDate ? `Expires ${formatDate(expirationDate)}` : 'Active'}
                </div>
                {daysUntilExpiration && (
                  <div className="text-xs text-gray-600">
                    {daysUntilExpiration > 0 
                      ? `${daysUntilExpiration} days remaining`
                      : 'Expired'
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-gray-500 mr-2" />
              <div>
                <div className="text-sm font-medium">
                  {willRenew ? 'Auto-renewal ON' : 'Auto-renewal OFF'}
                </div>
                <div className="text-xs text-gray-600">
                  {willRenew ? 'Will renew automatically' : 'Subscription will end'}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Usage */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Feature Usage</h4>
            
            {/* Personas */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>AI Personas</span>
                <span>
                  {customerInfo?.activeSubscriptions.size || 0} / {
                    getFeatureLimit('personas') === 'unlimited' 
                      ? '∞' 
                      : getFeatureLimit('personas')
                  }
                </span>
              </div>              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all" 
                  style={{ 
                    width: `${getFeatureLimit('personas') === 'unlimited' 
                      ? 50 
                      : ((customerInfo?.activeSubscriptions.size || 0) / (getFeatureLimit('personas') as number)) * 100
                    }%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Voice Cloning */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Voice Cloning</span>
                <span>
                  {canAccessFeature('voice_cloning') ? 'Available' : 'Not Available'}
                </span>
              </div>              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all" 
                  style={{ width: `${canAccessFeature('voice_cloning') ? 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* API Access */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>API Access</span>
                <span>
                  {canAccessFeature('api_access') ? 'Enabled' : 'Disabled'}
                </span>
              </div>              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all" 
                  style={{ width: `${canAccessFeature('api_access') ? 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onManage} className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
            <Button onClick={onUpgrade} className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptionTierInfo?.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Management URL */}
      {customerInfo?.managementURL && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Billing Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage your billing information, payment method, and download invoices.
            </p>
            <Button 
              variant="outline" 
              asChild
              className="w-full"
            >
              <a 
                href={customerInfo.managementURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Billing Portal
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Renewal Warning */}
      {!willRenew && expirationDate && daysUntilExpiration && daysUntilExpiration <= 7 && daysUntilExpiration > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <div className="font-medium text-orange-800">
                  Subscription Ending Soon
                </div>
                <div className="text-sm text-orange-700">
                  Your subscription will end in {daysUntilExpiration} days. 
                  Enable auto-renewal to continue enjoying premium features.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionStatus;