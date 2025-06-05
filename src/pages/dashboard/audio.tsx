import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Plus, AlertCircle, Loader2, RefreshCw, UserCircle, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ElevenLabsAudioGenerator } from '@/components/audio/ElevenLabsAudioGenerator';
import { useNavigate } from 'react-router-dom';
import { getPersonas } from '@/lib/api/personas';
import { getPersonaAudios, getAllUserAudios } from '@/lib/api/elevenlabs';

interface Audio {
  id: string;
  persona_id: string;
  content: string;
  content_type: string;
  metadata: {
    status: string;
    audio_url?: string;
    text?: string;
    error?: string;
    created_at: string;
  };
  created_at: string;
}

interface Persona {
  id: string;
  name: string;
  description?: string;
}

interface AudioCardProps {
  audio: Audio;
  onUseWithVideo: (audioId: string) => void;
}

function AudioCard({ audio, onUseWithVideo }: AudioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {audio.metadata.text ? 
              (audio.metadata.text.length > 30 ? 
                `${audio.metadata.text.substring(0, 30)}...` : 
                audio.metadata.text) : 
              'Generated Audio'}
          </CardTitle>
          <CardDescription>
            Created {new Date(audio.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            {audio.metadata.audio_url ? (
              <audio controls className="w-full">
                <source src={audio.metadata.audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="flex items-center justify-center p-4 bg-gray-100 rounded">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                <span className="text-sm text-gray-600">Audio not available</span>
              </div>
            )}
            <div className="text-sm text-gray-600 line-clamp-2">
              {audio.metadata.text || 'No transcript available'}
            </div>
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onUseWithVideo(audio.id)}
              >
                Use with Video
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AudioPage() {
  const navigate = useNavigate();
  const [audios, setAudios] = useState<Audio[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'persona'
  useEffect(() => {
    loadPersonas();
    loadAllAudios(); // Load all audios initially
  }, []);

  useEffect(() => {
    if (activeTab === 'persona' && selectedPersona) {
      loadAudios();
    } else if (activeTab === 'all') {
      loadAllAudios();
    } else {
      setLoading(false);
    }
  }, [selectedPersona, activeTab]);
  const loadPersonas = async () => {
    try {
      setLoadingPersonas(true);
      const { data: personasData, error } = await getPersonas();
      
      if (error) throw error;
      
      if (personasData && personasData.length > 0) {
        setPersonas(personasData);
        setSelectedPersona(personasData[0].id);
      }
    } catch (err) {
      console.error("Error loading personas:", err);
      setError("Failed to load personas. Please try again.");
    } finally {
      setLoadingPersonas(false);
    }
  };const loadAudios = async () => {
    if (!selectedPersona) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch audio content for the selected persona
      const audiosData = await getPersonaAudios(selectedPersona);
      setAudios(audiosData);
    } catch (err) {
      console.error("Error loading audios:", err);
      setError("Failed to load audio files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllAudios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all audio content for the user (including demo audio)
      const audiosData = await getAllUserAudios();
      setAudios(audiosData);
    } catch (err) {
      console.error("Error loading all audios:", err);
      setError("Failed to load audio files. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleAudioGenerated = (_audioUrl: string) => {
    // Reload the audio list when a new audio is generated
    if (activeTab === 'all') {
      loadAllAudios();
    } else {
      loadAudios();
    }
    setShowGenerator(false);
  };

  if (loadingPersonas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!selectedPersona && personas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-center mb-2">No Personas Found</h2>
              <p className="text-center text-muted-foreground mb-6">
                You need to create a persona before you can generate audio.
              </p>
              <Button onClick={() => navigate('/create')}>
                Create Your First Persona
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI-Generated Audio</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage AI-generated audio for your personas
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setShowGenerator(!showGenerator)}>
              {showGenerator ? "Cancel" : <>
                <Plus className="mr-2 h-4 w-4" />
                New Audio
              </>}
            </Button>
          </div>
        </div>        {showGenerator && selectedPersona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <ElevenLabsAudioGenerator 
              personaId={selectedPersona} 
              onAudioGenerated={handleAudioGenerated}
            />
          </motion.div>
        )}        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Audio
            </TabsTrigger>
            <TabsTrigger value="persona" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              By Persona
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                  <p className="text-center text-destructive">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={loadAllAudios}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : audios.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Music className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">No audio files found.</p>
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    Create your first audio by clicking the "New Audio" button above.
                  </p>
                  <Button className="mt-6" onClick={() => setShowGenerator(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Audio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {audios.map((audio) => (
                  <AudioCard key={audio.id} audio={audio} onUseWithVideo={(audioId) => navigate(`/dashboard/videos?useAudio=${audioId}`)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="persona" className="space-y-6">
            {personas.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {personas.map((persona) => (
                  <Button
                    key={persona.id}
                    variant={selectedPersona === persona.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPersona(persona.id)}
                  >
                    {persona.name}
                  </Button>
                ))}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                  <p className="text-center text-destructive">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={loadAudios}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : audios.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Music className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    {selectedPersona ? "No audio found for this persona." : "Select a persona to view audio files."}
                  </p>
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    Create your first audio by clicking the "New Audio" button above.
                  </p>
                  <Button className="mt-6" onClick={() => setShowGenerator(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Audio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {audios.map((audio) => (
                  <AudioCard key={audio.id} audio={audio} onUseWithVideo={(audioId) => navigate(`/dashboard/videos?useAudio=${audioId}`)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
