import { useState, useEffect } from 'react';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wallet, User, Database, AlertTriangle, CheckCircle, RefreshCw, Search } from 'lucide-react';

interface UserWalletInfo {
  id: string;
  email: string;
  full_name: string;
  wallet_address?: string;
  created_at: string;
  source: string;
  persona_name?: string;
  persona_id?: string;
}

export default function WalletDiagnosticPage() {
  const [results, setResults] = useState<UserWalletInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchWallet, setSearchWallet] = useState('');
  const [fixingWallet, setFixingWallet] = useState<string | null>(null);

  const targetEmails = [
    'monu80850raj@gmail.com',
    'narendrasinghchouhan2022@vitbhopal.ac.in', 
    'rmonu3605@gmail.com'
  ];

  const checkWalletConnections = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Query users table with wallet addresses
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          wallet_address,
          created_at
        `)
        .not('wallet_address', 'is', null);

      if (usersError) throw usersError;

      // Also check personas table for creator wallet addresses
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select(`
          id,
          name,
          creator_wallet_address,
          user_id,
          users!inner(email, full_name)
        `)
        .not('creator_wallet_address', 'is', null);

      if (personasError) throw personasError;

      // Combine results
      const combinedResults = [
        ...(users || []).map(user => ({
          ...user,
          source: 'users_table',
          wallet_address: user.wallet_address
        })),
        ...(personas || []).map(persona => ({
          id: persona.user_id,
          email: persona.users?.email || '',
          full_name: persona.users?.full_name || '',
          wallet_address: persona.creator_wallet_address,
          source: 'personas_table',
          persona_name: persona.name,
          persona_id: persona.id,
          created_at: ''
        }))
      ];

      setResults(combinedResults);
    } catch (err) {
      console.error('Error checking wallet connections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const searchByEmail = async () => {
    if (!searchEmail.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Search in users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          wallet_address,
          created_at
        `)
        .ilike('email', `%${searchEmail}%`);

      if (usersError) throw usersError;

      // Search in personas table
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select(`
          id,
          name,
          creator_wallet_address,
          user_id,
          users!inner(email, full_name)
        `)
        .filter('users.email', 'ilike', `%${searchEmail}%`);

      if (personasError) throw personasError;

      // Combine results
      const combinedResults = [
        ...(users || []).map(user => ({
          ...user,
          source: 'users_table'
        })),
        ...(personas || []).map(persona => ({
          id: persona.user_id,
          email: persona.users?.email || '',
          full_name: persona.users?.full_name || '',
          wallet_address: persona.creator_wallet_address,
          source: 'personas_table',
          persona_name: persona.name,
          persona_id: persona.id,
          created_at: ''
        }))
      ];

      setResults(combinedResults);
    } catch (err) {
      console.error('Error searching by email:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const searchByWallet = async () => {
    if (!searchWallet.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Search in users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          wallet_address,
          created_at
        `)
        .ilike('wallet_address', `%${searchWallet}%`);

      if (usersError) throw usersError;

      // Search in personas table
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select(`
          id,
          name,
          creator_wallet_address,
          user_id,
          users!inner(email, full_name)
        `)
        .ilike('creator_wallet_address', `%${searchWallet}%`);

      if (personasError) throw personasError;

      // Combine results
      const combinedResults = [
        ...(users || []).map(user => ({
          ...user,
          source: 'users_table'
        })),
        ...(personas || []).map(persona => ({
          id: persona.user_id,
          email: persona.users?.email || '',
          full_name: persona.users?.full_name || '',
          wallet_address: persona.creator_wallet_address,
          source: 'personas_table',
          persona_name: persona.name,
          persona_id: persona.id,
          created_at: ''
        }))
      ];

      setResults(combinedResults);
    } catch (err) {
      console.error('Error searching by wallet:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateWalletAddress = async (userId: string, newWalletAddress: string, source: string) => {
    setFixingWallet(userId);
    try {
      if (source === 'users_table') {
        const { error } = await supabase
          .from('users')
          .update({ wallet_address: newWalletAddress })
          .eq('id', userId);
        
        if (error) throw error;
      }
      
      alert('Wallet address updated successfully!');
      // Refresh results
      if (searchEmail) await searchByEmail();
      else if (searchWallet) await searchByWallet();
      else await checkWalletConnections();
      
    } catch (err) {
      console.error('Error updating wallet:', err);
      alert('Failed to update wallet address: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setFixingWallet(null);
    }
  };

  const removeWalletConnection = async (userId: string, source: string) => {
    setFixingWallet(userId);
    try {
      if (source === 'users_table') {
        const { error } = await supabase
          .from('users')
          .update({ wallet_address: null })
          .eq('id', userId);

        if (error) throw error;
      }

      alert('Wallet connection removed successfully!');
      // Refresh results
      if (searchEmail) await searchByEmail();
      else if (searchWallet) await searchByWallet();
      else await checkWalletConnections();
      
    } catch (err) {
      console.error('Error removing wallet connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove wallet connection');
    } finally {
      setFixingWallet(null);
    }
  };

  useEffect(() => {
    checkWalletConnections();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet Connection Diagnostic</h1>
            <p className="text-gray-600 mt-2">
              Diagnose and fix wallet connection issues across user accounts
            </p>
          </div>
          <Button onClick={checkWalletConnections} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search by Email</label>
                <div className="flex space-x-2">
                  <Input
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter email address..."
                  />
                  <Button onClick={searchByEmail} disabled={loading}>
                    Search
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search by Wallet</label>
                <div className="flex space-x-2">
                  <Input
                    value={searchWallet}
                    onChange={(e) => setSearchWallet(e.target.value)}
                    placeholder="Enter wallet address..."
                  />
                  <Button onClick={searchByWallet} disabled={loading}>
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Wallet Connections ({results.length})
            </CardTitle>
            <CardDescription>
              All wallet connections found in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{result.email}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Name: {result.full_name || 'N/A'}</div>
                          <div>User ID: {result.id}</div>
                          <div>Wallet: {result.wallet_address}</div>
                          <div>Source: {result.source}</div>
                          {result.persona_name && (
                            <div>Persona: {result.persona_name}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={targetEmails.includes(result.email) ? "default" : "secondary"}
                          className={targetEmails.includes(result.email) ? "bg-blue-100 text-blue-800" : ""}
                        >
                          {targetEmails.includes(result.email) ? "Target Account" : "Other Account"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeWalletConnection(result.id, result.source)}
                          disabled={fixingWallet === result.id}
                        >
                          {fixingWallet === result.id ? "Removing..." : "Remove Wallet"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No wallet connections found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
