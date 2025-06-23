import { useState } from 'react';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function PasswordResetTestPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testPasswordReset = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔄 Testing password reset for:', email);
      console.log('🔄 Redirect URL will be:', `${window.location.origin}/auth/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      console.log('📧 Password reset response:', { data, error });
      
      setResult({
        success: !error,
        email: email,
        redirectUrl: `${window.location.origin}/auth/reset-password`,
        response: data,
        error: error ? {
          message: error.message,
          status: error.status || 'Unknown',
          details: error
        } : null
      });

      if (error) {
        setError(`Password reset failed: ${error.message}`);
      }

    } catch (err) {
      console.error('❌ Password reset test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult({ error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlParams.entries());
    
    setResult({
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      searchParams: params,
      hasResetParams: !!(params.access_token || params.token_hash || params.type),
      expectedRedirectUrl: `${window.location.origin}/auth/reset-password`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Password Reset Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Password Reset Email</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter email to test password reset"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <Button 
              onClick={testPasswordReset} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Password Reset Email
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Check Current URL Parameters</h2>
          <Button 
            onClick={checkCurrentUrl} 
            variant="outline"
            className="w-full"
          >
            Analyze Current URL
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Result:</h3>
            <pre className="text-sm text-blue-700 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
          <ol className="text-yellow-700 text-sm space-y-1">
            <li>1. Enter your email and click "Send Password Reset Email"</li>
            <li>2. Check your email for the reset link</li>
            <li>3. Click the reset link from your email</li>
            <li>4. If it redirects to /auth/callback, that link should auto-redirect to /auth/reset-password</li>
            <li>5. On the reset page, check browser console for parameter details</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Expected Flow:</h3>
          <div className="text-green-700 text-sm">
            <p><strong>Email Link → /auth/callback?type=recovery&... → Auto-redirect to /auth/reset-password</strong></p>
            <p>OR</p>
            <p><strong>Email Link → /auth/reset-password directly</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
