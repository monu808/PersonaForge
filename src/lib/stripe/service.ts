import { Stripe } from '@stripe/stripe-js';
import { stripePromise, SUBSCRIPTION_PRICES } from './config';

export class StripeService {
  private static instance: StripeService;
  private stripe: Promise<Stripe | null>;

  private constructor() {
    this.stripe = stripePromise;
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Create a subscription checkout session
   */
  async createCheckoutSession(
    priceId: string,
    customerId?: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ sessionId: string; url: string } | null> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId,
          successUrl: successUrl || `${window.location.origin}/subscription/success`,
          cancelUrl: cancelUrl || `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();
      return { sessionId, url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await this.stripe;
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw error;
    }
  }

  /**
   * Create a subscription with payment method
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId: string
  ): Promise<any> {
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          priceId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<any> {
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          priceId: newPriceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(customerId: string): Promise<{ url: string } | null> {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: `${window.location.origin}/subscription`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return { url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      return null;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<any> {
    try {
      const response = await fetch(`/api/stripe/customer/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get customer');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  /**
   * Handle payment method setup
   */
  async setupPaymentMethod(customerId: string): Promise<{ clientSecret: string } | null> {
    try {
      const response = await fetch('/api/stripe/setup-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to setup payment method');
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up payment method:', error);
      return null;
    }
  }

  /**
   * Get available payment methods for customer
   */
  async getPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/stripe/payment-methods/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get payment methods');
      }

      const { paymentMethods } = await response.json();
      return paymentMethods || [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  /**
   * Get price by tier and billing cycle
   */
  getPriceId(tier: string, billingCycle: 'monthly' | 'yearly'): string {
    const key = `${tier}_${billingCycle}` as keyof typeof SUBSCRIPTION_PRICES;
    return SUBSCRIPTION_PRICES[key] || '';
  }
}

// Export singleton instance
export const stripeService = StripeService.getInstance();
