import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';

export function getDeploymentStatus() {
  return new Promise<{ id: string }>(async (resolve) => {
    try {
      const response = await fetch('/api/deployment-status');
      const data = await response.json();
      resolve(data);
    } catch (error) {
      console.error('Error fetching deployment status:', error);
      resolve({ id: 'unknown' });
    }
  });
}

export function DeploymentStatusBadge() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeploymentStatus() {
      try {
        const result = await getDeploymentStatus();
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
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking deployment...</span>
      </Badge>
    );
  }

  switch (status) {
    case 'success':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Deployed Successfully
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive">
          Deployment Failed
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Deployment in Progress
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Status Unknown
        </Badge>
      );
  }
}