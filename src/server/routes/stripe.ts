import { Router } from 'express';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase';

const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Webhook endpoint secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Raw body parser for Stripe webhooks
router.use('/webhook', (req: Request, res: Response, next) => {
  if (req.get('content-type') === 'application/json') {
    req.setEncoding('utf8');
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      req.body = data;
      next();
    });
  } else {
    next();
  }
});

// Stripe webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  // Update user subscription status in database
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: subscription.metadata.user_id,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      created_at: new Date(),
      updated_at: new Date()
    });

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      plan_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date(),
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    // Update subscription payment status
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        last_payment_date: new Date(),
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  if (invoice.subscription) {
    // Update subscription with payment failure
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        payment_failed: true,
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating payment failure:', error);
      throw error;
    }
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);
  
  if (session.subscription && session.metadata?.user_id) {
    // Ensure subscription is properly linked to user
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: session.metadata.user_id,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        checkout_session_id: session.id,
        updated_at: new Date()
      });

    if (error) {
      console.error('Error linking checkout to subscription:', error);
      throw error;
    }
  }
}

// Get subscription details
router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json(data || null);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create checkout session
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { priceId, userId, userEmail } = req.body;

    // Create or get customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: { user_id: userId }
        });
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      throw error;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        user_id: userId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
