import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Clock, 
  Calendar,
  Trash2, 
  Download,
  Loader2,
  RefreshCw,
  Headphones
} from 'lucide-react';
import { Podcast, getUserPodcasts, deletePodcast } from '@/lib/api/podcasts';
import { toast } from '@/components/ui/use-toast';

// Simple date formatting function
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const created = new Date(date);
  const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  return created.toLocaleDateString();
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface PodcastListProps {
  refreshTrigger?: number;
}

export function PodcastList({ refreshTrigger = 0 }: PodcastListProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadPodcasts = async () => {
    setIsLoading(true);
    try {
      console.log('Loading podcasts...');
      const { data, error } = await getUserPodcasts();
      
      if (error) {
        console.error('Error loading podcasts:', error);
        toast({
          title: "Error",
          description: "Failed to load podcasts: " + error,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        console.log('Loaded podcasts:', data.length);
        // Log audio URLs for debugging
        data.forEach(podcast => {
          if (podcast.audio_url && podcast.status === 'completed') {
            console.log(`Podcast ${podcast.id} (${podcast.title}): Audio URL exists`);
          } else {
            console.log(`Podcast ${podcast.id} (${podcast.title}): Status: ${podcast.status}, Has Audio: ${!!podcast.audio_url}`);
          }
        });
        setPodcasts(data);
      } else {
        setPodcasts([]);
      }
    } catch (error) {
      console.error('Error loading podcasts:', error);
      toast({
        title: "Error",
        description: "Failed to load podcasts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load podcasts on component mount and refresh trigger
  useEffect(() => {
    loadPodcasts();
  }, [refreshTrigger]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio.currentTime && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        console.log('Audio duration loaded:', audio.duration);
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      setPlayingId(null);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setPlayingId(null);
      setCurrentTime(0);
      setDuration(0);
      toast({
        title: "Audio Error",
        description: "There was an error playing the audio.",
        variant: "destructive",
      });
    };

    const handleLoadStart = () => {
      setCurrentTime(0);
      setDuration(0);
    };

    const handleCanPlay = () => {
      console.log('Audio can play, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [playingId]);

  const handlePlay = async (podcast: Podcast) => {
    if (!podcast.audio_url) {
      toast({
        title: "Audio Not Ready",
        description: "The podcast audio is still being generated.",
        variant: "destructive",
      });
      return;
    }

    console.log('Attempting to play podcast:', podcast.id, 'Audio URL:', podcast.audio_url);

    if (playingId === podcast.id) {
      // Pause current podcast
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Play new podcast
      if (audioRef.current) {
        try {
          // Reset audio element
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
          setDuration(0);
          
          // Test audio URL accessibility
          console.log('Testing audio URL validity...');
          try {
            const response = await fetch(podcast.audio_url, { method: 'HEAD' });
            console.log('Audio URL response:', response.status, response.statusText);
            if (!response.ok) {
              throw new Error(`Audio URL not accessible: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            console.log('Audio URL test failed, proceeding anyway:', fetchError);
            // Continue anyway, might be a CORS issue but audio could still work
          }
          
          // Set new source
          audioRef.current.src = podcast.audio_url;
          setPlayingId(podcast.id);
          
          // Create a promise to handle loading
          const loadAndPlay = new Promise<void>((resolve, reject) => {
            const audio = audioRef.current;
            if (!audio) {
              reject(new Error('Audio element not available'));
              return;
            }

            let loaded = false;

            const onCanPlay = () => {
              if (loaded) return;
              loaded = true;
              console.log('Audio can play, attempting to play...');
              cleanup();
              
              audio.play()
                .then(() => {
                  console.log('Audio playback started successfully');
                  resolve();
                })
                .catch((playError) => {
                  console.error('Play error:', playError);
                  reject(playError);
                });
            };

            const onError = (e: Event) => {
              console.error('Audio loading error:', e, audio.error);
              cleanup();
              reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`));
            };

            const cleanup = () => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
            };

            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('error', onError);

            // Start loading
            audio.load();
          });

          await loadAndPlay;
          
        } catch (error) {
          console.error('Error setting up audio playback:', error);
          setPlayingId(null);
          setCurrentTime(0);
          setDuration(0);
          
          toast({
            title: "Playback Error",
            description: `Failed to play the podcast audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
      const { error } = await deletePodcast(id);
      if (error) throw new Error(error);

      setPodcasts(prev => prev.filter(p => p.id !== id));
      
      // Stop playing if this podcast was playing
      if (playingId === id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }

      toast({
        title: "Podcast Deleted",
        description: "The podcast has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-xs">Ready</div>;
      case 'generating':
        return <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-xs">Generating</div>;
      case 'failed':
        return <div className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-xs">Failed</div>;
      default:
        return <div className="px-2 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full text-gray-300 text-xs">Unknown</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="ml-2 text-white">Loading podcasts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio Element */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Podcast Library</h2>
            <p className="text-purple-200/80">Listen to your AI-generated conversations</p>
          </div>
        </div>
        <Button
          onClick={loadPodcasts}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30 hover:border-purple-400"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Podcast List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {podcasts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Headphones className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/60 mb-2">No podcasts yet</h3>
            <p className="text-white/40">Create your first podcast in Coruscant to get started!</p>
          </div>
        ) : (
          podcasts.map((podcast) => (
            <div 
              key={podcast.id} 
              className="bg-black/40 rounded-xl p-4 border border-white/10 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 group min-h-[280px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-purple-300 transition-colors line-clamp-2">
                    {podcast.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-purple-400" />
                      <span>{podcast.duration_minutes}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-purple-400" />
                      <span className="text-xs">{formatTimeAgo(podcast.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {getStatusBadge(podcast.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(podcast.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Topic */}
              <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-200 text-xs text-center mb-3 truncate">
                {podcast.topic}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col justify-center">
                {/* Audio Player */}
                {podcast.status === 'completed' && podcast.audio_url && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlay(podcast)}
                        className="bg-purple-600/20 border-purple-500/50 text-purple-200 hover:bg-purple-600/30 hover:border-purple-400 h-8 w-8 p-0"
                      >
                        {playingId === podcast.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {podcast.audio_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-white/60 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/40 h-8 w-8 p-0"
                        >
                          <a href={podcast.audio_url} download={`${podcast.title}.mp3`}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    
                    {playingId === podcast.id && (
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="text-purple-300 text-xs">{formatTime(currentTime)}</span>
                        <div className="flex-1 bg-white/10 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-purple-300 text-xs">{formatTime(duration)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Messages */}
                {podcast.status === 'generating' && (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                    <p className="text-yellow-300 text-sm">Generating...</p>
                  </div>
                )}

                {podcast.status === 'failed' && (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <p className="text-red-300 text-sm">Failed</p>
                  </div>
                )}
              </div>

              {/* Hosts Info */}
              <div className="text-xs text-white/50 text-center mt-3 px-2 py-1 bg-white/5 rounded border border-white/10">
                <span className="text-purple-300">Hosts:</span> {podcast.host1_voice_name} & {podcast.host2_voice_name}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
