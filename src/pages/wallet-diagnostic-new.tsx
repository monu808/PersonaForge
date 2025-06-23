import { useState } from 'react';
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
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet Connection Diagnostic</h1>
          <p className="text-gray-600">
            Diagnose and manage wallet connections across user accounts
          </p>
        </div>

        {/* Search Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search by Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button onClick={searchByEmail} disabled={loading}>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Search by Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter wallet address"
                  value={searchWallet}
                  onChange={(e) => setSearchWallet(e.target.value)}
                />
                <Button onClick={searchByWallet} disabled={loading}>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                View All Wallets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={checkWalletConnections} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show All Wallet Connections'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Check for Target Emails */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Quick Check: Target Emails
            </CardTitle>
            <CardDescription>
              Check wallet connections for your specific email addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {targetEmails.map((email) => (
                <Button
                  key={email}
                  variant="outline"
                  onClick={() => {
                    setSearchEmail(email);
                    setTimeout(() => searchByEmail(), 100);
                  }}
                  className="text-left justify-start"
                >
                  {email}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Wallet Connection Results ({results.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={`${result.id}-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={result.source === 'users_table' ? 'default' : 'secondary'}>
                            {result.source === 'users_table' ? 'User Profile' : 'Persona'}
                          </Badge>
                          <span className="font-medium">{result.email}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Full Name:</strong> {result.full_name || 'Not set'}</p>
                          <p><strong>User ID:</strong> {result.id}</p>
                          <p><strong>Wallet Address:</strong> {result.wallet_address || 'Not connected'}</p>
                          {result.persona_name && (
                            <p><strong>Persona:</strong> {result.persona_name} (ID: {result.persona_id})</p>
                          )}
                          {result.created_at && (
                            <p><strong>Created:</strong> {new Date(result.created_at).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {result.source === 'users_table' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newWallet = prompt('Enter new wallet address:', result.wallet_address || '');
                              if (newWallet) {
                                updateWalletAddress(result.id, newWallet, result.source);
                              }
                            }}
                          >
                            Update Wallet
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && !error && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No wallet connections found.</p>
              <p className="text-sm">Use the search tools above to find users and their wallet connections.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
