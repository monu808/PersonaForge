import { useState } from 'react';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function DatabaseDiagnosticPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing Supabase connection...');
      
      // Test 1: Basic connection
      const { data: session, error: sessionError } = await supabase.auth.getSession();
        // Test 2: Try to query a simple auth table
      const { data: user, error: userError } = await supabase.auth.getUser();

      setResult({
        connection: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length
        },
        session: {
          hasSession: !!session,
          error: sessionError?.message || null
        },        user: {
          hasUser: !!user,
          error: userError?.message || null
        }
      });

    } catch (err) {
      console.error('Connection test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testSimpleSignup = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing simple signup...');
      
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      console.log('Attempting signup with:', { email: testEmail });
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      console.log('Signup result:', { data, error });

      setResult({
        testEmail,
        success: !error,
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          email_confirmed_at: data.user.email_confirmed_at
        } : null,
        session: data?.session ? 'Session created' : 'No session',
        error: error ? {
          message: error.message,
          status: error.status || 'Unknown',
          details: error
        } : null
      });

      if (error) {
        setError(`Signup failed: ${error.message}`);
      }

    } catch (err) {
      console.error('Signup test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult({ error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSupabaseProject = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Extract project reference from URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      
      setResult({
        projectInfo: {
          supabaseUrl,
          projectRef,
          isValidUrl: /^https:\/\/[a-z]+\.supabase\.co$/.test(supabaseUrl || ''),
        },
        environment: {
          isDevelopment: import.meta.env.DEV,
          mode: import.meta.env.MODE,
          hasAllEnvVars: !!(
            import.meta.env.VITE_SUPABASE_URL && 
            import.meta.env.VITE_SUPABASE_ANON_KEY
          )
        },
        recommendations: [
          'Check that your Supabase project is active and not paused',
          'Verify environment variables are correct',
          'Check Supabase dashboard for any service issues',
          'Ensure your database has proper auth tables and triggers'
        ]
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Database Diagnostic</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Connection Test</h2>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Test Connection
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Signup Test</h2>
            <Button 
              onClick={testSimpleSignup} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Test Simple Signup
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Project Info</h2>
            <Button 
              onClick={checkSupabaseProject} 
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Check Project
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <p className="text-red-700 font-mono text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-4">Diagnostic Results:</h3>
            <pre className="text-sm text-blue-700 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-4">Common 500 Error Causes:</h3>
          <ul className="text-yellow-700 text-sm space-y-2">
            <li>• <strong>Database triggers failing</strong> - Check for custom triggers on user creation</li>
            <li>• <strong>Row Level Security issues</strong> - RLS policies blocking user insertion</li>
            <li>• <strong>Missing required tables</strong> - profiles table or other dependencies</li>
            <li>• <strong>Supabase project issues</strong> - Project paused, billing issues, or service outage</li>
            <li>• <strong>Environment variables</strong> - Wrong project URL or API key</li>
            <li>• <strong>Database schema corruption</strong> - Auth tables modified incorrectly</li>
          </ul>
        </div>

        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-4">Next Steps:</h3>
          <ol className="text-green-700 text-sm space-y-2">
            <li>1. <strong>Run the tests above</strong> to identify the specific issue</li>
            <li>2. <strong>Check Supabase Dashboard Logs</strong> for detailed error messages</li>
            <li>3. <strong>Verify project status</strong> - ensure it's not paused or suspended</li>
            <li>4. <strong>Check database schema</strong> in SQL Editor for any issues</li>
            <li>5. <strong>Review any custom triggers/functions</strong> that might be failing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
