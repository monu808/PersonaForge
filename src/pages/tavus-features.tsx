import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  Users, 
  Bot, 
  Play, 
  Plus,
  ExternalLink,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PersonaCreateForm } from '@/components/persona/PersonaCreateForm';
import { ReplicaCreateForm } from '@/components/persona/ReplicaCreateForm';
import { ReplicaStatusChecker } from '@/components/persona/ReplicaStatusChecker';
import { TavusVideoGenerator } from '@/components/video/TavusVideoGenerator';
import { TavusConversationManager } from '@/components/video/TavusConversationManager';
import { TavusSyncComponent } from '@/components/persona/TavusSyncComponent';
import { TavusAutomationMonitor } from '@/components/automation/TavusAutomationMonitor';
import { getPersonas } from '@/lib/api/personas';
import { toast } from '@/components/ui/use-toast';

export function TavusFeatures() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const result = await getPersonas();
      if (result.error) {
        throw result.error;
      }
      setPersonas(result.data || []);
      if (result.data?.length && !selectedPersonaId) {
        setSelectedPersonaId(result.data[0].id);
      }
    } catch (error) {
      console.error('Error loading personas:', error);
      toast({
        title: "Error",
        description: "Failed to load personas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePersonaCreated = (_personaId: string) => {
    toast({
      title: "Persona Created",
      description: "Your new persona has been created successfully!",
    });
    loadPersonas(); // Refresh the list
  };

  const handleReplicaCreated = (_replicaData: any) => {
    toast({
      title: "Replica Creation Started",
      description: "Your replica is being processed. You'll be notified when it's ready.",
    });
    loadPersonas(); // Refresh the list to show updated personas
  };

  const handleVideoGenerated = (videoId: string) => {
    toast({
      title: "Video Generated",
      description: "Your video has been generated successfully!",
    });
    navigate(`/dashboard/videos?highlight=${videoId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tavus AI Features
            </h1>
            <p className="text-gray-600">
              Create personas, replicas, videos, and real-time conversations with advanced AI technology
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/videos')}
            >
              <Video className="h-4 w-4 mr-2" />
              View Videos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <Bot className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <CardTitle className="text-lg">Create Persona</CardTitle>
            <CardDescription>
              Design AI personalities with custom behaviors and responses
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <CardTitle className="text-lg">Create Replica</CardTitle>
            <CardDescription>
              Train digital replicas using video footage for realistic avatars
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Video className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <CardTitle className="text-lg">Generate Videos</CardTitle>
            <CardDescription>
              Create videos with your replicas using scripts or audio
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Play className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <CardTitle className="text-lg">Live Conversations</CardTitle>
            <CardDescription>
              Have real-time video conversations with your AI personas
            </CardDescription>
          </CardHeader>
        </Card>
      </div>      {/* Main Features Tabs */}
      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personas" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Personas
          </TabsTrigger>
          <TabsTrigger value="replicas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Replicas
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Conversations
          </TabsTrigger>
        </TabsList>

        {/* Create Persona Tab */}
        <TabsContent value="personas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PersonaCreateForm onSuccess={handlePersonaCreated} />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Persona Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Custom personality templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Configurable conversation layers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      <span>LLM, TTS, and STT settings</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Replica integration support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {personas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Personas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {personas.slice(0, 3).map((persona) => (
                        <div key={persona.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{persona.name}</span>
                          <span className="text-xs text-gray-500 capitalize">{persona.replica_type}</span>
                        </div>
                      ))}
                      {personas.length > 3 && (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/dashboard')}>
                          View All ({personas.length}) <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAVUS Sync for existing TAVUS personas (admin-only, now hidden) */}
              {/* <TavusSyncComponent 
                personas={personas} 
                onSyncComplete={loadPersonas}
              /> */}
            </div>
          </div>
        </TabsContent>

        {/* Create Replica Tab */}
        <TabsContent value="replicas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReplicaCreateForm onSuccess={handleReplicaCreated} />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Replica Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Realistic facial expressions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Natural voice synthesis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Personalized appearance</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Gesture and mannerism matching</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-2">
                    <div className="p-2 bg-blue-50 rounded">
                      <strong>Video Quality:</strong> HD (1080p) minimum
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <strong>Duration:</strong> 2-5 minutes of clear footage
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <strong>Content:</strong> Direct-to-camera speaking
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <strong>Processing:</strong> 15-30 minutes typical
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>        </TabsContent>        {/* Replica Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ReplicaStatusChecker />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Troubleshooting Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Common Issues:</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <div>
                            <strong>Replica in Error State:</strong> Create a new replica with a different training video
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-500">•</span>
                          <div>
                            <strong>Replica Training:</strong> Wait 15-30 minutes for processing to complete
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <div>
                            <strong>Video Generation Fails:</strong> Check replica status first using the "Scan All Personas" button
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2">Quick Fix for Error r8b3dd03978e:</h4>
                      <p className="text-orange-700 text-sm mb-3">
                        This replica is in an error state and cannot be used for video generation.
                      </p>
                      <ol className="text-orange-700 text-sm space-y-1 list-decimal list-inside">
                        <li>Go to the "Replicas" tab</li>
                        <li>Create a new replica for the affected persona</li>
                        <li>Use a high-quality training video (HD, 2-5 minutes, clear audio)</li>
                        <li>Wait for processing to complete</li>
                        <li>Try video generation again</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Generate Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {selectedPersonaId ? (
                <TavusVideoGenerator 
                  personaId={selectedPersonaId} 
                  onVideoGenerated={handleVideoGenerated}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Video className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-center mb-4">
                      Create a persona first to generate videos
                    </p>
                    <Button onClick={() => navigate('/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Persona
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="space-y-6">
              {personas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Select Persona</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {personas.map((persona) => {
                        const hasReplica = persona.attributes?.default_replica_id;
                        const isSelected = selectedPersonaId === persona.id;
                        return (
                          <div
                            key={persona.id}
                            onClick={() => hasReplica && setSelectedPersonaId(persona.id)}
                            className={`
                              p-4 border rounded-lg transition-all duration-200 
                              ${hasReplica ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'}
                              ${isSelected && hasReplica
                                ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                              }
                              ${!hasReplica ? 'bg-gray-50 border-gray-200' : ''}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">
                                    {persona.name}
                                  </h3>
                                  {!hasReplica && (
                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                      No Replica
                                    </span>
                                  )}
                                  {hasReplica && persona.attributes?.default_replica_id === 'r8b3dd03978e' && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                      Error State
                                    </span>
                                  )}
                                </div>
                                {persona.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {persona.description}
                                  </p>
                                )}
                                {!hasReplica && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Create a replica first in the Replicas tab
                                  </p>
                                )}
                                {hasReplica && persona.attributes?.default_replica_id === 'r8b3dd03978e' && (
                                  <p className="text-xs text-red-500 mt-1 font-medium">
                                    ⚠️ This replica is in error state - create a new one
                                  </p>
                                )}
                              </div>
                              {isSelected && hasReplica && (
                                <div className="ml-3 flex-shrink-0">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>Script-based generation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>Audio file upload</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>ElevenLabs integration</span>
                    </div>                    <div className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>HD video output</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Live Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <TavusConversationManager 
            personas={personas}
            onConversationCreated={(_data) => {
              toast({
                title: "Conversation Ready",
                description: "Your conversation is ready to join!",
              });
            }}
          />
        </TabsContent>
      </Tabs>
      
      {/* Automation Monitor - Bottom Right Corner */}
      <TavusAutomationMonitor />
    </div>
  );
}

export default TavusFeatures;
