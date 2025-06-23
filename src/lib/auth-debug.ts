import { supabase } from '@/lib/auth';

export function checkAuthConfiguration() {
  const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    currentOrigin: window.location.origin,
    expectedCallbackUrl: `${window.location.origin}/auth/callback`,
  };

  console.log('Auth Configuration Check:', config);

  return config;
}

export async function testGoogleOAuth() {
  try {
    console.log('Testing Google OAuth configuration...');
    
    // This will make a test request to see if Google OAuth is configured
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'none', // Don't show consent screen, just test config
        },
      },
    });

    if (error) {
      console.error('Google OAuth test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('Google OAuth test passed');
    return { success: true, data };
  } catch (error) {
    console.error('Error testing Google OAuth:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Debug function to log OAuth errors
export function logOAuthError(error: any) {
  console.group('OAuth Error Details');
  console.error('Error message:', error?.message);
  console.error('Error code:', error?.status);
  console.error('Full error:', error);
  console.log('Current URL:', window.location.href);
  console.log('Expected callback URL:', `${window.location.origin}/auth/callback`);
  console.groupEnd();
}
