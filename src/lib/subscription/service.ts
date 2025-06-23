import { supabase } from '../auth';
import { SUBSCRIPTION_PLANS, getUserPlan, SubscriptionPlan } from './plans';

export interface UserUsage {
  id: string;
  user_id: string;
  personas_created: number;
  text_to_speech_used: number;
  voice_clones_created: number;
  live_conversation_minutes_used: number;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionDetails {
  id: string;
  user_id: string;
  status: string;
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export class SubscriptionService {
    /**
   * Get user's current subscription details
   */
  static async getUserSubscription(): Promise<{ plan: SubscriptionPlan; subscription: UserSubscriptionDetails | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { plan: SUBSCRIPTION_PLANS.free, subscription: null };
      }

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !subscription) {
        // Create a free subscription for new users
        const freeSubscription = await this.createFreeSubscription(user.id);
        return { plan: SUBSCRIPTION_PLANS.free, subscription: freeSubscription };
      }

      const plan = getUserPlan(subscription.status, subscription.plan_id);
      return { plan, subscription };
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return { plan: SUBSCRIPTION_PLANS.free, subscription: null };
    }
  }

  /**
   * Create a free subscription for new users
   */
  static async createFreeSubscription(userId: string): Promise<UserSubscriptionDetails | null> {
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 10); // Free plan never expires

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          plan_id: 'free',
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating free subscription:', error);
      return null;
    }
  }

  /**
   * Get user's current usage statistics
   */
  static async getUserUsage(): Promise<UserUsage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: usage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no usage record exists, create one
        if (error.code === 'PGRST116') {
          return await this.initializeUserUsage();
        }
        throw error;
      }

      // Check if usage period has expired and reset if needed
      if (new Date(usage.current_period_end) < new Date()) {
        return await this.resetMonthlyUsage();
      }

      return usage;
    } catch (error) {
      console.error('Error fetching user usage:', error);
      return null;
    }
  }

  /**
   * Initialize usage tracking for new user
   */
  static async initializeUserUsage(): Promise<UserUsage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const { data: usage, error } = await supabase
        .from('user_usage')
        .insert({
          user_id: user.id,
          personas_created: 0,
          text_to_speech_used: 0,
          voice_clones_created: 0,
          live_conversation_minutes_used: 0,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return usage;
    } catch (error) {
      console.error('Error initializing user usage:', error);
      return null;
    }
  }

  /**
   * Reset monthly usage counters
   */
  static async resetMonthlyUsage(): Promise<UserUsage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const { data: usage, error } = await supabase
        .from('user_usage')
        .update({
          personas_created: 0,
          text_to_speech_used: 0,
          voice_clones_created: 0,
          live_conversation_minutes_used: 0,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return usage;
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      return null;
    }
  }
  /**
   * Check if user can perform a specific action based on their plan and usage
   */
  static async canPerformAction(action: 'personas' | 'textToSpeech' | 'voiceCloning' | 'liveConversationMinutes' | 'monetizationEnabled' | 'eventHosting' | 'automationEnabled'): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { plan } = await this.getUserSubscription();
      const usage = await this.getUserUsage();

      if (!usage) {
        return { allowed: false, reason: 'Unable to fetch usage data' };
      }

      // Handle boolean permissions first
      if (action === 'monetizationEnabled' || action === 'eventHosting' || action === 'automationEnabled') {
        const allowed = plan.limits[action];
        return { 
          allowed, 
          reason: allowed ? undefined : `This feature requires a higher subscription plan` 
        };
      }

      // Handle usage-based permissions
      let currentUsage = 0;
      let limitKey: keyof SubscriptionPlan['limits'];
      
      switch (action) {
        case 'personas':
          currentUsage = usage.personas_created;
          limitKey = 'personas';
          break;
        case 'textToSpeech':
          currentUsage = usage.text_to_speech_used;
          limitKey = 'textToSpeech';
          break;
        case 'voiceCloning':
          currentUsage = usage.voice_clones_created;
          limitKey = 'voiceCloning';
          break;
        case 'liveConversationMinutes':
          currentUsage = usage.live_conversation_minutes_used;
          limitKey = 'liveConversationMinutes';
          break;
        default:
          return { allowed: false, reason: 'Unknown action' };
      }

      const limit = plan.limits[limitKey];
      
      // Check if unlimited (-1)
      if (limit === -1) {
        return { allowed: true };
      }
      
      // Check if within limits
      if (typeof limit === 'number' && currentUsage < limit) {
        return { allowed: true };
      }
      
      // User has reached their limit
      return { 
        allowed: false, 
        reason: `You've reached your limit of ${limit} for ${this.getFeatureName(action)}. Current usage: ${currentUsage}` 
      };
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Get user friendly feature name
   */
  static getFeatureName(action: string): string {
    const names = {
      personas: 'personas',
      textToSpeech: 'text-to-speech generations',
      voiceCloning: 'voice clones',
      liveConversationMinutes: 'live conversation minutes',
      monetizationEnabled: 'monetization',
      eventHosting: 'event hosting',
      automationEnabled: 'automation'
    };
    return names[action as keyof typeof names] || action;
  }

  /**
   * Increment usage counter for a specific action
   */
  static async incrementUsage(action: 'personas' | 'textToSpeech' | 'voiceCloning' | 'liveConversationMinutes', amount: number = 1): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get current usage
      const usage = await this.getUserUsage();
      if (!usage) return false;

      let updateField = '';
      switch (action) {
        case 'personas':
          updateField = 'personas_created';
          break;
        case 'textToSpeech':
          updateField = 'text_to_speech_used';
          break;
        case 'voiceCloning':
          updateField = 'voice_clones_created';
          break;
        case 'liveConversationMinutes':
          updateField = 'live_conversation_minutes_used';
          break;
        default:
          return false;
      }

      const { error } = await supabase
        .from('user_usage')
        .update({
          [updateField]: usage[updateField as keyof UserUsage] as number + amount
        })
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  /**
   * Get usage statistics with plan limits for display
   */
  static async getUsageWithLimits(): Promise<{
    usage: UserUsage;
    plan: SubscriptionPlan;
    percentages: {
      personas: number;
      textToSpeech: number;
      voiceCloning: number;
      liveConversationMinutes: number;
    };
  } | null> {
    try {
      const { plan } = await this.getUserSubscription();
      const usage = await this.getUserUsage();

      if (!usage) return null;

      const calculatePercentage = (used: number, limit: number): number => {
        if (limit === -1) return 0; // Unlimited
        if (limit === 0) return 100; // No allowance
        return Math.min((used / limit) * 100, 100);
      };

      return {
        usage,
        plan,
        percentages: {
          personas: calculatePercentage(usage.personas_created, plan.limits.personas),
          textToSpeech: calculatePercentage(usage.text_to_speech_used, plan.limits.textToSpeech),
          voiceCloning: calculatePercentage(usage.voice_clones_created, plan.limits.voiceCloning),
          liveConversationMinutes: calculatePercentage(usage.live_conversation_minutes_used, plan.limits.liveConversationMinutes)
        }
      };
    } catch (error) {
      console.error('Error getting usage with limits:', error);
      return null;
    }
  }
}

export default SubscriptionService;
