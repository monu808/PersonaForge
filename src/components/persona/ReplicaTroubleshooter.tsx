import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Info,
  FileVideo,
  Clock
} from 'lucide-react';
import { getPersonas } from '@/lib/api/personas';
import { checkTavusReplicaStatus } from '@/lib/api/tavus';
import { 
  REPLICA_STATUS_GUIDE, 
  TAVUS_ERROR_SOLUTIONS, 
  TAVUS_VIDEO_REQUIREMENTS,
  TROUBLESHOOTING_CHECKLIST 
} from '@/lib/tavus-guide';
import { toast } from '@/components/ui/use-toast';

interface FailedReplica {
  personaName: string;
  personaId: string;
  replicaId: string;
  status: string;
  error?: string;
}

export function ReplicaTroubleshooter() {
  const [isScanning, setIsScanning] = useState(false);
  const [failedReplicas, setFailedReplicas] = useState<FailedReplica[]>([]);
  const [fixingReplicas, setFixingReplicas] = useState<Set<string>>(new Set());

  const scanForFailedReplicas = async () => {
    setIsScanning(true);
    setFailedReplicas([]);

    try {
      const { data: personas, error } = await getPersonas();
      
      if (error || !personas) {
        throw new Error('Failed to fetch personas');
      }

      const failed: FailedReplica[] = [];
      
      for (const persona of personas) {
        const replicaId = persona.attributes?.default_replica_id;
        
        if (!replicaId) {
          failed.push({
            personaName: persona.name,
            personaId: persona.id,
            replicaId: 'none',
            status: 'no_replica',
            error: 'No replica ID found for this persona'
          });
          continue;
        }

        try {
          const replicaStatus = await checkTavusReplicaStatus(replicaId);
          
          if (replicaStatus.status === 'error' || replicaStatus.status === 'unknown') {
            failed.push({
              personaName: persona.name,
              personaId: persona.id,
              replicaId: replicaId,
              status: replicaStatus.status,
              error: replicaStatus.error || 'Unknown error occurred'
            });
          }
        } catch (err) {
          failed.push({
            personaName: persona.name,
            personaId: persona.id,
            replicaId: replicaId,
            status: 'error',
            error: 'Failed to check replica status'
          });
        }
      }
      
      setFailedReplicas(failed);
      
      toast({
        title: "Scan Complete",
        description: `Found ${failed.length} personas that need attention`,
        variant: failed.length > 0 ? "destructive" : "default"
      });
      
    } catch (err) {
      toast({
        title: "Scan Failed",
        description: err instanceof Error ? err.message : 'Failed to scan replicas',
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'error':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Error</Badge>;
      case 'no_replica':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" />No Replica</Badge>;
      case 'unknown':
        return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" />Unknown</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSolutionSteps = (replica: FailedReplica) => {
    if (replica.status === 'no_replica') {
      return [
        "Go to the Replicas tab",
        "Click 'Create AI Replica'",
        "Upload a high-quality training video",
        "Follow the video requirements guide",
        "Wait for training to complete"
      ];
    }

    return [
      "Review the video requirements checklist",
      "Create a new training video that meets all criteria",
      "Go to the Replicas tab and create a new replica",
      "Use the improved training video",
      "Monitor the training progress"
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Replica Troubleshooter
          </CardTitle>
          <p className="text-sm text-gray-600">
            Identify and resolve issues with failed or missing replicas automatically.
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={scanForFailedReplicas}
            disabled={isScanning}
            className="w-full"
          >
            {isScanning && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {isScanning ? 'Scanning Replicas...' : 'Scan for Problems'}
          </Button>
        </CardContent>
      </Card>

      {/* Failed Replicas */}
      {failedReplicas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">
              Found {failedReplicas.length} Problem{failedReplicas.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {failedReplicas.map((replica, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{replica.personaName}</h4>
                    <p className="text-sm text-gray-600">
                      {replica.replicaId !== 'none' ? `Replica ID: ${replica.replicaId}` : 'No replica created'}
                    </p>
                  </div>
                  {getStatusBadge(replica.status)}
                </div>

                {replica.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {replica.error}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h5 className="text-sm font-medium mb-2">Solution Steps:</h5>
                  <ol className="text-sm text-gray-600 space-y-1">
                    {getSolutionSteps(replica).map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-2">
                        <span className="bg-blue-100 text-blue-700 text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">
                          {stepIndex + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.hash = '#replicas'}
                  className="w-full"
                >
                  <FileVideo className="h-4 w-4 mr-2" />
                  Go to Replicas Tab
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Video Requirements Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Training Video Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">✅ Required Elements</h4>
              <ul className="text-sm space-y-1">
                {TAVUS_VIDEO_REQUIREMENTS.REQUIRED_ELEMENTS.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-red-700 mb-2">❌ Avoid These</h4>
              <ul className="text-sm space-y-1">
                {TAVUS_VIDEO_REQUIREMENTS.AVOID.map((avoid, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {avoid}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Technical Specifications</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Duration:</span>
                <p>{TAVUS_VIDEO_REQUIREMENTS.MIN_DURATION_SECONDS}-{TAVUS_VIDEO_REQUIREMENTS.MAX_DURATION_SECONDS}s</p>
              </div>
              <div>
                <span className="font-medium">Resolution:</span>
                <p>{TAVUS_VIDEO_REQUIREMENTS.RECOMMENDED_RESOLUTION}</p>
              </div>
              <div>
                <span className="font-medium">Format:</span>
                <p>{TAVUS_VIDEO_REQUIREMENTS.SUPPORTED_FORMATS.join(', ').toUpperCase()}</p>
              </div>
              <div>
                <span className="font-medium">Size:</span>
                <p>Under {TAVUS_VIDEO_REQUIREMENTS.MAX_FILE_SIZE_MB}MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Common Solutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(TAVUS_ERROR_SOLUTIONS).map(([key, solution]) => (
              <div key={key} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">{solution.message}</h4>
                <p className="text-sm text-gray-600 mt-1">{solution.solution}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Replica Status Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(REPLICA_STATUS_GUIDE).map(([status, guide]) => (
              <div key={status} className="flex items-start gap-3 p-3 border rounded-lg">                <div className="mt-1">
                  {(status === 'ready' || status === 'completed') && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {status === 'training' && <Clock className="h-5 w-5 text-blue-500" />}
                  {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  {status === 'pending' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium capitalize">{status}</h4>
                  <p className="text-sm text-gray-600">{guide.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Time: {guide.timeEstimate}</span>
                    <span>Action: {guide.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
