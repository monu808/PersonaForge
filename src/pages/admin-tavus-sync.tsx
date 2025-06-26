import { useEffect, useState } from 'react';
import { TavusSyncComponent } from '@/components/persona/TavusSyncComponent';
import { getPersonas } from '@/lib/api/personas';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/auth';

// Simple admin check - for now, allow all authenticated users
// You can modify this to check specific user emails or roles from your database
function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // For now, allow all authenticated users to access admin features
        // You can replace this with your specific admin logic:
        // - Check user email against admin list
        // - Check user role from database
        // - Check user metadata
        setIsAdmin(!!user);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);
  
  return { isAdmin, loading };
}

export default function AdminTavusSyncPage() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin || adminLoading) return;
    loadPersonas();
  }, [isAdmin, adminLoading]);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const result = await getPersonas();
      if (result.error) throw new Error(String(result.error));
      setPersonas(result.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load personas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Sync Existing TAVUS Personas</h1>
      {loading ? (
        <div>Loading personas...</div>
      ) : (
        <TavusSyncComponent personas={personas} onSyncComplete={loadPersonas} />
      )}
    </div>
  );
}
