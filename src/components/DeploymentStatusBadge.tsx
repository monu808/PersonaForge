import { useEffect, useState } from 'react';
// import { Badge } from './ui/badge';
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
      <div className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking deployment...</span>
      </div>
    );
  }

  switch (status) {
    case 'success':
      return (
        <div className="bg-green-100 text-green-800 border-green-200">
          Deployed Successfully
        </div>
      );
    case 'error':
      return (
        <div className="destructive">
          Deployment Failed
        </div>
      );
    case 'pending':
      return (
        <div className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Deployment in Progress
        </div>
      );
    default:
      return (
        <div 
          id="bolt-button"
          className="pointer-events-auto relative"
          style={{
            position: 'absolute',
            bottom: '2vw',
            right: '2vw',
            width: '8vw',
            height: '8vw',
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
        >
          <img 
            // Badge image removed
            alt="Built with Bolt.new" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div style="
                    width: 100%;
                    height: 100%;
                    background-color: #000;
                    border: 2px solid #333;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                  ">
                    BOLT
                  </div>
                `;
              }
            }}
          />
        </div>
      );
  }
}