import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/auth';

/**
 * Temporary Admin Component to Grant Enterprise Access
 * Add this to a route like /admin-grant-access (remove after use)
 */
export default function GrantEnterpriseAccess() {
  const [email, setEmail] = useState('Monu80850raj@gmail.com');
  const [userId, setUserId] = useState('adb771b6-b568-4b4c-a03f-8236b8950933'); // Pre-fill with the ID from screenshot
  const [isLoading, setIsLoading] = useState(false);
  const findUser = async () => {
    try {
      setIsLoading(true);
      
      // Since profiles table doesn't exist, we'll need to handle this differently
      // For now, let's provide instructions to get the user ID manually
      toast({
        title: 'Manual User ID Required',
        description: 'Please get the user ID from Supabase dashboard (auth.users table) and enter it below',
        variant: 'default',
      });
        // You can also try this approach if you have admin privileges:
      // const { data, error } = await supabase.auth.admin.listUsers();
      // But this requires service role key, not anon key
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  const grantAccess = async () => {
    if (!userId.trim()) {
      toast({
        title: 'Error',
        description: 'User ID is required',
        variant: 'destructive',
      });
      return;
    }

    // Basic UUID validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId.trim())) {
      toast({
        title: 'Error',
        description: 'Please enter a valid UUID format for User ID',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const now = new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);      // Create enterprise subscription - try upsert first, then manual update if conflict
      let { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId.trim(),
          status: 'active',
          plan_id: 'enterprise',
          current_period_start: now.toISOString(),
          current_period_end: oneYearLater.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id'
        });

      // If upsert fails due to conflict, try manual update
      if (subError && subError.code === '23505') {
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            plan_id: 'enterprise',
            current_period_start: now.toISOString(),
            current_period_end: oneYearLater.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId.trim());
        
        subError = updateError;
      }

      if (subError) throw subError;

      // Initialize usage
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);      // Initialize usage - try upsert first, then manual update if needed
      let { error: usageError } = await supabase
        .from('user_usage')
        .upsert({
          user_id: userId.trim(),
          personas_created: 0,
          text_to_speech_used: 0,
          voice_clones_created: 0,
          live_conversation_minutes_used: 0,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id'
        });

      // If upsert fails, try manual update
      if (usageError && usageError.code === '23505') {
        const { error: updateError } = await supabase
          .from('user_usage')
          .update({
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId.trim());
        
        usageError = updateError;
      }

      if (usageError) {
        console.warn('Usage tracking error:', usageError);
      }      toast({
        title: 'Success!',
        description: `Enterprise access granted to ${email} until ${oneYearLater.toDateString()}`,
      });
        } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for permission errors
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = 'Permission denied. RLS policies prevent this operation. Please use the SQL script method instead - check scripts/direct-enterprise-grant.sql';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant Enterprise Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
            <Button 
            onClick={findUser} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Finding...' : 'Find User (Manual Process)'}
          </Button>

          <div>
            <label className="block text-sm font-medium mb-2">User ID</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Paste User ID from Supabase dashboard"
            />
          </div>

          <Button 
            onClick={grantAccess} 
            disabled={isLoading}
            className="w-full"
            variant="destructive"
          >
            {isLoading ? 'Granting...' : 'Grant Enterprise Access (1 Year)'}
          </Button><div className="text-sm text-gray-600 space-y-2">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Go to your Supabase Dashboard → Authentication → Users</li>
              <li>Find the user with email: <code className="bg-gray-100 px-1 rounded">Monu80850raj@gmail.com</code></li>
              <li>Copy their User ID (UUID format like: abcd1234-ef56-...)</li>
              <li>Paste the User ID in the field above</li>
              <li>Click "Grant Enterprise Access" to give them 1 year of enterprise access</li>
              <li>User will need to refresh their browser to see changes</li>
            </ol>            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p><strong>Note:</strong> The "Find User" button doesn't work because there's no profiles table. Please get the User ID manually from Supabase dashboard.</p>
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p><strong>Alternative - SQL Method:</strong></p>
              <p className="text-sm mt-1">If you get permission errors, run this SQL in Supabase Dashboard → SQL Editor:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
{`INSERT INTO user_subscriptions (user_id, status, plan_id, current_period_start, current_period_end, created_at, updated_at) 
VALUES ('adb771b6-b568-4b4c-a03f-8236b8950933', 'active', 'enterprise', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()) 
ON CONFLICT (user_id) DO UPDATE SET status = 'active', plan_id = 'enterprise', current_period_end = NOW() + INTERVAL '1 year';`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
