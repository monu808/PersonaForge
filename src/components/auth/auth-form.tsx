import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signUpSchema, signUp, signIn, signInWithGoogle } from '@/lib/auth';
import GoogleButton from 'react-google-button';

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

    try {
      if (mode === 'signup') {
        const { error } = await signUp(data);
        if (error) throw error;
        setError('Please check your email to verify your account.');
      } else {
        const { data: authData, error } = await signIn(data);
        if (error) throw error;
        if (authData?.user) {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      if (err.message === 'User already registered') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await signInWithGoogle();
      if (error) throw error;
      if (data) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-8 bg-white rounded-lg shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <Link to="/auth/sign-up" className="text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/auth/sign-in" className="text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
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
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        )}

        {error && (
          <div className={`p-3 rounded-md ${
            error.includes('Please check your email')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          } text-sm flex items-center`}>
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === 'signin' ? (
            'Sign in'
          ) : (
            'Sign up'
          )}
        </Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div>
          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full"
          />
        </div>
      </form>
    </div>
  );
}