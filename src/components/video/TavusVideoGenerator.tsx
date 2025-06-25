import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, FileAudio, FileText, AlertCircle, Music } from 'lucide-react';
import { createPersonaVideo, syncTavusVideoToDatabase, debugListAllVideos } from '@/lib/api/tavus';
import { supabase } from '@/lib/auth';
import { useLocation } from 'react-router-dom';

interface TavusVideoGeneratorProps {
  personaId: string;
  onVideoGenerated: (forPersonaId: string) => void; // Updated to clarify it passes persona ID
  onForceRefresh?: () => void; // Optional callback to force refresh
}

export function TavusVideoGenerator({ personaId, onVideoGenerated, onForceRefresh }: TavusVideoGeneratorProps) {
  const location = useLocation();
  const [script, setScript] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<'script' | 'audio' | 'elevenlabs'>('script');
  const [loadingAudio, setLoadingAudio] = useState<boolean>(false);
  // Check if there's an audio ID in the URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const audioId = params.get('useAudio');
    
    if (audioId) {
      setLoadingAudio(true);
      setGenerationType('elevenlabs');
      
      // Fetch the actual audio data from Supabase
      const fetchAudioData = async () => {
        try {
          const { data, error } = await supabase
            .from('persona_content')
            .select('*')
            .eq('id', audioId)
            .eq('content_type', 'audio')
            .single();
          
          if (error) throw error;
          
          if (data) {
            setAudioUrl(data.metadata?.audio_url || data.content);
            if (data.metadata?.text) {
              setScript(data.metadata.text);
            }
          }
        } catch (error) {
          console.error('Error fetching audio data:', error);
          setError('Failed to load audio file');
        } finally {
          setLoadingAudio(false);
        }
      };
      
      fetchAudioData();
    }
  }, [location.search, personaId]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    console.log('DEBUG: Starting video generation for persona:', personaId);
    console.log('DEBUG: Current persona from props:', personaId);
    
    try {
      const request: {
        personaId: string;
        script?: string;
        audioFile?: File;
        audioUrl?: string;
      } = {
        personaId: personaId // Explicitly use the personaId from props
      };
      
      // Set the right source for the video based on generation type
      if (generationType === 'script') {
        request.script = script;
      } else if (generationType === 'audio' && audioFile) {
        request.audioFile = audioFile;
      } else if (generationType === 'elevenlabs' && audioUrl) {
        request.audioUrl = audioUrl;
      }
        const { data, error } = await createPersonaVideo(request);
      
      if (error) throw error;      if (data?.id) {
        // Video was successfully created and stored in database
        console.log('Video successfully created:', data);
        console.log('DEBUG: Video created for persona ID:', personaId);
        
        // Call the callback immediately to trigger UI updates
        console.log('DEBUG: Calling onVideoGenerated with persona ID:', personaId);
        onVideoGenerated(personaId);
        
        // Automatically perform recovery operation in background to ensure video appears
        if (data.tavus_video_id) {
          console.log('DEBUG: Performing automatic video recovery for Tavus ID:', data.tavus_video_id);
          console.log('DEBUG: Recovery will use persona ID:', personaId);
          
          // Perform recovery in background
          setTimeout(async () => {
            try {
              const recoveryResult = await syncTavusVideoToDatabase(
                data.tavus_video_id,
                personaId, // Use the explicit personaId from props
                request.script || 'Generated video'
              );
              
              if (recoveryResult.success) {
                console.log('DEBUG: Auto-recovery successful for persona:', personaId);
                // Debug: List all videos to see what's in the database
                setTimeout(() => {
                  debugListAllVideos();
                }, 1000);
                
                // Force refresh to show the recovered video
                if (onForceRefresh) {
                  setTimeout(() => {
                    console.log('DEBUG: Calling force refresh after recovery');
                    onForceRefresh();
                  }, 500);
                }
              } else {
                console.warn('DEBUG: Auto-recovery failed:', recoveryResult.error);
                // If recovery failed, try again with a different approach
                if (recoveryResult.error?.includes('already exists')) {
                  console.log('DEBUG: Video already exists, calling force refresh anyway');
                  if (onForceRefresh) {
                    setTimeout(() => {
                      onForceRefresh();
                    }, 500);
                  }
                }
              }
            } catch (error) {
              console.warn('DEBUG: Auto-recovery error:', error);
            }
          }, 2000); // Wait 2 seconds for initial database transaction to settle
        }
      } else {
        throw new Error('No video ID returned from API');
      }} catch (err) {
      console.error('Error generating video:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video';
      
      // Check if it's a database error (video created but not stored)
      if (errorMessage.includes('Failed to save video to database')) {
        setError(`${errorMessage}\n\nThe video was created in Tavus but couldn't be saved to your account. You can recover it using the "Recover Video" button with the Tavus video ID from the error above.`);
      }
      // Check if it's a replica error and provide helpful guidance
      else if (errorMessage.includes('error state') || errorMessage.includes('not ready')) {
        setError(`${errorMessage}\n\nTo fix this:\n1. Go to the Replicas tab\n2. Create a new replica for this persona\n3. Wait for it to complete training\n4. Try generating the video again`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Video</CardTitle>
        <CardDescription>
          Create a video with your persona using either a script or audio file
        </CardDescription>
      </CardHeader>
      <CardContent>
        {personaId ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                type="button"
                variant={generationType === 'script' ? 'default' : 'outline'}
                onClick={() => setGenerationType('script')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Use Script
              </Button>
              <Button
                type="button"
                variant={generationType === 'audio' ? 'default' : 'outline'}
                onClick={() => setGenerationType('audio')}
              >
                <FileAudio className="mr-2 h-4 w-4" />
                Upload Audio
              </Button>
              {audioUrl && (
                <Button
                  type="button"
                  variant={generationType === 'elevenlabs' ? 'default' : 'outline'}
                  onClick={() => setGenerationType('elevenlabs')}
                >
                  <Music className="mr-2 h-4 w-4" />
                  Use ElevenLabs Audio
                </Button>
              )}
            </div>
            
            {generationType === 'script' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Script</label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Enter the script for your video..."
                  className="h-32"
                  required={generationType === 'script'}
                />
              </div>
            ) : generationType === 'audio' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Audio File</label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  required={generationType === 'audio'}
                />
                {audioFile && (
                  <div className="text-sm text-gray-500 mt-2">
                    Selected file: {audioFile.name}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">ElevenLabs Generated Audio</label>
                {loadingAudio ? (
                  <div className="flex items-center p-4 bg-gray-100 rounded">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Loading audio...</span>
                  </div>
                ) : audioUrl ? (
                  <div className="space-y-3">
                    <audio controls className="w-full">
                      <source src={audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    {script && (
                      <div className="bg-gray-100 p-2 rounded text-sm">
                        <strong>Text:</strong> {script}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-3 rounded border border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-500 inline mr-2" />
                    No audio file loaded. Go to the Audio page to create one.
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-center text-destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={
                isGenerating || 
                (generationType === 'script' && !script.trim()) || 
                (generationType === 'audio' && !audioFile) ||
                (generationType === 'elevenlabs' && !audioUrl)
              }
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Video'
              )}
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <AlertCircle className="mr-2 h-4 w-4" />
            Please select a persona first
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TavusVideoGenerator;