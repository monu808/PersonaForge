import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/ui/google-signin-button';
import { signUpSchema, signUp, signIn, signInWithGoogle } from '@/lib/auth';
import { logOAuthError } from '@/lib/auth-debug';

type FormData = z.infer<typeof signUpSchema>;

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {      if (mode === 'signup') {
        const { error } = await signUp(data);
        if (error) throw error;
        setError('Success! Please check your email and click the confirmation link to activate your account.');
      } else {
        const { data: authData, error } = await signIn(data);
        if (error) throw error;
        if (authData?.user) {
          navigate('/coruscant', { replace: true });
        }
      }} catch (err) {
      const error = err as Error;
      if (error.message === 'User already registered') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        logOAuthError(error);
        throw error;
      }
      // OAuth will redirect to Google, then back to our callback
      // No need to navigate here as the redirect will happen automatically
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message.includes('400') 
        ? 'Google sign-in is not properly configured. Please contact support or try email sign-in instead.'
        : `Google sign-in failed: ${error.message}`;
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              {mode === 'signin' && (
                <Link 
                  to="/auth/forgot-password" 
                  className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              {...register('password')}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number (optional)
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+1234567890"
                autoComplete="tel"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          )}          {error && (
            <div className={`p-3 rounded-md ${
              error.includes('Success!') || error.includes('Please check your email')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            } text-sm flex items-center`}>
              {error.includes('Success!') || error.includes('Please check your email') ? (
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>          <GoogleSignInButton
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
}