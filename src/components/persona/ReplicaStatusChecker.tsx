import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, Clock, XCircle, Info, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { checkTavusReplicaStatus } from '@/lib/api/tavus';
import { getPersonas } from '@/lib/api/personas';

interface ReplicaStatusCheckerProps {
  initialReplicaId?: string;
}

export function ReplicaStatusChecker({ initialReplicaId = '' }: ReplicaStatusCheckerProps) {
  const [replicaId, setReplicaId] = useState(initialReplicaId);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPersonasStatus, setAllPersonasStatus] = useState<any[]>([]);
  const [isScanningAll, setIsScanningAll] = useState(false);

  const handleCheckStatus = async () => {
    if (!replicaId.trim()) {
      setError('Please enter a replica ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await checkTavusReplicaStatus(replicaId.trim());
      setStatus(result);
      
      if (result.error) {
        setError(result.error);
      } else {
        toast({
          title: "Status Check Complete",
          description: `Replica status: ${result.status}`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check replica status';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAllPersonas = async () => {
    setIsScanningAll(true);
    setAllPersonasStatus([]);
    setError(null);    try {
      const { data: personas, error: personasError } = await getPersonas();
      
      if (personasError || !personas) {
        throw new Error('Failed to fetch personas');
      }

      const results = [];
      
      for (const persona of personas) {
        const replicaId = persona.attributes?.default_replica_id;
        
        if (!replicaId) {
          results.push({
            personaName: persona.name,
            personaId: persona.id,
            replicaId: null,
            status: 'no_replica',
            error: 'No replica ID found'
          });
          continue;
        }

        // Add a small delay between requests to avoid rate limiting
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }

        try {
          const replicaStatus = await checkTavusReplicaStatus(replicaId);
          
          // Check for API errors and provide better feedback
          if (replicaStatus.status === 'error' && replicaStatus.error?.includes('HTTP error! status: 500')) {
            results.push({
              personaName: persona.name,
              personaId: persona.id,
              replicaId: replicaId,
              status: 'api_error',
              error: 'Tavus API temporarily unavailable (500 error)'
            });
          } else {
            results.push({
              personaName: persona.name,
              personaId: persona.id,
              replicaId: replicaId,
              status: replicaStatus.status,
              training_progress: replicaStatus.training_progress,
              error: replicaStatus.error
            });
          }
        } catch (err) {
          results.push({
            personaName: persona.name,
            personaId: persona.id,
            replicaId: replicaId,
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to check status'
          });
        }
      }
        setAllPersonasStatus(results);
      
      const errorCount = results.filter(r => r.status === 'error' || r.status === 'no_replica').length;
      const apiErrorCount = results.filter(r => r.status === 'api_error').length;
      const readyCount = results.filter(r => r.status === 'ready' || r.status === 'completed').length;
      const trainingCount = results.filter(r => r.status === 'training').length;
      
      let description = `Found ${results.length} personas: ${readyCount} ready, ${trainingCount} training`;
      if (errorCount > 0) description += `, ${errorCount} need attention`;
      if (apiErrorCount > 0) description += `, ${apiErrorCount} API errors`;
      
      toast({
        title: "Persona Scan Complete",
        description: description,
        variant: apiErrorCount > 0 ? "destructive" : "default"
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan personas';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsScanningAll(false);
    }
  };  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'training':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'error':
      case 'api_error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'no_replica':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'unknown':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'training':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error':
      case 'api_error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'no_replica':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'unknown':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };  const getStatusMessage = (status: string, trainingProgress?: number, error?: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return 'Replica is ready for video generation';
      case 'training':
        return `Training in progress${trainingProgress ? ` (${trainingProgress}% complete)` : ''}`;
      case 'error':
        return `Replica failed: ${error || 'Unknown error'}`;
      case 'api_error':
        return 'Tavus API temporarily unavailable - try again later';
      case 'no_replica':
        return 'No replica found - create one in the Replicas tab';
      case 'unknown':
        return 'Unable to determine replica status';
      default:
        return `Status: ${status}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Replica Status Checker
        </CardTitle>
        <p className="text-sm text-gray-600">
          Check the current status of your Tavus replica to see if it's ready for video generation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="replicaId">Replica ID</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="replicaId"
              value={replicaId}
              onChange={(e) => setReplicaId(e.target.value)}
              placeholder="Enter replica ID (e.g., r1477c4645e2)"
              className="flex-1"
            />            <Button 
              onClick={handleCheckStatus}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Check Status
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handleScanAllPersonas}
            disabled={isScanningAll}
            variant="secondary"
            className="w-full"
          >
            {isScanningAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Search className="h-4 w-4 mr-2" />
            Scan All Personas
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {status && (
          <div className={`p-4 border rounded-md ${getStatusColor(status.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(status.status)}
              <div className="flex-1">
                <div className="font-medium">
                  Replica ID: {status.replica_id}
                </div>
                <div className="text-sm mt-1">
                  {getStatusMessage(status.status, status.training_progress, status.error)}
                </div>
                {status.training_progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${status.training_progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Training Progress: {status.training_progress}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>        )}

        {allPersonasStatus.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">All Personas Status</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allPersonasStatus.map((persona, index) => (
                <div key={index} className={`p-3 border rounded-md text-sm ${getStatusColor(persona.status)}`}>
                  <div className="flex items-start gap-2">
                    {getStatusIcon(persona.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{persona.personaName}</div>
                      <div className="text-xs opacity-75 truncate">
                        {persona.replicaId ? `Replica: ${persona.replicaId}` : 'No replica found'}
                      </div>
                      <div className="text-xs mt-1">
                        {getStatusMessage(persona.status, persona.training_progress, persona.error)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <strong>Action Required:</strong> Personas with "error" or "no_replica" status need new replicas created in the Replicas tab.
              {allPersonasStatus.some(p => p.status === 'api_error') && (
                <div className="mt-2 text-amber-600">
                  <strong>API Issues:</strong> Some replicas show API errors due to temporary Tavus service issues. These typically resolve within a few minutes - try refreshing later.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Status Guide:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Ready:</strong> Replica can be used for video generation</li>
            <li><strong>Training:</strong> Replica is being processed (15-30 minutes)</li>
            <li><strong>Error:</strong> Replica failed and needs to be recreated</li>
            <li><strong>Unknown:</strong> Unable to check status</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
