import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, VolumeX, Volume2, AlertCircle } from 'lucide-react';
import { VoiceSelector } from './VoiceSelector';
import { createPersonaAudio } from '@/lib/api/elevenlabs';
import { syncService } from '@/lib/api/sync-service';
import SubscriptionService from '@/lib/subscription/service';
import { useEffect } from 'react';

interface ElevenLabsAudioGeneratorProps {
  personaId: string;
  onAudioGenerated?: (audioUrl: string) => void;
}

export function ElevenLabsAudioGenerator({ personaId, onAudioGenerated }: ElevenLabsAudioGeneratorProps) {
  // State for form
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
    // Handle audio playback
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      
      setAudioElement(audio);
      
      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [audioUrl]);
  
  const playAudio = () => {
    if (audioElement && !isPlaying) {
      audioElement.play();
    } else if (audioElement && isPlaying) {
      audioElement.pause();
    }
  };
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text to generate speech');
      return;
    }

    // Check if user can perform TTS action
    try {
      const permission = await SubscriptionService.canPerformAction('textToSpeech');
      if (!permission.allowed) {
        setError(permission.reason || 'You have reached your text-to-speech limit');
        return;
      }
    } catch (error) {
      setError('Error checking permissions');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      const { data, error } = await createPersonaAudio({
        personaId,
        text,
        voiceId: selectedVoice,
      });
      
      if (error) throw error;
        if (data?.metadata?.audio_url) {
        setAudioUrl(data.metadata.audio_url);
        
        // Increment usage after successful generation
        await SubscriptionService.incrementUsage('textToSpeech', 1);
        
        // Log activity for sync
        await syncService.logActivity(
          'audio_generated',
          `Generated audio for persona: ${personaId}`,
          {
            persona_id: personaId,
            voice_id: selectedVoice,
            text_length: text.length,
            audio_url: data.metadata.audio_url
          }
        );
        
        if (onAudioGenerated) {
          onAudioGenerated(data.metadata.audio_url);
        }
      } else {
        throw new Error('No audio URL returned from API');
      }
    } catch (err) {
      console.error('Error generating audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Speech</CardTitle>
        <CardDescription>
          Create speech from text using ElevenLabs text-to-speech
        </CardDescription>
      </CardHeader>
      <CardContent>
        {personaId ? (
          <form onSubmit={handleSubmit} className="space-y-4">            <VoiceSelector
              selectedVoiceId={selectedVoice}              onVoiceSelect={(voiceId) => {
                setSelectedVoice(voiceId);
              }}
              label="Voice"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">Text</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text to convert to speech..."
                className="h-32"
                required
              />
            </div>
            
            {error && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-center text-destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
              {audioUrl && (
              <div className="bg-secondary/15 p-3 rounded-md space-y-2">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Audio generated</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={playAudio}
                    >
                      {isPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                      {isPlaying ? 'Stop' : 'Play'}
                    </Button>
                  </div>
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  {onAudioGenerated && (
                    <div className="pt-2 border-t border-secondary">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => onAudioGenerated(audioUrl)}
                      >
                        Use this audio
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isGenerating || !text.trim() || !selectedVoice}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Speech'
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

export default ElevenLabsAudioGenerator;
