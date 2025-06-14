import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, VolumeX, Volume2, AlertCircle } from 'lucide-react';
import { createPersonaAudio, getAvailableVoices, ElevenLabsVoice } from '@/lib/api/elevenlabs';
import { syncService } from '@/lib/api/sync-service';
import { useEffect } from 'react';

interface ElevenLabsAudioGeneratorProps {
  personaId: string;
  onAudioGenerated?: (audioUrl: string) => void;
}

export function ElevenLabsAudioGenerator({ personaId, onAudioGenerated }: ElevenLabsAudioGeneratorProps) {
  // State for form
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceList, setVoiceList] = useState<ElevenLabsVoice[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Load available voices on component mount
  useEffect(() => {
    async function loadVoices() {
      try {
        const voices = await getAvailableVoices();
        setVoiceList(voices);
        
        // Set default voice if available
        if (voices.length > 0 && !selectedVoice) {
          setSelectedVoice(voices[0].id);
        }
      } catch (error) {
        console.error('Error loading voices:', error);
        setError('Failed to load available voices');
      }
    }
    
    loadVoices();
  }, []);
  
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
          <form onSubmit={handleSubmit} className="space-y-4">            <div>
              <label className="block text-sm font-medium mb-2">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice">
                    {selectedVoice ? voiceList.find(v => v.id === selectedVoice)?.name : "Select a voice"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {voiceList.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
