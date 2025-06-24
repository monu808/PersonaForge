import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Play, Pause, Volume2 } from 'lucide-react';
import { getAvailableVoices, type ElevenLabsVoice } from '@/lib/api/elevenlabs';
import { toast } from '@/components/ui/use-toast';

interface VoiceSelectorProps {
  label: string;
  value: string;
  onChange: (voiceId: string) => void;
  className?: string;
}

export function VoiceSelector({ label, value, onChange, className }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const loadVoices = async () => {
    try {
      setIsLoading(true);
      const availableVoices = await getAvailableVoices();
      setVoices(availableVoices);
    } catch (error) {
      console.error('Error loading voices:', error);
      toast({
        title: "Error",
        description: "Failed to load voices. Using default voices.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playVoicePreview = async (voice: ElevenLabsVoice) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }

      if (isPlaying) {
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);

      // If voice has a preview URL, use it
      if (voice.previewUrl) {
        const audio = new Audio(voice.previewUrl);
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          toast({
            title: "Preview Error",
            description: "Could not play voice preview.",
            variant: "destructive",
          });
        };

        await audio.play();
      } else {
        // Generate a short preview using ElevenLabs API
        const { generateSpeech } = await import('@/lib/api/elevenlabs');
        const response = await generateSpeech({
          text: `Hello, this is ${voice.name}. I'm excited to help create your podcast.`,
          voiceId: voice.id
        });

        if (response.audioUrl) {
          const audio = new Audio(response.audioUrl);
          setCurrentAudio(audio);
          
          audio.onended = () => {
            setIsPlaying(false);
            setCurrentAudio(null);
          };
          
          audio.onerror = () => {
            setIsPlaying(false);
            setCurrentAudio(null);
            toast({
              title: "Preview Error",
              description: "Could not play voice preview.",
              variant: "destructive",
            });
          };

          await audio.play();
        } else {
          throw new Error('No audio URL returned');
        }
      }
    } catch (error) {
      console.error('Error playing voice preview:', error);
      setIsPlaying(false);
      setCurrentAudio(null);
      toast({
        title: "Preview Error",
        description: "Could not play voice preview.",
        variant: "destructive",
      });
    }
  };

  const selectedVoice = voices.find(v => v.id === value);

  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2 mt-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={isLoading ? "Loading voices..." : "Select a voice"}>
              {selectedVoice ? selectedVoice.name : "Select a voice"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{voice.name}</span>
                  {voice.description && (
                    <span className="text-xs text-muted-foreground">{voice.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedVoice && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => playVoicePreview(selectedVoice)}
            disabled={isLoading}
            className="px-3"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {selectedVoice?.description && (
        <p className="text-xs text-muted-foreground mt-1">{selectedVoice.description}</p>
      )}
    </div>
  );
}

interface VoiceSelectorCardProps {
  title: string;
  description: string;
  host1Voice: string;
  host2Voice: string;
  onHost1Change: (voiceId: string) => void;
  onHost2Change: (voiceId: string) => void;
  className?: string;
}

export function VoiceSelectorCard({
  title,
  description,
  host1Voice,
  host2Voice,
  onHost1Change,
  onHost2Change,
  className
}: VoiceSelectorCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <VoiceSelector
          label="Host 1 Voice"
          value={host1Voice}
          onChange={onHost1Change}
        />
        <VoiceSelector
          label="Host 2 Voice"
          value={host2Voice}
          onChange={onHost2Change}
        />
      </CardContent>
    </Card>
  );
}
