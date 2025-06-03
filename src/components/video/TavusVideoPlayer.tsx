import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { checkTavusVideoStatus } from '@/lib/api/tavus';

interface TavusVideoPlayerProps {
  videoId: string;
  autoRefresh?: boolean;
}

export function TavusVideoPlayer({ videoId, autoRefresh = true }: TavusVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkVideoStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await checkTavusVideoStatus(videoId);
      
      if (error) throw error;
      
      setStatus(data.status);
      
      if (data.status === 'completed') {
        setVideoUrl(data.url);
        setThumbnailUrl(data.thumbnail_url);
      } else if (data.status === 'failed') {
        setError('Video generation failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to fetch video status. Please try again later.');
      console.error('Error checking video status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkVideoStatus();
    
    // Set up polling if autoRefresh is true and video is not ready
    let interval: number | null = null;
    
    if (autoRefresh && (status === 'pending' || status === 'processing')) {
      interval = setInterval(() => {
        checkVideoStatus();
      }, 10000); // Check every 10 seconds
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
          </div>
        ) : status === 'completed' && videoUrl ? (
          <div className="relative">
            <video 
              src={videoUrl} 
              poster={thumbnailUrl || undefined} 
              controls 
              className="w-full"
            />
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 h-64">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              {status === 'pending' ? 'Preparing to generate your video...' : 
               status === 'processing' ? 'Generating your personalized video...' : 
               'Getting video information...'}
            </p>
            {!loading && !autoRefresh && (
              <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}