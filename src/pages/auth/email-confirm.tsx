import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/auth';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get parameters from URL
        const token = searchParams.get('token') || searchParams.get('token_hash');
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        
        console.log('Email confirmation params:', { 
          token: token ? '***' : null, 
          type, 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          allParams: Object.fromEntries(searchParams.entries())
        });

        // Method 1: If we have access_token and refresh_token, set the session directly
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens from URL');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }          if (data?.user && data?.session) {
            setStatus('success');
            setMessage('Your email has been confirmed successfully! You can now access your account.');
            
            // Wait a moment then redirect to coruscant
            setTimeout(() => {
              navigate('/coruscant', { replace: true });
            }, 2000);
            return;
          }
        }// Method 2: Use token/token_hash with verifyOtp
        if (token) {
          console.log('Verifying OTP with token');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (error) {
            throw error;
          }

          if (data?.user && data?.session) {
            setStatus('success');
            setMessage('Your email has been confirmed successfully! You can now access your account.');
            
            // Wait a moment then redirect to coruscant
            setTimeout(() => {
              navigate('/coruscant', { replace: true });
            }, 2000);
            return;
          }
        }

        // Method 3: Check if we already have a session (user might have clicked link while logged in)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          console.log('User already has active session');
          setStatus('success');          setMessage('Your email has been confirmed and you are already signed in!');
          
          setTimeout(() => {
            navigate('/coruscant', { replace: true });
          }, 2000);
          return;
        }

        // If we get here, we don't have the right parameters or tokens
        throw new Error('Invalid confirmation link or missing parameters');

      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'Failed to confirm email. The link may be expired or invalid.'
        );
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/auth/sign-up', { replace: true });
  };

  const handleSignIn = () => {
    navigate('/auth/sign-in', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirming your email...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Email Confirmed!
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirmation Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full">
                  Try Creating Account Again
                </Button>
                <Button onClick={handleSignIn} variant="outline" className="w-full">
                  Sign In Instead
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
