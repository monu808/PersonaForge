import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, CreditCard, Calendar, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');
  const subscriptionId = searchParams.get('subscription_id');

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!sessionId && !subscriptionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/stripe/subscription-details?${sessionId ? `session_id=${sessionId}` : `subscription_id=${subscriptionId}`}`);
        
        if (response.ok) {
          const details = await response.json();
          setSubscriptionDetails(details);
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [sessionId, subscriptionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Welcome to PersonaForge! Your subscription is now active.
          </p>
        </motion.div>

        {subscriptionDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-semibold">
                        {subscriptionDetails.planName || 'Premium Plan'}
                      </p>
                      <Badge variant="secondary">
                        {subscriptionDetails.interval === 'year' ? 'Yearly' : 'Monthly'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-lg font-semibold mt-1">
                      ${(subscriptionDetails.amount / 100).toFixed(2)}
                      <span className="text-sm text-gray-500 ml-1">
                        /{subscriptionDetails.interval === 'year' ? 'year' : 'month'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Next Billing Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">
                        {subscriptionDetails.nextBillingDate
                          ? new Date(subscriptionDetails.nextBillingDate * 1000).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">
                        •••• •••• •••• {subscriptionDetails.last4 || '****'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 mb-4">
                  <Crown className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Premium Features Unlocked</h3>
                <p className="text-sm text-gray-600">
                  Access all premium features and create amazing AI personas.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Access</h3>
                <p className="text-sm text-gray-600">
                  Your subscription is active immediately. Start creating now!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 mb-4">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Management</h3>
                <p className="text-sm text-gray-600">
                  Manage your subscription and billing through your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center space-y-4"
        >
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="inline-flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/create')}
            >
              Create Your First Persona
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/subscription')}
            >
              Manage Subscription
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help Getting Started?
              </h3>
              <p className="text-blue-700 mb-4">
                Check out our getting started guide or contact our support team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" size="sm">
                  View Guide
                </Button>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
