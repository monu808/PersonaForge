import { useState, useEffect } from 'react';
import { checkPodcastHealth, cleanupCorruptedPodcasts } from '../../lib/api/podcasts';

interface PodcastHealthData {
  total: number;
  healthy: number;
  recovered: number;
  corrupted: number;
  error: string | null;
}

export function PodcastHealthStatus() {
  const [healthData, setHealthData] = useState<PodcastHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      const data = await checkPodcastHealth();
      setHealthData(data);
    } catch (error) {
      console.error('Error loading podcast health:', error);
      setHealthData({
        total: 0,
        healthy: 0,
        recovered: 0,
        corrupted: 0,
        error: 'Failed to load health data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    setCleanupResult(null);
    
    try {
      const result = await cleanupCorruptedPodcasts();
      if (result.error) {
        setCleanupResult(`Cleanup failed: ${result.error}`);
      } else if (result.cleaned === 0) {
        setCleanupResult('No corrupted podcasts found to clean.');
      } else {
        setCleanupResult(`Successfully cleaned ${result.cleaned} podcasts!`);
        // Reload health data after cleanup
        setTimeout(loadHealthData, 1000);
      }
    } catch (error) {
      setCleanupResult(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Checking podcast health...</span>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Podcast Health Check Failed</h3>
        <p className="text-red-600">Unable to check podcast database health.</p>
      </div>
    );
  }

  const getHealthStatus = () => {
    if (healthData.error) return 'error';
    if (healthData.corrupted > 0) return 'warning';
    if (healthData.recovered > 0) return 'recovered';
    return 'healthy';
  };

  const status = getHealthStatus();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Podcast Database Health</h3>
        <button
          onClick={loadHealthData}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>

      {healthData.error ? (
        <div className="text-red-600 mb-4">
          <strong>Error:</strong> {healthData.error}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{healthData.total}</div>
            <div className="text-sm text-gray-600">Total Podcasts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthData.healthy}</div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{healthData.recovered}</div>
            <div className="text-sm text-gray-600">Recovered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{healthData.corrupted}</div>
            <div className="text-sm text-gray-600">Corrupted</div>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-lg mb-4 ${
        status === 'healthy' ? 'bg-green-50 text-green-800' :
        status === 'recovered' ? 'bg-yellow-50 text-yellow-800' :
        status === 'warning' ? 'bg-orange-50 text-orange-800' :
        'bg-red-50 text-red-800'
      }`}>
        {status === 'healthy' && (
          <p><strong>✅ All Good!</strong> Your podcasts are loading properly.</p>
        )}
        {status === 'recovered' && (
          <p><strong>⚠️ Some Recovery Needed:</strong> Some podcasts were recovered from corrupted data. They may have limited information but are accessible.</p>
        )}
        {status === 'warning' && (
          <p><strong>🔧 Issues Detected:</strong> Some podcasts have corrupted data that may prevent loading. Consider running cleanup.</p>
        )}
        {status === 'error' && (
          <p><strong>❌ Database Issues:</strong> There are problems accessing your podcast data.</p>
        )}
      </div>

      {(healthData.corrupted > 0 || healthData.recovered > 0) && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Run cleanup to fix corrupted podcasts and improve loading reliability.
              </p>
              {cleanupResult && (
                <p className={`text-sm mb-2 ${
                  cleanupResult.includes('Successfully') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {cleanupResult}
                </p>
              )}
            </div>
            <button
              onClick={handleCleanup}
              disabled={isCleaning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCleaning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{isCleaning ? 'Cleaning...' : 'Run Cleanup'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Healthy:</strong> Podcasts with complete, valid data</p>
        <p><strong>Recovered:</strong> Podcasts that were fixed from corrupted data</p>
        <p><strong>Corrupted:</strong> Podcasts with data issues that need cleanup</p>
      </div>
    </div>
  );
}
