import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { syncTavusPersonasToLocal } from '@/lib/api/personas';
import { listTavusPersonas } from '@/lib/api/tavus';
import { Loader2, RefreshCw, Users, CheckCircle } from 'lucide-react';

interface TavusPersonaSyncProps {
  onSyncComplete?: () => void;
}

export function TavusPersonaSync({ onSyncComplete }: TavusPersonaSyncProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tavusPersonas, setTavusPersonas] = useState<any[]>([]);
  const [showPersonas, setShowPersonas] = useState(false);

  const handleListTavusPersonas = async () => {
    try {
      setIsLoading(true);
      const { personas, error } = await listTavusPersonas();
      
      if (error) {
        throw new Error(error);
      }

      setTavusPersonas(personas);
      setShowPersonas(true);
      
      toast({
        title: "TAVUS Personas Listed",
        description: `Found ${personas.length} personas in your TAVUS account.`,
      });
    } catch (error) {
      console.error('Error listing TAVUS personas:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to list TAVUS personas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncPersonas = async () => {
    try {
      setIsLoading(true);
      const { synced, error } = await syncTavusPersonasToLocal();
      
      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${synced} TAVUS personas to your local account.`,
      });

      onSyncComplete?.();
    } catch (error) {
      console.error('Error syncing TAVUS personas:', error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to sync TAVUS personas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          TAVUS Persona Sync
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sync your existing TAVUS personas to your local account, or view personas created through the API.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleListTavusPersonas}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            List TAVUS Personas
          </Button>
          
          <Button
            onClick={handleSyncPersonas}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Sync to Local
          </Button>
        </div>

        {showPersonas && (
          <div className="space-y-2">
            <h4 className="font-medium">TAVUS Personas ({tavusPersonas.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tavusPersonas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No TAVUS personas found. Create one first using the persona creation form.
                </p>
              ) : (
                tavusPersonas.map((persona) => (
                  <div key={persona.persona_id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{persona.persona_name || 'Unnamed Persona'}</h5>
                        <p className="text-xs text-muted-foreground">ID: {persona.persona_id}</p>
                        {persona.replica_id && (
                          <p className="text-xs text-muted-foreground">Replica: {persona.replica_id}</p>
                        )}
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        TAVUS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This will only sync personas that don't already exist locally.</p>
          <p>Existing personas with matching TAVUS IDs will be skipped.</p>
        </div>
      </CardContent>
    </Card>
  );
}
