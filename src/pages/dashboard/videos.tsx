import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Plus, AlertCircle, Loader2, RefreshCw, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TavusVideoGenerator } from '@/components/video/TavusVideoGenerator';
import { TavusVideoPlayer } from '@/components/video/TavusVideoPlayer';
import FeatureGate from '@/components/subscription/feature-gate';
import { getPersonaVideos, syncTavusVideoToDatabase } from '@/lib/api/tavus';
import { getPersonas } from '@/lib/api/personas';
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

export default function VideosPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryVideoId, setRecoveryVideoId] = useState('');
  const [recoveryScript, setRecoveryScript] = useState('');  const [isRecovering, setIsRecovering] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [personaSwitchMessage, setPersonaSwitchMessage] = useState<string | null>(null);
  const [personas, setPersonas] = useState<any[]>([]); // Add personas state

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      loadVideos();
      // Set up auto-refresh for videos that might be processing
      setupAutoRefresh();
    } else {
      setLoading(false);
      clearAutoRefresh();
    }
    
    // Cleanup on unmount or persona change
    return () => {
      clearAutoRefresh();
    };
  }, [selectedPersona]);

  const setupAutoRefresh = () => {
    clearAutoRefresh();
      // Check if there are any videos that are still processing
    const hasProcessingVideos = videos.some(video => 
      video.metadata.status === 'generating' || 
      video.metadata.status === 'processing' || 
      video.metadata.status === 'pending' ||
      video.metadata.status === 'queued' ||
      video.metadata.status === 'in_progress'
    );
    
    if (hasProcessingVideos) {
      const interval = setInterval(() => {
        loadVideos();
        setLastRefresh(new Date());
      }, 15000); // Refresh every 15 seconds
      
      setRefreshInterval(interval);
    }
  };

  const clearAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  // Update auto-refresh when videos change
  useEffect(() => {
    setupAutoRefresh();
  }, [videos]);
  const loadPersonas = async () => {
    try {
      setLoadingPersonas(true);
      const { data: personas, error } = await getPersonas();
      
      if (error) throw error;
      
      console.log('DEBUG: Loaded personas:', personas?.map(p => ({ id: p.id, name: p.name })));
      
      if (personas && personas.length > 0) {
        const firstPersonaId = personas[0].id;
        console.log('DEBUG: Setting selectedPersona to:', firstPersonaId);
        setSelectedPersona(firstPersonaId);
      }
      setPersonas(personas || []); // Set personas state
    } catch (err) {
      console.error("Error loading personas:", err);
      setError("Failed to load personas. Please try again.");
    } finally {
      setLoadingPersonas(false);
    }
  };  const loadVideos = async () => {
    if (!selectedPersona) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('DEBUG: Loading videos for persona:', selectedPersona);
      
      const videos = await getPersonaVideos(selectedPersona);
      console.log('DEBUG: Loaded videos:', videos);
      
      // Filter out deleted videos
      const activeVideos = videos?.filter(video => 
        video.metadata.status !== 'deleted'
      ) || [];
      
      console.log('DEBUG: Active videos (excluding deleted):', activeVideos);
      setVideos(activeVideos);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error loading videos:", err);
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  };const forceRefresh = () => {
    console.log('DEBUG: Force refresh called for persona:', selectedPersona);
    if (selectedPersona) {
      loadVideos();
    } else {
      console.warn('DEBUG: Force refresh called but no selectedPersona');
    }
  };  const handleVideoGenerated = (forPersonaId: string) => {
    console.log('DEBUG: Video generated callback called');
    console.log('DEBUG: Video was generated for persona:', forPersonaId);
    console.log('DEBUG: Current selectedPersona state:', selectedPersona);
    
    setShowGenerator(false);
    
    // Check if the video was generated for the currently selected persona
    if (forPersonaId !== selectedPersona) {
      console.warn('DEBUG: Persona mismatch! Generated for:', forPersonaId, 'but showing:', selectedPersona);
      // Switch to the persona that the video was actually created for
      console.log('DEBUG: Switching to persona:', forPersonaId);
      setPersonaSwitchMessage(`Video created! Switching to the correct persona...`);
      setSelectedPersona(forPersonaId);
      
      // Clear the message after a delay
      setTimeout(() => {
        setPersonaSwitchMessage(null);
      }, 3000);
      
      return; // The useEffect will handle loading videos for the new persona
    }
    
    if (!selectedPersona) {
      console.error('DEBUG: No selectedPersona when video was generated!');
      return;
    }
    
    // Add delay to ensure both database transaction and auto-recovery complete
    setTimeout(() => {
      console.log('DEBUG: First refresh after generation for persona:', selectedPersona);
      if (selectedPersona) {
        loadVideos();
      }
    }, 1000);
    
    // Additional refresh after auto-recovery completes
    setTimeout(() => {
      console.log('DEBUG: Second refresh after auto-recovery for persona:', selectedPersona);
      if (selectedPersona) {
        loadVideos();
        setupAutoRefresh();
      }
    }, 3500);
  };

  const handleVideoRecovery = async () => {
    if (!selectedPersona || !recoveryVideoId.trim()) {
      setError('Please enter a valid Tavus video ID');
      return;
    }

    setIsRecovering(true);
    try {
      const result = await syncTavusVideoToDatabase(
        recoveryVideoId.trim(),
        selectedPersona,
        recoveryScript.trim()
      );

      if (result.success) {
        setRecoveryVideoId('');
        setRecoveryScript('');
        setShowRecovery(false);
        loadVideos(); // Refresh the videos list
        setError(null);
      } else {
        setError(result.error || 'Failed to recover video');
      }
    } catch (err) {
      console.error('Error recovering video:', err);
      setError('Failed to recover video. Please try again.');
    } finally {
      setIsRecovering(false);
    }  };

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
          </div>          <div className="mt-4 md:mt-0 flex gap-2">
            {/* Persona Selector for debugging */}
            {personas && personas.length > 1 && (
              <select 
                value={selectedPersona || ''} 
                onChange={(e) => {
                  console.log('DEBUG: Manually switching to persona:', e.target.value);
                  setSelectedPersona(e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {personas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name || `Persona ${persona.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            )}
            
            <FeatureGate 
              feature="video_generation"
            >
              <Button onClick={() => setShowGenerator(!showGenerator)}>
                {showGenerator ? "Cancel" : <>
                  <Plus className="mr-2 h-4 w-4" />
                  New Video
                </>}
              </Button>
            </FeatureGate>
            
            <Button 
              variant="outline" 
              onClick={loadVideos}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowRecovery(!showRecovery)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recover Video
            </Button>
          </div>
        </div>        {showGenerator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >            <FeatureGate feature="video_generation">
              <TavusVideoGenerator 
                personaId={selectedPersona} 
                onVideoGenerated={handleVideoGenerated}
                onForceRefresh={forceRefresh}
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
          </Card>        ) : (
          <>
            {/* Persona switch notification */}
            {personaSwitchMessage && (
              <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="flex items-center justify-center py-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span className="text-sm text-green-800 font-medium">
                      {personaSwitchMessage}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Status indicator for auto-refresh */}{videos.some(video => 
              video.metadata.status === 'generating' || 
              video.metadata.status === 'processing' || 
              video.metadata.status === 'pending' ||
              video.metadata.status === 'queued' ||
              video.metadata.status === 'in_progress'
            ) && (
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Videos are being generated
                      </p>
                      <p className="text-xs text-blue-700">
                        This page will refresh automatically every 15 seconds
                      </p>
                    </div>
                  </div>
                  {lastRefresh && (
                    <div className="text-right">
                      <p className="text-xs text-blue-600 font-medium">
                        Last updated
                      </p>
                      <p className="text-xs text-blue-500">
                        {lastRefresh.toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
              {videos.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="bg-gray-100 rounded-full p-6 mb-6">
                    <Film className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
                  <p className="text-center text-gray-500 mb-2">
                    Create your first personalized video with AI
                  </p>
                  <p className="text-center text-sm text-gray-400 mb-8">
                    Videos will appear here once generated
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90" 
                    onClick={() => setShowGenerator(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Video
                  </Button>
                </CardContent>
              </Card>) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                  >
                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">                          <CardTitle className="text-base leading-tight">
                            <div className="line-clamp-2 overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const,
                              textOverflow: 'ellipsis'
                            }}>
                              {video.metadata.script ? 
                                (video.metadata.script.length > 60 ? 
                                  `${video.metadata.script.substring(0, 60)}...` : 
                                  video.metadata.script) : 
                                'Personalized Video'}
                            </div>
                          </CardTitle>
                          {/* Status badge */}
                          {(video.metadata.status === 'generating' || 
                            video.metadata.status === 'processing' || 
                            video.metadata.status === 'pending' ||
                            video.metadata.status === 'queued' ||
                            video.metadata.status === 'in_progress') && (
                            <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Processing</span>
                            </div>
                          )}
                          {(video.metadata.status === 'completed' || video.metadata.status === 'ready') && (
                            <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span>Ready</span>
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {new Date(video.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </CardHeader>                      <CardContent className="pt-0">                        <TavusVideoPlayer 
                          videoId={video.metadata.tavus_video_id || video.content} 
                          autoRefresh={
                            video.metadata.status !== 'completed' && 
                            video.metadata.status !== 'ready' &&
                            video.metadata.status !== 'failed' &&
                            video.metadata.status !== 'error'
                          }
                          databaseId={video.id}
                          onVideoDeleted={loadVideos}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>        )}

        {showRecovery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Recover Video from Tavus</CardTitle>
                <CardDescription>
                  If a video was generated in Tavus but doesn't appear here, you can recover it by entering the video ID.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">                <div>
                  <label htmlFor="videoId" className="block text-sm font-medium text-gray-700 mb-1">
                    Tavus Video ID
                  </label>
                  <Input
                    id="videoId"
                    type="text"
                    value={recoveryVideoId}
                    onChange={(e) => setRecoveryVideoId(e.target.value)}
                    placeholder="Enter the Tavus video ID"
                  />
                </div>
                <div>
                  <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-1">
                    Script (optional)
                  </label>
                  <Textarea
                    id="script"
                    value={recoveryScript}
                    onChange={(e) => setRecoveryScript(e.target.value)}
                    placeholder="Enter the script used for this video (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleVideoRecovery}
                    disabled={isRecovering || !recoveryVideoId.trim()}
                  >
                    {isRecovering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recovering...
                      </>
                    ) : (
                      'Recover Video'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRecovery(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}