import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';
export async function getDeploymentStatus() {
  return new Promise<{ id: string }>(async (resolve) => {
    try {
      const url = '/.netlify/functions/deployment-status';
      console.log('🔍 Fetching deployment status from:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📊 Response data:', data);
      return resolve(data);
    } catch (error) {
      console.error('❌ Error fetching deployment status:', error);
      return resolve({ id: 'unknown' });
    }
  });
}

export function DeploymentStatusBadge() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeploymentStatus() {
      console.log('🔄 Fetching deployment status...');
      try {
        const result = await getDeploymentStatus();
        console.log('✅ Got deployment status:', result);
        setStatus(result.id || 'unknown');
      } catch (error) {
        console.error('Error fetching deployment status:', error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    }

    fetchDeploymentStatus();
  }, []);

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking deployment...</span>
      </Badge>
    );
  }

  switch (status) {
    case 'success':
      console.log('🟢 Showing success badge');
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Deployed Successfully
        </Badge>
      );
    case 'error':
      console.log('🔴 Showing error badge');
      return (
        <Badge variant="destructive">
          Deployment Failed
        </Badge>
      );
    case 'pending':
      console.log('🟠 Showing pending badge');
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Deployment in Progress
        </Badge>
      );
    default:
      console.log('⚪ Showing unknown badge');
      return (
        <Badge variant="outline">
          Status Unknown
        </Badge>
      );
  }
}