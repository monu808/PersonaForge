import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { stripePromise, STRIPE_CONFIG } from '@/lib/stripe/config';
import { stripeService } from '@/lib/stripe/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface CheckoutFormProps {
  priceId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  priceId,
  planName,
  amount,
  billingCycle,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessing(true);

    try {
      // Confirm payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Create subscription on the backend
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          paymentMethodId: 'auto', // Use the payment method from elements
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { clientSecret, subscriptionId } = await response.json();

      // Confirm payment with client secret
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success?subscription_id=${subscriptionId}`,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Success
      onSuccess?.(subscriptionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{planName}</CardTitle>
            <Badge variant="secondary">
              {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-2xl font-bold">
            <span>Total</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Billed {billingCycle === 'yearly' ? 'annually' : 'monthly'}
            {billingCycle === 'yearly' && <span className="text-green-600 ml-1">(Save 20%)</span>}
          </p>
        </CardContent>
      </Card>

      {/* Payment Element */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="h-4 w-4" />
        <span>Payments are secure and encrypted. Powered by Stripe.</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isLoading || processing}
      >
        {isLoading || processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Subscribe to {planName}
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By subscribing, you agree to our{' '}
        <a href="/terms" className="underline hover:text-gray-700">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline hover:text-gray-700">
          Privacy Policy
        </a>
        . You can cancel anytime.
      </p>
    </form>
  );
};

interface StripeCheckoutProps {
  priceId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  priceId,
  planName,
  amount,
  billingCycle,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create payment intent on component mount
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
              priceId,
              planName,
              billingCycle,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError?.('Failed to initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [priceId, amount, planName, billingCycle, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Initializing payment...</span>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Payment Initialization Failed</h3>
        <p className="text-gray-600 mb-4">
          We couldn't initialize the payment process. Please try again.
        </p>
        <Button onClick={onCancel} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">Complete Your Subscription</h2>
        <p className="text-gray-600 text-center">
          Secure checkout powered by Stripe
        </p>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: STRIPE_CONFIG.elementsOptions.appearance,
        }}
      >
        <CheckoutForm
          priceId={priceId}
          planName={planName}
          amount={amount}
          billingCycle={billingCycle}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>

      <div className="mt-6 text-center">
        <Button onClick={onCancel} variant="ghost">
          ← Back to Pricing
        </Button>
      </div>
    </div>
  );
};

export default StripeCheckout;
