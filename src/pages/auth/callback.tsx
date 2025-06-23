import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {        console.log('Auth callback - URL params:', Object.fromEntries(searchParams.entries()));
        
        // Check if this is a password reset (redirect to reset-password page)
        const type = searchParams.get('type');
        if (type === 'recovery') {
          console.log('Redirecting to password reset handler');
          const currentUrl = window.location.href;
          const resetPasswordUrl = currentUrl.replace('/auth/callback', '/auth/reset-password');
          window.location.replace(resetPasswordUrl);
          return;
        }
        
        // Check if this is an email confirmation (redirect to email-confirm page)
        if (type === 'email_confirmation' || searchParams.get('token_hash')) {
          console.log('Redirecting to email confirmation handler');
          const currentUrl = window.location.href;
          const emailConfirmUrl = currentUrl.replace('/auth/callback', '/auth/email-confirm');
          window.location.replace(emailConfirmUrl);
          return;
        }

        // Handle OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth/sign-in?error=callback_failed');
          return;
        }        if (data?.session) {
          console.log('Session found, redirecting to coruscant');
          // User is authenticated, redirect to coruscant
          navigate('/coruscant', { replace: true });
        } else {
          console.log('No session found, redirecting to sign in');
          // No session found, redirect to sign in
          navigate('/auth/sign-in');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/auth/sign-in?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
