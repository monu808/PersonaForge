import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Bot, Volume2, AudioLines, ExternalLink, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ElevenLabsAudioGenerator } from '@/components/audio/ElevenLabsAudioGenerator';
import { VoiceCloneCreator } from '@/components/audio/VoiceCloneCreator';
import { ConversationalAI } from '@/components/audio/ConversationalAI';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getPersonas } from '@/lib/api/personas';

interface Persona {
  id: string;
  name: string;
  description?: string;
}

export function ElevenLabsFeatures() {
  const navigate = useNavigate();
  const [generatedAudioCount, setGeneratedAudioCount] = useState(0);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [loadingPersonas, setLoadingPersonas] = useState(true);

  // Load personas on component mount
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        setLoadingPersonas(true);
        const response = await getPersonas();
        
        if (response.data && response.data.length > 0) {
          setPersonas(response.data);
          setSelectedPersona(response.data[0].id);
        }
      } catch (err) {
        console.error("Error loading personas:", err);
        toast({
          title: 'Error Loading Personas',
          description: 'Failed to load personas. Some features may not work correctly.',
          variant: 'destructive'
        });
      } finally {
        setLoadingPersonas(false);
      }
    };

    loadPersonas();
  }, []);
  const handleAudioGenerated = (_audioUrl: string) => {
    setGeneratedAudioCount(prev => prev + 1);
    toast({
      title: 'Audio Generated Successfully!',
      description: 'Your audio has been saved and is now available in the Audio Dashboard.',
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard/audio')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View in Dashboard
        </Button>
      ),
    });
  };

  const handleVoiceCreated = (_voiceId: string, voiceName: string) => {
    toast({
      title: 'Voice Clone Created!',
      description: `Voice "${voiceName}" has been created successfully and is now available for use.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ElevenLabs AI Voice Features
              </h1>
              <p className="text-gray-600">
                Advanced voice generation, cloning, and conversational AI capabilities powered by ElevenLabs
              </p>
            </div>
            <div className="flex gap-3">
              {generatedAudioCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-green-700">
                    {generatedAudioCount} audio file{generatedAudioCount > 1 ? 's' : ''} generated
                  </p>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/audio')}
              >
                <AudioLines className="h-4 w-4 mr-2" />
                View Audio Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Volume2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <CardTitle className="text-lg">Text-to-Speech</CardTitle>
              <CardDescription>
                Generate natural-sounding speech from text using premium AI voices
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Mic className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <CardTitle className="text-lg">Voice Cloning</CardTitle>
              <CardDescription>
                Create custom voice clones from audio samples for personalized content
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Bot className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <CardTitle className="text-lg">Conversational AI</CardTitle>
              <CardDescription>
                Build AI agents that can have natural voice conversations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Features Tabs */}
        <Tabs defaultValue="tts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tts" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Text-to-Speech
            </TabsTrigger>
            <TabsTrigger value="clone" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Cloning
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Conversational AI
            </TabsTrigger>
          </TabsList>

          {/* Text-to-Speech Tab */}
          <TabsContent value="tts" className="space-y-6">
            {/* Persona Selector */}
            {!loadingPersonas && personas.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Select Persona for Audio Generation
                  </CardTitle>
                  <CardDescription>
                    Choose which persona to associate with the generated audio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a persona...">
                        {selectedPersona && personas.find(p => p.id === selectedPersona)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {loadingPersonas ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading personas...</span>
                </CardContent>
              </Card>
            ) : personas.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Personas Found</h3>
                  <p className="text-center text-muted-foreground mb-6">
                    You need to create a persona before you can generate audio.
                  </p>
                  <Button onClick={() => navigate('/create')}>
                    Create Your First Persona
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ElevenLabsAudioGenerator 
                  personaId={selectedPersona}
                  onAudioGenerated={handleAudioGenerated}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AudioLines className="h-5 w-5" />
                      Features & Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Premium Voice Quality</h4>
                          <p className="text-sm text-gray-600">
                            Industry-leading AI voices with natural intonation and emotion
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Multiple Languages</h4>
                          <p className="text-sm text-gray-600">
                            Support for 29+ languages with native pronunciation
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Voice Control</h4>
                          <p className="text-sm text-gray-600">
                            Adjust stability, clarity, and style for perfect results
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Instant Generation</h4>
                          <p className="text-sm text-gray-600">
                            Generate high-quality audio in seconds, not hours
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Voice Cloning Tab */}          <TabsContent value="clone" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VoiceCloneCreator 
                onVoiceCreated={handleVoiceCreated}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Voice Cloning Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Requirements for Best Results:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          3-5 audio samples, each 1+ minutes long
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          Clear, high-quality recordings (minimal background noise)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          Natural speaking pace and consistent tone
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          Variety in content (different sentences/topics)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Supported Formats:</h4>
                      <div className="flex flex-wrap gap-2">
                        {['MP3', 'WAV', 'M4A', 'FLAC', 'OGG'].map((format) => (
                          <span key={format} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Tip:</strong> Record yourself reading different types of content 
                        (news articles, stories, conversations) for the most versatile voice clone.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Conversational AI Tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ConversationalAI personaId="default-persona" />
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Agent Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        <span>Natural voice conversations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        <span>Custom personality & knowledge</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        <span>Text and voice input/output</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        <span>Real-time speech processing</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        <span>Context-aware responses</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Use Cases</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs space-y-2">
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Customer Support:</strong> 24/7 voice assistance
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Education:</strong> Interactive tutoring and Q&A
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Entertainment:</strong> Character roleplay and storytelling
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Training:</strong> Simulation and practice scenarios
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>        </Tabs>
      </div>
    </div>
  );
}

export default ElevenLabsFeatures;
