/**
 * Optional automation status monitor component
 * Shows TAVUS automation progress for debugging purposes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, EyeOff, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { tavusAutomation } from '@/lib/automation/tavus-automation';

interface AutomationStatus {
  personaId: string;
  status: 'pending' | 'replica_creating' | 'replica_training' | 'replica_ready' | 'tavus_persona_creating' | 'completed' | 'failed';
  replicaId?: string;
  tavusPersonaId?: string;
  error?: string;
  lastChecked: string;
  attempts: number;
}

interface TavusAutomationMonitorProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export function TavusAutomationMonitor({ 
  isVisible: externalVisible, 
  onVisibilityChange 
}: TavusAutomationMonitorProps = {}) {
  const [automations, setAutomations] = useState<AutomationStatus[]>([]);
  const [internalVisible, setInternalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use external visibility if provided, otherwise use internal state
  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;
  
  const setIsVisible = (visible: boolean) => {
    if (onVisibilityChange) {
      onVisibilityChange(visible);
    } else {
      setInternalVisible(visible);
    }
  };

  const refreshAutomations = () => {
    setIsRefreshing(true);
    const allAutomations = tavusAutomation.getAllAutomations();
    setAutomations(allAutomations);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    refreshAutomations();
    
    // Auto-refresh every 30 seconds when visible
    let interval: NodeJS.Timeout | null = null;
    if (isVisible) {
      interval = setInterval(refreshAutomations, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'replica_training':
      case 'replica_creating':
      case 'tavus_persona_creating':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'replica_creating':
        return 'Creating Replica';
      case 'replica_training':
        return 'Training Replica';
      case 'replica_ready':
        return 'Replica Ready';
      case 'tavus_persona_creating':
        return 'Creating TAVUS Persona';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const cancelAutomation = (personaId: string) => {
    tavusAutomation.cancelAutomation(personaId);
    refreshAutomations();
  };

  if (!isVisible) {
    return null; // Don't render anything when not visible
  }

  return (
    <div className="fixed top-28 right-4 z-50 w-80">
      <Card className="shadow-lg">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium">
              Automation
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                onClick={refreshAutomations}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          {automations.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">
              No automations
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {automations.map((automation) => (
                <div
                  key={automation.personaId}
                  className="border rounded p-2 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(automation.status)}
                      <span className="text-xs font-medium">
                        {getStatusText(automation.status)}
                      </span>
                    </div>
                    {automation.status !== 'completed' && automation.status !== 'failed' && (
                      <Button
                        onClick={() => cancelAutomation(automation.personaId)}
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>ID: {automation.personaId.slice(0, 8)}...</p>
                    {automation.replicaId && (
                      <p>Replica: {automation.replicaId.slice(0, 8)}...</p>
                    )}
                    {automation.tavusPersonaId && (
                      <p>TAVUS: {automation.tavusPersonaId.slice(0, 8)}...</p>
                    )}
                    <p>Attempts: {automation.attempts} | {new Date(automation.lastChecked).toLocaleTimeString()}</p>
                    {automation.error && (
                      <p className="text-red-600 text-xs break-words">Error: {automation.error.slice(0, 40)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
            <p>💡 Full logs in console</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
