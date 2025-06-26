import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { getTavusPersonas } from '@/lib/api/tavus';
import { syncTavusPersonaToLocal } from '@/lib/api/personas';
import { Loader2, Link2, RefreshCw, CheckCircle, AlertCircle, User, Bot } from 'lucide-react';

interface TavusSyncComponentProps {
  personas: any[];
  onSyncComplete?: () => void;
}

export function TavusSyncComponent({ personas, onSyncComplete }: TavusSyncComponentProps) {
  const [tavusPersonas, setTavusPersonas] = useState<any[]>([]);
  const [loadingTavusPersonas, setLoadingTavusPersonas] = useState(false);
  const [selectedLocalPersona, setSelectedLocalPersona] = useState<string>('');
  const [selectedTavusPersona, setSelectedTavusPersona] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  // Filter local personas that don't have TAVUS integration
  const eligibleLocalPersonas = personas.filter(persona => 
    !persona.attributes?.tavus_persona_id
  );

  const loadTavusPersonas = async () => {
    try {
      setLoadingTavusPersonas(true);
      const result = await getTavusPersonas();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTavusPersonas(result.personas || []);
      
      // Also try to fetch the specific persona ID the user mentioned
      console.log('Attempting to fetch specific persona: p5cb2b4babaa');
      try {
        const { getTavusPersonaById } = await import('@/lib/api/tavus');
        const specificPersonaResult = await getTavusPersonaById('p5cb2b4babaa');
        
        if (specificPersonaResult.persona) {
          console.log('Successfully fetched specific persona p5cb2b4babaa:', specificPersonaResult.persona);
          // Add it to the list if it's not already there
          const existingPersona = result.personas.find(p => p.persona_id === 'p5cb2b4babaa');
          if (!existingPersona) {
            console.log('Adding specific persona to the list');
            setTavusPersonas(prev => [...prev, specificPersonaResult.persona]);
          }
        } else {
          console.log('Specific persona p5cb2b4babaa fetch result:', specificPersonaResult);
        }
      } catch (specificError) {
        console.log('Error fetching specific persona:', specificError);
      }
      
      if (result.personas.length === 0) {
        toast({
          title: "No TAVUS Personas Found",
          description: "No existing TAVUS personas found in your account.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error loading TAVUS personas:', error);
      toast({
        title: "Error Loading TAVUS Personas",
        description: error instanceof Error ? error.message : "Failed to load TAVUS personas",
        variant: "destructive",
      });
    } finally {
      setLoadingTavusPersonas(false);
    }
  };

  const handleSync = async () => {
    if (!selectedLocalPersona || !selectedTavusPersona) {
      toast({
        title: "Selection Required",
        description: "Please select both a local persona and a TAVUS persona to sync.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncing(true);
      
      const result = await syncTavusPersonaToLocal(selectedLocalPersona, selectedTavusPersona);
      
      if (result.success) {
        toast({
          title: "Sync Complete!",
          description: "Successfully linked TAVUS persona to your local persona.",
        });
        
        // Reset selections
        setSelectedLocalPersona('');
        setSelectedTavusPersona('');
        
        onSyncComplete?.();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing personas:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync personas",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (eligibleLocalPersonas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Personas Synced</h3>
            <p className="text-sm text-gray-600">
              All your local personas already have TAVUS integration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Sync Existing TAVUS Personas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect your existing TAVUS personas to local personas for full integration.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Load TAVUS Personas Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Step 1: Load TAVUS Personas</p>
          <div className="flex gap-2">
            <Button
              onClick={loadTavusPersonas}
              disabled={loadingTavusPersonas}
              variant="outline"
              size="sm"
            >
              {loadingTavusPersonas ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load TAVUS Personas
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Debug Information */}
        {tavusPersonas.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Debug Info: Found {tavusPersonas.length} TAVUS Personas
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Persona IDs:</p>
              <div className="font-mono bg-white border rounded p-2 max-h-32 overflow-y-auto">
                {tavusPersonas.map((persona, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{persona.persona_id}</span>
                    <span className="text-gray-500">{persona.persona_name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2">
                Looking for: <span className="font-mono bg-yellow-100 px-1 rounded">p5cb2b4babaa</span>
                {tavusPersonas.find(p => p.persona_id === 'p5cb2b4babaa') ? (
                  <span className="text-green-600 ml-2">✓ Found</span>
                ) : (
                  <span className="text-red-600 ml-2">✗ Not found</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Selection Section */}
        {tavusPersonas.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Persona Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Local Persona
                </label>
                <Select value={selectedLocalPersona} onValueChange={setSelectedLocalPersona}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select local persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleLocalPersonas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        <div className="flex items-center gap-2">
                          <span>{persona.name}</span>
                          <span className="text-xs text-gray-500">({persona.replica_type})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TAVUS Persona Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  TAVUS Persona
                </label>
                <Select value={selectedTavusPersona} onValueChange={setSelectedTavusPersona}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select TAVUS persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tavusPersonas.map((tavusPersona) => (
                      <SelectItem key={tavusPersona.persona_id} value={tavusPersona.persona_id}>
                        <div className="flex items-center gap-2">
                          <span>{tavusPersona.persona_name || `Persona ${tavusPersona.persona_id.slice(-8)}`}</span>
                          <span className="text-xs text-blue-600">ID: {tavusPersona.persona_id.slice(-8)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sync Button */}
            <Button
              onClick={handleSync}
              disabled={syncing || !selectedLocalPersona || !selectedTavusPersona}
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Sync Personas
                </>
              )}
            </Button>

            {/* Preview */}
            {selectedLocalPersona && selectedTavusPersona && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Sync Preview</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>
                    <strong>Local:</strong> {eligibleLocalPersonas.find(p => p.id === selectedLocalPersona)?.name}
                  </p>
                  <p>
                    <strong>TAVUS:</strong> {tavusPersonas.find(p => p.persona_id === selectedTavusPersona)?.persona_name || 'Unnamed Persona'}
                  </p>
                  <p className="mt-2 font-medium">This will enable full TAVUS integration for the selected local persona.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* No TAVUS Personas Message */}
        {tavusPersonas.length === 0 && !loadingTavusPersonas && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Click "Load TAVUS Personas" to see your existing TAVUS personas.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">How this works:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Load your existing TAVUS personas from your account</li>
                <li>Select a local persona that needs TAVUS integration</li>
                <li>Choose the TAVUS persona to link it with</li>
                <li>Sync to enable full video generation and conversation features</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
