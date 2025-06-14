import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Plus, AlertCircle, Loader2, RefreshCw, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TavusVideoGenerator } from '@/components/video/TavusVideoGenerator';
import { TavusVideoPlayer } from '@/components/video/TavusVideoPlayer';
import FeatureGate from '@/components/subscription/feature-gate';
import { getPersonaVideos } from '@/lib/api/tavus';
import { getPersonas } from '@/lib/api/personas';
import { useAuth } from '@/lib/context/auth-context';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  persona_id: string;
  content: string;
  content_type: string;
  metadata: {
    status: string;
    tavus_video_id?: string;
    video_url?: string;
    thumbnail_url?: string;
    script?: string;
    error?: string;
  };
  created_at: string;
}

interface TavusVideoGeneratorProps {
  personaId: string;
  onVideoGenerated?: (videoId: string) => void;
}

export default function VideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPersonas, setLoadingPersonas] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      loadVideos();
    } else {
      setLoading(false);
    }
  }, [selectedPersona]);

  const loadPersonas = async () => {
    try {
      setLoadingPersonas(true);
      const { data: personas, error } = await getPersonas();
      
      if (error) throw error;
      
      if (personas && personas.length > 0) {
        setSelectedPersona(personas[0].id);
      }
    } catch (err) {
      console.error("Error loading personas:", err);
      setError("Failed to load personas. Please try again.");
    } finally {
      setLoadingPersonas(false);
    }
  };

  const loadVideos = async () => {
    if (!selectedPersona) return;
    
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getPersonaVideos(selectedPersona);
      
      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error("Error loading videos:", err);
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoGenerated = (videoId: string) => {
    loadVideos();
    setShowGenerator(false);
  };

  if (loadingPersonas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedPersona) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-center mb-2">No Personas Found</h2>
              <p className="text-center text-muted-foreground mb-6">
                You need to create a persona before you can generate videos.
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
            <h1 className="text-2xl font-bold text-gray-900">Personalized Videos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage personalized videos for your personas
            </p>
          </div>          <div className="mt-4 md:mt-0">
            <FeatureGate 
              feature="video_generation"
              fallback={
                <Button disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  New Video (Premium)
                </Button>
              }
            >
              <Button onClick={() => setShowGenerator(!showGenerator)}>
                {showGenerator ? "Cancel" : <>
                  <Plus className="mr-2 h-4 w-4" />
                  New Video
                </>}
              </Button>
            </FeatureGate>
          </div>
        </div>        {showGenerator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <FeatureGate feature="video_generation">
              <TavusVideoGenerator 
                personaId={selectedPersona} 
                onVideoGenerated={handleVideoGenerated}
              />
            </FeatureGate>
          </motion.div>
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
              <Button variant="outline" className="mt-4" onClick={loadVideos}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Film className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">No videos found for this persona.</p>
              <p className="text-center text-sm text-muted-foreground mt-1">
                Create your first video by clicking the "New Video" button above.
              </p>
              <Button className="mt-6" onClick={() => setShowGenerator(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {video.metadata.script ? 
                        (video.metadata.script.length > 30 ? 
                          `${video.metadata.script.substring(0, 30)}...` : 
                          video.metadata.script) : 
                        'Personalized Video'}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(video.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TavusVideoPlayer 
                      videoId={video.metadata.tavus_video_id || video.content} 
                      autoRefresh={video.metadata.status !== 'completed'}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}