import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { useSubscription } from '@/lib/revenuecat/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DatabaseCleanup from '@/components/debug/DatabaseCleanup';
import { 
  Crown, 
  Check, 
  X, 
  User, 
  Mail, 
  Calendar,
  Shield,
  Zap,
  Sparkles,
  Star
} from 'lucide-react';

const AdminTestPage: React.FC = () => {
  const { user } = useAuth();  const { 
    isSubscribed, 
    subscriptionTier, 
    canAccessFeature, 
    getFeatureLimit,
    expirationDate
  } = useSubscription();

  const isPremiumUser = user?.email === 'monu80850raj@gmail.com';

  const testFeatures = [
    { id: 'basic_persona_creation', name: 'Basic Persona Creation', icon: User },
    { id: 'voice_cloning', name: 'Voice Cloning', icon: Sparkles },
    { id: 'hd_video_generation', name: 'HD Video Generation', icon: Star },
    { id: '4k_video_generation', name: '4K Video Generation', icon: Crown },
    { id: 'api_access', name: 'API Access', icon: Zap },
    { id: 'commercial_usage', name: 'Commercial Usage', icon: Shield },
    { id: 'team_collaboration', name: 'Team Collaboration', icon: User },
    { id: 'white_label', name: 'On-Premise Deployment', icon: Shield },
    { id: 'neurovia_access', name: 'Neurovia Access', icon: Sparkles },
    { id: 'premium_neurovia_features', name: 'Premium Neurovia Features', icon: Crown },
  ];

  const limits = [
    { id: 'personas', name: 'Personas' },
    { id: 'voice_cloning', name: 'Voice Cloning Sessions' },
    { id: 'video_generation', name: 'Video Generations' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Premium Features Test Panel
          </h1>
          <p className="text-gray-600">
            Verify premium feature access for the special user account
          </p>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user?.email || 'Not logged in'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Premium User</label>
                  <div className="flex items-center gap-2 mt-1">
                    {isPremiumUser ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <Badge className="bg-green-100 text-green-700">Yes</Badge>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500" />
                        <Badge variant="secondary">No</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subscription Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {isSubscribed ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500" />
                        <Badge variant="secondary">Inactive</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subscription Tier</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <Badge variant={subscriptionTier === 'enterprise' ? 'default' : 'secondary'}>
                      {subscriptionTier || 'Free'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {expirationDate && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Expires: {expirationDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Access */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Feature Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testFeatures.map((feature) => {
                    const hasAccess = canAccessFeature(feature.id);
                    const IconComponent = feature.icon;
                    
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium">{feature.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasAccess ? (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <Badge variant="secondary">Disabled</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Limits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Feature Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {limits.map((limit) => {
                    const limitValue = getFeatureLimit(limit.id);
                    
                    return (
                      <div key={limit.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{limit.name}</span>
                          <Badge 
                            variant={limitValue === 'unlimited' ? 'default' : 'secondary'}
                            className={limitValue === 'unlimited' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {limitValue === 'unlimited' ? 'Unlimited' : `${limitValue} per month`}
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              limitValue === 'unlimited' 
                                ? 'bg-green-500 w-full' 
                                : typeof limitValue === 'number' && limitValue > 50
                                ? 'bg-blue-500 w-3/4'
                                : typeof limitValue === 'number' && limitValue > 10
                                ? 'bg-yellow-500 w-1/2'
                                : 'bg-red-500 w-1/4'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Premium Features Status
              </h3>
              <p className="text-blue-700 mb-4">
                {isPremiumUser 
                  ? '✅ All premium features are enabled for this account!'
                  : '❌ This account does not have premium access. Please log in with monu80850raj@gmail.com'
                }
              </p>
              {isPremiumUser && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/create'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Premium Persona
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/dashboard/videos'}
                    variant="outline"
                  >
                    Generate 4K Videos
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/elevenlabs'}
                    variant="outline"
                  >
                    Access Voice Cloning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Database Cleanup - Admin Only */}
        {user?.email === 'monu80850raj@gmail.com' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <DatabaseCleanup />
          </motion.div>
        )}
      </div>
    </div>  );
};

export default AdminTestPage;
