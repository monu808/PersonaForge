import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BrainCircuitIcon, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/auth';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {    const checkResetToken = async () => {
      try {
        // Get tokens from URL parameters - try different formats
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');        console.log('Reset password params:', { 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          hasToken: !!token,
          hasTokenHash: !!tokenHash,
          allParams: Object.fromEntries(searchParams.entries()),
          fullUrl: window.location.href
        });

        // Method 1: If we have access_token and refresh_token (modern format)
        if (accessToken && refreshToken) {
          console.log('✅ Using access_token/refresh_token method');
          
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          if (data?.user) {
            console.log('✅ Reset session established for user:', data.user.email);
            setStatus('form');
            return;
          }
        }

        // Method 2: If we have token_hash (legacy format)
        if (tokenHash && type === 'recovery') {
          console.log('✅ Using token_hash method');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            throw error;
          }

          if (data?.user && data?.session) {
            console.log('✅ Reset session established via OTP for user:', data.user.email);
            setStatus('form');
            return;
          }
        }

        // Method 3: Check if user is already authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          console.log('✅ User already has active session');
          setStatus('form');
          return;
        }

        // If none of the methods worked, show error
        throw new Error('Invalid reset link. Please request a new password reset.');

      } catch (error) {
        console.error('❌ Reset token validation error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'Invalid or expired reset link. Please request a new password reset.'
        );
      }
    };

    checkResetToken();
  }, [searchParams]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setMessage('');

    try {
      console.log('🔄 Updating password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      });

      if (error) {
        throw error;
      }

      console.log('✅ Password updated successfully');
      setStatus('success');
      setMessage('Your password has been updated successfully!');

      // Redirect to sign-in after a moment
      setTimeout(() => {
        navigate('/auth/sign-in', { replace: true });
      }, 3000);

    } catch (error) {
      console.error('❌ Password update error:', error);
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to update password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center group">
            <BrainCircuitIcon className="h-10 w-10 text-primary-600 group-hover:text-primary-700 transition-colors" />
            <span className="ml-3 text-2xl font-bold text-gray-900">PersonaForge</span>
          </Link>
        </div>
        
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Set new password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-gray-600">Validating reset link...</p>
            </div>
          )}

          {status === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {message && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Update password
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password Updated!
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to sign in...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invalid Reset Link
              </h3>
              <p className="text-red-600 mb-6 text-sm">
                {message}
              </p>
              <div className="space-y-3">
                <Link to="/auth/forgot-password">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>
                <Link to="/auth/sign-in">
                  <Button variant="outline" className="w-full">Back to Sign In</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
