import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TavusVideoGenerator } from '@/components/video/TavusVideoGenerator';
import { TavusVideoPlayer } from '@/components/video/TavusVideoPlayer';
import { getPersonaVideos } from '@/lib/api/tavus';
import { Film, Loader2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PersonaManagePage() {
  const { id: personaId } = useParams<{ id: string }>();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (personaId) {
      loadVideos();
    }
  }, [personaId]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPersonaVideos(personaId!);
      setVideos(data);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoGenerated = () => {
    loadVideos();
    setShowGenerator(false);
  };

  if (!personaId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-center mb-2">Invalid Persona ID</h2>
              <p className="text-center text-gray-600">
                Please select a valid persona to manage.
              </p>
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
            <h1 className="text-2xl font-bold text-gray-900">Manage Persona</h1>
            <p className="mt-1 text-sm text-gray-600">
              Generate and manage videos for your AI persona
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setShowGenerator(!showGenerator)}>
              {showGenerator ? (
                'Cancel'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  New Video
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {showGenerator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <T

avusVideoGenerator
                  personaId={personaId}
                  onVideoGenerated={handleVideoGenerated}
                />
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
                          {video.metadata.script
                            ? video.metadata.script.length > 30
                              ? `${video.metadata.script.substring(0, 30)}...`
                              : video.metadata.script
                            : 'Personalized Video'}
                        </CardTitle>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}