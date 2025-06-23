-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create user_usage table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    personas_created INTEGER DEFAULT 0,
    text_to_speech_used INTEGER DEFAULT 0,
    voice_clones_created INTEGER DEFAULT 0,
    live_conversation_minutes_used INTEGER DEFAULT 0,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for user_usage
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user_usage
CREATE POLICY "Users can view their own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_usage
CREATE TRIGGER handle_user_usage_updated_at
    BEFORE UPDATE ON public.user_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create free subscription and usage tracking for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create free subscription
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');
    
    -- Create usage tracking
    INSERT INTO public.user_usage (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create subscription and usage when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
