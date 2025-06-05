import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, FileAudio, FileText, AlertCircle, Music } from 'lucide-react';
import { createPersonaVideo } from '@/lib/api/tavus';
import { supabase } from '@/lib/auth';
import { useLocation } from 'react-router-dom';

interface TavusVideoGeneratorProps {
  personaId: string;
  onVideoGenerated: (videoId: string) => void;
}

export function TavusVideoGenerator({ personaId, onVideoGenerated }: TavusVideoGeneratorProps) {
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
    
    try {
      const request: {
        personaId: string;
        script?: string;
        audioFile?: File;
        audioUrl?: string;
      } = {
        personaId
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
      
      if (error) throw error;
      
      if (data?.id) {
        onVideoGenerated(data.id);
      } else {
        throw new Error('No video ID returned from API');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate video');
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