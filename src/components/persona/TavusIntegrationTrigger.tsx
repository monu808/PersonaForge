import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { createTavusPersonaForExisting } from '@/lib/api/personas';
import { Loader2, Zap, AlertCircle, User } from 'lucide-react';

interface TavusIntegrationTriggerProps {
  personas: any[];
  onIntegrationComplete?: () => void;
}

export function TavusIntegrationTrigger({ personas, onIntegrationComplete }: TavusIntegrationTriggerProps) {
  const [processingPersona, setProcessingPersona] = useState<string | null>(null);

  // Filter personas that have replicas but no TAVUS persona integration
  const eligiblePersonas = personas.filter(persona => {
    const hasReplica = persona.attributes?.default_replica_id;
    const hasTavusPersona = persona.attributes?.tavus_persona_id;
    return hasReplica && !hasTavusPersona;
  });

  const handleCreateTavusPersona = async (personaId: string, personaName: string) => {
    try {
      setProcessingPersona(personaId);
      
      const result = await createTavusPersonaForExisting(personaId);
      
      if (result.success) {
        toast({
          title: "TAVUS Integration Complete!",
          description: `TAVUS persona created for "${personaName}" (ID: ${result.tavusPersonaId})`,
        });
        onIntegrationComplete?.();
      } else {
        throw new Error(result.error || 'Failed to create TAVUS persona');
      }
    } catch (error) {
      console.error('Error creating TAVUS persona:', error);
      toast({
        title: "Integration Failed",
        description: error instanceof Error ? error.message : "Failed to create TAVUS persona",
        variant: "destructive",
      });
    } finally {
      setProcessingPersona(null);
    }
  };

  if (eligiblePersonas.length === 0) {
    return null; // Don't show if no eligible personas
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Complete TAVUS Integration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These personas have replicas but are missing TAVUS persona integration. Click to complete the integration.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {eligiblePersonas.map((persona) => {
          const isProcessing = processingPersona === persona.id;
          
          return (
            <div key={persona.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <h4 className="font-medium">{persona.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Replica: {persona.attributes?.default_replica_id}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreateTavusPersona(persona.id, persona.name)}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Create TAVUS Persona
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const { createMinimalTavusPersona } = await import('@/lib/api/tavus');
                      const result = await createMinimalTavusPersona(`Test ${persona.name}`);
                      console.log('Minimal persona creation result:', result);
                      toast({
                        title: result.persona_id ? "Test Success!" : "Test Failed",
                        description: result.persona_id 
                          ? `Minimal persona created: ${result.persona_id}` 
                          : `Error: ${result.error}`,
                        variant: result.persona_id ? "default" : "destructive",
                      });
                    } catch (error) {
                      console.error('Test minimal persona error:', error);
                      toast({
                        title: "Test Failed",
                        description: error instanceof Error ? error.message : String(error),
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test Minimal
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="mt-4 text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">What this does:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1 text-blue-700">
                <li>Creates a TAVUS persona using your existing replica</li>
                <li>Configures personality layers from your local persona data</li>
                <li>Updates your local persona with the TAVUS persona ID</li>
                <li>Enables full video generation and conversation features</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
