import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BrainCircuitIcon, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/auth';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setMessage('');

    try {
      console.log('🔄 Requesting password reset for:', data.email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      console.log('✅ Password reset email sent successfully');
      setStatus('success');
      setMessage(`We've sent a password reset link to ${data.email}. Please check your email and follow the instructions to reset your password.`);

    } catch (error) {
      console.error('❌ Password reset error:', error);
      setStatus('error');
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to send password reset email. Please try again.'
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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Send reset link
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check your email
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {message}
              </p>
              <Button onClick={() => setStatus('form')} variant="outline" className="w-full">
                Send another email
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-red-600 mb-6 text-sm">
                {message}
              </p>
              <Button onClick={() => setStatus('form')} className="w-full">
                Try again
              </Button>
            </div>
          )}

          <div className="mt-6">
            <Link 
              to="/auth/sign-in" 
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
