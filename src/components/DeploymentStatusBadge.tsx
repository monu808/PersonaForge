import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';

export function getDeploymentStatus() {
  return new Promise<{ id: string }>(async (resolve) => {
    try {
      const url = '/.netlify/functions/deployment-status';
      console.log('🔍 Fetching deployment status from:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📊 Response data:', data);
      resolve(data);
    } catch (error) {
      console.error('❌ Error fetching deployment status:', error);
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
        <div 
          id="bolt-button"
          className="pointer-events-auto"
          style={{
            position: 'absolute',
            bottom: '2vw',
            right: '2vw',
            width: '8vw',
            height: '8vw',
            backgroundImage: 'url(/badge/black_circle_360x360.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            cursor: 'pointer',
            transition: 'opacity 300ms',
            minWidth: '64px',
            minHeight: '64px',
            maxWidth: '120px',
            maxHeight: '120px'
          }}
          onClick={() => window.open('https://bolt.new/', '_blank', 'noopener,noreferrer')}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="Built with Bolt.new"
        />
      );
  }
}