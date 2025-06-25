import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Loader2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { checkTavusVideoStatus, updateVideoStatus, deletePersonaVideo } from '@/lib/api/tavus';

interface TavusVideoPlayerProps {
  videoId: string;
  autoRefresh?: boolean;
  databaseId?: string;
  onVideoDeleted?: () => void;
}

export function TavusVideoPlayer({ videoId, autoRefresh = true, databaseId, onVideoDeleted }: TavusVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);const checkVideoStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('DEBUG: Checking status for video ID:', videoId);
      
      const response = await checkTavusVideoStatus(videoId);
      
      console.log('DEBUG: Tavus API response:', response);
      
      if (!response) {
        throw new Error('No response received from Tavus API');
      }
      
      if (response.error) {
        console.error('DEBUG: Tavus API error:', response.error);
        throw new Error(response.error);
      }
      
      const previousStatus = status;
      console.log('DEBUG: Status change:', { previous: previousStatus, new: response.status });
      setStatus(response.status);
      
      // Handle 'ready' status as completed (Tavus uses 'ready' instead of 'completed')
      if (response.status === 'completed' || response.status === 'ready') {
        console.log('DEBUG: Video is ready, setting URLs:', {
          video_url: response.url,
          thumbnail_url: response.thumbnail_url
        });
        
        setVideoUrl(response.url || null);
        setThumbnailUrl(response.thumbnail_url || null);
        
        // Update database with completed status
        if (previousStatus !== 'completed' && previousStatus !== 'ready') {
          await updateVideoStatus(videoId, {
            status: 'completed',
            video_url: response.url,
            thumbnail_url: response.thumbnail_url
          });
        }      } else if (response.status === 'failed' || response.status === 'error') {
        console.error('DEBUG: Video generation failed:', response.status);
        setError('Video generation failed. Please try again.');
        
        // Update database with failed status
        if (previousStatus !== 'failed' && previousStatus !== 'error') {
          await updateVideoStatus(videoId, {
            status: 'failed',
            error: 'Video generation failed'
          });
        }
      } else if (response.status === 'deleted') {
        console.log('DEBUG: Video is deleted');
        setError('This video has been deleted.');
        
        // Update database with deleted status
        if (previousStatus !== 'deleted') {
          await updateVideoStatus(videoId, {
            status: 'deleted',
            error: 'Video deleted'
          });
        }
      }
    } catch (err) {
      console.error('DEBUG: Error checking video status:', err);
      setError('Failed to fetch video status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };  useEffect(() => {
    checkVideoStatus();
    
    // Set up polling if autoRefresh is true and video is not ready
    let interval: NodeJS.Timeout | null = null;
    
    const processingStatuses = ['pending', 'processing', 'generating', 'queued', 'in_progress'];
    
    if (autoRefresh && processingStatuses.includes(status)) {
      console.log('DEBUG: Setting up polling for status:', status);
      interval = setInterval(() => {
        checkVideoStatus();
      }, 10000); // Check every 10 seconds
    } else {
      console.log('DEBUG: Not setting up polling. Status:', status, 'AutoRefresh:', autoRefresh);
    }
    
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [videoId, status, autoRefresh]);

  const handleRefresh = () => {
    checkVideoStatus();
  };

  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `tavus-video-${videoId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShare = () => {
    if (navigator.share && videoUrl) {
      navigator.share({
        title: 'My Personalized Video',
        text: 'Check out this personalized video I created!',
        url: videoUrl
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(videoUrl || '')
        .then(() => alert('Video URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  const handleDelete = async () => {
    if (!databaseId) {
      setError('Cannot delete video: no database ID provided');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('DEBUG: Deleting video:', { databaseId, videoId });
      
      const result = await deletePersonaVideo(databaseId, videoId);
      
      if (result.success) {
        console.log('DEBUG: Video deleted successfully');
        if (onVideoDeleted) {
          onVideoDeleted();
        }
      } else {
        setError(`Failed to delete video: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 h-64">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-center text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>        ) : (status === 'completed' || status === 'ready') && videoUrl ? (
          <div className="relative group">
            <video 
              src={videoUrl} 
              poster={thumbnailUrl || undefined} 
              controls 
              className="w-full aspect-video object-contain bg-black rounded-lg"
              preload="metadata"
              style={{
                objectFit: 'contain'
              }}
              onLoadedMetadata={() => setLoading(false)}
              onError={() => setError('Failed to load video')}
            />
            {/* Action buttons positioned outside video area to avoid interfering with controls */}
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-black/80 text-white hover:bg-black/90 backdrop-blur-sm shadow-lg" 
                onClick={handleDownload}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-black/80 text-white hover:bg-black/90 backdrop-blur-sm shadow-lg" 
                onClick={handleShare}
              >
                <Share2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="bg-red-600 text-white hover:bg-red-700 backdrop-blur-sm shadow-lg" 
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>) : (
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 h-64 rounded-lg">
            <div className="bg-white rounded-full p-4 mb-4 shadow-lg">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-center text-gray-700 font-medium mb-2">
              {status === 'pending' ? 'Preparing to generate your video...' : 
               status === 'processing' ? 'Generating your personalized video...' : 
               status === 'generating' ? 'Creating your video with AI...' :
               status === 'queued' ? 'Your video is queued for processing...' :
               status === 'in_progress' ? 'Video generation in progress...' :
               `Video status: ${status}. Checking for updates...`}
            </p>
            <p className="text-center text-xs text-gray-500 mb-4">
              This may take several minutes depending on video length
            </p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            {!loading && !autoRefresh && (
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            )}          </div>
        )}
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Video</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this video? This action cannot be undone and will remove the video from both your account and Tavus.
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}