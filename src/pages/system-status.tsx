import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/auth';
import { useAuth } from '@/lib/context/auth-context';

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  message: string;
  lastChecked: Date;
  endpoint?: string;
}

export default function SystemStatusDashboard() {
  const { user } = useAuth();
  const [systems, setSystems] = useState<SystemStatus[]>([
    { name: 'Supabase Database', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'Supabase Storage', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'Stripe API', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'ElevenLabs API', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'Tavus API', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'Google Gemini API', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'RevenueCat Service', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
    { name: 'Backend Server', status: 'unknown', message: 'Checking...', lastChecked: new Date() },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const updateSystemStatus = (index: number, updates: Partial<SystemStatus>) => {
    setSystems(prev => prev.map((system, i) => 
      i === index 
        ? { ...system, ...updates, lastChecked: new Date() }
        : system
    ));
  };

  const checkSystemStatuses = async () => {
    setIsChecking(true);

    // Check Supabase Database
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      updateSystemStatus(0, {
        status: error ? 'outage' : 'operational',
        message: error ? `Database error: ${error.message}` : 'Database accessible'
      });
    } catch (error) {
      updateSystemStatus(0, {
        status: 'outage',
        message: 'Database connection failed'
      });
    }

    // Check Supabase Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      updateSystemStatus(1, {
        status: error ? 'outage' : 'operational',
        message: error ? `Storage error: ${error.message}` : `${data?.length || 0} buckets accessible`
      });
    } catch (error) {
      updateSystemStatus(1, {
        status: 'outage',
        message: 'Storage connection failed'
      });
    }

    // Check Stripe API
    try {
      const response = await fetch('/api/stripe/health-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      updateSystemStatus(2, {
        status: response.ok ? 'operational' : 'degraded',
        message: response.ok ? 'Stripe API accessible' : 'Stripe API issues'
      });
    } catch (error) {
      updateSystemStatus(2, {
        status: 'outage',
        message: 'Stripe API unreachable'
      });
    }

    // Check ElevenLabs API
    try {
      if (!import.meta.env.VITE_ELEVENLABS_API_KEY) {
        updateSystemStatus(3, {
          status: 'outage',
          message: 'ElevenLabs API key not configured'
        });
      } else {
        const response = await supabase.functions.invoke('elevenlabs-voices');
        updateSystemStatus(3, {
          status: response.error ? 'degraded' : 'operational',
          message: response.error ? 'ElevenLabs API issues' : 'ElevenLabs API accessible'
        });
      }
    } catch (error) {
      updateSystemStatus(3, {
        status: 'outage',
        message: 'ElevenLabs API unreachable'
      });
    }

    // Check Tavus API
    try {
      const response = await supabase.functions.invoke('tavus-api', {
        body: { action: 'health-check' }
      });
      updateSystemStatus(4, {
        status: response.error ? 'degraded' : 'operational',
        message: response.error ? 'Tavus API issues' : 'Tavus API accessible'
      });
    } catch (error) {
      updateSystemStatus(4, {
        status: 'outage',
        message: 'Tavus API unreachable'
      });
    }

    // Check Google Gemini API
    try {
      if (!import.meta.env.VITE_GOOGLE_GEMINI_API_KEY) {
        updateSystemStatus(5, {
          status: 'outage',
          message: 'Google Gemini API key not configured'
        });
      } else {
        updateSystemStatus(5, {
          status: 'operational',
          message: 'Google Gemini API configured'
        });
      }
    } catch (error) {
      updateSystemStatus(5, {
        status: 'outage',
        message: 'Google Gemini API error'
      });
    }

    // Check RevenueCat Service
    try {
      if (!import.meta.env.VITE_REVENUECAT_API_KEY) {
        updateSystemStatus(6, {
          status: 'outage',
          message: 'RevenueCat API key not configured'
        });
      } else {
        updateSystemStatus(6, {
          status: 'operational',
          message: 'RevenueCat service configured'
        });
      }
    } catch (error) {
      updateSystemStatus(6, {
        status: 'outage',
        message: 'RevenueCat service error'
      });
    }

    // Check Backend Server
    try {
      const response = await fetch('/health');
      updateSystemStatus(7, {
        status: response.ok ? 'operational' : 'degraded',
        message: response.ok ? 'Backend server responsive' : 'Backend server issues'
      });
    } catch (error) {
      updateSystemStatus(7, {
        status: 'outage',
        message: 'Backend server unreachable'
      });
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkSystemStatuses();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(checkSystemStatuses, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'outage':
        return <Badge variant="destructive">Outage</Badge>;
      default:
        return <Badge variant="outline">Checking</Badge>;
    }
  };

  const getOverallStatus = () => {
    const statuses = systems.map(s => s.status);
    if (statuses.includes('outage')) return 'outage';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.every(s => s === 'operational')) return 'operational';
    return 'unknown';
  };

  const operationalCount = systems.filter(s => s.status === 'operational').length;
  const totalSystems = systems.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Status Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time status of all PersonaForge integrations and services
          </p>
        </div>
        <Button onClick={checkSystemStatuses} disabled={isChecking} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(getOverallStatus())}
                Overall System Status
              </CardTitle>
              <CardDescription>
                {operationalCount} of {totalSystems} services operational
              </CardDescription>
            </div>
            {getStatusBadge(getOverallStatus())}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systems.filter(s => s.status === 'operational').length}
              </div>
              <div className="text-sm text-muted-foreground">Operational</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {systems.filter(s => s.status === 'degraded').length}
              </div>
              <div className="text-sm text-muted-foreground">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {systems.filter(s => s.status === 'outage').length}
              </div>
              <div className="text-sm text-muted-foreground">Outages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {systems.filter(s => s.status === 'unknown').length}
              </div>
              <div className="text-sm text-muted-foreground">Unknown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.map((system, index) => (
          <Card key={system.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(system.status)}
                  {system.name}
                </CardTitle>
                {getStatusBadge(system.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {system.message}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Last checked: {system.lastChecked.toLocaleTimeString()}
                </span>
                {system.endpoint && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={system.endpoint} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current configuration and environment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Environment:</strong> {import.meta.env.MODE}
            </div>
            <div>
              <strong>Build Version:</strong> {import.meta.env.VITE_APP_VERSION || '1.0.0'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'Not authenticated'}
            </div>
            <div>
              <strong>Last Updated:</strong> {new Date().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access testing and monitoring tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild>
              <a href="/integration/test">
                Run Integration Tests
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/test">
                Admin Test Panel
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">
                User Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
