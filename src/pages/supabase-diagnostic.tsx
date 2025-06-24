import { supabase } from '../lib/auth';

export default function SupabaseDiagnostic() {
  const testConnection = async () => {
    console.log('Testing Supabase connection...');
    
    try {
      // Test basic connection
      const { error: healthError } = await supabase
        .from('podcasts')
        .select('count')
        .limit(1);
      
      if (healthError) {
        console.error('Supabase connection error:', healthError);
        console.error('Error details:', {
          message: healthError.message,
          code: healthError.code,
          details: healthError.details,
          hint: healthError.hint
        });
      } else {
        console.log('Supabase connection successful');
      }
      
      // Test auth status
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('Auth error:', authError);
      } else {
        console.log('Auth status:', authData.session ? 'Authenticated' : 'Not authenticated');
      }
      
      // Test table access
      const { data: tableData, error: tableError } = await supabase
        .from('podcasts')
        .select('id, title, created_at')
        .limit(1);
        
      if (tableError) {
        console.error('Table access error:', tableError);
        console.error('Table error details:', {
          message: tableError.message,
          code: tableError.code,
          details: tableError.details,
          hint: tableError.hint
        });
      } else {
        console.log('Table access successful. Sample data:', tableData);
      }
      
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Supabase Diagnostic</h2>
      <button 
        onClick={testConnection}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Test Supabase Connection
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Check the browser console for detailed results.
      </p>
    </div>
  );
}
